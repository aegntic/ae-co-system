/**
 * Voice Synthesis API Routes
 * 
 * API endpoints for text-to-speech synthesis using Sesame CSM.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sesame = require('../../../integrations/sesame');
const logger = require('../../../core/utils/logger');
const { ensureAudioDirectory, generateAudioFilename } = require('../../../integrations/sesame/utils');

// Initialize Sesame CSM when the server starts
(async () => {
  try {
    await sesame.initialize();
    logger.info('Sesame CSM initialized for API use');
  } catch (error) {
    logger.error(`Failed to initialize Sesame CSM for API: ${error.message}`);
  }
})();

/**
 * @api {post} /api/voice/synthesize Synthesize speech from text
 * @apiName SynthesizeSpeech
 * @apiGroup Voice
 * 
 * @apiParam {String} text The text to synthesize
 * @apiParam {String} [voice="default"] The voice to use
 * @apiParam {String} [format="wav"] The audio format (wav, mp3, ogg)
 * 
 * @apiSuccess {Boolean} success Indicates if the synthesis was successful
 * @apiSuccess {String} audioUrl URL to access the generated audio file
 * @apiSuccess {Number} duration Duration of the audio in seconds
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice = 'default', format = 'wav' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for speech synthesis' 
      });
    }
    
    // Ensure audio directory exists
    const audioDir = ensureAudioDirectory();
    
    // Generate a unique filename
    const outputFilename = generateAudioFilename('speech', format);
    const outputPath = path.join(audioDir, outputFilename);
    
    // Synthesize speech
    const result = await sesame.synthesize(text, {
      voice,
      outputPath
    });
    
    // Convert to requested format if needed
    let finalPath = result.audioPath;
    if (format !== 'wav') {
      const { convertAudioFormat } = require('../../../integrations/sesame/utils');
      finalPath = await convertAudioFormat(result.audioPath, format);
      
      // Remove the original WAV file if conversion was successful
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(result.audioPath);
      }
    }
    
    // Generate a public URL for the audio file
    const audioUrl = `/media/generated/audio/${path.basename(finalPath)}`;
    
    return res.json({
      success: true,
      audioUrl,
      duration: result.duration
    });
  } catch (error) {
    logger.error(`Speech synthesis API error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to synthesize speech',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/voice/models List available voice models
 * @apiName ListVoiceModels
 * @apiGroup Voice
 * 
 * @apiSuccess {Boolean} success Indicates if the request was successful
 * @apiSuccess {Array} models List of available voice models
 */
router.get('/models', async (req, res) => {
  try {
    const { listModels } = require('../../../integrations/sesame/models');
    const models = await listModels();
    
    return res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error(`Error listing voice models: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to list voice models',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/voice/models/download Download a voice model
 * @apiName DownloadVoiceModel
 * @apiGroup Voice
 * 
 * @apiParam {String} modelName The name of the model to download
 * 
 * @apiSuccess {Boolean} success Indicates if the download was successful
 * @apiSuccess {String} modelName The name of the downloaded model
 * @apiSuccess {String} path Path to the downloaded model
 */
router.post('/models/download', async (req, res) => {
  try {
    const { modelName } = req.body;
    
    if (!modelName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model name is required' 
      });
    }
    
    const { downloadModel } = require('../../../integrations/sesame/models');
    const result = await downloadModel(modelName);
    
    return res.json({
      success: true,
      modelName: result.modelName,
      path: result.path
    });
  } catch (error) {
    logger.error(`Error downloading voice model: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to download voice model',
      message: error.message
    });
  }
});

module.exports = router;

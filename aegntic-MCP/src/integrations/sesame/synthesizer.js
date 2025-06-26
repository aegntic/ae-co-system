/**
 * Sesame CSM Synthesizer
 * 
 * Provides a high-level API for synthesizing speech with Sesame CSM.
 */

const path = require('path');
const fs = require('fs');
const client = require('./client');
const logger = require('../../core/utils/logger');
const config = require('../../core/config');

/**
 * Generate an audio file from text using Sesame CSM
 * 
 * @param {string} text The text to synthesize
 * @param {Object} options Options for synthesis
 * @param {string} options.voice The voice to use (default: 'default')
 * @param {string} options.outputPath The path to save the audio file (optional)
 * @returns {Promise<Object>} The result of the synthesis
 */
async function synthesize(text, options = {}) {
  if (!text) {
    throw new Error('Text is required for synthesis');
  }

  try {
    // Ensure the client is initialized
    if (!client.isInitialized()) {
      await client.initialize();
    }

    // Create a default output path if none is provided
    let outputPath = options.outputPath;
    if (!outputPath) {
      const mediaDir = path.join(process.cwd(), 'media', 'generated', 'audio');
      fs.mkdirSync(mediaDir, { recursive: true });
      outputPath = path.join(mediaDir, `${Date.now()}.wav`);
    }

    // Send the synthesis request
    const result = await client.sendRequest({
      text,
      voice: options.voice || 'default',
      outputPath
    });

    return {
      success: true,
      audioPath: result.path,
      duration: result.duration || 0
    };
  } catch (error) {
    logger.error(`Speech synthesis error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  synthesize
};

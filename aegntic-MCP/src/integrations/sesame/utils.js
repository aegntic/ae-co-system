/**
 * Sesame CSM Utilities
 * 
 * Helper functions for working with Sesame CSM.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../core/utils/logger');

/**
 * Convert audio formats using FFmpeg
 * 
 * @param {string} inputPath Path to the input audio file
 * @param {string} outputFormat Format to convert to (mp3, ogg, etc.)
 * @returns {Promise<string>} Path to the converted file
 */
async function convertAudioFormat(inputPath, outputFormat = 'mp3') {
  try {
    // Check if ffmpeg is available
    const { spawn } = require('child_process');
    
    // Create the output path
    const outputPath = inputPath.replace(/\.[^.]+$/, `.${outputFormat}`);
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-y', // Overwrite output files
        outputPath
      ]);
      
      let errorOutput = '';
      
      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  } catch (error) {
    logger.error(`Error converting audio format: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a unique filename for audio output
 * 
 * @param {string} prefix Optional prefix for the filename
 * @param {string} extension File extension (default: wav)
 * @returns {string} A unique filename
 */
function generateAudioFilename(prefix = 'sesame', extension = 'wav') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Ensures the audio output directory exists
 * 
 * @param {string} baseDir Base directory for audio output
 * @returns {string} Path to the audio output directory
 */
function ensureAudioDirectory(baseDir = null) {
  const outputDir = baseDir || path.join(process.cwd(), 'media', 'generated', 'audio');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return outputDir;
}

module.exports = {
  convertAudioFormat,
  generateAudioFilename,
  ensureAudioDirectory
};

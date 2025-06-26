/**
 * Sesame CSM Models
 * 
 * Utilities for managing Sesame CSM models.
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const logger = require('../../core/utils/logger');
const config = require('../../core/config');

const execPromise = util.promisify(exec);

/**
 * List available Sesame CSM models
 * 
 * @returns {Promise<Array>} List of available models
 */
async function listModels() {
  try {
    const modelsDir = path.dirname(config.sesame.modelPath);
    
    if (!fs.existsSync(modelsDir)) {
      return [];
    }
    
    const files = await fs.promises.readdir(modelsDir);
    
    // Filter to directories with model files
    const models = [];
    
    for (const file of files) {
      const filePath = path.join(modelsDir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isDirectory()) {
        // Check if this contains model files
        try {
          const modelFiles = await fs.promises.readdir(filePath);
          if (modelFiles.some(f => f.endsWith('.ckpt') || f.endsWith('.pt') || f.endsWith('.bin'))) {
            models.push({
              name: file,
              path: filePath,
              files: modelFiles.length
            });
          }
        } catch (err) {
          // Skip directories we can't read
        }
      }
    }
    
    return models;
  } catch (error) {
    logger.error(`Error listing Sesame models: ${error.message}`);
    return [];
  }
}

/**
 * Download a Sesame CSM model
 * 
 * @param {string} modelName The name of the model to download
 * @returns {Promise<Object>} The result of the download
 */
async function downloadModel(modelName) {
  try {
    logger.info(`Downloading Sesame model: ${modelName}`);
    
    // Create models directory if it doesn't exist
    const modelsDir = path.dirname(config.sesame.modelPath);
    if (!fs.existsSync(modelsDir)) {
      await fs.promises.mkdir(modelsDir, { recursive: true });
    }
    
    // Map model name to Hugging Face repo
    let repoId;
    switch (modelName) {
      case 'csm-tiny':
        repoId = 'sesame-ai/csm-tiny';
        break;
      case 'csm-small':
        repoId = 'sesame-ai/csm-small';
        break;
      case 'csm-medium':
        repoId = 'sesame-ai/csm-medium';
        break;
      default:
        repoId = modelName; // Assume direct repo ID
    }
    
    // Execute download command
    const { stdout, stderr } = await execPromise(
      `python3 -m huggingface_hub.cli download ${repoId} --local-dir ${path.join(modelsDir, modelName)}`
    );
    
    logger.info(`Sesame model download complete: ${modelName}`);
    
    return {
      success: true,
      modelName,
      output: stdout,
      path: path.join(modelsDir, modelName)
    };
  } catch (error) {
    logger.error(`Error downloading Sesame model: ${error.message}`);
    throw error;
  }
}

module.exports = {
  listModels,
  downloadModel
};

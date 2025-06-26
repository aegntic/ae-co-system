/**
 * Sesame CSM Voice Synthesis Example
 * 
 * This example demonstrates how to use the Sesame CSM integration for text-to-speech synthesis.
 * 
 * Usage: 
 * node examples/sesame-synthesis.js "Text to synthesize"
 */

const path = require('path');
const sesame = require('../src/integrations/sesame');
const logger = require('../src/core/utils/logger');

// The text to synthesize (default or from command line)
const textToSynthesize = process.argv[2] || 'Hello, this is a test of the Sesame CSM voice synthesis system.';

/**
 * Example function that demonstrates voice synthesis
 */
async function runExample() {
  try {
    // Initialize the Sesame CSM client
    logger.info('Initializing Sesame CSM...');
    await sesame.initialize();
    
    // Define the output path
    const outputPath = path.join(process.cwd(), 'examples', 'output', `example-${Date.now()}.wav`);
    
    // Synthesize speech
    logger.info(`Synthesizing text: "${textToSynthesize}"`);
    const result = await sesame.synthesize(textToSynthesize, {
      outputPath
    });
    
    logger.info(`Synthesis complete! Audio saved to: ${result.audioPath}`);
    logger.info(`Audio duration: ${result.duration} seconds`);
    
    // Clean up
    await sesame.shutdown();
    
    return result;
  } catch (error) {
    logger.error(`Error in Sesame synthesis example: ${error.message}`);
    throw error;
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  // Create output directory if it doesn't exist
  const fs = require('fs');
  const outputDir = path.join(process.cwd(), 'examples', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  runExample()
    .then(() => {
      logger.info('Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Example failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runExample
};

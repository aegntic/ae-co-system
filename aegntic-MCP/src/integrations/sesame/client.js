/**
 * Sesame CSM Client
 * 
 * Manages the connection to the Sesame CSM Python process.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../../core/config');
const logger = require('../../core/utils/logger');

/**
 * SesameClient provides a Node.js interface to the Sesame CSM Python library
 */
class SesameClient {
  constructor() {
    this.modelPath = config.sesame.modelPath;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.initialized = false;
    this.process = null;
    this.busy = false;
    this.requestQueue = [];
    this.processingPromise = null;
  }

  /**
   * Initialize the Sesame CSM client by starting the Python bridge
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      logger.info('Initializing Sesame CSM client...');
      
      // Create the Python bridge script if it doesn't exist
      const bridgePath = path.join(__dirname, 'sesame_bridge.py');
      if (!fs.existsSync(bridgePath)) {
        await this._createBridgeScript(bridgePath);
      }

      // Start the Python process
      this.process = spawn(this.pythonPath, [
        bridgePath,
        '--model-path', this.modelPath
      ]);

      // Handle process events
      this.process.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message === 'READY') {
          this.initialized = true;
          logger.info('Sesame CSM initialized successfully');
        } else {
          try {
            const response = JSON.parse(message);
            const requestId = response.requestId;
            
            if (this.requestQueue.length > 0 && this.requestQueue[0].id === requestId) {
              const request = this.requestQueue.shift();
              if (response.status === 'success') {
                request.resolve(response);
              } else {
                request.reject(new Error(response.message || 'Unknown error'));
              }
              
              // Process the next request in the queue
              this._processNextRequest();
            }
          } catch (error) {
            logger.error(`Error parsing Sesame CSM response: ${error.message}`);
          }
        }
      });

      this.process.stderr.on('data', (data) => {
        logger.error(`Sesame CSM error: ${data}`);
      });

      this.process.on('close', (code) => {
        logger.info(`Sesame CSM process exited with code ${code}`);
        this.initialized = false;
        this.process = null;
        
        // Reject all pending requests
        this.requestQueue.forEach(request => {
          request.reject(new Error('Sesame CSM process terminated'));
        });
        this.requestQueue = [];
      });

      // Wait for initialization
      return new Promise((resolve, reject) => {
        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
          reject(new Error('Sesame CSM initialization timed out'));
        }, 30000);

        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    } catch (error) {
      logger.error(`Failed to initialize Sesame CSM: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a request to the Sesame CSM process
   * @param {Object} request The request object to send
   * @returns {Promise<Object>} The response from the Sesame CSM process
   */
  async sendRequest(request) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();
      request.requestId = requestId;
      
      this.requestQueue.push({
        id: requestId,
        request,
        resolve,
        reject
      });
      
      if (!this.busy) {
        this._processNextRequest();
      }
    });
  }

  /**
   * Process the next request in the queue
   * @private
   */
  _processNextRequest() {
    if (this.requestQueue.length === 0) {
      this.busy = false;
      return;
    }

    this.busy = true;
    const { request } = this.requestQueue[0];
    
    try {
      this.process.stdin.write(JSON.stringify(request) + '\\n');
    } catch (error) {
      const failedRequest = this.requestQueue.shift();
      failedRequest.reject(error);
      this._processNextRequest();
    }
  }

  /**
   * Check if the client is initialized
   * @returns {boolean} True if the client is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Shut down the Sesame CSM client
   */
  async shutdown() {
    if (this.process) {
      logger.info('Shutting down Sesame CSM client...');
      this.process.kill();
      this.initialized = false;
      this.process = null;
    }
  }

  /**
   * Create the Python bridge script
   * @param {string} filePath The path to write the script to
   * @private
   */
  async _createBridgeScript(filePath) {
    const script = `#!/usr/bin/env python3
import sys
import os
import argparse
import json
import traceback

# Parse command line arguments
parser = argparse.ArgumentParser(description='Sesame CSM Bridge')
parser.add_argument('--model-path', type=str, required=True, help='Path to the CSM model')
args = parser.parse_args()

# Initialize Sesame CSM
try:
    # Import Sesame CSM
    sys.path.append('/opt/csm')
    from csm.model import load_csm_model
    
    # Load the model
    model = load_csm_model(args.model_path)
    
    # Signal that the model is loaded
    print("READY", flush=True)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

# Main processing loop
for line in sys.stdin:
    try:
        request = json.loads(line)
        request_id = request.get('requestId', '')
        text = request.get('text', '')
        output_path = request.get('outputPath', '')
        
        # Process with Sesame CSM
        audio = model.synthesize(text)
        
        # Save audio to file
        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(audio)
        
        # Send response
        response = {
            'status': 'success',
            'requestId': request_id,
            'path': output_path
        }
        print(json.dumps(response), flush=True)
    except Exception as e:
        response = {
            'status': 'error',
            'requestId': request.get('requestId', ''),
            'message': str(e)
        }
        print(json.dumps(response), flush=True)
        traceback.print_exc(file=sys.stderr)
`;

    try {
      await fs.promises.writeFile(filePath, script);
      await fs.promises.chmod(filePath, '755'); // Make executable
      logger.info(`Created Sesame bridge script at ${filePath}`);
    } catch (error) {
      logger.error(`Failed to create Sesame bridge script: ${error.message}`);
      throw error;
    }
  }
}

// Create a singleton instance
const client = new SesameClient();

// Export the client
module.exports = client;

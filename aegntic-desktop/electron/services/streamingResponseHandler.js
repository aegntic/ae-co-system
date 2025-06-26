const EventEmitter = require('events');

/**
 * Enhanced response handler with streaming capabilities
 */
class StreamingResponseHandler extends EventEmitter {
  constructor(browserIntegrator) {
    super();
    this.browserIntegrator = browserIntegrator;
    this.responses = {};
    this.activeStreams = new Map();
    this.streamingInterval = 500; // ms to check for updates
  }
  
  /**
   * Collect responses from models with streaming capability
   * @param {string} prompt - The prompt to send
   * @param {string[]} modelIds - Array of model IDs to query
   * @returns {Object} Initial response object (will be updated via events)
   */
  async collectResponses(prompt, modelIds) {
    // Clear previous responses
    this.clearResponses();
    
    // Send prompt to all selected models
    for (const modelId of modelIds) {
      try {
        await this.browserIntegrator.sendPrompt(modelId, prompt);
      } catch (error) {
        console.error(`Error sending prompt to ${modelId}:`, error);
        this.handleError(modelId, error);
      }
    }
    
    // Start streaming for each model
    modelIds.forEach(modelId => {
      this.startStreaming(modelId, prompt);
    });
    
    return this.responses;
  }

  /**
   * Start streaming responses from a model
   * @param {string} modelId - The model ID
   * @param {string} prompt - The original prompt
   */
  startStreaming(modelId, prompt) {
    // Initialize response object
    const session = this.browserIntegrator.getSession(modelId);
    if (!session) {
      this.handleError(modelId, new Error(`Session ${modelId} not found`));
      return;
    }

    this.responses[modelId] = {
      modelId,
      modelName: session.name,
      content: '',
      isComplete: false,
      timestamp: Date.now(),
      prompt
    };
    
    // Emit initial response
    this.emit('response-update', { ...this.responses });
    
    // Stop any existing stream for this model
    this.stopStreaming(modelId);
    
    // Store previous content to detect changes
    let previousContent = '';
    let unchangedCount = 0;
    const maxUnchangedCount = 10; // Stop after 5 seconds of no changes (10 * 500ms)
    
    // Start interval to check for updates
    const intervalId = setInterval(async () => {
      try {
        // Get current response text
        const content = await this.browserIntegrator.getResponseForStreaming(modelId);
        
        // If content has changed, update and emit event
        if (content !== previousContent) {
          previousContent = content;
          unchangedCount = 0;
          
          this.responses[modelId] = {
            ...this.responses[modelId],
            content,
            timestamp: Date.now()
          };
          
          this.emit('response-update', { ...this.responses });
        } else {
          unchangedCount++;
        }
        
        // If no changes for a while, consider it complete
        if (unchangedCount >= maxUnchangedCount) {
          this.responses[modelId].isComplete = true;
          this.emit('response-complete', modelId, this.responses[modelId]);
          this.stopStreaming(modelId);
        }
      } catch (error) {
        console.error(`Error streaming from ${modelId}:`, error);
        this.handleError(modelId, error);
        this.stopStreaming(modelId);
      }
    }, this.streamingInterval);
    
    // Store interval ID for cleanup
    this.activeStreams.set(modelId, intervalId);
    
    // Safety timeout (5 minutes)
    setTimeout(() => {
      if (this.activeStreams.has(modelId)) {
        this.responses[modelId].isComplete = true;
        this.emit('response-complete', modelId, this.responses[modelId]);
        this.stopStreaming(modelId);
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * Stop streaming for a specific model
   * @param {string} modelId - The model ID
   */
  stopStreaming(modelId) {
    if (this.activeStreams.has(modelId)) {
      clearInterval(this.activeStreams.get(modelId));
      this.activeStreams.delete(modelId);
    }
  }
  
  /**
   * Stop all active streams
   */
  stopAllStreams() {
    for (const [modelId, intervalId] of this.activeStreams.entries()) {
      clearInterval(intervalId);
      this.activeStreams.delete(modelId);
    }
  }
  
  /**
   * Handle errors in response collection
   * @param {string} modelId - The model ID
   * @param {Error} error - The error object
   */
  handleError(modelId, error) {
    const session = this.browserIntegrator.getSession(modelId);
    if (!session) return;
    
    this.responses[modelId] = {
      modelId,
      modelName: session.name,
      content: `Error: ${error.message}`,
      isComplete: true,
      error: true,
      timestamp: Date.now()
    };
    
    this.emit('response-update', { ...this.responses });
    this.emit('response-error', modelId, error);
  }

  /**
   * Get current responses
   * @returns {Object} Response object
   */
  getResponses() {
    return this.responses;
  }

  /**
   * Clear responses and stop all streams
   * @returns {Object} Empty response object
   */
  clearResponses() {
    this.stopAllStreams();
    this.responses = {};
    return this.responses;
  }
}

module.exports = StreamingResponseHandler;
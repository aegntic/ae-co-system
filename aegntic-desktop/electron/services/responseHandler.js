class ResponseHandler {
  constructor(browserIntegrator) {
    this.browserIntegrator = browserIntegrator;
    this.responses = {};
  }
  
  async collectResponses(prompt, modelIds) {
    // Send prompt to all selected models
    for (const modelId of modelIds) {
      try {
        await this.browserIntegrator.sendPrompt(modelId, prompt);
      } catch (error) {
        console.error(`Error sending prompt to ${modelId}:`, error);
        // We'll continue with other models even if one fails
      }
    }
    
    // Collect responses with timeout
    const responsePromises = modelIds.map(async (modelId) => {
      try {
        const session = this.browserIntegrator.getSession(modelId);
        
        // Race between getting a response and a timeout
        const content = await Promise.race([
          this.browserIntegrator.getResponse(modelId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 60000)
          )
        ]);
        
        this.responses[modelId] = {
          modelId,
          modelName: session.name,
          content,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`Error getting response from ${modelId}:`, error);
        
        this.responses[modelId] = {
          modelId,
          modelName: this.browserIntegrator.getSession(modelId).name,
          content: `Error: ${error.message}`,
          timestamp: Date.now()
        };
      }
    });
    
    await Promise.all(responsePromises);
    return this.responses;
  }

  getResponses() {
    return this.responses;
  }

  clearResponses() {
    this.responses = {};
    return this.responses;
  }
}

module.exports = ResponseHandler;

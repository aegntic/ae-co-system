/**
 * Conversation Capture Protocol
 *
 * Captures and persists conversation turns from various
 * input sources into the Memory-Bank persistence layer.
 */

const fs = require('fs').promises;
const path = require('path');
const MemoryIntegration = require('./memory-integration');

// Initialize integration layer
const memoryIntegration = new MemoryIntegration();

// Ensure boot sequence is executed
let bootstrapPromise = memoryIntegration.bootstrap();

/**
 * Capture a conversation turn and persist to memory
 */
async function captureTurn(message, role, metadata = {}) {
  // Ensure bootstrap has completed
  await bootstrapPromise;
  
  // Persist the turn to memory
  return memoryIntegration.persistTurn(message, role, metadata);
}

/**
 * Capture conversation from a file (one message per line)
 */
async function captureFromFile(filePath, defaultRole = 'system') {
  try {
    // Ensure bootstrap has completed
    await bootstrapPromise;
    
    // Read and parse the conversation file
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentRole = defaultRole;
    let buffer = [];
    
    // Process each line
    for (const line of lines) {
      if (line.startsWith('User: ')) {
        // If there's a buffered message, persist it first
        if (buffer.length > 0) {
          await memoryIntegration.persistTurn(buffer.join('\n'), currentRole);
          buffer = [];
        }
        
        currentRole = 'user';
        buffer.push(line.substring(6).trim());
      } else if (line.startsWith('Assistant: ')) {
        // If there's a buffered message, persist it first
        if (buffer.length > 0) {
          await memoryIntegration.persistTurn(buffer.join('\n'), currentRole);
          buffer = [];
        }
        
        currentRole = 'assistant';
        buffer.push(line.substring(11).trim());
      } else {
        // Continue adding to the current buffer
        buffer.push(line);
      }
    }
    
    // Persist any remaining content
    if (buffer.length > 0) {
      await memoryIntegration.persistTurn(buffer.join('\n'), currentRole);
    }
    
    return true;
  } catch (error) {
    console.error('Error capturing conversation from file:', error);
    return false;
  }
}

/**
 * Get the current conversation history
 */
async function getConversationHistory(limit = 10) {
  return memoryIntegration.getRecentTurns(limit);
}

/**
 * Close the current conversation session
 */
async function closeConversation() {
  return memoryIntegration.closeSession();
}

module.exports = {
  captureTurn,
  captureFromFile,
  getConversationHistory,
  closeConversation
};

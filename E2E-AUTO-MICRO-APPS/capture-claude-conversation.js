/**
 * Simplified Claude Conversation Capture Utility
 * 
 * Captures a conversation directly using Memory-Bank
 */

const path = require('path');
const MemoryIntegration = require('./modules/memory-integration');

// Create shorter sample conversation
const sampleConversation = [
  {
    role: 'user',
    content: 'Is the memory-bank working now?'
  },
  {
    role: 'assistant',
    content: 'Yes, the Memory-Bank is now initialized and operational. It can store conversation history, cached API responses, and project data.'
  },
  {
    role: 'user',
    content: 'Can we use it to capture our current conversation?'
  },
  {
    role: 'assistant',
    content: 'Yes, I created a capture utility that will store our conversation turns in the Memory-Bank persistence layer.'
  }
];

/**
 * Capture conversation to Memory-Bank
 */
async function captureConversation() {
  console.log('Capturing conversation to Memory-Bank...');
  
  try {
    // Initialize memory integration
    const integration = new MemoryIntegration();
    
    // Bootstrap memory system
    await integration.bootstrap();
    
    // Store each turn
    for (const turn of sampleConversation) {
      await integration.persistTurn(turn.content, turn.role, { 
        source: 'claude-conversation',
        timestamp: new Date().toISOString() 
      });
      console.log(`Persisted ${turn.role} turn to Memory-Bank`);
    }
    
    // Retrieve and display captured conversation
    const history = await integration.getRecentTurns(sampleConversation.length);
    
    console.log('\nCaptured Conversation:');
    console.log(JSON.stringify(history, null, 2));
    
    // Get session info
    const sessionInfo = await integration.getSessionInfo();
    console.log('\nSession Info:');
    console.log(JSON.stringify(sessionInfo, null, 2));
    
    // Close session
    await integration.closeSession();
    
    console.log('\nConversation successfully captured and stored in Memory-Bank!');
    return true;
  } catch (error) {
    console.error('Error capturing conversation:', error);
    return false;
  }
}

// Run capture process
captureConversation().catch(console.error);

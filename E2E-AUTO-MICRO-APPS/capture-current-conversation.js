/**
 * Current Conversation Capture Utility
 * 
 * Captures the current conversation state and persists
 * it to the Memory-Bank persistence layer.
 */

const fs = require('fs').promises;
const path = require('path');
const conversationCapture = require('./modules/conversation-capture');

// Sample conversation data for testing
// In a real implementation, this would be extracted from the actual conversation context
const sampleConversation = [
  {
    role: 'user',
    content: 'use desktop-commander to init memory-bank to the project'
  },
  {
    role: 'assistant',
    content: 'I\'ll architect a modular bootstrap sequence using desktop-commander to structurally integrate the Memory-Bank persistence layer with our conversation context buffer.'
  },
  {
    role: 'user',
    content: 'has this conversation been added to memory already?'
  },
  {
    role: 'assistant',
    content: 'No, this conversational context has not been persisted to the Memory-Bank persistence layer we just architected. The Memory-Bank module exists in a structural implementation state rather than an operational runtime state.'
  },
  {
    role: 'user',
    content: 'use desktop-commander to bootstrap and integrate it'
  }
];

async function captureCurrentConversation() {
  console.log('Capturing current conversation...');
  
  // Create a temporary file with the conversation
  const tempFilePath = path.join(__dirname, '.temp-conversation.txt');
  
  try {
    // Format conversation for the capture file
    const formattedConversation = sampleConversation.map(turn => {
      const rolePrefix = turn.role === 'user' ? 'User: ' : 'Assistant: ';
      return `${rolePrefix}${turn.content}`;
    }).join('\n\n');
    
    // Write to temp file
    await fs.writeFile(tempFilePath, formattedConversation, 'utf8');
    
    // Capture from the file
    await conversationCapture.captureFromFile(tempFilePath);
    
    // Clean up temp file
    await fs.unlink(tempFilePath);
    
    // Retrieve and display captured conversation
    const history = await conversationCapture.getConversationHistory();
    
    console.log('\nCaptured Conversation:');
    console.log(JSON.stringify(history, null, 2));
    
    // Close the conversation session
    await conversationCapture.closeConversation();
    
    console.log('\nConversation successfully captured and stored in Memory-Bank!');
    return true;
  } catch (error) {
    console.error('Error capturing conversation:', error);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  captureCurrentConversation().catch(console.error);
}

module.exports = captureCurrentConversation;

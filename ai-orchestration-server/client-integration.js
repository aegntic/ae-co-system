const axios = require('axios');

// Function to detect task type from prompt
function detectTaskType(prompt) {
  if (prompt.includes('optimize') || prompt.includes('performance'))
    return 'code-optimization';
  if (prompt.includes('debug') || prompt.includes('fix error'))
    return 'debugging';
  if (prompt.includes('document') || prompt.includes('explain'))
    return 'documentation';
  return 'code-generation';
}

// Function to send task to orchestration server
async function sendTask(prompt) {
  const taskType = detectTaskType(prompt);
  
  try {
    const response = await axios.post('http://localhost:3000/process-task', {
      taskType,
      prompt
    });
    
    return {
      success: true,
      taskType,
      result: response.data.result
    };
  } catch (error) {
    console.error('Error sending task:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Example of coordinating a complex workflow
async function sendWorkflow() {
  const tasks = {
    'task1': {
      type: 'code-generation',
      prompt: 'Create a React component for a user registration form'
    },
    'task2': {
      type: 'code-optimization',
      prompt: 'Optimize this database query: SELECT * FROM users WHERE active = true'
    },
    'task3': {
      type: 'documentation',
      prompt: 'Document the authentication flow for a REST API'
    }
  };
  
  try {
    const response = await axios.post('http://localhost:3000/coordinate-workflow', {
      tasks
    });
    
    return {
      success: true,
      results: response.data.results
    };
  } catch (error) {
    console.error('Error sending workflow:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions for use in Claude integration
module.exports = {
  sendTask,
  sendWorkflow,
  detectTaskType
};

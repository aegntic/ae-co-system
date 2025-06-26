const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Open Router authentication - to be loaded from environment
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;

// Model registry with specializations
const modelRegistry = {
  'code-generation': 'anthropic/claude-3-opus',
  'code-optimization': 'openai/gpt-4',
  'debugging': 'google/gemini-pro',
  'documentation': 'anthropic/claude-3-sonnet'
};

// Task routing function
async function routeTask(taskType, prompt) {
  const model = modelRegistry[taskType] || 'anthropic/claude-3-opus';
  
  console.log(`Routing task of type ${taskType} to model ${model}`);
  
  // Call to Open Router API
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000', // Required by Open Router
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Open Router:', error.message);
    throw new Error(`Failed to process task: ${error.message}`);
  }
}

// Task coordination for complex workflows
async function coordinateTasks(tasks) {
  const results = {};
  
  for (const [taskId, taskData] of Object.entries(tasks)) {
    results[taskId] = await routeTask(taskData.type, taskData.prompt);
  }
  
  return results;
}

// Define server routes
app.post('/process-task', async (req, res) => {
  try {
    const { taskType, prompt } = req.body;
    const result = await routeTask(taskType, prompt);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/coordinate-workflow', async (req, res) => {
  try {
    const { tasks } = req.body;
    const results = await coordinateTasks(tasks);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI Orchestration Server running on port ${PORT}`));

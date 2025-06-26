# AI Task Orchestration Server

## Overview
This system enables Claude to orchestrate coding tasks across multiple specialized AI models via Open Router, functioning as a "Model Context Protocol" (MCP) server. It allows for efficient distribution of tasks to the most appropriate models based on task type.

## Architecture
- **Server**: Express.js backend that handles routing tasks to appropriate models
- **Model Registry**: Configuration mapping task types to specialized models
- **Task Coordinator**: System for managing complex workflows requiring multiple models
- **Client Integration**: Interface for Claude to interact with the orchestration system

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Open Router API key
   - Adjust other settings as needed

3. Start the server:
   ```bash
   npm start
   ```

## Usage

### Simple Task Routing
Send a single task to be routed to the appropriate model:

```javascript
const response = await axios.post('http://localhost:3000/process-task', {
  taskType: 'code-generation',
  prompt: 'Create a function to calculate Fibonacci numbers'
});
```

### Complex Workflow Coordination
Send multiple related tasks to be processed in sequence:

```javascript
const response = await axios.post('http://localhost:3000/coordinate-workflow', {
  tasks: {
    'task1': {
      type: 'code-generation',
      prompt: 'Create a React component for a user profile'
    },
    'task2': {
      type: 'documentation',
      prompt: 'Document the props and usage of the component'
    }
  }
});
```

## Supported Task Types
- `code-generation`: Creating new code (Claude-3-Opus)
- `code-optimization`: Improving existing code (GPT-4)
- `debugging`: Finding and fixing errors (Gemini Pro)
- `documentation`: Creating technical documentation (Claude-3-Sonnet)

## Security Considerations
- API keys should be kept in environment variables
- Implement proper authentication for production use
- Consider rate limiting to prevent abuse
- Validate all inputs to prevent injection attacks

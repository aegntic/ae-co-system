#!/bin/bash

echo "Firebase Studio MCP Server - Mock Version"
echo "========================================"

# Create mock implementation folder
MOCK_DIR=~/mcp-servers/firebase-studio-mcp/servers/firebase-studio-mcp/mock
mkdir -p $MOCK_DIR
cd $MOCK_DIR

# Create mock implementation of the Firebase CLI and MCP server
cat > mock-firebase.js << 'EOF'
#!/usr/bin/env node

// Mock Firebase CLI implementation
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server to handle MCP requests
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Root route returns server info
  if (parsedUrl.pathname === '/') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      name: 'Firebase Studio MCP Server (Mock)',
      description: 'Mock implementation of Firebase Studio for testing',
      methods: [
        {
          name: 'firebaseCommand',
          description: 'Execute any Firebase CLI command directly (mock)',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              args: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        {
          name: 'listProjects',
          description: 'List all Firebase projects (mock)',
          parameters: { type: 'object', properties: {} }
        },
        {
          name: 'gcloudCommand',
          description: 'Execute any Google Cloud CLI command (mock)',
          parameters: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              command: { type: 'string' }
            }
          }
        }
      ]
    }));
    return;
  }
  
  // Handle method calls
  if (parsedUrl.pathname === '/methods' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { method, parameters } = JSON.parse(body);
        res.setHeader('Content-Type', 'application/json');
        
        switch (method) {
          case 'firebaseCommand':
            res.end(JSON.stringify({
              success: true,
              output: `Mock execution of: firebase ${parameters.command} ${parameters.args ? parameters.args.join(' ') : ''}`,
              note: 'This is a mock response'
            }));
            break;
            
          case 'listProjects':
            res.end(JSON.stringify({
              success: true,
              projects: [
                { name: 'mock-project-1', projectId: 'mock-project-1' },
                { name: 'mock-project-2', projectId: 'mock-project-2' }
              ],
              note: 'This is a mock response'
            }));
            break;
            
          case 'gcloudCommand':
            res.end(JSON.stringify({
              success: true,
              output: `Mock execution of: gcloud ${parameters.service} ${parameters.command}`,
              note: 'This is a mock response'
            }));
            break;
            
          default:
            res.statusCode = 404;
            res.end(JSON.stringify({
              success: false,
              error: `Method '${method}' not found`
            }));
        }
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid request body'
        }));
      }
    });
    return;
  }
  
  // Handle all other routes
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: false,
    error: 'Not found'
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Firebase Studio MCP Server (Mock) running on port ${PORT}`);
  console.log(`📋 Connection URL for Claude: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
EOF

# Make the mock script executable
chmod +x mock-firebase.js

# Start the mock server
echo "Starting Firebase Studio MCP Server (Mock)..."
node mock-firebase.js

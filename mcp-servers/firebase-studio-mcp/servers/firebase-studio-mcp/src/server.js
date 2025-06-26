/**
 * Firebase Studio MCP Server Implementation
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import MCP server using dynamic import with require
let mcp;
try {
  // Try to import as a CommonJS module
  mcp = require('../node_modules/mcp-server/index.js');
} catch (error) {
  // If that fails, create a minimal version locally
  console.warn('Failed to load mcp-server, using local implementation');
  mcp = {
    Server: class Server {
      constructor(options = {}) {
        this.name = options.name || 'MCP Server';
        this.description = options.description || 'A Model Context Protocol Server';
        this.methods = [];
        this.port = 3000;
      }
      
      method(methodConfig) {
        this.methods.push(methodConfig);
        return this;
      }
      
      async start(options = {}) {
        this.port = options.port || 3000;
        console.log(`[Mock MCP Server] Server started on port ${this.port}`);
        return { port: this.port };
      }
    }
  };
}

// Create MCP server
const server = new mcp.Server({
  name: 'Firebase Studio MCP Server',
  description: 'Complete access to Firebase and Google Cloud services'
});

// Firebase Admin SDK state
let firebaseApp = null;
let serviceAccount = null;

// Helper function to execute shell commands with promise
const executeCommand = (command, args = [], options = {}) => {
  return new Promise((resolve) => {
    // First, check if we need to use specific paths for firebase or gcloud
    let actualCommand = command;
    let actualOptions = { ...options };
    
    // Ensure we can find the commands in PATH
    if (command === 'firebase') {
      // Try to use global firebase if available
      try {
        const firebasePath = require('child_process').execSync('which firebase', { encoding: 'utf8' }).trim();
        actualCommand = firebasePath;
      } catch (error) {
        console.warn('Firebase CLI not found in PATH, trying alternate locations...');
        // We'll just use the default and let it fail with appropriate message
      }
    } else if (command === 'gcloud') {
      // Try to use the installed Google Cloud SDK if available
      try {
        const homeDir = require('os').homedir();
        const gcloudPath = `${homeDir}/google-cloud-sdk-install/google-cloud-sdk/bin/gcloud`;
        if (fs.existsSync(gcloudPath)) {
          actualCommand = gcloudPath;
        }
      } catch (error) {
        console.warn('Google Cloud SDK not found in expected location, trying default...');
        // We'll just use the default and let it fail with appropriate message
      }
    }
    
    const proc = spawn(actualCommand, args, { 
      shell: true, 
      ...actualOptions 
    });
    
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() });
      } else {
        resolve({ 
          success: false, 
          error: stderr.trim() || 'Command failed', 
          code,
          command: `${actualCommand} ${args.join(' ')}`
        });
      }
    });
  });
};

// Initialize Firebase Admin SDK
server.method({
  name: 'initializeFirebase',
  description: 'Initialize Firebase Admin SDK with service account',
  parameters: {
    type: 'object',
    properties: {
      serviceAccountPath: {
        type: 'string',
        description: 'Path to service account JSON file'
      },
      databaseURL: {
        type: 'string',
        description: 'Firebase database URL (optional)'
      },
      storageBucket: {
        type: 'string',
        description: 'Firebase storage bucket (optional)'
      }
    },
    required: ['serviceAccountPath']
  },
  handler: async ({ serviceAccountPath, databaseURL, storageBucket }) => {
    try {
      // Dynamically import firebase-admin
      const admin = require('firebase-admin');
      
      if (!fs.existsSync(serviceAccountPath)) {
        return { success: false, error: `Service account file not found at: ${serviceAccountPath}` };
      }
      
      serviceAccount = require(path.resolve(serviceAccountPath));
      
      const config = {
        credential: admin.credential.cert(serviceAccount)
      };
      
      if (databaseURL) config.databaseURL = databaseURL;
      if (storageBucket) config.storageBucket = storageBucket;
      
      // Cleanup previous app if it exists
      if (firebaseApp) {
        await admin.app().delete();
      }
      
      firebaseApp = admin.initializeApp(config);
      
      return { 
        success: true, 
        message: 'Firebase Admin SDK initialized successfully',
        projectId: serviceAccount.project_id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Firebase CLI Methods
server.method({
  name: 'firebaseCommand',
  description: 'Execute any Firebase CLI command directly',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string', 
        description: 'Firebase command to run (e.g., "deploy", "serve")'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Command arguments'
      },
      cwd: {
        type: 'string',
        description: 'Working directory for command execution'
      },
      json: {
        type: 'boolean',
        description: 'Parse output as JSON if possible',
        default: true
      }
    },
    required: ['command']
  },
  handler: async ({ command, args = [], cwd, json = true }) => {
    try {
      const options = cwd ? { cwd } : {};
      const result = await executeCommand('firebase', [command, ...(args || [])], options);
      
      if (result.success && json) {
        try {
          return { success: true, data: JSON.parse(result.output) };
        } catch (e) {
          // Not JSON, return as is
          return result;
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Project management
server.method({
  name: 'listProjects',
  description: 'List all Firebase projects',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    try {
      const result = await executeCommand('firebase', ['projects:list', '--json']);
      if (result.success) {
        try {
          return { success: true, projects: JSON.parse(result.output) };
        } catch (e) {
          return { 
            success: true, 
            output: result.output,
            note: 'Could not parse JSON output, returning raw output'
          };
        }
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Google Cloud SDK Methods
server.method({
  name: 'gcloudCommand',
  description: 'Execute any Google Cloud CLI command',
  parameters: {
    type: 'object',
    properties: {
      service: {
        type: 'string',
        description: 'GCloud service (e.g., "compute", "firestore", "functions")'
      },
      command: {
        type: 'string',
        description: 'Command to execute'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Command arguments'
      },
      project: {
        type: 'string',
        description: 'Project ID (overrides default)'
      },
      json: {
        type: 'boolean',
        description: 'Parse output as JSON',
        default: true
      }
    },
    required: ['service', 'command']
  },
  handler: async ({ service, command, args = [], project, json = true }) => {
    const cmdArgs = [service, command, ...args];
    
    if (project) {
      cmdArgs.push('--project', project);
    }
    
    if (json) {
      cmdArgs.push('--format=json');
    }
    
    const result = await executeCommand('gcloud', cmdArgs);
    
    if (result.success && json) {
      try {
        return { success: true, data: JSON.parse(result.output) };
      } catch (e) {
        // Not JSON, return as is
        return result;
      }
    }
    
    return result;
  }
});

// Firebase Emulator Suite
server.method({
  name: 'startEmulators',
  description: 'Start Firebase emulators',
  parameters: {
    type: 'object',
    properties: {
      services: {
        type: 'array',
        items: { 
          type: 'string',
          enum: ['auth', 'functions', 'firestore', 'database', 'hosting', 'pubsub', 'storage']
        },
        description: 'Services to emulate'
      },
      projectPath: {
        type: 'string',
        description: 'Path to Firebase project'
      },
      exportOnExit: {
        type: 'string',
        description: 'Directory to export data on exit'
      },
      importData: {
        type: 'string',
        description: 'Directory to import data from'
      }
    }
  },
  handler: async ({ services, projectPath, exportOnExit, importData }) => {
    const args = ['emulators:start'];
    
    if (services && services.length > 0) {
      args.push('--only', services.join(','));
    }
    
    if (exportOnExit) {
      args.push('--export-on-exit', exportOnExit);
    }
    
    if (importData) {
      args.push('--import', importData);
    }
    
    const options = projectPath ? { cwd: projectPath } : {};
    
    // Run in background
    const proc = spawn('firebase', args, { 
      ...options, 
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    
    return { 
      success: true, 
      message: 'Emulators started in background',
      pid: proc.pid,
      command: `firebase ${args.join(' ')}`
    };
  }
});

// Firebase Authentication
const firebaseAuth = require('../auth-helper');

server.method({
  name: 'loginFirebase',
  description: 'Login to Firebase CLI',
  parameters: {
    type: 'object',
    properties: {
      ci: {
        type: 'boolean',
        description: 'Generate a CI token and print it to STDOUT'
      },
      nonInteractive: {
        type: 'boolean',
        description: 'Use non-interactive authentication flow (no browser)'
      },
      reauth: {
        type: 'boolean',
        description: 'Force reauthentication even if already logged in'
      }
    }
  },
  handler: async (params) => {
    return await firebaseAuth.login(params);
  }
});

server.method({
  name: 'logoutFirebase',
  description: 'Logout from Firebase CLI',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    return await firebaseAuth.logout();
  }
});

server.method({
  name: 'getCurrentUser',
  description: 'Get current Firebase user',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    return await firebaseAuth.getCurrentUser();
  }
});

// Google Cloud Authentication
server.method({
  name: 'loginGcloud',
  description: 'Login to Google Cloud SDK',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to set as default'
      }
    }
  },
  handler: async ({ projectId }) => {
    try {
      // Execute gcloud auth login
      const result = await executeCommand('gcloud', ['auth', 'login']);
      
      // Set project if provided
      if (projectId && result.success) {
        const projectResult = await executeCommand('gcloud', ['config', 'set', 'project', projectId]);
        if (!projectResult.success) {
          return {
            success: false,
            error: `Authentication succeeded but failed to set project: ${projectResult.error}`
          };
        }
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to authenticate with Google Cloud SDK' 
      };
    }
  }
});

module.exports = server;
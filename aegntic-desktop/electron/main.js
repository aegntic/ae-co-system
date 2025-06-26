const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const BrowserIntegrator = require('./services/browserIntegration');
const StreamingResponseHandler = require('./services/streamingResponseHandler');
const ObsidianIntegrator = require('./services/obsidianIntegration');
const ConversationStorage = require('./services/conversationStorage');
const PerformanceMonitor = require('./services/performanceMonitor');
const SecurityManager = require('./services/securityManager');

// Keep a global reference of the window object and services
let mainWindow;
let browserIntegrator;
let responseHandler;
let obsidianIntegrator;
let conversationStorage;
let performanceMonitor;
let securityManager;

// App name
const APP_NAME = 'Aegntic Desktop';

/**
 * Create application menu
 */
function createAppMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: APP_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { 
          label: 'Preferences', 
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('show-settings')
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('new-conversation')
        },
        { type: 'separator' },
        {
          label: 'Export to Obsidian',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('export-to-obsidian')
        },
        ...(isMac ? [] : [
          { type: 'separator' },
          { 
            label: 'Preferences', 
            accelerator: 'CmdOrCtrl+,',
            click: () => mainWindow.webContents.send('show-settings')
          },
          { type: 'separator' },
          { role: 'quit' }
        ])
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/yourusername/aegntic-desktop');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: APP_NAME,
    webPreferences: {
      nodeIntegration: false, // Keep false for security
      contextIsolation: true, // Enable context isolation
      enableRemoteModule: false, // Disable remote module for security
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false, // Prevent insecure content
      experimentalFeatures: false, // Disable experimental features
      preload: path.join(__dirname, 'preload.js') // Specify preload script
    },
    backgroundColor: '#f5f5f5',
    // Better startup experience with a light background color
    show: false, // Don't show until ready
  });

  // Initialize services
  securityManager = new SecurityManager();
  performanceMonitor = new PerformanceMonitor();
  browserIntegrator = new BrowserIntegrator(mainWindow);
  responseHandler = new StreamingResponseHandler(browserIntegrator);
  obsidianIntegrator = new ObsidianIntegrator();
  conversationStorage = new ConversationStorage();
  
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // Initialize conversation storage
  conversationStorage.initialize().catch(err => {
    console.error('Failed to initialize conversation storage:', err);
  });

  // Create application menu
  createAppMenu();

  // Load the React app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../client/build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to avoid flashing white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set up IPC handlers
  setupIpcHandlers();

  // Set up response streaming events
  setupStreamingEvents();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Cleanup resources
    responseHandler.stopAllStreams();
    mainWindow = null;
  });
}

/**
 * Set up streaming response events
 */
function setupStreamingEvents() {
  responseHandler.on('response-update', (responses) => {
    if (mainWindow) {
      mainWindow.webContents.send('response-update', responses);
    }
  });
  
  responseHandler.on('response-complete', (modelId, response) => {
    if (mainWindow) {
      mainWindow.webContents.send('response-complete', modelId, response);
    }
  });
  
  responseHandler.on('response-error', (modelId, error) => {
    if (mainWindow) {
      mainWindow.webContents.send('response-error', modelId, {
        message: error.message,
        stack: error.stack
      });
    }
  });
}

function setupIpcHandlers() {
  // Get available models
  ipcMain.handle('get-available-models', async () => {
    try {
      // Initialize sessions for models if they don't exist
      const modelIds = ['claude', 'chatgpt', 'grok', 'gemini'];
      const models = [];

      for (const id of modelIds) {
        let session = browserIntegrator.getSession(id);
        if (!session) {
          session = await browserIntegrator.createSession(id);
        }
        
        // Refresh session to check login status
        await browserIntegrator.refreshSession(id);
        
        models.push({
          id: session.id,
          name: session.name,
          isLoggedIn: session.isLoggedIn
        });
      }
      
      return models;
    } catch (error) {
      console.error('Error getting available models:', error);
      return [];
    }
  });

  // Login to a model
  ipcMain.handle('login-to-model', async (event, modelId) => {
    try {
      const view = await browserIntegrator.showLoginUI(modelId);
      
      return new Promise((resolve) => {
        // Monitor URL changes to detect successful login
        const urlChangeHandler = (e, url) => {
          if (browserIntegrator.isLoggedInUrl(modelId, url)) {
            // Hide login UI
            browserIntegrator.hideLoginUI(modelId);
            // Update login status
            browserIntegrator.setLoginStatus(modelId, true);
            // Remove listener
            view.webContents.removeListener('did-navigate', urlChangeHandler);
            // Resolve with success
            resolve({ success: true });
          }
        };
        
        view.webContents.on('did-navigate', urlChangeHandler);
        view.webContents.on('did-navigate-in-page', urlChangeHandler);
        
        // Also check the current URL after a short delay
        // (in case we're already logged in)
        setTimeout(() => {
          view.webContents.getURL().then(url => {
            if (browserIntegrator.isLoggedInUrl(modelId, url)) {
              // Hide login UI
              browserIntegrator.hideLoginUI(modelId);
              // Update login status
              browserIntegrator.setLoginStatus(modelId, true);
              // Remove listener
              view.webContents.removeListener('did-navigate', urlChangeHandler);
              view.webContents.removeListener('did-navigate-in-page', urlChangeHandler);
              // Resolve with success
              resolve({ success: true });
            }
          });
        }, 1000);
      });
    } catch (error) {
      console.error(`Error logging in to ${modelId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Cancel login
  ipcMain.handle('cancel-login', async (event, modelId) => {
    try {
      await browserIntegrator.hideLoginUI(modelId);
      return { success: true };
    } catch (error) {
      console.error(`Error canceling login for ${modelId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Check login status for all models
  ipcMain.handle('check-login-status', async () => {
    try {
      const status = await browserIntegrator.checkAllSessions();
      return { success: true, status };
    } catch (error) {
      console.error('Error checking login status:', error);
      return { success: false, error: error.message };
    }
  });

  // Send prompt to selected models
  ipcMain.handle('send-prompt', async (event, prompt, modelIds) => {
    try {
      // Start collecting responses
      responseHandler.collectResponses(prompt, modelIds);
      
      // Create a record of this conversation
      await conversationStorage.addConversation(prompt, {});
      
      return { success: true };
    } catch (error) {
      console.error('Error sending prompt:', error);
      return { success: false, error: error.message };
    }
  });

  // Stop response generation
  ipcMain.handle('stop-generation', async () => {
    try {
      responseHandler.stopAllStreams();
      return { success: true };
    } catch (error) {
      console.error('Error stopping generation:', error);
      return { success: false, error: error.message };
    }
  });

  // Export to Obsidian
  ipcMain.handle('export-to-obsidian', async (event, conversationId = null) => {
    try {
      // If vault path not set, ask for it
      if (!obsidianIntegrator.vaultPath) {
        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory'],
          title: 'Select Obsidian Vault'
        });
        
        if (result.canceled) {
          return { success: false, error: 'Vault selection canceled' };
        }
        
        await obsidianIntegrator.setVaultPath(result.filePaths[0]);
      }
      
      let prompt, responses;
      
      if (conversationId) {
        // Get conversation from storage
        const conversation = await conversationStorage.getConversation(conversationId);
        if (!conversation) {
          return { success: false, error: 'Conversation not found' };
        }
        
        prompt = conversation.prompt;
        responses = conversation.responses;
      } else {
        // Use current active conversation
        prompt = Object.values(responseHandler.getResponses())[0]?.prompt || '';
        responses = responseHandler.getResponses();
      }
      
      // Generate mindmap
      const filePath = await obsidianIntegrator.addConversation(prompt, responses);
      
      // Update conversation in storage if it exists
      if (conversationId) {
        await conversationStorage.updateConversation(conversationId, {
          exportedToObsidian: true
        });
      }
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting to Obsidian:', error);
      return { success: false, error: error.message };
    }
  });

  // Set Obsidian vault path
  ipcMain.handle('set-obsidian-vault', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Obsidian Vault'
      });
      
      if (result.canceled) {
        return { success: false, error: 'Vault selection canceled' };
      }
      
      const folderPath = await obsidianIntegrator.setVaultPath(result.filePaths[0]);
      return { success: true, vaultPath: result.filePaths[0], folderPath };
    } catch (error) {
      console.error('Error setting Obsidian vault:', error);
      return { success: false, error: error.message };
    }
  });

  // Conversation history management
  ipcMain.handle('get-conversations', async (event, limit = 50, offset = 0) => {
    try {
      const conversations = await conversationStorage.getConversations(limit, offset);
      return { success: true, conversations };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-conversation', async (event, id) => {
    try {
      const conversation = await conversationStorage.getConversation(id);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }
      return { success: true, conversation };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-conversation', async (event, id) => {
    try {
      const success = await conversationStorage.deleteConversation(id);
      return { success };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('search-conversations', async (event, query, limit = 50) => {
    try {
      const conversations = await conversationStorage.searchConversations(query, limit);
      return { success: true, conversations };
    } catch (error) {
      console.error('Error searching conversations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clear-all-conversations', async () => {
    try {
      const success = await conversationStorage.clearAllConversations();
      return { success };
    } catch (error) {
      console.error('Error clearing conversations:', error);
      return { success: false, error: error.message };
    }
  });

  // App settings
  ipcMain.handle('get-app-settings', async () => {
    try {
      // TODO: Implement settings storage
      return { 
        success: true, 
        settings: {
          theme: 'light',
          responseViewMode: 'tabs',
          autoExportToObsidian: false,
          obsidianVaultPath: obsidianIntegrator.vaultPath || null
        } 
      };
    } catch (error) {
      console.error('Error getting app settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-app-settings', async (event, settings) => {
    try {
      // TODO: Implement settings storage
      if (settings.obsidianVaultPath && settings.obsidianVaultPath !== obsidianIntegrator.vaultPath) {
        await obsidianIntegrator.setVaultPath(settings.obsidianVaultPath);
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving app settings:', error);
      return { success: false, error: error.message };
    }
  });
  // Test command handler
  ipcMain.handle('test-command', async () => {
    try {
      return { success: true, message: 'Test command executed successfully!' };
    } catch (error) {
      console.error('Error executing test command:', error);
      return { success: false, error: error.message };
    }
  });

}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aegntic Desktop is an Electron application that provides a unified interface for multiple AI chat services (Claude, ChatGPT, Grok, Gemini) with Obsidian mindmap integration. It uses direct browser integration through Electron's BrowserView to maintain persistent login sessions and enable side-by-side comparison of AI responses.

## Architecture

- **Frontend**: React with TypeScript (in `client/` directory)
- **Backend**: Electron main process with Node.js services (in `electron/` directory)
- **Communication**: IPC (Inter-Process Communication) between React and Electron
- **Browser Integration**: BrowserView for embedding AI service websites
- **Storage**: Local IndexedDB for conversation history

### Key Components

- `electron/main.js`: Main Electron process and application entry point
- `client/src/components/MultiAIApp.tsx`: Primary React component coordinating the UI
- `electron/services/browserIntegration.js`: Service for managing embedded browsers for each AI service
- `electron/services/streamingResponseHandler.js`: Handles real-time response streaming from AI services
- `electron/services/obsidianIntegration.js`: Manages mindmap export to Obsidian
- `electron/services/conversationStorage.js`: Local conversation history management

## Essential Commands

### Development
```bash
# Install dependencies (both root and client)
npm install
cd client && npm install && cd ..

# Start development server (runs React dev server + Electron)
npm start

# Alternative: use convenience script
./run-dev.sh
```

### Building
```bash
# Build React app and create Electron distribution
npm run build

# Alternative: use convenience script
./build-app.sh

# Build React app only
npm run react-build

# Build and publish release
npm run release
```

### Testing
```bash
# Run React tests
cd client && npm test

# Currently no specific Electron tests defined
# Tests are handled via react-scripts test runner
```

## Development Workflow

1. **Dual Process Development**: The app runs as two processes:
   - React development server on `http://localhost:3000`
   - Electron main process that loads the React app

2. **IPC Communication**: Main process and renderer communicate via:
   - `window.electronAPI` object (defined in `electron/preload.js`)
   - IPC channels for sending prompts, receiving responses, managing settings

3. **Browser Integration**: Each AI service runs in its own BrowserView:
   - Persistent sessions maintain login state
   - DOM injection for prompt sending and response extraction
   - Service-specific selectors defined in `browserIntegration.js`

4. **Response Streaming**: Real-time response display:
   - Polling mechanism to capture streaming responses
   - Progressive content updates via IPC events
   - Stop generation capability

## Configuration

### AI Service Integration
Services are configured in `electron/services/browserIntegration.js`:
- **Claude**: `https://claude.ai/chats`
- **ChatGPT**: `https://chat.openai.com`
- **Grok**: `https://grok.x.ai`
- **Gemini**: `https://gemini.google.com/app`

Each service has specific DOM selectors for:
- Input fields (textarea for prompts)
- Send buttons
- Response containers

### Obsidian Integration
- Uses Obsidian URI protocol for direct integration
- Generates structured mindmaps from conversations
- Configurable vault path in application settings

## Common Issues & Solutions

### Development Server Issues
```bash
# If React dev server fails to start
cd client && npm install && npm start

# If Electron fails to connect
# Ensure React dev server is running on port 3000
# Check that wait-on dependency is properly waiting for the server
```

### Build Issues
```bash
# If electron-builder is missing
npm install electron-builder --save-dev

# If React build fails
cd client && npm run build

# Clean build (remove node_modules and reinstall)
rm -rf node_modules client/node_modules
npm install && cd client && npm install
```

### Browser Integration Issues
- **Login Sessions**: BrowserView sessions persist between app restarts
- **Service Updates**: AI service DOM changes may require selector updates in `browserIntegration.js`
- **CORS/Security**: Some services may block automation - handled via BrowserView isolation

## File Structure

```
aegntic-desktop/
├── client/                          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── MultiAIApp.tsx      # Main app component
│   │   │   ├── ModelSelector.tsx   # AI service selection
│   │   │   ├── PromptInput.tsx     # Prompt input component
│   │   │   ├── ResponseView.tsx    # Response display
│   │   │   ├── HistoryPanel.tsx    # Conversation history
│   │   │   └── SettingsPanel.tsx   # App settings
│   │   └── App.tsx                 # React entry point
│   └── package.json                # Client dependencies
├── electron/
│   ├── main.js                     # Electron main process
│   ├── preload.js                  # IPC bridge
│   └── services/                   # Backend services
│       ├── browserIntegration.js   # AI service browser management
│       ├── streamingResponseHandler.js  # Response streaming
│       ├── obsidianIntegration.js  # Obsidian export
│       └── conversationStorage.js  # Local storage
├── package.json                    # Main dependencies and scripts
├── build.js                        # Custom build script
├── run-dev.sh                      # Development launcher
└── build-app.sh                    # Production build script
```

## Performance Considerations

- **Memory Management**: Each AI service runs in isolated BrowserView
- **Startup Time**: Concurrent React + Electron startup via `concurrently`
- **Response Streaming**: Efficient polling with DOM observation
- **Storage**: IndexedDB for conversation persistence without blocking UI

## Security & Privacy

- **Local Storage**: All conversations stored locally via IndexedDB
- **Session Isolation**: Each AI service has isolated browser session
- **No API Keys**: Uses direct browser authentication (no stored credentials)
- **Sandboxing**: Electron security best practices with context isolation
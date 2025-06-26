# Aegntic Desktop

An Electron application that integrates multiple AI chat services (Claude, ChatGPT, Grok, Gemini) into a single desktop interface, with Obsidian mindmap generation.

## Project Overview

Aegntic Desktop provides a unified interface for premium AI services using direct browser integration, maintaining persistent login sessions, and allowing side-by-side comparison of responses.

### Key Features

- **Multiple AI Services**: Integrate Claude, ChatGPT, Grok, and Gemini in one interface
- **Direct Browser Integration**: Uses Electron's BrowserView to access services
- **Real-time Response Streaming**: View responses as they're generated
- **Side-by-side Comparison**: Compare responses from different models
- **Obsidian Mindmaps**: Export conversations as structured mindmaps
- **Conversation History**: Save and manage previous conversations
- **Persistent Sessions**: Maintain login state between app sessions
- **Dark Mode**: Customizable appearance with light and dark themes

## Second Iteration Improvements

This release includes significant improvements over the initial MVP:

1. **Response Streaming Implementation**: Real-time display of AI responses as they're generated
2. **Enhanced Session Management**: Improved reliability of login sessions with automatic refresh
3. **Robust Error Handling**: Better error recovery and user notifications
4. **UI Polish**: Improved design with dark mode support
5. **Local History & Storage**: Conversation history persists between sessions
6. **Settings Panel**: Customizable user preferences
7. **Advanced Mindmap Generation**: Better organization of exported content
8. **Keyboard Shortcuts**: Support for keyboard navigation and input

## Technical Implementation

- **Electron**: Cross-platform desktop application framework
- **React & TypeScript**: For a robust, type-safe UI
- **BrowserView**: Electron's embedded browser capability
- **IPC Communication**: For main process / renderer process communication
- **Local Storage**: IndexedDB for conversation history
- **Obsidian URI Protocol**: For direct integration with Obsidian

## Getting Started

1. **Prerequisites**:
   - Node.js (v14+)
   - npm or yarn

2. **Installation**:
   ```bash
   # Clone the repository
   git clone https://github.com/aegntic/aegntic-desktop.git
   cd aegntic-desktop

   # Install dependencies
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Development**:
   ```bash
   # Start the application in development mode
   npm start
   ```

4. **Building**:
   ```bash
   # Create a distribution package
   npm run build
   ```

## Usage Guide

1. **First Launch**:
   - Set your Obsidian vault location
   - Login to your preferred AI services
   
2. **Sending Prompts**:
   - Select one or more AI models
   - Enter your prompt
   - Click "Send Prompt" or use Ctrl+Enter
   
3. **Viewing Responses**:
   - Switch between tab and split view
   - Watch responses stream in real-time
   - Stop generation if needed
   
4. **Exporting to Obsidian**:
   - Click "Export to Obsidian" to create a mindmap
   - Access conversations from your Obsidian vault
   
5. **Managing History**:
   - View past conversations
   - Reload previous prompts and responses
   - Delete unwanted history items

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

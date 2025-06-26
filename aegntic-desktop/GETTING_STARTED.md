# Getting Started with Aegntic Desktop

This guide will help you set up and run the Aegntic Desktop application on your system.

## Prerequisites

- **Node.js**: v14.0.0 or higher (v16+ recommended)
- **npm**: v6.0.0 or higher
- **Electron**: v19.0.0 or higher (installed as a dependency)
- **Obsidian**: Optional, for mindmap integration

## Installation

1. **Clone the repository** (or download and extract the ZIP file):
   ```bash
   git clone https://github.com/yourusername/aegntic-desktop.git
   cd aegntic-desktop
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

## Development Environment

### Running in Development Mode

Use the provided script:
```bash
./run-dev.sh
```

Or manually:
```bash
# Start the React development server
npm run react-start

# In a separate terminal, start the Electron app
npm run electron-start
```

The application will open with hot reloading enabled for the React components.

### Development Tips

- The React development server runs on `http://localhost:3000`
- Electron DevTools can be accessed with F12 or Ctrl+Shift+I
- Changes to React components will automatically reload
- Changes to Electron main process require restarting the application

## Building for Production

To create a distributable package:

```bash
./build-app.sh
```

Or manually:
```bash
# Build the application
npm run build
```

This will create distribution packages in the `dist` directory for your current platform.

## Application Structure

```
aegntic-desktop/
├── assets/                 # Application resources
├── client/                 # React frontend
│   ├── public/             # Public assets
│   ├── src/                # React source code
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main App component
│   │   └── index.tsx       # Entry point
├── electron/               # Electron main process
│   ├── services/           # Backend services
│   │   ├── browserIntegration.js    # Browser integration
│   │   ├── streamingResponseHandler.js # Streaming responses
│   │   ├── conversationStorage.js   # History storage
│   │   └── obsidianIntegration.js   # Obsidian export
│   └── main.js             # Main Electron process
└── package.json            # Project configuration
```

## Usage Guide

### First Launch

1. When you first open the application, you'll need to:
   - Log in to your AI services
   - Set your Obsidian vault (if you want to use this feature)

2. **Logging in**:
   - Click the "Login" button next to each AI service
   - Complete the login in the embedded browser
   - The login state will persist between application restarts

3. **Setting up Obsidian**:
   - Click "Set Obsidian Vault" and select your vault folder
   - Make sure Obsidian is installed on your system

### Daily Usage

1. **Sending a prompt**:
   - Select one or more AI models using the checkboxes
   - Enter your prompt in the text area
   - Press Ctrl+Enter or click "Send Prompt"
   - Watch as responses stream in real-time

2. **Viewing responses**:
   - Switch between "Tabs" and "Split View" modes
   - In "Tabs" mode, click each tab to see individual responses
   - In "Split View" mode, compare all responses side-by-side

3. **Managing conversations**:
   - Click "History" to view past conversations
   - Click on a conversation to reload it
   - Use the delete button to remove unwanted conversations
   - Export conversations to Obsidian with the export button

4. **Customizing settings**:
   - Click "Settings" to open the settings panel
   - Change theme between light and dark mode
   - Set default view mode
   - Configure automatic exports

## Troubleshooting

### Common Issues

**Login problems**:
- Try clearing your session data by quitting the app and deleting the data in:
  - Windows: `%APPDATA%/aegntic-desktop`
  - macOS: `~/Library/Application Support/aegntic-desktop`
  - Linux: `~/.config/aegntic-desktop`

**Obsidian integration not working**:
- Make sure Obsidian is installed
- Verify that your vault path is correctly set
- Check that URI protocol handling is enabled in Obsidian

**Application crashes**:
- Check the logs in:
  - Windows: `%APPDATA%/aegntic-desktop/logs`
  - macOS: `~/Library/Logs/aegntic-desktop`
  - Linux: `~/.config/aegntic-desktop/logs`

### Getting Help

If you encounter issues not covered here:
- Check the GitHub repository for open issues
- Submit a new issue with detailed reproduction steps

## Contributing

Contributions are welcome! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

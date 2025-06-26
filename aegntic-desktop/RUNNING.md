# Running Aegntic Desktop MVP

This is a minimal viable product (MVP) implementation of the Aegntic Desktop application. Here's how to run it:

## Project Structure

```
aegntic-desktop/
├── assets/                 # Application resources
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── MultiAIApp.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── PromptInput.tsx
│   │   │   └── ResponseView.tsx
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.tsx
├── electron/               # Electron main process
│   ├── services/
│   │   ├── browserIntegration.js
│   │   ├── responseHandler.js
│   │   └── obsidianIntegration.js
│   └── main.js             # Main Electron process
├── node_modules/
├── package.json
└── README.md
```

## Development Quick Start

1. Install dependencies in both the root and client directories:

```bash
# In the root directory
npm install

# In the client directory
cd client
npm install
cd ..
```

2. Run the application in development mode:

```bash
# Start the React development server
npm run react-start

# In a separate terminal, start the Electron app
npm run electron-start
```

The application will open in development mode with both the React and Electron processes running.

## Running in Production Mode

To build and run the application in production mode:

```bash
# Build the React app
npm run react-build

# Start the Electron app in production mode
npm run electron-start
```

## Creating a Distributable Package

To create a distributable package for your platform:

```bash
# Build for your current platform
npm run build
```

This will create distribution packages in the `dist` directory.

## Usage Workflow

1. **First Launch Setup**:
   - The application will open with all AI models disconnected
   - Click the "Set Obsidian Vault" button to select your Obsidian vault (if you use Obsidian)

2. **Connecting to AI Services**:
   - Click the "Login" button next to each AI model you want to use
   - Complete the login process in the embedded browser window
   - After successful login, the model will show as "Connected"

3. **Using the Application**:
   - Select one or more AI models using the checkboxes
   - Enter your prompt in the text area
   - Click "Send Prompt" to send the prompt to all selected models
   - View responses in either tab or split view
   - Click "Export to Obsidian" to create a mindmap from the conversation

## Troubleshooting

- **Login Issues**: If you're having trouble logging in, try clearing the persistent sessions:
  - Quit the application
  - Delete the data in the `%APPDATA%/aegntic-desktop` directory (Windows) or `~/Library/Application Support/aegntic-desktop` (macOS)
  - Restart the application

- **Display Issues**: If browser windows don't display properly, ensure you're running a recent version of Electron (v20+)

- **Obsidian Integration**: Make sure you have Obsidian installed and have selected a valid vault

## Next Steps and MVP Limitations

This MVP implements the core functionality but has some limitations:

- **Limited Error Handling**: The error handling is basic; unexpected issues may cause crashes
- **Response Streaming**: The current implementation doesn't support streaming responses
- **UI Polish**: The interface is functional but minimal
- **Session Management**: Session persistence is basic and may require manual re-login
- **CSS Integration**: The CSS styling is functional but could be improved

Future development will address these limitations and add more advanced features.

## Testing

For manual testing:
1. Try logging in with each AI service
2. Send prompts to multiple services simultaneously  
3. Test the Obsidian export functionality
4. Verify side-by-side comparison works

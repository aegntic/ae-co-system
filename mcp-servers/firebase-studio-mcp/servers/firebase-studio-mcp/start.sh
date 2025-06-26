#!/bin/bash
set -e

echo "Firebase Studio MCP Server Starter"
echo "=================================="

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Using Node.js version: $NODE_VERSION"

# Create local bin directory if it doesn't exist
mkdir -p ~/bin
export PATH="$HOME/bin:$PATH"

# Install Firebase CLI locally
if ! command -v firebase >/dev/null 2>&1; then
  echo "Installing Firebase CLI locally..."
  
  # Use npx to run firebase-tools without global installation
  mkdir -p ~/firebase-tools-local
  cd ~/firebase-tools-local
  npm init -y --scope=firebase-local
  npm install firebase-tools
  
  # Create a symlink in ~/bin
  ln -sf ~/firebase-tools-local/node_modules/.bin/firebase ~/bin/firebase
  echo "✓ Firebase CLI installed locally"
fi

# Verify installation
if command -v firebase >/dev/null 2>&1; then
  FIREBASE_VERSION=$(firebase --version)
  echo "✓ Using Firebase CLI version: $FIREBASE_VERSION"
else
  echo "⚠️ Firebase CLI installation failed"
fi

# Start the server
echo
echo "Starting Firebase Studio MCP Server..."
cd ~/mcp-servers/firebase-studio-mcp/servers/firebase-studio-mcp
node index.js

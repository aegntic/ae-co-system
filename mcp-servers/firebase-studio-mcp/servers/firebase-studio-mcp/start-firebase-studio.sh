#!/bin/bash
# Firebase Studio MCP Server Startup Script
# This script correctly configures the environment and starts the server

# Set up path variables
NODE_PATH="/usr/local/lib/nodejs/bin"
GCLOUD_PATH="$HOME/google-cloud-sdk-install/google-cloud-sdk/bin"
SERVER_DIR="$HOME/mcp-servers/firebase-studio-mcp/servers/firebase-studio-mcp"

# Set environment variables
export PATH="$NODE_PATH:$GCLOUD_PATH:$PATH"
export MCP_PORT=${MCP_PORT:-3001}

# Display environment info
echo "=== Firebase Studio MCP Server ==="
echo "Node.js version: $($NODE_PATH/node -v)"
echo "npm version: $($NODE_PATH/npm -v)"

# Check Firebase CLI
if command -v firebase >/dev/null 2>&1; then
  FIREBASE_VERSION=$(firebase --version)
  echo "Firebase CLI version: $FIREBASE_VERSION"
else
  echo "Firebase CLI not found - Run 'sudo npm install -g firebase-tools'"
  exit 1
fi

# Check Google Cloud SDK
if [ -f "$GCLOUD_PATH/gcloud" ]; then
  GCLOUD_VERSION=$($GCLOUD_PATH/gcloud --version | head -n 1)
  echo "Google Cloud SDK: $GCLOUD_VERSION"
else
  echo "Google Cloud SDK not found in expected location"
  exit 1
fi

# Firebase Authentication Status
echo "Checking Firebase authentication status..."
if [ -f "$HOME/.firebase-auth.json" ]; then
  AUTH_STATUS=$(cat $HOME/.firebase-auth.json)
  echo "Auth config found: $AUTH_STATUS"
else
  echo "Not authenticated with Firebase. Server will prompt for login when needed."
fi

# Start the server
echo "Starting Firebase Studio MCP Server on port $MCP_PORT..."
cd "$SERVER_DIR"
$NODE_PATH/node index.js

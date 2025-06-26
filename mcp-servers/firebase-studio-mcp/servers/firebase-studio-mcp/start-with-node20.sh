#!/bin/bash

# Use Node.js v20
NODE_PATH="/usr/local/lib/nodejs/bin"
GCLOUD_PATH="$HOME/google-cloud-sdk-install/google-cloud-sdk/bin"

# Export paths
export PATH="$NODE_PATH:$GCLOUD_PATH:$PATH"

# Verify versions
echo "Using Node.js version: $($NODE_PATH/node -v)"
echo "Using npm version: $($NODE_PATH/npm -v)"

# Check Firebase CLI
if command -v firebase >/dev/null 2>&1; then
  FIREBASE_VERSION=$(firebase --version)
  echo "Using Firebase CLI version: $FIREBASE_VERSION"
else
  echo "Firebase CLI not found - Installing now..."
  $NODE_PATH/npm install -g firebase-tools
  echo "Firebase CLI installed."
fi

# Start the server
echo "Starting Firebase Studio MCP Server..."
cd ~/mcp-servers/firebase-studio-mcp/servers/firebase-studio-mcp
$NODE_PATH/node index.js

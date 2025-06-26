#!/bin/bash
set -e

echo "Firebase Studio & Google Cloud SDK Setup"
echo "========================================"

# Check for existing installations
echo "Checking existing installations..."

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_VERSION=$(firebase --version | head -n 1)
  echo "✓ Firebase CLI already installed: $FIREBASE_VERSION"
  FIREBASE_INSTALLED=true
else
  echo "✗ Firebase CLI not found"
  FIREBASE_INSTALLED=false
fi

if command -v gcloud >/dev/null 2>&1; then
  GCLOUD_VERSION=$(gcloud --version | head -n 1)
  echo "✓ Google Cloud SDK already installed: $GCLOUD_VERSION"
  GCLOUD_INSTALLED=true
else
  echo "✗ Google Cloud SDK not found"
  GCLOUD_INSTALLED=false
fi

# Installation section
echo
echo "Installation options:"
echo "---------------------"

if [ "$FIREBASE_INSTALLED" = false ]; then
  INSTALL_FIREBASE="Y"
  if [[ $INSTALL_FIREBASE =~ ^[Yy]$ ]]; then
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
    echo "✓ Firebase CLI installed"
  fi
fi

if [ "$GCLOUD_INSTALLED" = false ]; then
  INSTALL_GCLOUD="N"
  echo "Skipping Google Cloud SDK installation..."
fi

# Configuration
echo
echo "Configuration:"
echo "-------------"

# Skip Firebase login
if command -v firebase >/dev/null 2>&1; then
  FIREBASE_LOGIN="N"
  echo "Skipping Firebase login for now..."
fi

# Skip gcloud login
if command -v gcloud >/dev/null 2>&1; then
  GCLOUD_LOGIN="N"
  echo "Skipping Google Cloud SDK login for now..."
fi

# Skip Project setup
echo
echo "Project Setup:"
echo "-------------"
SETUP_PROJECT="N"
echo "Skipping Firebase project setup for now..."

echo
echo "Setup Complete!"
echo "---------------"
echo "Firebase Studio MCP Server is ready to use."
echo
echo "Next Steps:"
echo "1. Start the server: npm start"
echo "2. Connect to the MCP server at http://localhost:3000"

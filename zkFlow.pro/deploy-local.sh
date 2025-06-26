#!/bin/bash

# zkFlow.pro - Local Deployment Helper
# This script helps you deploy to Chrome Web Store from your local machine

echo "🚀 zkFlow.pro - Chrome Web Store Deployment Helper"
echo "=================================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo "🔍 Checking requirements..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules/puppeteer" ]; then
    echo "📦 Installing Puppeteer for automation..."
    npm install puppeteer
fi

# Check if extension is built
if [ ! -f "extension/zkflow-pro.zip" ]; then
    echo "📦 Building extension..."
    cd extension
    npm run build
    npm run package
    cd ..
fi

# Check if screenshots exist
if [ ! -f "store-assets/screenshot-1-hero.png" ]; then
    echo "📸 Generating screenshots..."
    cd store-assets
    node capture-screenshots.js
    cd ..
fi

echo ""
echo "✅ All files are ready!"
echo ""
echo "Choose your deployment method:"
echo ""
echo "1) 🤖 Automated Upload (Recommended)"
echo "   - Opens Chrome and fills everything automatically"
echo "   - You just need to review and click submit"
echo ""
echo "2) 📋 Manual Upload with Helper"
echo "   - Opens all necessary files and folders"
echo "   - You copy and paste the information"
echo ""
echo -n "Enter your choice (1 or 2): "
read choice

case $choice in
    1)
        echo ""
        echo "🤖 Starting automated upload..."
        echo ""
        node chrome-store-uploader-smart.js
        ;;
    2)
        echo ""
        echo "📋 Opening files for manual upload..."
        echo ""
        
        # Open Chrome Web Store Developer Dashboard
        if command_exists open; then
            # macOS
            open "https://chrome.google.com/webstore/devconsole"
            open "extension/"
            open "store-assets/"
            open "CHROME_STORE_LISTING.md"
        elif command_exists xdg-open; then
            # Linux
            xdg-open "https://chrome.google.com/webstore/devconsole"
            xdg-open "extension/"
            xdg-open "store-assets/"
            xdg-open "CHROME_STORE_LISTING.md"
        elif command_exists start; then
            # Windows
            start "https://chrome.google.com/webstore/devconsole"
            start "extension/"
            start "store-assets/"
            start "CHROME_STORE_LISTING.md"
        fi
        
        echo "✅ Opened all necessary files and folders"
        echo ""
        echo "📋 Manual upload steps:"
        echo "1. Log in to Chrome Web Store Developer Dashboard"
        echo "2. Click 'New Item'"
        echo "3. Upload: extension/zkflow-pro.zip"
        echo "4. Copy text from CHROME_STORE_LISTING.md"
        echo "5. Upload screenshots from store-assets/ folder"
        echo "6. Set pricing: $4.99/month for Pro"
        echo "7. Submit for review!"
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Good luck with your launch!"
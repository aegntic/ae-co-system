#!/bin/bash

# Build script for zkFlow.pro Chrome Extension

echo "🚀 Building zkFlow.pro Chrome Extension..."

# Clean previous build
rm -f zkflow-pro-extension.zip

# Create icons if they don't exist
if [ ! -f "assets/icons/icon-16.png" ]; then
    echo "⚠️  Icons not found. Please generate icons first:"
    echo "   1. Open assets/icons/icon-placeholder.html in browser"
    echo "   2. Save as icon-16.png, icon-48.png, icon-128.png"
    exit 1
fi

# Check manifest
if [ ! -f "manifest.json" ]; then
    echo "❌ manifest.json not found!"
    exit 1
fi

# Create distribution package
echo "📦 Creating distribution package..."
zip -r zkflow-pro-extension.zip . \
    -x "*.git*" \
    -x "node_modules/*" \
    -x "*.md" \
    -x "*.sh" \
    -x "package*.json" \
    -x ".gitignore" \
    -x "*.map" \
    -x "test/*"

echo "✅ Build complete!"
echo "📁 Output: zkflow-pro-extension.zip"
echo "📏 Size: $(du -h zkflow-pro-extension.zip | cut -f1)"

# Verify contents
echo ""
echo "📋 Package contents:"
unzip -l zkflow-pro-extension.zip | grep -E "\.(js|html|css|json|png)$" | tail -20

echo ""
echo "🎯 Next steps:"
echo "1. Test the extension in Chrome (developer mode)"
echo "2. Upload to Chrome Web Store Developer Dashboard"
echo "3. Follow CHROME_STORE_SUBMISSION.md guide"
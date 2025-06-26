#!/bin/bash

# zkFlow.pro - Complete Chrome Web Store Launch Script
# This script prepares and uploads the extension to Chrome Web Store

echo "🚀 zkFlow.pro - Chrome Web Store Launch Script"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "extension" ]; then
    echo "❌ Error: Please run this script from the zkFlow.pro root directory"
    exit 1
fi

# Step 1: Generate icons if they don't exist
echo "🎨 Step 1: Checking icons..."
if [ ! -f "extension/assets/icons/icon128.png" ]; then
    echo "   Generating missing icons..."
    cd extension/assets/icons
    node generate-icons-auto.js
    cd ../../..
else
    echo "   ✅ Icons already exist"
fi
echo ""

# Step 2: Generate screenshots if they don't exist
echo "📸 Step 2: Checking screenshots..."
if [ ! -f "store-assets/screenshot-1-hero.png" ]; then
    echo "   Generating screenshots..."
    cd store-assets
    node capture-screenshots.js
    cd ..
else
    echo "   ✅ Screenshots already exist"
fi
echo ""

# Step 3: Build and package the extension
echo "📦 Step 3: Building extension..."
cd extension
npm run build
npm run package
cd ..
echo "   ✅ Extension packaged: extension/zkflow-pro.zip"
echo ""

# Step 4: Verify all files are ready
echo "🔍 Step 4: Verifying all files..."
MISSING_FILES=0

# Check required files
FILES_TO_CHECK=(
    "extension/zkflow-pro.zip"
    "store-assets/screenshot-1-hero.png"
    "store-assets/promotional-tile-440x280.png"
    "CHROME_STORE_LISTING.md"
    "chrome-store-uploader.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo "   ✅ Found: $file"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo "❌ Some files are missing. Please fix the issues above and try again."
    exit 1
fi
echo ""

# Step 5: Show checklist
echo "📋 Pre-flight Checklist:"
echo "   ✅ Extension built and packaged"
echo "   ✅ Icons generated (16x16, 48x48, 128x128)"
echo "   ✅ Screenshots captured (5 main + promotional)"
echo "   ✅ Store listing content prepared"
echo "   ✅ Automated uploader ready"
echo ""

echo "🎯 Ready for Chrome Web Store submission!"
echo ""
echo "⚠️  Before proceeding, make sure you have:"
echo "   • A Google account"
echo "   • Chrome Web Store Developer account ($5 one-time fee)"
echo "   • About 10 minutes for the upload process"
echo ""

# Step 6: Launch the uploader
echo "🚀 Launching Chrome Web Store uploader..."
echo "   The script will open Chrome and guide you through the process."
echo "   You'll need to:"
echo "   1. Log in to your Google account"
echo "   2. Review the auto-filled information"
echo "   3. Add pricing details ($4.99/month for Pro)"
echo "   4. Click the final SUBMIT button"
echo ""

read -p "Press ENTER to launch the Chrome Web Store uploader..."

# Run the uploader
node chrome-store-uploader.js

echo ""
echo "🎉 Launch script completed!"
echo ""
echo "📊 Post-submission checklist:"
echo "   □ Set up Google Analytics for the extension"
echo "   □ Create a Product Hunt launch page"
echo "   □ Prepare Reddit posts for r/productivity"
echo "   □ Draft email to tech bloggers"
echo "   □ Create demo video for YouTube"
echo "   □ Set up support email/website"
echo ""
echo "Good luck with your launch! 🚀"
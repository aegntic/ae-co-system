#!/bin/bash

echo "🚀 4site.pro Remote Debug Automation"
echo "===================================="
echo ""

# Check if Chrome is running with remote debugging
if curl -s http://localhost:9222/json > /dev/null 2>&1; then
    echo "✅ Chrome remote debugging detected on port 9222"
    echo ""
    
    # Run the automation
    node remote-debug-automation.mjs
else
    echo "❌ Chrome remote debugging not detected"
    echo ""
    echo "🔧 SETUP INSTRUCTIONS:"
    echo "1. Close all Chrome windows"
    echo "2. Start Chrome with remote debugging:"
    echo ""
    echo "   google-chrome --remote-debugging-port=9222 --disable-web-security"
    echo ""
    echo "3. Navigate to your Polar.sh product metadata page"
    echo "4. Run this script again: ./run-remote-debug.sh"
    echo ""
    echo "Alternative command if google-chrome doesn't work:"
    echo "   /usr/bin/google-chrome --remote-debugging-port=9222 --disable-web-security"
    echo "   OR"
    echo "   chromium --remote-debugging-port=9222 --disable-web-security"
fi
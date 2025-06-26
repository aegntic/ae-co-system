#!/bin/bash

echo "🚀 STARTING CHROME WITH DEBUG MODE"
echo "=================================="

# Kill existing Chrome
echo "1️⃣ Killing existing Chrome processes..."
pkill -f chrome 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
sleep 2

# Start Chrome with debug
echo "2️⃣ Starting Chrome with remote debugging..."
google-chrome \
    --remote-debugging-port=9222 \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --user-data-dir=/tmp/chrome-debug \
    --new-window \
    "https://polar.sh" &

echo "3️⃣ Waiting for Chrome to start..."
sleep 5

# Test connection
echo "4️⃣ Testing connection..."
if curl -s http://localhost:9222/json > /dev/null 2>&1; then
    echo "✅ SUCCESS! Chrome debug mode is active"
    echo ""
    echo "🎯 NOW DO THIS:"
    echo "1. Navigate to your Polar.sh product metadata page"
    echo "2. Click in the metadata section"
    echo "3. Run: node remote-debug-automation.mjs"
    echo ""
else
    echo "❌ Chrome debug mode failed"
    echo "🔧 Try manually running this command:"
    echo "google-chrome --remote-debugging-port=9222 --disable-web-security --user-data-dir=/tmp/chrome-debug"
fi
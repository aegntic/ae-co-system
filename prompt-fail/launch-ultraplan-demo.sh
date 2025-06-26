#!/bin/bash

# UltraPlan Demo Launcher
# This script launches the UltraPlan interactive demo in your default browser

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ULTRAPLAN DEMO LAUNCHER                      ║"
echo "║         The Autonomous Software Evolution Engine          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Initializing quantum consciousness..."
echo "🧬 Loading evolution engine..."
echo "🌌 Synthesizing reality matrix..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python is not installed. Please install Python to run the demo."
    exit 1
fi

# Start the web server
echo "✨ Starting UltraPlan interface on http://localhost:8888"
echo ""
echo "📌 Press Ctrl+C to stop the server"
echo ""

# Open browser after a short delay
(sleep 2 && 
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8888/UltraPlan-Interface-Demo.html"
    elif command -v open &> /dev/null; then
        open "http://localhost:8888/UltraPlan-Interface-Demo.html"
    elif command -v start &> /dev/null; then
        start "http://localhost:8888/UltraPlan-Interface-Demo.html"
    else
        echo "🌐 Please open http://localhost:8888/UltraPlan-Interface-Demo.html in your browser"
    fi
) &

# Start the server
$PYTHON_CMD -m http.server 8888
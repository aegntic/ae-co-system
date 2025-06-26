#!/bin/bash

echo "🏢 Starting DailyDoco Pro - Enterprise Premium Version"
echo "============================================"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Start the development server
echo "🎯 Starting development server on http://localhost:5174"
bun run dev
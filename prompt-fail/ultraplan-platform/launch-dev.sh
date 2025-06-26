#!/bin/bash
# UltraPlan Development Launch Script

echo "🚀 Starting UltraPlan Development Environment..."

# Check if node/npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."

# Extension
cd extension
if [ ! -d "node_modules" ]; then
    npm install
fi

# Webapp
cd ../webapp
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build extension
echo "🔨 Building extension..."
cd ../extension
npm run build

echo "✅ Extension built! Load the 'dist' folder as an unpacked extension in Chrome"

# Start webapp
echo "🌐 Starting webapp development server..."
cd ../webapp
npm run dev &

echo "
✨ UltraPlan Development Environment Ready!

📍 Web App: http://localhost:5173
📍 Extension: Load ./extension/dist in Chrome

📚 Quick Commands:
  - Build extension: cd extension && npm run build
  - Start webapp: cd webapp && npm run dev
  - Run tests: npm test (in respective directories)

💡 Revenue Streams Implemented:
  - Subscription tiers (Free/$49/$299/$2999)
  - Marketplace (20% commission)
  - Certifications ($299-$2999)
  - Success Insurance (20% of budget)
  - White-label Studio ($49,999)

Press Ctrl+C to stop the development server.
"

# Keep script running
wait
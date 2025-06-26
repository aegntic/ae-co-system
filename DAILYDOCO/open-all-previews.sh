#!/bin/bash

# Kill any existing servers
pkill -f vite 2>/dev/null || true
sleep 2

echo "Starting DailyDoco Pro frontends..."

# Start c1v1 in background
cd /home/tabs/ae-co-system/DAILYDOCO/c1v1-modern-saas
bun run dev > /tmp/c1v1.log 2>&1 &
echo "Started c1v1 on port 5173"

# Start c2v1 in background  
cd /home/tabs/ae-co-system/DAILYDOCO/c2v1-enterprise-premium
bun run dev > /tmp/c2v1.log 2>&1 &
echo "Started c2v1 on port 5174"

# Start c3v1 in background
cd /home/tabs/ae-co-system/DAILYDOCO/c3v1-ai-futuristic
bun run dev > /tmp/c3v1.log 2>&1 &
echo "Started c3v1 on port 5175"

# Wait for servers to start
echo "Waiting for servers to initialize..."
sleep 8

# Open browser windows
echo "Opening browser windows..."
xdg-open "http://localhost:5173" 2>/dev/null &
sleep 1
xdg-open "http://localhost:5174" 2>/dev/null &
sleep 1
xdg-open "http://localhost:5175" 2>/dev/null &

echo "Done! All three versions should be open in your browser."
echo ""
echo "Direct links:"
echo "c1v1 Modern SaaS: http://localhost:5173"
echo "c2v1 Enterprise Premium: http://localhost:5174" 
echo "c3v1 AI-First Futuristic: http://localhost:5175"
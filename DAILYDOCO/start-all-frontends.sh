#!/bin/bash

# Start all three frontend servers
echo "Starting all DailyDoco Pro frontends..."

# Start c1v1 Modern SaaS (port 5173)
cd /home/tabs/ae-co-system/DAILYDOCO/c1v1-modern-saas && bun run dev &
PID1=$!
echo "c1v1 Modern SaaS starting on port 5173... (PID: $PID1)"

# Start c2v1 Enterprise Premium (port 5174)
cd /home/tabs/ae-co-system/DAILYDOCO/c2v1-enterprise-premium && bun run dev &
PID2=$!
echo "c2v1 Enterprise Premium starting on port 5174... (PID: $PID2)"

# Start c3v1 AI-First Futuristic (port 5175)
cd /home/tabs/ae-co-system/DAILYDOCO/c3v1-ai-futuristic && bun run dev &
PID3=$!
echo "c3v1 AI-First Futuristic starting on port 5175... (PID: $PID3)"

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

# Show running processes
echo -e "\nRunning servers:"
ps aux | grep -E "(vite|bun)" | grep -v grep

echo -e "\nAll servers started!"
echo "c1v1 Modern SaaS: http://localhost:5173"
echo "c2v1 Enterprise Premium: http://localhost:5174"
echo "c3v1 AI-First Futuristic: http://localhost:5175"

# Keep script running
wait
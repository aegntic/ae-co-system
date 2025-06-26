#!/bin/bash

echo "🚀 Launching YouTube Intelligence Engine - Complete Stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "bun.*dev" 2>/dev/null || true

sleep 2

# Verify database infrastructure is running
echo "🗄️  Verifying database infrastructure..."
if ! docker-compose ps | grep -q "Up (healthy).*postgres"; then
    echo "❌ PostgreSQL not healthy. Starting database infrastructure..."
    docker-compose up -d postgres redis neo4j
    echo "⏳ Waiting for databases to be ready..."
    sleep 20
fi

# Check database connections
echo "🔍 Testing database connections..."
if docker exec youtube-intelligence-engine_postgres_1 pg_isready -U intelligence_user -d youtube_intelligence > /dev/null 2>&1; then
    echo "✅ PostgreSQL connection verified"
else
    echo "❌ PostgreSQL connection failed"
    exit 1
fi

if docker exec youtube-intelligence-engine_redis_1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis connection verified"
else
    echo "❌ Redis connection failed"
    exit 1
fi

if docker exec youtube-intelligence-engine_neo4j_1 cypher-shell -u neo4j -p intelligence_neo4j "RETURN 1" > /dev/null 2>&1; then
    echo "✅ Neo4j connection verified"
else
    echo "⚠️  Neo4j still starting (will retry)"
fi

# Start backend API server
echo "🔧 Starting Backend API Server (FastAPI)..."
cd "/home/tabs/DAILYDOCO/R&D/youtube-intelligence-engine"
nohup uv run python main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend startup..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API running on http://localhost:8000"
else
    echo "⚠️  Backend starting (may take a moment for first run)"
fi

# Start frontend web interface
echo "🎨 Starting Frontend Web Interface (React + Bun)..."
cd "/home/tabs/DAILYDOCO/R&D/youtube-intelligence-engine/web-interface"
nohup bun run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend startup..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend interface running on http://localhost:3000"
else
    echo "⚠️  Frontend starting (may take a moment)"
fi

echo ""
echo "🎉 YouTube Intelligence Engine - LAUNCHED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Web Interface:    http://localhost:3000"
echo "🔌 API Backend:      http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "🎮 Ready to play! Open http://localhost:3000 in your browser"
echo ""
echo "📋 System Status:"
echo "   Frontend PID: $FRONTEND_PID"
echo "   Backend PID:  $BACKEND_PID"
echo ""
echo "📝 Logs available at:"
echo "   Frontend: tail -f /tmp/frontend.log"
echo "   Backend:  tail -f /tmp/backend.log"
echo ""
echo "🛑 To stop: pkill -f 'python.*main.py' && pkill -f 'vite'"
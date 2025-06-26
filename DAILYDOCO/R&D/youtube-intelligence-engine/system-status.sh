#!/bin/bash

echo "🔍 YouTube Intelligence Engine - System Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Database Infrastructure
echo "🗄️  Database Infrastructure:"
POSTGRES_STATUS=$(docker exec youtube-intelligence-engine_postgres_1 pg_isready -U intelligence_user -d youtube_intelligence 2>/dev/null && echo "✅ HEALTHY" || echo "❌ FAILED")
REDIS_STATUS=$(docker exec youtube-intelligence-engine_redis_1 redis-cli ping 2>/dev/null | grep -q "PONG" && echo "✅ HEALTHY" || echo "❌ FAILED")
NEO4J_STATUS=$(docker exec youtube-intelligence-engine_neo4j_1 cypher-shell -u neo4j -p intelligence_neo4j "RETURN 1" 2>/dev/null | grep -q "1" && echo "✅ HEALTHY" || echo "⚠️  STARTING")

echo "   PostgreSQL: $POSTGRES_STATUS"
echo "   Redis:      $REDIS_STATUS"
echo "   Neo4j:      $NEO4J_STATUS"

# Check Backend API
echo ""
echo "🔌 Backend API Server:"
BACKEND_HEALTH=$(curl -s http://localhost:8000/health | grep -q "healthy" && echo "✅ HEALTHY" || echo "❌ FAILED")
BACKEND_DOCS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "200" && echo "✅ ACCESSIBLE" || echo "❌ FAILED")

echo "   Health Check:     $BACKEND_HEALTH"
echo "   Documentation:    $BACKEND_DOCS"

if [ "$BACKEND_HEALTH" = "✅ HEALTHY" ]; then
    echo "   Detailed Status:"
    curl -s http://localhost:8000/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'     Database:    {data[\"services\"][\"database\"]}')
    print(f'     Graphitti:   {data[\"services\"][\"graphitti\"]}')
    print(f'     Scheduler:   {data[\"services\"][\"scheduler\"]}')
    print(f'     Timestamp:   {data[\"timestamp\"]}')
except:
    print('     Could not parse health data')
"
fi

# Check Frontend Interface
echo ""
echo "🎨 Frontend Web Interface:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && echo "✅ HEALTHY" || echo "❌ FAILED")
echo "   React App:        $FRONTEND_STATUS"

# Check Process Status
echo ""
echo "🔄 Process Status:"
BACKEND_PID=$(pgrep -f "python.*main.py" | head -1)
FRONTEND_PID=$(pgrep -f "vite.*dev" | head -1)

if [ ! -z "$BACKEND_PID" ]; then
    echo "   Backend PID:      $BACKEND_PID ✅"
else
    echo "   Backend PID:      Not Running ❌"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "   Frontend PID:     $FRONTEND_PID ✅"
else
    echo "   Frontend PID:     Not Running ❌"
fi

# Check Port Availability
echo ""
echo "🌐 Network Connectivity:"
FRONTEND_PORT=$(netstat -tlnp 2>/dev/null | grep ":3000" | grep -q "LISTEN" && echo "✅ OPEN" || echo "❌ CLOSED")
BACKEND_PORT=$(netstat -tlnp 2>/dev/null | grep ":8000" | grep -q "LISTEN" && echo "✅ OPEN" || echo "❌ CLOSED")
POSTGRES_PORT=$(netstat -tlnp 2>/dev/null | grep ":5432" | grep -q "LISTEN" && echo "✅ OPEN" || echo "❌ CLOSED")
REDIS_PORT=$(netstat -tlnp 2>/dev/null | grep ":6380" | grep -q "LISTEN" && echo "✅ OPEN" || echo "❌ CLOSED")
NEO4J_PORT=$(netstat -tlnp 2>/dev/null | grep ":7474" | grep -q "LISTEN" && echo "✅ OPEN" || echo "❌ CLOSED")

echo "   Frontend (3000):  $FRONTEND_PORT"
echo "   Backend (8000):   $BACKEND_PORT"
echo "   PostgreSQL (5432): $POSTGRES_PORT"
echo "   Redis (6380):     $REDIS_PORT"
echo "   Neo4j (7474):     $NEO4J_PORT"

# Overall System Status
echo ""
echo "🎯 Overall System Status:"
if [[ "$POSTGRES_STATUS" == "✅ HEALTHY" && "$REDIS_STATUS" == "✅ HEALTHY" && "$BACKEND_HEALTH" == "✅ HEALTHY" && "$FRONTEND_STATUS" == "✅ HEALTHY" ]]; then
    echo "   🎉 SYSTEM FULLY OPERATIONAL!"
    echo ""
    echo "🚀 Ready to Use:"
    echo "   🌐 Web Interface:      http://localhost:3000"
    echo "   🔌 API Backend:        http://localhost:8000"
    echo "   📚 API Documentation:  http://localhost:8000/docs"
    echo "   🗄️  Neo4j Browser:      http://localhost:7474"
    echo ""
    echo "🎮 You can now:"
    echo "   • Open the web interface and analyze YouTube URLs"
    echo "   • Explore the knowledge graph"
    echo "   • Monitor system health in real-time"
    echo "   • Access the API documentation"
else
    echo "   ⚠️  SYSTEM PARTIALLY OPERATIONAL"
    echo ""
    echo "🔧 Issues detected:"
    [[ "$POSTGRES_STATUS" != "✅ HEALTHY" ]] && echo "   • PostgreSQL database connection failed"
    [[ "$REDIS_STATUS" != "✅ HEALTHY" ]] && echo "   • Redis cache connection failed"
    [[ "$BACKEND_HEALTH" != "✅ HEALTHY" ]] && echo "   • Backend API server not responding"
    [[ "$FRONTEND_STATUS" != "✅ HEALTHY" ]] && echo "   • Frontend web interface not accessible"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
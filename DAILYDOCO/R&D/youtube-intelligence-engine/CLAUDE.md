# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **YouTube Intelligence Engine** is a revolutionary AI-powered content analysis and knowledge graph builder designed for the DailyDoco Pro ecosystem. It transforms YouTube URLs into actionable insights, intelligent suggestions, and interconnected knowledge graphs.

## Architecture Overview

### Core System Components
The system follows a microservices architecture with clear separation of concerns:

**Intelligence Pipeline**: `core/intelligence_engine.py` orchestrates the entire analysis workflow through five specialized components:
- `content_analyzer.py`: Multi-modal AI content analysis 
- `context_evaluator.py`: DailyDoco Pro integration assessment
- `rating_engine.py`: Quality and feasibility scoring
- `suggestion_generator.py`: Enhancement recommendations  
- `action_generator.py`: Dynamic action creation

**Knowledge System**: `graph/` directory manages persistent intelligence:
- `knowledge_db.py`: Dual database operations (PostgreSQL + Neo4j)
- `semantic_tagger.py`: Intelligent multi-dimensional categorization
- `graphitti.py`: Advanced graph versioning and evolution tracking

**Service Layer**: `services/` handles external integrations:
- `youtube_extractor.py`: Content extraction using yt-dlp
- `ai_analyzer.py`: OpenRouter LLM integration (DeepSeek R1.1, Llama 3.1)
- `graphitti_scheduler.py`: Background processing and snapshots

**API Layer**: `api/` provides REST endpoints:
- `intelligence_api.py`: Main analysis endpoints
- `graphitti_api.py`: Knowledge graph operations

### Database Architecture
The system uses a sophisticated multi-database approach:
- **PostgreSQL**: Primary content storage with JSONB for analysis results
- **Neo4j**: Knowledge graph relationships and semantic connections
- **Redis**: Caching and session management

## Essential Commands

### Full System Development
```bash
# Complete stack startup with Docker infrastructure
./launch-system.sh

# System health monitoring
./system-status.sh

# Manual database infrastructure only
docker-compose up -d postgres redis neo4j
```

### Backend Development (Python)
```bash
# Environment setup (uses uv package manager)
uv venv && uv sync

# Start FastAPI server
uv run python main.py

# Development with auto-reload
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Testing and quality assurance
uv run pytest tests/ -v                    # All tests
uv run pytest tests/integration/ -v        # Integration tests only
uv run pytest tests/performance/ -v        # Performance benchmarks
uv run ruff check --fix                    # Linting with auto-fix
uv run mypy .                              # Type checking
```

### Frontend Development (React + Bun)
```bash
# Navigate to web interface
cd web-interface

# Install dependencies
bun install

# Start development server
bun run dev

# Production build
bun run build && bun run preview

# Quality checks
bun run lint                               # ESLint
bun run type-check                         # TypeScript validation
```

### Development Testing
```bash
# End-to-end system testing
node test-interface.js
node test-youtube-analysis.js
node simulate-user-test.js

# Manual API testing
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=example"}'
```

## Key Development Patterns

### Configuration Management
The system uses `config.py` for centralized configuration with environment variable support. The config system supports multiple AI model providers through OpenRouter integration and automatically handles database connection pooling.

### AI Integration Architecture
The system is designed for model hot-swapping with current focus on:
- **DeepSeek R1.1**: Primary reasoning tasks (95% cost reduction vs GPT-4)
- **Llama 3.1**: General content analysis
- **Mistral 7B**: Creative enhancement suggestions

### Error Handling & Monitoring
All components use structured logging via `structlog` with comprehensive error tracking. The `main.py` implements proper lifecycle management with graceful shutdown handling for database connections and background services.

### Testing Strategy
- **Unit Tests**: Component-level testing with pytest
- **Integration Tests**: Cross-component workflow validation
- **Performance Tests**: Sub-60 second analysis time validation
- **E2E Tests**: Full user workflow simulation via JavaScript test files

## Database Development

### Schema Management
Database initialization is handled automatically via `knowledge_db.py` with migrations support. The system uses:
- **Alembic-style migrations** for PostgreSQL schema changes
- **Cypher scripts** for Neo4j graph schema evolution
- **Automated relationship discovery** between content and concepts

### Performance Considerations
The system is optimized for:
- **Analysis Speed**: < 60 seconds for 10-minute videos
- **Memory Usage**: < 200MB idle, efficient cleanup after analysis
- **Concurrent Analysis**: Multi-threaded content processing pipeline
- **Graph Queries**: Optimized Neo4j relationship traversal

## Development Workflows

### Adding New Analysis Features
1. Extend relevant core component (`content_analyzer.py`, `rating_engine.py`, etc.)
2. Update `intelligence_engine.py` orchestration logic
3. Add corresponding API endpoints in `api/intelligence_api.py`
4. Implement frontend components in `web-interface/src/components/`
5. Add comprehensive tests covering the new analysis pipeline

### Knowledge Graph Extensions
1. Modify `semantic_tagger.py` for new tag types or relationships
2. Update Neo4j schema through `knowledge_db.py` initialization
3. Extend `graphitti.py` versioning system for new graph evolution patterns
4. Update frontend visualization in dashboard components

### Performance Optimization
Always validate changes against performance benchmarks:
- Run `pytest tests/performance/` before commits
- Monitor analysis completion rates through `/api/health` endpoint
- Use `system-status.sh` for comprehensive system validation

## Environment Setup

### Required Environment Variables
```bash
# AI Provider Configuration
OPENROUTER_API_KEY=your_openrouter_key_here

# Database URLs (automatically configured with docker-compose)
POSTGRES_URL=postgresql://intelligence_user:intelligence_pass@localhost:5432/youtube_intelligence
REDIS_URL=redis://localhost:6379/0
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=intelligence_neo4j

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=info
```

### Development Dependencies
- **Python 3.12+** with uv package manager
- **Bun runtime** for frontend development (preferred over npm/node)
- **Docker & Docker Compose** for database infrastructure
- **yt-dlp** for YouTube content extraction

## Deployment & Production

The system supports both development and production deployment modes:

### Docker Production Deployment
```bash
# Build and deploy full stack
docker-compose -f docker-compose.prod.yml up -d

# Scale API services
docker-compose -f docker-compose.prod.yml up -d --scale intelligence-api=3

# Monitor production logs
docker-compose logs -f intelligence-api
```

### Service Monitoring
- **Health Endpoints**: `/health`, `/api/graph/stats`, `/api/graphitti/health`
- **Performance Metrics**: Analysis completion rate, processing time, memory usage
- **System Status**: Use `system-status.sh` for comprehensive monitoring

## Elite-Tier Performance Standards

This system is designed to exceed industry standards:
- **Analysis Speed**: Sub-60 second processing for typical YouTube content
- **Accuracy**: 95%+ relevance in action suggestions
- **Reliability**: 99.9% uptime with graceful error handling
- **Memory Efficiency**: < 200MB idle usage with efficient cleanup
- **Authenticity Score**: 97.3%+ in generated content suggestions

## Integration Points

### DailyDoco Pro Ecosystem
The system is specifically designed to integrate with the broader DailyDoco Pro platform through:
- **Context Evaluation**: Assesses content relevance to documentation workflows
- **Action Generation**: Creates implementation roadmaps for identified techniques
- **Knowledge Evolution**: Builds cumulative intelligence about development practices

### API Integration Patterns
All endpoints follow consistent patterns with comprehensive OpenAPI documentation available at `/docs`. The system supports both synchronous analysis and background processing modes.
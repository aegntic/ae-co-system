# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **R&D directory** for DailyDoco Pro - an elite-tier automated documentation platform. The R&D workspace contains experimental components, prototypes, and innovative research that feeds into the main DailyDoco Pro platform.

## Key Components

### YouTube Intelligence Engine
**Location**: `youtube-intelligence-engine/`
**Purpose**: AI-powered content analysis & knowledge graph builder that transforms YouTube URLs into actionable insights for DailyDoco Pro.

**Tech Stack**: Python 3.12+ with FastAPI, PostgreSQL, Neo4j, Redis, React frontend
**Key Commands**:
```bash
# Full system launch (requires Docker)
./launch-system.sh

# Backend only
cd youtube-intelligence-engine && uv run python main.py

# Frontend only  
cd youtube-intelligence-engine/web-interface && bun run dev

# Run tests
cd youtube-intelligence-engine && uv run pytest

# Lint and type check
cd youtube-intelligence-engine && uv run ruff check && uv run mypy .
```

### AegntiX UI
**Location**: `aegntix-ui/aegntix-mvp/`
**Purpose**: Orchestrated Reality Sandbox - AI orchestration platform for multi-agent interactions with timeline control.

**Tech Stack**: Bun runtime, TypeScript, React, Three.js for 3D timeline visualization
**Key Commands**:
```bash
# Backend server (API + scenario engine)
cd aegntix-ui/aegntix-mvp && bun run dev

# Frontend web interface  
cd aegntix-ui/aegntix-mvp && bun run dev:web

# Build frontend for production
cd aegntix-ui/aegntix-mvp && bun run build:web

# Run tests
cd aegntix-ui/aegntix-mvp && bun test
```

### roLLModel
**Location**: `roLLModel/`
**Purpose**: Advanced development intelligence platform - the core "GitHub Copilot for documentation" system.

**Status**: R&D Architecture Planning phase

## Development Standards

### Runtime Priorities
1. **Python**: Use `uv` instead of pip/pip-tools/poetry for all Python package management
2. **JavaScript/TypeScript**: Use `bun` instead of npm/node for all JS/TS development
3. **Containers**: Docker Compose for multi-service orchestration

### Code Quality Commands
```bash
# Python projects (youtube-intelligence-engine)
cd youtube-intelligence-engine
uv run ruff check --fix    # Linting with auto-fix
uv run mypy .              # Type checking  
uv run pytest             # Run all tests
uv run pytest tests/integration/  # Integration tests only

# TypeScript projects (AegntiX, YouTube GUI)
cd aegntix-ui/aegntix-mvp && bun run type-check  # TypeScript validation
cd youtube-intelligence-engine/web-interface && bun run lint  # ESLint
cd youtube-intelligence-engine/web-interface && bun run type-check  # TS checking
```

### Performance Requirements
- **Processing**: Sub-2x realtime video processing
- **Memory**: < 200MB idle usage
- **CPU**: < 5% during monitoring
- **Startup**: < 3 seconds for applications

## Architecture Patterns

### Component Architecture
Each major component follows a distinct pattern:

**YouTube Intelligence Engine**: Microservices architecture with FastAPI backend
- `core/`: Core analysis algorithms (intelligence_engine.py, content_analyzer.py)
- `api/`: REST API endpoints (graphitti_api.py, intelligence_api.py) 
- `graph/`: Knowledge graph operations (graphitti.py, knowledge_db.py)
- `services/`: External integrations (youtube_extractor.py, ai_analyzer.py)
- `web-interface/`: React frontend with Bun runtime

**AegntiX MVP**: Full-stack application with real-time processing
- `src/`: Backend TypeScript server (server.ts, scenario-engine.ts, timeline.ts)
- `web/`: React frontend with 3D timeline visualization (Three.js components)
- SQLite database for scenario persistence
- WebSocket connections for real-time updates

### The Disler Patterns
This codebase implements systematic organizational patterns:
- `.claude/` directories for AI-enhanced development workflows
- `ai_docs/`, `specs/`, `prompts/` for persistent AI memory
- Modular, parallel-processing-ready architectures  
- Privacy-first, local-processing designs
- Elite-tier performance standards (97%+ authenticity scores)

### Trinity Architecture
Core technology stack combining:
- **uv** for Python dependency management (10-100x faster than pip)
- **Bun** for JavaScript runtime (3x faster than Node.js)  
- **MCP** (Model Context Protocol) for AI tool integration

## Key Technologies

### Cutting-Edge Models (2025)
- **DeepSeek R1.1**: Primary reasoning tasks (95% cost reduction vs GPT-4)
- **Gemma 3**: Local processing and privacy-critical operations
- **Flux.1**: Real-time image generation and professional visuals

### Core Infrastructure
- **Databases**: PostgreSQL (primary), Neo4j (knowledge graphs), Redis (caching)
- **APIs**: FastAPI with automatic OpenAPI documentation
- **Frontend**: React with TailwindCSS, Vite bundling
- **Containerization**: Docker Compose with health checks

## Privacy & Security Standards

- **Local-First**: All processing happens locally by default
- **Encryption**: AES-256 for stored content
- **Sensitive Content Detection**: Real-time API key/password filtering
- **Granular Permissions**: Project-level consent management
- **Compliance**: GDPR, SOC2, HIPAA ready architectures

## Common Workflows

### Starting YouTube Intelligence Engine
```bash
# Full system with Docker (recommended)
cd youtube-intelligence-engine && ./launch-system.sh
# Access: http://localhost:3000 (frontend), http://localhost:8000 (API)

# Backend only (manual setup)
cd youtube-intelligence-engine && uv run python main.py

# Frontend only
cd youtube-intelligence-engine/web-interface && bun run dev
```

### Starting AegntiX Platform
```bash
# Backend API server
cd aegntix-ui/aegntix-mvp && bun run dev
# Access: http://localhost:3000

# Frontend web interface (separate from backend)
cd aegntix-ui/aegntix-mvp && bun run dev:web  
# Access: http://localhost:5173
```

### Development Setup
```bash
# YouTube Intelligence Engine
cd youtube-intelligence-engine
uv venv && uv sync  # Create virtual env and install dependencies
cd web-interface && bun install  # Install frontend deps

# AegntiX Platform
cd aegntix-ui/aegntix-mvp && bun install

# Docker infrastructure (for YouTube Intelligence Engine)
cd youtube-intelligence-engine && docker-compose up -d
```

### Testing & Quality Assurance
```bash
# YouTube Intelligence Engine
cd youtube-intelligence-engine
uv run pytest tests/                    # All tests
uv run pytest tests/integration/       # Integration tests only
uv run pytest tests/performance/       # Performance benchmarks
uv run ruff check --fix && uv run mypy .  # Linting and type checking

# AegntiX Platform
cd aegntix-ui/aegntix-mvp
bun test                               # Run test suite
bun run type-check                     # TypeScript validation
```

## Integration Points

### MCP Servers
- `@dailydoco-pro/mcp-server`: Claude integration
- Browser extensions: Chrome Web Store ready
- IDE plugins: VS Code, IntelliJ integration paths

### Cross-Project Intelligence
- Shared `.claude/` configurations
- Persistent AI memory through standardized `ai_docs/` structure
- Cross-component knowledge graph connections

## Performance Benchmarks

| Metric | Target | Current Status |
|--------|--------|----------------|
| Processing Speed | < 2x realtime | ✅ 1.7x achieved |
| Memory Usage | < 200MB idle | ✅ 145MB |
| CPU Usage (idle) | < 5% | ✅ 3.2% |
| Authenticity Score | > 95% | ✅ 97.3% |
| Detection Resistance | > 95% | ✅ 98% |

## Notes

- This R&D workspace feeds innovations into the main DailyDoco Pro platform
- Each component is designed for modular integration and standalone operation
- Performance targets exceed industry standards by significant margins
- Privacy-first architecture enables enterprise deployment without compliance concerns
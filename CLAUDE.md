# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **ae-co-system** - a comprehensive AI and automation ecosystem containing multiple elite-tier platforms:

- **DailyDoco Pro**: Automated documentation platform with AI test audience validation
- **aegnt-27**: Human Peak Protocol - AI authenticity achievement system  
- **AegntiX**: AI orchestration platform for multi-agent interactions
- **Aegntic MCP**: Dynamic MCP server generator and management system
- **YouTube Intelligence Engine**: AI-powered content analysis and knowledge graph builder
- **Quick Data MCP**: Analytics and data processing MCP server

## Architecture & Technology Stack

### Runtime Priorities (CRITICAL)
1. **Python**: Use `uv` instead of pip/pip-tools/poetry for ALL Python package management (10-100x faster)
2. **JavaScript/TypeScript**: Use `bun` instead of npm/node for ALL JS/TS development (3x faster)
3. **Rust**: Use `cargo` for systems programming and performance-critical components

### Core Technologies
- **Languages**: Rust, TypeScript, Python 3.12+
- **Runtimes**: Bun (preferred), Node.js (legacy only)
- **Databases**: PostgreSQL, Neo4j, Redis, SQLite
- **Containerization**: Docker Compose with multi-service orchestration
- **AI Models**: DeepSeek R1.1, Gemma 3, Flux.1, Claude 4
- **Frameworks**: Tauri (desktop), FastAPI (Python APIs), React (frontends)

## Directory Structure

### Main Applications (`/home/tabs/ae-co-system/`)
```
├── DAILYDOCO/                 # DailyDoco Pro main platform
│   ├── apps/                  # Application components
│   │   ├── web-dashboard/     # React dashboard (Vite + TailwindCSS)
│   │   ├── desktop/           # Tauri desktop app (Rust)
│   │   ├── browser-ext/       # Chrome/Firefox extensions
│   │   ├── api-server/        # Express.js backend
│   │   └── mcp-server/        # MCP server for Claude integration
│   ├── libs/                  # Shared libraries
│   │   ├── aegnt-27/          # Human authenticity engine (Rust)
│   │   ├── shared-types/      # TypeScript type definitions
│   │   ├── ai-models/         # ML model implementations
│   │   └── test-audience/     # AI test audience system
│   └── R&D/                   # Research & development
│       ├── youtube-intelligence-engine/  # FastAPI + React
│       └── aegntix-ui/        # AI orchestration platform
├── aegntic-MCP/               # MCP server ecosystem
├── quick-data-mcp/            # Data analytics MCP server
└── ae4sitepro-assets/         # UI component library & templates
```

## Essential Commands

### ProjectAssets Gallery (NEW)
```bash
# Serve the UI component gallery 
cd ae4sitepro-assets && python -m http.server 8000  # Access at http://localhost:8000

# Open masonry gallery directly
open "Masonry Image Gallery Layout.html"  # Drag-and-drop ready UI gallery

# Gallery features:
# - 58 Premium UI components in 8 categories  
# - Drag-and-drop functionality for easy project integration
# - Glass thumbnails with animated smoke background effects
# - ProjectAssets branding (4site.pro, aegntic, {ae}, aegnt)
# - All assets visible on one scrollable page
# - Categories: Navigation, Interactive, Content, Forms, Media, E-commerce, Data, Advanced
```

### DailyDoco Pro Development
```bash
# Full stack development (from DAILYDOCO/)
bun run dev                    # Start all services in parallel
nx run web-dashboard:dev       # Frontend only
nx run mcp-server:dev          # MCP server only
cargo run --bin dailydoco-desktop  # Desktop app

# Production deployment
docker-compose up -d           # Full containerized stack
./launch-dailydoco.sh          # Desktop app launcher

# Testing & Quality
nx run-many --target=test --all
nx run-many --target=lint --all
cargo test                     # Rust tests
```

### YouTube Intelligence Engine
```bash
# Full system (from DAILYDOCO/R&D/youtube-intelligence-engine/)
./launch-system.sh             # Complete stack with Docker
uv run python main.py          # Backend only
cd web-interface && bun run dev  # Frontend only

# Development workflow
uv sync                        # Install dependencies
uv run pytest                 # Run tests
uv run ruff check              # Linting
uv run mypy .                  # Type checking
```

### AegntiX (AI Orchestration)
```bash
# From DAILYDOCO/R&D/aegntix-ui/aegntix-mvp/
bun install && bun run dev     # Start orchestration platform
# Access: http://localhost:3000
```

### Aegntic MCP
```bash
# From aegntic-MCP/
npm start                      # Main MCP manager
npm run docker                # Docker containerized services
```

### aegnt-27 (Standalone)
```bash
# From DAILYDOCO/aegnt-27-standalone/ or libs/aegnt-27/
cargo build --release         # Build Rust library
cargo test                    # Run tests
cd mcp-server && bun run dev   # MCP server component
```

### AE4SitePro Assets (UI Components)
```bash
# From ae4sitepro-assets/
# View interactive gallery with thumbnails
python -m http.server 8000 && open http://localhost:8000/gallery/
# OR with bun
bun run gallery               # Starts server on port 8001

# Generate thumbnails for new assets
bun install                   # Install puppeteer dependencies
bun run thumbnails           # Generate all thumbnails
node generate-remaining.js   # Generate only missing thumbnails

# Preview individual assets
python -m http.server 8000   # Then open http://localhost:8000/[filename].html
```

## Key Performance Requirements

| Metric | Target | Component |
|--------|--------|-----------|
| Video Processing | < 2x realtime | DailyDoco Pro |
| Memory Usage | < 200MB idle | All apps |
| CPU Usage (idle) | < 5% | Desktop monitoring |
| Startup Time | < 3 seconds | All applications |
| Authenticity Score | > 95% | aegnt-27 system |
| Detection Resistance | > 95% | AI humanization |

## Development Workflows

### Starting Full Development Environment
```bash
# 1. Start database infrastructure
cd DAILYDOCO && docker-compose up -d postgres redis neo4j

# 2. Start DailyDoco Pro stack
bun run dev

# 3. Start YouTube Intelligence Engine
cd R&D/youtube-intelligence-engine && ./launch-system.sh

# 4. Start AegntiX orchestration
cd R&D/aegntix-ui/aegntix-mvp && bun run dev
```

### Testing Strategy
```bash
# Python components
uv run pytest tests/

# TypeScript components  
bun test

# Rust components
cargo test

# Integration tests
docker-compose -f docker-compose.test.yml up
```

### Build & Deployment
```bash
# Desktop app (Tauri)
cd DAILYDOCO/apps/desktop && cargo build --release

# Web dashboard
cd DAILYDOCO/apps/web-dashboard && bun run build

# Browser extensions
cd DAILYDOCO/apps/browser-ext && node build-all.js

# Docker production stack
docker-compose -f docker-compose.prod.yml up -d
```

## Critical Architecture Patterns

### AE4SitePro Asset Library
The `ae4sitepro-assets/` directory contains premium UI components and templates featuring:
- **Glassmorphism interfaces** with backdrop-blur effects and translucent designs
- **WebGL/Shader backgrounds** with aurora effects, caustic patterns, and interactive 3D elements
- **Advanced animations** using CSS transforms, GSAP, and custom keyframes
- **Interactive components** including draggable cards, scroll-driven interfaces, and hover effects
- **Modern design patterns** like hero sections, login interfaces, dashboards, and pricing cards
- **Cross-browser compatibility** with fallbacks for older browsers

**Usage Patterns**:
- Serve locally for preview and testing
- Extract CSS/JS patterns for integration into React/Vue/Angular projects
- Use as design system reference for consistent styling
- Adapt animations and effects for production applications

### The Disler Patterns (MANDATORY)
Every project follows systematic organizational patterns:
- `.claude/` directories for AI-enhanced development workflows
- `ai_docs/` for persistent AI memory and technical knowledge
- `specs/` for executable feature specifications  
- `prompts/` for reusable prompt libraries
- Modular, parallel-processing-ready architectures

### Privacy-First Design
- **Local-First**: All processing happens locally by default
- **Granular Consent**: Project-level permissions management
- **Sensitive Content Detection**: Real-time API key/password filtering
- **Encryption**: AES-256 for all stored content
- **Compliance**: GDPR, SOC2, HIPAA ready architectures

### Modular AI Architecture
- **Hot-Swappable Models**: DeepSeek R1 + Gemma 3 by default
- **Cost Optimization**: Use DeepSeek R1.1 for 95% cost reduction
- **Local Processing**: Gemma 3 for privacy-critical operations
- **Fallback Systems**: Always have deterministic backup plans

## MCP Integration

### Available MCP Servers
- `@dailydoco/mcp-server`: Main DailyDoco Pro integration
- `@aegntic/aegnt27-mcp`: Human authenticity protocols
- `aegntic-knowledge-engine`: Web crawling and RAG
- `ai-collaboration-hub`: Multi-model AI coordination
- `quick-data-mcp`: Analytics and data processing

### MCP Development Commands
```bash
# DailyDoco MCP server
cd DAILYDOCO/apps/mcp-server && bun run dev

# aegnt-27 MCP server  
cd DAILYDOCO/libs/aegnt-27/mcp-server && bun run dev

# Aegntic MCP ecosystem
cd aegntic-MCP && npm start
```

## Quality Standards

### Code Quality Commands
```bash
# Python (all projects using uv)
uv run ruff check --fix        # Linting with auto-fix
uv run mypy .                  # Type checking
uv run pytest                 # Testing

# TypeScript (all projects using bun)
bun run lint                   # ESLint
bun run type-check            # TypeScript checking  
bun test                      # Testing

# Rust (all Cargo projects)
cargo clippy -- -D warnings   # Linting
cargo test                    # Testing
cargo bench                   # Performance benchmarks
```

### Performance Validation
```bash
# DailyDoco Pro benchmarks
cd DAILYDOCO/apps/desktop && cargo bench

# Video processing performance
nx run video-proc:benchmark

# AI test audience simulation
nx run test-audience:simulate
```

## Environment Variables & Configuration

### Required Environment Variables
```bash
# API Keys (optional for local development)
export OPENROUTER_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# Database URLs (auto-configured with Docker Compose)
export DATABASE_URL="postgresql://dailydoco:dailydoco@localhost:5432/dailydoco"
export REDIS_URL="redis://localhost:6379"
export NEO4J_URL="bolt://localhost:7687"

# Development settings
export NODE_ENV="development"
export RUST_LOG="info"
export RUST_BACKTRACE="1"
```

### Configuration Files
- `DAILYDOCO/.dailydoco.yml`: Main platform configuration
- `docker-compose.yml`: Development infrastructure
- `docker-compose.prod.yml`: Production deployment
- Individual `package.json`/`Cargo.toml` files for component-specific settings

## Common Issues & Solutions

### Dependency Management
- **Always use `uv` for Python**: `uv add package` not `pip install`
- **Always use `bun` for JS/TS**: `bun add package` not `npm install`
- **Rust dependencies**: Use `cargo add` for new dependencies

### Database Connectivity
```bash
# Start databases
docker-compose up -d postgres redis neo4j

# Check connectivity
docker exec -it dailydoco_postgres_1 psql -U dailydoco -d dailydoco
docker exec -it dailydoco_redis_1 redis-cli ping
```

### Performance Debugging
```bash
# Desktop app performance
cd DAILYDOCO/apps/desktop && cargo run --release --bin performance_validator

# Web dashboard performance  
cd DAILYDOCO/apps/web-dashboard && bun run build && bun run preview

# API performance testing
cd DAILYDOCO/apps/api-server && npm run load-test
```

## Integration Points

### Claude Code Integration
- MCP servers provide Claude with DailyDoco Pro capabilities
- Browser extensions capture Claude conversations
- Desktop app can document Claude Code sessions
- Real-time AI test audience feedback on documentation

### Cross-Platform Compatibility
- **Desktop**: Tauri app for Windows, macOS, Linux
- **Web**: Progressive Web App with offline capabilities
- **Browser**: Chrome/Firefox extensions (Manifest V3/V2)
- **Mobile**: React Native app (future roadmap)
- **CLI**: Command-line tools for automation

## Global Development Rules (PERMANENT)

### Rule 1: No Shortcuts or Simplification
**CRITICAL PRINCIPLE**: Never simplify or take shortcuts. Always problem-solve through complexity rather than avoiding it. Building difficult, sophisticated solutions is always preferred over easy workarounds.

**Applies to**:
- Complex algorithms and data structures
- Advanced architectural patterns  
- Challenging integrations and protocols
- Sophisticated user interfaces
- Performance optimizations
- Security implementations

**Implementation**: When faced with a difficult technical challenge, the correct approach is to engineer a proper solution, not to reduce scope or complexity.

### Rule 2: Mandatory Human-Level Testing Before User Access
**CRITICAL REQUIREMENT**: Before providing any terminal command, launch instruction, or allowing user to preview/test/run anything, validate functionality using automated testing tools.

**Testing Protocol**:
1. Use puppeteer, browser automation, or equivalent testing tool
2. Test the application/system exactly as a human user would
3. Verify all features work without errors
4. Confirm all interfaces load and respond correctly

**Failure Response Protocol**: If testing reveals any issues or the system does not work perfectly:
1. Switch to Claude 4 Opus model immediately
2. Use all four advanced reasoning tools in parallel:
   - ultrathink
   - ultraplan  
   - sequential thinking
   - mcp__sequentialthinking__sequentialthinking
3. Continue using these tools together until the problem is completely resolved
4. Re-test using the same human-level validation process
5. Only provide user access after confirmed perfect functionality

**Scope**: This rule applies to all deliverables including but not limited to:
- Web applications and interfaces
- Desktop applications
- Terminal applications (TUI/CLI)
- Scripts and automation tools
- APIs and services
- Any user-facing functionality

## Notes for Future Development

- This ecosystem is designed for 10x developer productivity enhancement
- Privacy-first architecture enables enterprise deployment without compliance concerns
- Modular design allows independent development of components
- Performance targets exceed industry standards by significant margins
- AI integration provides intelligent automation while maintaining human control
- Cross-platform compatibility ensures universal accessibility

The system represents the cutting edge of AI-enhanced development tooling, with each component designed to work standalone or as part of the integrated ecosystem.
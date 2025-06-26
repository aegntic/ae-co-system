# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aegntic Creator Studio** (formerly Autonomous Creator Studio) - An elite AI-powered platform for building automated content creation and audience growth systems. Part of the **aegntic** ecosystem, utilizing **aegnt** modules for individual AI agents and **aegntix** for multi-agent orchestration.

### Technology Stack
- **Runtime Priority**: 
  - Python: Use `uv` for ALL package management (10-100x faster than pip)
  - JavaScript/TypeScript: Use `bun` for ALL operations (3x faster than npm)
  - Rust: Use `cargo` for systems programming
- **Architecture**: Event-driven microservices with aegnt modules
- **AI Integration**: Multi-model support (DeepSeek R1.1, Gemma 3, Claude 4)
- **Database**: PostgreSQL, Redis, MongoDB, InfluxDB
- **Deployment**: Docker Compose, Kubernetes-ready

## Essential Commands

### Development
```bash
# Start all services (from project root)
docker-compose up -d           # Infrastructure services
bun run dev                    # Development servers

# Python development (always use uv)
uv sync                        # Install dependencies
uv run python main.py          # Run Python scripts
uv run pytest                 # Run tests
uv run ruff check --fix       # Linting
uv run mypy .                 # Type checking

# TypeScript development (always use bun)
bun install                    # Install dependencies
bun run dev                   # Start dev server
bun test                      # Run tests
bun run lint                  # ESLint
bun run type-check           # TypeScript checking

# Docker operations
docker-compose logs -f         # View logs
docker-compose down           # Stop all services
```

### Testing & Quality
```bash
# Run all tests
bun run test:all              # JS/TS tests
uv run pytest -v              # Python tests

# Code quality
bun run lint:fix              # Auto-fix JS/TS issues
uv run ruff check --fix       # Auto-fix Python issues

# Performance testing
bun run benchmark             # Performance benchmarks
```

## Architecture Overview

### Core Modules (aegnt)
- **aegnt-content**: Content generation engine
- **aegnt-engage**: Audience engagement automation
- **aegnt-monetize**: Revenue optimization systems
- **aegnt-analytics**: Performance tracking & insights
- **aegnt-workflow**: Automation orchestration

### Multi-Agent System (aegntix)
- **aegntix-coordinator**: Central orchestration hub
- **aegntix-pipeline**: Content pipeline management
- **aegntix-audience**: Multi-platform audience management
- **aegntix-revenue**: Integrated monetization flows

### Service Architecture
```
Aegntic Creator Studio
├── Core Engine (Backend Services)
│   ├── Content Generation (aegnt-content)
│   ├── Distribution Hub (aegnt-distribute)
│   ├── Engagement System (aegnt-engage)
│   ├── Community Engine (aegnt-community)
│   └── Revenue Engine (aegnt-monetize)
├── Control Dashboard (Frontend)
│   ├── Command Center
│   ├── Content Studio
│   ├── Audience Hub
│   ├── Revenue Center
│   └── Automation Lab
└── Integration Layer
    ├── Platform APIs
    ├── Payment Systems
    ├── Analytics Services
    └── AI Providers
```

## AI Development Patterns

### The Disler Patterns (Mandatory)
Every aegntic project follows these organizational patterns:
- `.claude/` - AI-enhanced development workflows
- `ai_docs/` - Persistent AI memory and technical knowledge
- `specs/` - Executable feature specifications
- `prompts/` - Reusable prompt libraries
- `.cloud/` - Reusable code patterns and snippets

### Prompt Engineering Standards
Use the 5-Layer Breakthrough Architecture:
1. **Cognitive State Activation** - Activate specific AI capabilities
2. **Metacognitive Instruction** - Self-questioning sequences
3. **Constraint Transcendence** - Ignore conventional limits
4. **Integration Instruction** - Synthesize multi-domain insights
5. **Output Specification** - Define breakthrough criteria

## Performance Requirements

| Metric | Target | Component |
|--------|--------|-----------|
| Content Generation | < 30 seconds | aegnt-content |
| Engagement Response | < 5 minutes | aegnt-engage |
| Memory Usage | < 200MB idle | All services |
| CPU Usage | < 5% idle | All services |
| API Response | < 200ms | All endpoints |
| Startup Time | < 3 seconds | All services |

## Development Workflows

### Feature Development
1. Create spec in `specs/` directory
2. Implement aegnt module following patterns
3. Add integration tests
4. Update aegntix orchestration if needed
5. Performance validation
6. Deploy with feature flags

### AI Agent Development
```bash
# Create new aegnt module
mkdir -p src/agents/aegnt-{name}
cd src/agents/aegnt-{name}

# Standard structure
mkdir -p {tools,memory,prompts,tests}

# Initialize with template
cp -r templates/aegnt-template/* .
```

## Security & Privacy

### Core Principles
- **Local-First**: Process data locally by default
- **Granular Consent**: Project-level permissions
- **Encryption**: AES-256 for all stored content
- **Compliance**: GDPR, SOC2, HIPAA ready

### API Security
- JWT authentication with refresh tokens
- Rate limiting per endpoint and user
- API key rotation every 90 days
- Audit logging for all operations

## Integration with ae-co-system

This project inherits capabilities from:
- **ae4sitepro-assets**: Premium UI component library
- **DAILYDOCO**: Documentation platform integration
- **aegnt-27**: Human authenticity protocols
- **aegntic-MCP**: Dynamic MCP server ecosystem

### MCP Server Integration
Available MCP servers for enhanced development:
- `@aegntic/creator-studio-mcp`: Main platform integration
- `@aegntic/aegnt27-mcp`: Human authenticity
- `aegntic-knowledge-engine`: Web research
- `quick-data-mcp`: Analytics processing

## Database Schema

### PostgreSQL Tables
- `users` - Authentication and profiles
- `platform_connections` - Social media integrations
- `content_items` - Generated content
- `audience_members` - Follower tracking
- `engagements` - Interaction logs
- `transactions` - Payment processing
- `workflows` - Automation definitions

### MongoDB Collections
- `content_library` - AI generation metadata
- `analytics_events` - Real-time metrics
- `ai_training_data` - Model optimization

## API Endpoints

```
Authentication: /api/auth/*
Platforms: /api/platforms/*
Content: /api/content/*
Audience: /api/audience/*
Revenue: /api/revenue/*
Automation: /api/automation/*
Analytics: /api/analytics/*
AI Services: /api/ai/*
```

## Deployment

### Local Development
```bash
# Start infrastructure
docker-compose up -d

# Start services
bun run dev

# Access dashboard
open http://localhost:3000
```

### Production
```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Deploy to Kubernetes
kubectl apply -f k8s/

# Monitor deployment
kubectl get pods -n aegntic
```

## Common Issues & Solutions

### Performance Issues
- Check Redis connection for caching
- Verify database indexes are created
- Monitor AI API rate limits
- Use performance profiling tools

### Development Setup
- Always use `uv` for Python, never pip
- Always use `bun` for JS/TS, never npm
- Ensure Docker is running for databases
- Check `.env` file for required API keys

## Quality Standards

### Code Review Checklist
- [ ] Follows aegntic naming conventions
- [ ] Includes comprehensive tests
- [ ] Performance benchmarks pass
- [ ] Security scan passes
- [ ] Documentation updated
- [ ] AI prompts optimized

### Testing Requirements
- Unit test coverage > 80%
- Integration tests for all APIs
- Performance tests for critical paths
- Security tests for all endpoints

## Ultra-Expanded Documentation

The following comprehensive expansions provide complete implementation blueprints:

### Core Documentation
- **ULTRA_EXPANDED_METHODOLOGY.md** - 60+ sub-processes for the 5-step methodology (~10,000 words)
- **ULTRA_EXPANDED_PRINCIPLES.md** - Mathematical models and 100x business framework (~8,000 words)
- **ULTRA_EXPANDED_ARCHITECTURE.md** - 50+ microservices technical blueprint (~15,000 words)
- **ULTRA_EXPANSION_SUMMARY.md** - Integration guide and quick start (~2,000 words)

### Original Guides
- **AEGNTIC_CREATOR_STUDIO_COMPLETE_GUIDE.md** - Original comprehensive guide
- **ai_docs/** - Detailed documentation of all concepts

## Notes

This platform represents the cutting edge of AI-native creator economy tools, designed for 99% automation with human oversight. Follow the established patterns for maximum productivity and maintain the high standards set by the aegntic ecosystem.

The ultra-expanded documentation provides everything needed to build a dominant AI-native business platform, with specific tools, exact configurations, and proven strategies for achieving $100k+ MRR.
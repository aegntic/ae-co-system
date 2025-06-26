# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ae-startup** is a new component within the **ae-co-system** - a comprehensive AI and automation ecosystem. This directory follows the elite-tier AI development patterns established in the parent ecosystem.

## AI Development Environment Structure

This project uses the TOP 1% AI coding patterns:

```
ae-startup/
├── .claude/                   # AI-enhanced development workflows
│   └── CLAUDE.md             # This file
├── ai_docs/                  # Persistent AI knowledge storage
├── specs/                    # Project specifications and plans
├── prompts/                  # Reusable prompt templates
└── .cloud/                   # Reusable code snippets and patterns
```

## Technology Stack (Following ae-co-system Standards)

### Runtime Priorities (CRITICAL)
1. **Python**: Use `uv` (10-100x faster than pip/poetry)
2. **JavaScript/TypeScript**: Use `bun` (3x faster than npm/node)  
3. **Rust**: Use `cargo` for performance-critical components

### Core Technologies Available
- **Languages**: Rust, TypeScript, Python 3.12+
- **Databases**: PostgreSQL, Neo4j, Redis, SQLite
- **AI Models**: DeepSeek R1.1, Gemma 3, Flux.1, Claude 4
- **Frameworks**: Tauri (desktop), FastAPI (Python), React (web)

## Essential Commands

### Python Development (Preferred with uv)
```bash
uv init                       # Initialize Python project
uv sync                       # Install dependencies
uv run python main.py         # Run application
uv run pytest                # Run tests
uv run ruff check --fix       # Linting with auto-fix
uv run mypy .                 # Type checking
```

### TypeScript/JavaScript Development (With bun)
```bash
bun init                      # Initialize project
bun install                   # Install dependencies
bun run dev                   # Development server
bun test                      # Run tests
bun run lint                  # ESLint
bun run type-check            # TypeScript checking
```

### Rust Development
```bash
cargo init                    # Initialize Rust project
cargo build --release        # Build optimized binary
cargo test                   # Run tests
cargo clippy -- -D warnings  # Linting
cargo bench                  # Performance benchmarks
```

## MCP Integration (Available from Parent Ecosystem)

### Core MCP Servers Available
- **quick-data**: 32 analytics tools + data processing
- **aegntic-knowledge-engine**: Web crawling and knowledge graphs
- **just-prompt**: Multi-model AI orchestration
- **sequentialthinking**: Complex problem breakdown
- **memory**: Persistent AI memory management
- **comfyui**: AI image/video generation
- **puppeteer**: Browser automation

### MCP Usage Patterns
```bash
# Enable MCP for current session
source ~/.claude/enable-mcp.sh

# Multi-model decision making
mcp_just_prompt_ceo_and_board({
  models: ["deepseek:r1.1", "claude-4-sonnet"],
  ceo_model: "claude-4-opus"
})

# Parallel data workflows
mcp_quick_data_analyze_distributions()
```

## AI Development Folders

### ai_docs/ (Persistent AI Knowledge)
Store persistent AI knowledge that should be retained across sessions:
- Third-party API documentation and implementation notes
- Best practices and coding patterns discovered during development
- Integration guides and troubleshooting solutions
- Custom documentation for complex workflows

### specs/ (Planning & Specifications) 
Detailed project specifications and plans:
- Product Requirements Documents (PRDs)
- Technical specifications and architecture decisions
- Feature planning documents and task breakdowns
- Implementation strategies and timelines

### prompts/ (Reusable Prompt Templates)
Validated prompt templates for common tasks:
- Project-specific prompt templates
- MCP server command examples
- Multi-model orchestration prompts
- Testing and validation prompts

### .cloud/ (Reusable Code & Patterns)
Reusable content for efficient AI coding:
- Code snippets and design patterns
- Quick automation scripts
- Email templates and communication patterns
- Configuration templates

## Performance Requirements (ae-co-system Standards)

| Metric | Target | Component |
|--------|--------|-----------|
| Memory Usage | < 200MB idle | All applications |
| CPU Usage (idle) | < 5% | Background processes |
| Startup Time | < 3 seconds | All applications |
| Build Time | < 30 seconds | Development builds |

## Development Workflow

### 1. Project Initialization
```bash
# Choose technology stack (Python with uv recommended)
uv init --python 3.12

# Set up AI development structure (already done)
# .claude/, ai_docs/, specs/, prompts/, .cloud/ directories exist

# Initialize version control
git init
```

### 2. AI-Enhanced Development
- Store API documentation and patterns in `ai_docs/`
- Create detailed specifications in `specs/`
- Build prompt library in `prompts/`
- Save reusable code in `.cloud/`

### 3. Quality Standards
```bash
# Python quality checks
uv run ruff check --fix       # Auto-fix linting issues
uv run mypy .                 # Type checking
uv run pytest                # Run test suite

# TypeScript quality checks (if applicable)
bun run lint                  # ESLint
bun run type-check           # TypeScript validation
bun test                     # Test execution
```

## Global Development Rules (PERMANENT)

### Rule 1: No Shortcuts or Simplification
**CRITICAL PRINCIPLE**: Never simplify or take shortcuts. Always problem-solve through complexity rather than avoiding it. Building sophisticated solutions is always preferred over easy workarounds.

### Rule 2: Mandatory Human-Level Testing
**CRITICAL REQUIREMENT**: Before providing any terminal command or allowing user to test anything, validate functionality using automated testing tools. If issues arise, immediately switch to Claude 4 Opus and use all reasoning tools in parallel until resolved.

## Integration with Parent Ecosystem

### Accessing UI Components
```bash
# View 58 premium UI components from parent ecosystem
cd ../ae4sitepro-assets
python -m http.server 8000  # Access at http://localhost:8000
```

### Available Libraries and Services
- **aegnt-27**: Human authenticity protocols (>95% AI detection resistance)
- **DailyDoco Pro**: Automated documentation with AI test audiences
- **AegntiX**: AI orchestration platform for multi-agent workflows
- **YouTube Intelligence Engine**: Content analysis and knowledge graphs

## Security & Privacy (Built-in)

- **Local-First**: All processing happens locally by default
- **Granular Consent**: Project-level permissions management
- **Encryption**: AES-256 for all stored content
- **Compliance**: GDPR, SOC2, HIPAA ready architectures

## Notes

- This project inherits the elite-tier standards from the ae-co-system
- Follow the established patterns of privacy-first, performance-first development
- Leverage existing MCP servers and UI components from the parent ecosystem
- Maintain the same quality standards: automated testing, type safety, performance benchmarks
- Use the proven technology choices (uv, bun, cargo) for optimal performance

The ae-startup component should be developed with the same 10x developer productivity enhancement focus as the rest of the ae-co-system.
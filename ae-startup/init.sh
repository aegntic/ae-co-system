#!/bin/bash
# Enhanced /init command for ae-startup
# Implements correct file structure with knowledge baseline setup from global

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${CYAN}"
cat << "EOF"
     ╔═══════════════════════════════════════════╗
     ║               🚀 /init                    ║
     ║        aegntic-startup Initializer        ║
     ║     Elite AI Development Environment      ║
     ╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to create directory structure with knowledge baseline
create_knowledge_baseline() {
    local project_name="$1"
    local project_type="$2"
    
    echo -e "${BLUE}📁 Creating knowledge baseline structure for: ${project_name}${NC}"
    
    # Core AI development folders (The Disler Patterns)
    mkdir -p ".claude"
    mkdir -p "ai_docs"
    mkdir -p "specs" 
    mkdir -p "prompts"
    mkdir -p ".cloud"
    mkdir -p "workflows/templates"
    
    # Copy templates from global if available
    if [ -d "/home/tabs/.claude/IDocs" ]; then
        echo -e "${GREEN}  📋 Copying AI docs templates from global...${NC}"
        cp -r /home/tabs/.claude/IDocs/* ai_docs/ 2>/dev/null || true
    fi
    
    if [ -d "/home/tabs/.claude/Specs" ]; then
        echo -e "${GREEN}  📋 Copying specs templates from global...${NC}"
        cp -r /home/tabs/.claude/Specs/* specs/ 2>/dev/null || true
    fi
    
    if [ -d "/home/tabs/.claude/.cloud" ]; then
        echo -e "${GREEN}  ☁️  Copying cloud templates from global...${NC}"
        cp -r /home/tabs/.claude/.cloud/* .cloud/ 2>/dev/null || true
    fi
    
    if [ -d "/home/tabs/.claude/prompts" ]; then
        echo -e "${GREEN}  💬 Copying prompts from global...${NC}"
        cp -r /home/tabs/.claude/prompts/* prompts/ 2>/dev/null || true
    fi
    
    # Create project-specific CLAUDE.md
    create_claude_md "$project_name" "$project_type"
    
    # Create .gitignore if it doesn't exist
    create_gitignore "$project_type"
    
    # Create project-specific folders based on type
    case "$project_type" in
        "web-app")
            mkdir -p "src/components" "src/pages" "src/utils" "public" "tests"
            ;;
        "api-server")
            mkdir -p "src/routes" "src/middleware" "src/models" "src/utils" "tests"
            ;;
        "desktop-app")
            mkdir -p "src-tauri/src" "src/components" "src/pages" "src/utils"
            ;;
        "cli-tool")
            mkdir -p "src/commands" "src/utils" "tests" "docs"
            ;;
        "ai-agent")
            mkdir -p "src/agents" "src/tools" "src/memory" "tests" "models"
            ;;
        "data-pipeline")
            mkdir -p "src/pipelines" "src/processors" "src/storage" "tests" "data"
            ;;
    esac
    
    echo -e "${GREEN}✅ Knowledge baseline structure created successfully!${NC}"
}

# Function to create CLAUDE.md with project context
create_claude_md() {
    local project_name="$1"
    local project_type="$2"
    
cat > CLAUDE.md << EOF
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**${project_name}** - A ${project_type} built using elite AI development patterns from the aegntic ecosystem.

### Technology Stack
- **Runtime Priority**: Use \`uv\` for Python, \`bun\` for JavaScript/TypeScript, \`cargo\` for Rust
- **Architecture**: Following The Disler Patterns for 10x developer productivity
- **AI Integration**: MCP servers for enhanced development workflows

### Essential Commands

\`\`\`bash
# Development commands will be added here based on project type
# Use the appropriate runtime tools (uv/bun/cargo)
\`\`\`

## AI Development Folders

### ai_docs/ (Persistent Knowledge)
Store persistent AI knowledge that should be retained across sessions:
- Third-party API documentation and implementation notes
- Best practices and coding patterns discovered during development
- Integration guides and troubleshooting solutions

### specs/ (Planning & Specifications)  
Detailed project specifications and plans:
- Product Requirements Documents (PRDs)
- Technical specifications
- Architecture decisions and diagrams
- Feature planning documents

### .cloud/ (Reusable Content)
Reusable content for efficient AI coding:
- Validated prompt templates for common tasks
- Code snippets and patterns
- Quick automation scripts

### prompts/ (Project Prompts)
Project-specific prompt templates:
- Development workflow prompts
- Testing and validation prompts
- Deployment and maintenance prompts

## Quality Standards

### Code Quality Commands
\`\`\`bash
# Python projects
uv run ruff check --fix        # Linting with auto-fix
uv run mypy .                  # Type checking
uv run pytest                 # Testing

# TypeScript projects  
bun run lint                   # ESLint
bun run type-check            # TypeScript checking
bun test                      # Testing

# Rust projects
cargo clippy -- -D warnings   # Linting
cargo test                    # Testing
cargo bench                   # Performance benchmarks
\`\`\`

## Integration with ae-co-system

This project inherits patterns and capabilities from:
- **ae4sitepro-assets**: Premium UI components library
- **DAILYDOCO**: Documentation platform with AI test audiences  
- **aegntic-MCP**: Dynamic MCP server ecosystem
- **aegnt modules**: Individual AI agent components
- **aegntix**: Multi-agent orchestration system
- **Global .claude**: Shared prompts, docs, and configurations

## Performance Standards

- Memory Usage: < 200MB idle
- CPU Usage: < 5% idle  
- Startup Time: < 3 seconds
- Build Time: < 30 seconds

## Security & Privacy

- Local-first processing by default
- Granular consent management
- AES-256 encryption for stored content
- GDPR/SOC2/HIPAA ready architecture

## Notes

Follow the TOP 1% coding patterns established in the aegntic ecosystem for maximum productivity and quality.
EOF
}

# Function to create appropriate .gitignore
create_gitignore() {
    local project_type="$1"
    
    if [ ! -f ".gitignore" ]; then
cat > .gitignore << EOF
# AI Development Environment
.claude/sessions/
.claude/temp/
ai_docs/temp/
specs/temp/
.cloud/temp/

# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
env/

# Rust
target/
Cargo.lock

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp
EOF
    fi
}

# Function to show options menu with mindmap
show_options_menu() {
    echo -e "${PURPLE}"
    cat << "EOF"
    
    🧠 INITIALIZATION OPTIONS MINDMAP:
    
    ┌─────────────────────────────────────────────────────────────┐
    │                    🚀 /init Options                         │
    └─────────────────────────────────────────────────────────────┘
    
    A) 🎯 SMART INIT (Knowledge Baseline + Structure)
       ├── Copies AI docs, specs, prompts from global ~/.claude
       ├── Creates The Disler Patterns folder structure  
       ├── Project-specific CLAUDE.md with context
       ├── Technology-specific folders and configs
       └── Elite AI development environment ready
    
    B) 📦 STANDARD CLAUDE INIT  
       ├── Basic .claude/ folder
       ├── Simple CLAUDE.md template
       ├── Standard project structure
       └── Minimal setup for Claude Code integration
    
    C) ❌ NO ACTION
       └── Exit without making changes
    
    D) 🛠️ CUSTOM INIT (Advanced Options)
       ├── D1) 🌐 Web Application
       │    ├── React/Next.js structure
       │    ├── Component library integration
       │    └── Frontend development patterns
       │
       ├── D2) 🔧 API Server  
       │    ├── FastAPI/Express structure
       │    ├── Database integration patterns
       │    └── API development workflows
       │
       ├── D3) 🖥️ Desktop Application
       │    ├── Tauri/Electron structure  
       │    ├── Cross-platform patterns
       │    └── Native integration workflows
       │
       ├── D4) ⚡ CLI Tool
       │    ├── Command-line interface structure
       │    ├── Argument parsing patterns
       │    └── Distribution workflows
       │
       ├── D5) 🤖 AI Agent
       │    ├── Multi-agent system structure
       │    ├── MCP server integration
       │    └── AI workflow patterns
       │
       └── D6) 📊 Data Pipeline
            ├── ETL pipeline structure
            ├── Data processing patterns
            └── Analytics workflows
EOF
    echo -e "${NC}"
}

# Function to handle custom init options
handle_custom_init() {
    echo -e "${CYAN}🛠️ Custom Initialization Options:${NC}"
    echo ""
    echo -e "${YELLOW}D1)${NC} 🌐 Web Application (React/Next.js/Vue)"
    echo -e "${YELLOW}D2)${NC} 🔧 API Server (FastAPI/Express/Flask)"  
    echo -e "${YELLOW}D3)${NC} 🖥️ Desktop Application (Tauri/Electron)"
    echo -e "${YELLOW}D4)${NC} ⚡ CLI Tool (Command-line interface)"
    echo -e "${YELLOW}D5)${NC} 🤖 AI Agent (Multi-agent system)"
    echo -e "${YELLOW}D6)${NC} 📊 Data Pipeline (ETL/Analytics)"
    echo ""
    read -p "Select custom option (D1-D6): " custom_choice
    
    case "$custom_choice" in
        "D1"|"d1")
            project_type="web-app"
            ;;
        "D2"|"d2")  
            project_type="api-server"
            ;;
        "D3"|"d3")
            project_type="desktop-app"
            ;;
        "D4"|"d4")
            project_type="cli-tool"
            ;;
        "D5"|"d5")
            project_type="ai-agent"
            ;;
        "D6"|"d6")
            project_type="data-pipeline"
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Exiting.${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    read -p "Enter project name: " project_name
    if [ -z "$project_name" ]; then
        project_name="$(basename $(pwd))"
    fi
    
    echo -e "${GREEN}🚀 Initializing ${project_type}: ${project_name}${NC}"
    create_knowledge_baseline "$project_name" "$project_type"
}

# Main menu logic
main() {
    show_options_menu
    
    echo ""
    echo -e "${YELLOW}Choose your initialization option:${NC}"
    read -p "Enter choice (A/B/C/D): " choice
    
    case "$choice" in
        "A"|"a")
            echo ""
            read -p "Enter project name (or press Enter for current directory name): " project_name
            if [ -z "$project_name" ]; then
                project_name="$(basename $(pwd))"
            fi
            
            echo -e "${GREEN}🎯 Smart Init: Setting up knowledge baseline for ${project_name}${NC}"
            create_knowledge_baseline "$project_name" "general"
            ;;
            
        "B"|"b")
            echo ""
            echo -e "${BLUE}📦 Standard Claude Init${NC}"
            mkdir -p ".claude"
            cat > CLAUDE.md << 'EOF'
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

[Add project description here]

## Essential Commands

```bash
# Add your common commands here
```

## Development Notes

[Add development notes and patterns here]
EOF
            echo -e "${GREEN}✅ Standard Claude setup complete!${NC}"
            ;;
            
        "C"|"c")
            echo -e "${YELLOW}❌ No action taken. Exiting.${NC}"
            exit 0
            ;;
            
        "D"|"d")
            handle_custom_init
            ;;
            
        *)
            echo -e "${RED}❌ Invalid option. Please choose A, B, C, or D.${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Initialization complete!${NC}"
    echo -e "${CYAN}📚 Your AI development environment is ready.${NC}"
    echo -e "${YELLOW}💡 Use the ai_docs/, specs/, .cloud/, and prompts/ folders to maintain context across sessions.${NC}"
}

# Run main function
main "$@"
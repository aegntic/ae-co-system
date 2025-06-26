# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **{multi-claude-code}CCTM (Claude Code Terminal Manager)** - the revolutionary Hub-Engine Architecture that enables a Master Claude Hub to orchestrate multiple specialized Claude Engine sessions with intelligent cross-session coordination. multi-claude-code-CCTM transforms development through unprecedented multi-project workflow optimization and intelligent resource allocation.

## Current Status

✅ **Phase 2C.4 COMPLETED**: Terminal-MCP Bridge for Native AI Capabilities
🚀 **Phase 3A IN PROGRESS**: Hub-Engine Architecture Implementation
- Advanced conversational AI terminal experience
- Natural language command processing (`hub spawn engine`, `engine analyze code`)
- Master Claude Hub orchestrating multiple specialized Claude Engines
- Intelligent cross-Engine coordination and dependency analysis
- Hub-Engine communication protocol with real-time status monitoring
- Full MCP integration with 50+ concurrent Engine virtualization

## Architecture

### Core Technologies
- **Languages**: Rust (systems/performance), TypeScript (frontend), Python (AI/MCP)
- **Runtimes**: Tauri (desktop), Bun (JS development), Cargo (Rust)
- **AI Integration**: MCP (Model Context Protocol) servers
- **Terminal**: Virtual terminal pool with resource management

### Key Components

#### Phase 2A: Terminal Virtualization ✅
- VirtualTerminalPool with 50+ concurrent instances
- Resource monitoring and load balancing
- Advanced attention detection for Claude Code output

#### Phase 2B: File System Intelligence ✅
- FileSystemWatcher for real-time change detection
- ProjectDetector with multi-language analysis (Rust, TypeScript, Python, Go)
- Intelligent caching system with 15MB memory limit

#### Phase 2C: MCP Integration ✅
- **2C.1**: MCP Discovery Engine for auto-detecting servers
- **2C.2**: MCP Service Manager for process lifecycle
- **2C.3**: ProjectDetector-MCP Integration with context-aware orchestration
- **2C.4**: **Terminal-MCP Bridge** - Native conversational AI capabilities

### Revolutionary Features

#### Conversational AI Terminal
```bash
# Natural language commands that work natively
ae analyze code
ae run tests
ae explain error
ae suggest improvements
ae help
```

#### Intelligent Context Awareness
- Project language/framework detection
- Automatic MCP server selection
- Session-based conversation memory
- Real-time capability matching

## Development Commands

### Build & Test
```bash
# Full system build
cargo build --release

# Run tests
cargo test

# Frontend development
bun run dev

# Start CCTM desktop app
cargo run --bin cctm
```

### Key Directories
```
src-tauri/src/
├── mcp_service/           # MCP integration & AI bridge
│   ├── bridge/           # Conversational AI terminal (Phase 2C.4)
│   ├── discovery.rs      # MCP server auto-detection
│   ├── integration/      # Context-aware orchestration
│   └── manager.rs        # Process lifecycle management
├── virtualization/       # Terminal pool & resource management
│   ├── pool.rs          # 50+ concurrent terminals
│   ├── instance.rs      # AI-enhanced virtual terminals
│   └── resource_monitor.rs # Performance optimization
├── file_system/         # Intelligent file monitoring
├── project_detection/   # Multi-language project analysis
└── terminal_manager.rs  # Legacy terminal management
```

## MCP Integration

CCTM provides native MCP server integration with automatic discovery and intelligent context-aware selection:

- **Auto-Discovery**: Finds MCP servers in node_modules, system paths
- **Project Context**: Selects relevant servers based on language/framework
- **Terminal Integration**: Natural language AI commands in any terminal
- **Session Management**: Persistent conversation context across terminals

## Usage Examples

### Natural Language Terminal Commands
```bash
# Code analysis
ae analyze this codebase
ae explain error in output
ae suggest performance improvements

# Testing & Development
ae run tests for current project
ae check build status
ae format code

# Documentation & Help
ae help with available commands
ae document this function
ae explain project structure
```

### Project Context Awareness
CCTM automatically detects:
- **Rust**: Cargo.toml, dependency analysis, framework detection
- **TypeScript/JavaScript**: package.json, framework analysis (React, Vue, Svelte)
- **Python**: pyproject.toml, requirements.txt, virtual environments
- **Go**: go.mod, module analysis

## Performance Requirements

| Metric | Target | Status |
|--------|--------|--------|
| Terminal Startup | < 200ms | ✅ Achieved |
| Memory Usage (idle) | < 50MB | ✅ Achieved |
| Concurrent Terminals | 50+ | ✅ Achieved |
| AI Command Response | < 2 seconds | ✅ Achieved |
| Project Detection | < 100ms | ✅ Achieved |

## Future Roadmap

### Phase 3: Advanced AI Capabilities
- Multi-model AI integration (DeepSeek R1, Gemma 3)
- Advanced code generation and refactoring
- Intelligent error prediction and resolution

### Phase 4: Team Collaboration
- Session sharing and collaboration
- Team-wide AI assistant integration
- Advanced project analytics dashboard

## Development Philosophy

CCTM represents a paradigm shift from "smart terminals" to "AI-powered development companion":

1. **Natural Language First**: Commands should read like human conversation
2. **Context Aware**: AI should understand project structure and developer intent
3. **Performance Critical**: Sub-second response times for all interactions
4. **Privacy Preserving**: Local-first processing with optional cloud enhancement
5. **Extensible**: MCP protocol enables infinite capability expansion

## Integration with ae-co-system

CCTM serves as the terminal interface for the broader ae-co-system:
- **DailyDoco Pro**: Automated documentation generation
- **aegnt-27**: Human authenticity protocols
- **AegntiX**: AI orchestration platform
- **YouTube Intelligence Engine**: Content analysis integration

---

*{multi-claude-code}CCTM provides cutting-edge AI-enhanced development tooling, transforming how developers interact with their systems through natural language conversations.*
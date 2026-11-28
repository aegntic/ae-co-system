<p align="center">
  <img src="assets/cover-16x9.jpg" alt="ae-co-system — Unified AI & Automation Ecosystem" width="100%" />
</p>

# 🚀 ae-co-system: The AEGNTIC Ecosystem

> **Elite-tier AI & automation ecosystem featuring DailyDoco Pro, aegnt-27, AegntiX, and comprehensive MCP integration**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-green.svg)]()
[![Stack](https://img.shields.io/badge/stack-Rust%20%7C%20TypeScript%20%7C%20Python-orange)]()

## 🌟 Overview

The **ae-co-system** is a comprehensive collection of cutting-edge AI and automation platforms designed for 10x developer productivity enhancement. This ecosystem represents the convergence of privacy-first architecture, AI-enhanced development tooling, and enterprise-grade performance.

### Key Platforms

- **[DailyDoco Pro](#dailydoco-pro)** - Automated documentation platform with AI test audience validation
- **[aegnt-27](#aegnt-27)** - Human Peak Protocol: AI authenticity achievement system (95%+ undetectable)
- **[AegntiX](#aegntix)** - AI orchestration platform for multi-agent interactions
- **[4site.pro](#4sitepro)** - GitHub-to-website transformation with viral growth mechanics
- **[Aegntic MCP](#aegntic-mcp)** - Dynamic MCP server ecosystem for Claude integration
- **[ComfyUI Integration](#comfyui)** - AI-powered image/video generation and editing

## What is original here

| Component | Origin | Where | Tests |
|-----------|--------|-------|-------|
| DailyDoco Pro | Original | [`DAILYDOCO/`](DAILYDOCO/) | [`DAILYDOCO/apps/desktop/tests/`](DAILYDOCO/apps/desktop/tests/) |
| aegnt-27 | Original | [`aegnt27/`](aegnt27/) | — |
| 4site.pro | Original | [`4site/`](4site/) | — |
| AegntiX | Original | [`DAILYDOCO/R&D/aegntix-ui/`](DAILYDOCO/R&D/aegntix-ui/) | [`aegntix-mvp/tests/`](DAILYDOCO/R&D/aegntix-ui/aegntix-mvp/tests/) |
| Aegntic MCP | Original | [`aegntic-MCP/`](aegntic-MCP/) | [`aegntic-MCP/tests/`](aegntic-MCP/tests/) |
| modcontxtpro | Original | [`aegntic-MCP/modcontxtpro/`](aegntic-MCP/modcontxtpro/) | [`tests/unit/`](aegntic-MCP/modcontxtpro/tests/unit/) |
| CLAEM (claem-mcp-server) | Original | [`CLAEM/claem-mcp-server/`](CLAEM/claem-mcp-server/) | [`tests/`](CLAEM/claem-mcp-server/tests/) |
| ai-collaboration-hub | Original | [`CLAEM/core-collaboration-system/ai-collaboration-hub/`](CLAEM/core-collaboration-system/ai-collaboration-hub/) | [`tests/`](CLAEM/core-collaboration-system/ai-collaboration-hub/tests/) |
| multi-cld-code (CCTM) | Original | [`multi-cld-code/`](multi-cld-code/) | — |
| quick-data MCP | Original | [`mcp-servers/quick-data/`](mcp-servers/quick-data/) | [`tests/`](mcp-servers/quick-data/tests/) |
| prompt-fail | Original | [`prompt-fail/`](prompt-fail/) | [`ultraplan-platform/webapp/src/tests/`](prompt-fail/ultraplan-platform/webapp/src/tests/) |
| zkFlow.pro | Original | [`zkFlow.pro/`](zkFlow.pro/) | — |
| ComfyUI | Third-party (GPL-3.0, vendored upstream) | [`ComfyUI/`](ComfyUI/) | [`ComfyUI/tests/`](ComfyUI/tests/) |
| pickd MCP | Third-party (by IndyDevDan, per its README/pyproject) | [`mcp-servers/pickd/`](mcp-servers/pickd/) | [`src/mcp_server_pickd/tests/`](mcp-servers/pickd/src/mcp_server_pickd/tests/) |
| aegntic-knowledge-engine | Third-party (MIT © 2025 Cole Medin, per LICENSE) | [`mcp-servers/aegntic-knowledge-engine/`](mcp-servers/aegntic-knowledge-engine/) | — |
| crawl4ai-mcp-server | Third-party (wrapper around Crawl4AI, per its README/header) | [`mcp-servers/crawl4ai-mcp-server.py`](mcp-servers/crawl4ai-mcp-server.py) | [`test_crawl4ai.py`](mcp-servers/test_crawl4ai.py) |
| just-prompt | Third-party (vendored upstream; no licence file in-tree) | [`CLAEM/just-prompt-orchestration/just-prompt/`](CLAEM/just-prompt-orchestration/just-prompt/) | [`src/just_prompt/tests/`](CLAEM/just-prompt-orchestration/just-prompt/src/just_prompt/tests/) |
| STEGOSAURUS-WRECKS | Third-party (AGPL-3.0, vendored upstream) | [`STEGOSAURUS-WRECKS/`](STEGOSAURUS-WRECKS/) | — |
| youtube2prompt | Unclear (MIT; placeholder remotes, no upstream notice in-tree) | [`youtube2prompt/`](youtube2prompt/) | [`tests/`](youtube2prompt/tests/) |

Third-party components are vendored under their own licences (see each component's `LICENSE`/README). "Original" means authored in this ecosystem by its owners (aegntic / Mattae Cooper) with no upstream notice in-tree.

## 🏗️ Architecture

### Technology Stack

| Category | Technologies |
|----------|-------------|
| **Languages** | Rust (performance), TypeScript/JavaScript (web), Python 3.12+ (AI/ML) |
| **Runtimes** | Bun (preferred), Node.js (legacy), UV (Python) |
| **Databases** | PostgreSQL, Neo4j, Redis, SQLite |
| **AI Models** | DeepSeek R1.1, Gemma 3, Flux.1, Claude 4 |
| **Frameworks** | Tauri (desktop), FastAPI (Python APIs), React (frontends), NX (monorepo) |

### Performance Requirements

| Metric | Target | Component |
|--------|--------|-----------|
| Video Processing | < 2x realtime | DailyDoco Pro |
| Memory Usage | < 200MB idle | All applications |
| CPU Usage (idle) | < 5% | Desktop monitoring |
| Startup Time | < 3 seconds | All applications |
| Authenticity Score | > 95% | aegnt-27 system |
| Detection Resistance | > 95% | AI humanization |

## 📦 Core Components

### DailyDoco Pro
The flagship automated documentation platform that captures, processes, and publishes development sessions with AI-powered enhancements.

**Key Features:**
- 🎥 Intelligent screen capture with predictive moment detection
- 🤖 AI test audience simulation (50-100 synthetic viewers)
- 📊 Real-time performance analytics
- 🔐 Privacy-first local processing
- 🚀 Multi-platform support (Desktop, Web, Browser Extensions)

**Location:** `DAILYDOCO/`

### aegnt-27
Human authenticity engine achieving 95%+ AI detection resistance through advanced behavioral modeling.

**Key Features:**
- 🖱️ Natural mouse movement patterns with Bezier curves
- ⌨️ Authentic typing patterns with thinking pauses
- 🎤 Voice naturalness enhancement
- 📝 Content authenticity validation
- 🔧 Commercial licensing for advanced features

**Location:** `DAILYDOCO/libs/aegnt-27/` & `DAILYDOCO/aegnt-27-standalone/`

### AegntiX
Advanced AI orchestration platform enabling seamless multi-agent collaboration.

**Location:** `DAILYDOCO/R&D/aegntix-ui/`

### 4site.pro
Transform any GitHub repository into a stunning website with viral growth mechanics and commission-based scaling.

**Key Features:**
- 🌐 Instant GitHub-to-website transformation
- 📈 Viral coefficient tracking (K-factor optimization)
- 💰 Multi-tier commission system
- 🎨 Premium template library
- ⚡ SEO & performance optimization

**Location:** `4site/` (DO NOT MODIFY - Active Development)

### Aegntic MCP
Comprehensive Model Context Protocol server ecosystem providing Claude with advanced capabilities.

**Available Servers:**
- Docker management
- GitHub integration
- N8N workflow automation
- Firebase operations
- Knowledge engine with RAG
- Quick data analytics
- And 15+ more specialized servers

**Location:** `aegntic-MCP/`

### ComfyUI
Integrated AI generation platform for images, videos, and creative content.

**Location:** `ComfyUI/`

## 🚀 Quick Start

### Prerequisites
```bash
# Install Bun (JavaScript/TypeScript)
curl -fsSL https://bun.sh/install | bash

# Install UV (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Development Setup

#### 1. DailyDoco Pro
```bash
cd DAILYDOCO
bun install
bun run dev  # Starts all services
```

#### 2. Aegntic MCP
```bash
cd aegntic-MCP
npm install
npm start
```

#### 3. Quick Data Analytics
```bash
cd mcp-servers/quick-data
uv sync
uv run python -m quick_data_mcp
```

## 📖 Documentation

### Essential Guides
- [Project Instructions (CLAUDE.md)](CLAUDE.md) - AI coding guidelines
- [Ecosystem Overview](AEGNTIC_ECOSYSTEM_OVERVIEW.md) - Strategic vision
- [Repository Structure](REPOSITORY_STRUCTURE_PLAN.md) - Organization details

### Component Documentation
- [DailyDoco Pro](DAILYDOCO/README.md)
- [Aegntic MCP](aegntic-MCP/README.md)
- [4site.pro](4site/README.md)
- [aegnt-27](DAILYDOCO/aegnt-27-standalone/README.md)

## 🔧 Development Workflows

### Full Stack Development
```bash
# Start infrastructure
cd DAILYDOCO && docker-compose up -d postgres redis neo4j

# Start all services
bun run dev

# Run tests
nx run-many --target=test --all
```

### MCP Server Development
```bash
# DailyDoco MCP
cd DAILYDOCO/apps/mcp-server && bun run dev

# Quick Data MCP
cd mcp-servers/quick-data && uv run python -m quick_data_mcp
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

### Development Standards
- Use `bun` for JavaScript/TypeScript projects
- Use `uv` for Python package management
- Follow existing code conventions
- Maintain 95%+ test coverage
- Document all public APIs

## 📊 Project Status

| Component | Status | Version |
|-----------|--------|---------|
| DailyDoco Pro | 🟢 Active | v2.0.0 |
| aegnt-27 | 🟢 Active | v1.5.0 |
| 4site.pro | 🟢 Active | v3.0.0 |
| Aegntic MCP | 🟢 Active | v1.2.0 |
| AegntiX | 🟡 Beta | v0.9.0 |
| ComfyUI | 🟢 Active | Custom |

## 🔐 Security

- **Privacy-First**: All processing happens locally by default
- **Encryption**: AES-256 for stored content
- **Compliance**: GDPR, SOC2, HIPAA ready architectures
- **Sensitive Content**: Real-time API key/password filtering

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Documentation**: [https://docs.aegntic.com](https://docs.aegntic.com)
- **Community**: [Discord](https://discord.gg/aegntic) | [X/Twitter](https://x.com/aegntic)
- **Support**: [support@aegntic.com](mailto:support@aegntic.com)

## 🙏 Acknowledgments

Built with ❤️ by the AEGNTIC team, leveraging cutting-edge AI models including:
- DeepSeek R1.1 for cost-optimized intelligence
- Claude 4 for advanced reasoning
- Gemma 3 for privacy-critical operations
- Flux.1 for creative generation

---

<div align="center">
  <b>ae-co-system</b> - Where AI meets human authenticity
  <br>
  <sub>Making the impossible, possible. One commit at a time.</sub>
</div>
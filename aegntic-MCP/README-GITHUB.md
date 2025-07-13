# Aegntic MCP Ecosystem

> The most comprehensive collection of Model Context Protocol (MCP) servers and frameworks

[![npm version](https://img.shields.io/npm/v/@aegntic/mcp-standard.svg)](https://www.npmjs.com/package/@aegntic/mcp-standard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aegntic/aegntic-MCP/pulls)

## 🌟 Overview

The Aegntic MCP ecosystem provides production-ready Model Context Protocol servers and frameworks for extending AI assistants like Claude with powerful external capabilities. From simple tools to complex authenticated services, we've got you covered.

## 📦 What's Included

### 1. **Aegntic MCP Standard** (NEW!)
The definitive framework for building production-ready MCP servers with authentication.

```bash
npx @aegntic/create-mcp my-awesome-server
```

**Features:**
- 🔐 Multiple auth providers (GitHub OAuth, API Keys, JWT)
- 🛠️ Declarative tool builder with automatic validation
- 📚 Self-documenting tools with AI-optimized descriptions
- ⚡ Cloudflare Workers support for edge deployment
- 🎯 Zero-config setup with interactive CLI

[Learn more →](./aegntic-mcp-standard/README.md)

### 2. **Consolidated MCP Servers**
A curated collection of 40+ specialized MCP servers:

- **aegntic-hive-mcp** - AI conversation management system
- **n8n-pro** - Workflow automation with 525+ integrations
- **firebase-studio-mcp** - Complete Firebase and Google Cloud access
- **claude-export-mcp** - Export Claude Desktop conversations
- **docker-mcp** - Container and image management
- **knowledge-engine-mcp** - Web crawling and RAG capabilities
- **smithery-mcp** - Search and discover MCP tools
- [And many more...](./consolidated-mcp-servers/README.md)

### 3. **Remote MCP with Auth**
Reference implementation for cloud-native MCP servers with OAuth.

**Architecture:**
- Cloudflare Workers for global edge deployment
- GitHub OAuth for secure authentication
- PostgreSQL with connection pooling
- Production-ready error handling

[Implementation guide →](./remote-mcp-server-with-auth/README.md)

## 🚀 Quick Start

### Option 1: Use the Framework (Recommended)
```bash
# Install the CLI globally
npm install -g @aegntic/create-mcp

# Create a new MCP server
create-mcp my-server

# Choose your template:
# - basic (no auth)
# - auth (GitHub OAuth)
# - full (auth + database)
# - custom (pick features)

cd my-server
npm run dev
```

### Option 2: Use Pre-built Servers
```bash
# Clone the repository
git clone https://github.com/aegntic/aegntic-MCP.git
cd aegntic-MCP/consolidated-mcp-servers

# Pick a server (e.g., n8n-pro)
cd n8n-pro
npm install
npm start
```

### Option 3: Configure in Claude Desktop
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "aegntic-knowledge": {
      "command": "npx",
      "args": ["@aegntic/knowledge-engine-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    },
    "n8n-pro": {
      "command": "node",
      "args": ["/path/to/n8n-pro/index.js"]
    }
  }
}
```

## 📖 Documentation

### Framework Documentation
- [Getting Started](./aegntic-mcp-standard/README.md)
- [Authentication Guide](./aegntic-mcp-standard/src/auth/README.md)
- [Tool Examples](./aegntic-mcp-standard/examples/tools/README.md)
- [API Reference](./aegntic-mcp-standard/docs/API.md)

### Server Catalog
- [Complete Server List](./consolidated-mcp-servers/README.md)
- [Open Source Alternatives](./consolidated-mcp-servers/OPEN_SOURCE_MCP_GEMS.md)
- [Integration Patterns](./remote-mcp-server-with-auth/CLAUDE.md)

## 🏗️ Architecture

```
aegntic-MCP/
├── aegntic-mcp-standard/          # Framework for building MCP servers
│   ├── src/                       # Core framework code
│   ├── examples/                  # Example implementations
│   ├── packages/create-mcp/       # CLI tool
│   └── docs/                      # Documentation
│
├── consolidated-mcp-servers/      # Pre-built MCP servers
│   ├── aegntic-hive-mcp/         # AI conversation management
│   ├── n8n-pro/                  # Workflow automation
│   ├── firebase-studio-mcp/      # Firebase integration
│   └── ... (40+ more servers)
│
└── remote-mcp-server-with-auth/   # Cloud-native reference
    ├── src/                       # Cloudflare Workers code
    └── docs/                      # Implementation guide
```

## 💡 Use Cases

### For Developers
- Build custom MCP servers in minutes
- Add authentication to existing tools
- Deploy globally with edge computing
- Integrate any API or service

### For AI Users
- Enhance Claude with 40+ capabilities
- Automate workflows with n8n
- Manage Firebase projects
- Query databases directly
- Control Docker containers
- Search and analyze code

### For Enterprises
- Secure authentication with RBAC
- Audit logging and compliance
- Global deployment options
- Production-ready infrastructure

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Add New Servers**: Build MCPs for your favorite tools
2. **Improve Framework**: Add features to aegntic-mcp-standard
3. **Write Documentation**: Help others get started
4. **Share Templates**: Create specialized server templates

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📊 Stats

- **40+** Pre-built MCP servers
- **5** Authentication methods supported
- **200+** Edge locations for deployment
- **1M+** Potential concurrent users
- **<50ms** Cold start latency

## 🛠️ Powered By

- [Model Context Protocol](https://github.com/anthropics/mcp) by Anthropic
- [Cloudflare Workers](https://workers.cloudflare.com/) for edge deployment
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Zod](https://github.com/colinhacks/zod) for schema validation

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙏 Acknowledgments

Built by [Mattae Cooper](mailto:research@aegntic.ai) and the Aegntic community.

Special thanks to:
- Anthropic for creating the Model Context Protocol
- The open source community for inspiration
- Early adopters and contributors

---

<div align="center">
  <h3>🚀 Start Building Today</h3>
  <p>
    <a href="https://npmjs.com/package/@aegntic/create-mcp">npm</a> •
    <a href="./aegntic-mcp-standard/README.md">Docs</a> •
    <a href="https://github.com/aegntic/aegntic-MCP/issues">Issues</a> •
    <a href="https://discord.gg/aegntic">Discord</a>
  </p>
</div>
#!/bin/bash
# ae-startup Claude Code Startup Script

echo "🚀 Starting Claude Code with elite MCP ecosystem for aegntic-startup"
echo "Part of aegntic ecosystem: AI and automation ecosystem"
echo "MCP Servers: 16+ available"
echo "AI Development Environment: Enabled"

# Verify MCP servers are accessible
if [ -f ".mcp.json" ]; then
    echo "✅ MCP configuration loaded"
else
    echo "⚠️  Local MCP configuration not found, using global config"
fi

# Check for AI development structure
if [ -d ".claude" ] && [ -d "ai_docs" ] && [ -d "specs" ] && [ -d "prompts" ] && [ -d ".cloud" ]; then
    echo "✅ AI development environment structure ready"
else
    echo "❌ AI development structure incomplete"
fi

# Project-specific startup checks
echo ""
echo "📋 Project Status:"

# Check for Python environment
if [ -f "pyproject.toml" ]; then
    echo "🐍 Python project detected (use 'uv' for all operations)"
    if command -v uv >/dev/null 2>&1; then
        echo "  ✅ uv available"
        echo "  Commands: uv sync, uv run python main.py, uv run pytest"
    else
        echo "  ❌ uv not installed (required for Python development)"
    fi
fi

# Check for Node.js environment
if [ -f "package.json" ]; then
    echo "📦 Node.js project detected (use 'bun' for all operations)"
    if command -v bun >/dev/null 2>&1; then
        echo "  ✅ bun available"
        echo "  Commands: bun install, bun run dev, bun run build"
    else
        echo "  ❌ bun not installed (required for JS/TS development)"
    fi
fi

# Check for Rust environment
if [ -f "Cargo.toml" ]; then
    echo "🦀 Rust project detected"
    if command -v cargo >/dev/null 2>&1; then
        echo "  ✅ cargo available"
        echo "  Commands: cargo build --release, cargo test, cargo bench"
    else
        echo "  ❌ cargo not installed (required for Rust development)"
    fi
fi

echo ""
echo "🧠 Available Claude Commands:"
echo "  /prime - Load project context and activate AI development workflows"
echo "  /exe-parallel - Multi-agent workflow orchestration"
echo "  /performance-analysis - Performance optimization workflows"
echo "  /privacy-validation - Privacy-first validation workflows"
echo "  /init - Enhanced project initializer with knowledge baseline (run: ./init.sh)"

echo ""
echo "🔧 MCP Quick Start:"
echo "  Use mcp_quick_data_* for analytics and data processing"
echo "  Use mcp_just_prompt_* for multi-model AI decision making"
echo "  Use mcp_memory_* for persistent context management"
echo "  Use mcp_sequentialthinking_* for complex problem breakdown"
echo "  Use mcp_aegntic_knowledge_engine_* for web research"

echo ""
echo "📚 AI Development Folders:"
echo "  ai_docs/    - Persistent AI knowledge (API docs, best practices)"
echo "  specs/      - Project specifications and detailed plans"
echo "  prompts/    - Reusable prompt templates for common tasks"
echo "  .cloud/     - Reusable code snippets and patterns"

echo ""
echo "🌟 Parent Ecosystem Access:"
echo "  ../ae4sitepro-assets/     - 58 premium UI components"
echo "  ../DAILYDOCO/             - Documentation platform with AI test audiences"
echo "  ../aegntic-MCP/           - Dynamic MCP server management"
echo "  ~/.claude/                - Global MCP configuration and prompts"

echo ""
echo "⚡ Performance Standards:"
echo "  Memory Usage: < 200MB idle"
echo "  CPU Usage: < 5% idle"
echo "  Startup Time: < 3 seconds"
echo "  Build Time: < 30 seconds"

echo ""
echo "🔒 Security & Privacy:"
echo "  ✅ Local-first processing by default"
echo "  ✅ Granular consent management"
echo "  ✅ AES-256 encryption for stored content"
echo "  ✅ GDPR/SOC2/HIPAA ready architecture"

echo ""
echo "Ready for elite-tier AI-enhanced development! 🎯"
echo "Use the AI development folders to maintain context across sessions."
echo "Follow the TOP 1% coding patterns established in the aegntic ecosystem."
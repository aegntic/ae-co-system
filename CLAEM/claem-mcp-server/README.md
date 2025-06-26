# CLAEM: Claude-AI Enhanced MCP Server

**Revolutionary unified AI collaboration server with human oversight**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![MCP](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)
[![License: Dual](https://img.shields.io/badge/License-Dual%20License-blue.svg)](LICENSE)

## 🚀 Revolutionary Features

CLAEM represents a breakthrough in AI collaboration technology, combining multiple sophisticated AI interaction patterns into a unified, intelligent system with human oversight.

### ✨ Core Innovations

- 🧠 **Intelligent Collaboration Routing**: Automatically selects optimal AI collaboration patterns based on request analysis
- 📈 **Evolving Knowledge Graphs**: Builds temporal intelligence that improves over time
- 👤 **Human-Supervised AI-to-AI Communication**: Complete oversight with approval gates
- 💰 **95% Cost Reduction**: Through intelligent DeepSeek R1 routing
- 🌐 **1M Token Context**: Leverages Gemini Pro's massive context window
- 🏛️ **CEO-and-Board Patterns**: Multi-model synthesis for critical decisions
- 🔒 **Privacy-First Architecture**: Local processing with optional cloud features

### 🎯 Collaboration Strategies

| Strategy | Cost | Best For | Key Features |
|----------|------|----------|--------------|
| **DeepSeek R1** | 💰 95% reduction | Reasoning, analysis | Advanced reasoning at minimal cost |
| **Gemini Pro** | 💰💰 Moderate | Large context | 1M token context window |
| **CEO & Board** | 💰💰💰 Premium | Critical decisions | Multi-model synthesis |
| **Supervised Exchange** | 💰💰 Moderate | Human guidance | AI-to-AI with oversight |
| **Local Strategy** | 🆓 Free | Privacy critical | Fully local processing |

## 🛠️ Quick Start

### Installation

```bash
# Clone and install with uv (10-100x faster than pip)
git clone https://github.com/aegntic/CLAEM.git
cd CLAEM/claem-mcp-server
uv sync

# Initialize CLAEM in your project
uv run claem init --with-knowledge-graph --with-approval-interface
```

### Claude Code Integration

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "claem-mcp": {
      "command": "uv",
      "args": ["run", "claem-server"],
      "cwd": "/path/to/CLAEM/claem-mcp-server"
    }
  }
}
```

### Start the Server

```bash
# Start CLAEM MCP server
uv run claem serve

# Or directly run the server
uv run claem-server
```

## 🎮 Revolutionary MCP Tools

### `claem_intelligent_collaborate`
**Intelligent AI collaboration with automatic pattern selection**

```python
# Claude Code usage
result = await claem_intelligent_collaborate({
    "content": "Analyze this React application for security vulnerabilities",
    "task_type": "knowledge_analysis",
    "max_tokens": 100000,
    "require_approval": True
})
```

**Features:**
- Automatic strategy selection based on request analysis
- Intelligent model routing (DeepSeek R1, Claude 4, Gemini 2.5, etc.)
- Human approval gates for supervised collaboration
- Knowledge graph integration for enhanced context

### `claem_knowledge_evolve`
**Build temporal intelligence from collaboration history**

```python
# Process conversations for knowledge evolution
evolution_result = await claem_knowledge_evolve({
    "session_id": "your-session-id",
    "export_conversations": True,
    "learn_patterns": True
})
```

**Features:**
- Extracts concepts and patterns from AI collaborations
- Builds evolving knowledge graphs with temporal intelligence
- Learns user preferences and collaboration patterns
- Enables cross-session knowledge synthesis

### `claem_context_synthesize`
**Intelligent context preparation from knowledge graphs**

```python
# Synthesize relevant context for AI collaboration
context = await claem_context_synthesize({
    "content": "Help me optimize this database query",
    "max_tokens": 50000,
    "include_patterns": True
})
```

**Features:**
- Searches knowledge graphs for relevant context
- Adapts context preparation to collaboration type
- Includes learned patterns and historical insights
- Optimizes for token limits and relevance

### `claem_human_review`
**Human oversight and approval interface**

```python
# Review pending AI collaborations
review_result = await claem_human_review({
    "action": "list",
    "pending_only": True
})

# Approve or modify AI responses
approval_result = await claem_human_review({
    "action": "approve",
    "approval_id": "approval-123",
    "feedback": "Excellent analysis, proceed with implementation"
})
```

**Features:**
- Web-based approval dashboard
- Risk assessment and recommendations
- Human feedback integration
- Approval workflow management

### `claem_export_insights`
**Enhanced insights export with cross-session analysis**

```python
# Export comprehensive collaboration insights
export_result = await claem_export_insights({
    "include_knowledge_graph": True,
    "include_patterns": True,
    "format": "markdown"
})
```

**Features:**
- Complete collaboration history export
- Knowledge graph visualization data
- Pattern analysis and insights
- Multiple export formats (JSON, Markdown, Graph)

## 🏗️ Architecture

### Core Components

```
CLAEM MCP Server
├── Collaboration Router      # Intelligent pattern selection
├── Knowledge Engine         # Evolving temporal intelligence  
├── Context Engine          # Adaptive context synthesis
├── Approval Engine         # Human oversight system
└── Model Orchestrator     # Multi-provider management
```

### Integration Ecosystem

```
Claude Code ←→ CLAEM MCP ←→ AI Providers
     ↑              ↓           ↓
Human User    Knowledge Graph  DeepSeek R1
     ↑              ↓           ↓  
Approval UI   Pattern Learning  Gemini Pro
     ↑              ↓           ↓
Decision Tree  Context Synthesis Claude 4
```

## 💡 Use Cases

### 🔍 Code Analysis & Review
```python
await claem_intelligent_collaborate({
    "content": "Review this microservices architecture for scalability issues",
    "task_type": "knowledge_analysis",
    "context": "[Complete codebase with 50+ services]",
    "max_tokens": 500000  # Leverage Gemini's 1M context
})
```

### 🏛️ Strategic Decision Making
```python
await claem_intelligent_collaborate({
    "content": "Should we migrate from REST to GraphQL?",
    "task_type": "ceo_board_decision",
    "preferred_strategy": "ceo_board_strategy"  # Multi-model synthesis
})
```

### 🧠 Knowledge Evolution
```python
await claem_knowledge_evolve({
    "session_id": "project-alpha",
    "export_conversations": True,
    "learn_patterns": True
})
```

### 🎯 Context-Aware Development
```python
context = await claem_context_synthesize({
    "content": "Implement OAuth 2.0 authentication",
    "include_patterns": True
})

result = await claem_intelligent_collaborate({
    "content": "Implement OAuth 2.0 authentication",
    "context": context,  # Rich context from knowledge graph
    "task_type": "multi_model_synthesis"
})
```

## 🎨 Advanced Configuration

### Environment Variables

```bash
# API Keys (optional for local development)
export OPENROUTER_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# CLAEM Configuration
export CLAEM_DATABASE_URL="sqlite:///claem_knowledge.db"
export CLAEM_KNOWLEDGE_RETENTION_DAYS="365"
export CLAEM_DEFAULT_STRATEGY="deepseek_r1"
export CLAEM_APPROVAL_TIMEOUT="300"  # 5 minutes
```

### Custom Model Configuration

```python
from claem_mcp import CLAEMServer, ModelConfiguration

server = CLAEMServer()

# Add custom model
custom_model = ModelConfiguration(
    provider="custom_provider",
    model_name="custom-model-v1",
    max_tokens=8192,
    context_window=128000,
    cost_per_1k_tokens=0.001,
    reasoning_capable=True,
    privacy_rating=5
)

server.collaboration_router.add_custom_model(custom_model)
```

## 🧪 Testing

```bash
# Run comprehensive test suite
uv run pytest

# Run with coverage
uv run pytest --cov=src/claem_mcp

# Run integration tests
uv run pytest tests/integration/

# Run browser automation tests  
uv run pytest tests/browser/ -m browser
```

## 📊 Monitoring & Analytics

### Knowledge Graph Statistics
```python
stats = await claem_session_info({
    "include_statistics": True
})
# Returns: total sessions, knowledge nodes, relationships, etc.
```

### Strategy Performance Analysis
```python
export_data = await claem_export_insights({
    "include_patterns": True,
    "format": "json"
})
# Analyze strategy effectiveness, cost optimization, user preferences
```

## 🔧 Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/aegntic/CLAEM.git
cd CLAEM/claem-mcp-server

# Install with development dependencies
uv sync --extra dev

# Run in development mode
uv run claem serve --debug

# Run tests with auto-reload
uv run pytest --watch
```

### Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## 📄 License

Dual licensed:
- **Free for non-commercial use** (personal, educational, research)
- **Commercial license required** for business use

**Authors:**
- Mattae Cooper <human@mattaecooper.org>
- '{ae}'aegntic.ai <contact@aegntic.ai>

## 🌟 Why CLAEM?

### Traditional AI Interaction:
```
Human → Single AI → Response
```

### CLAEM Revolution:
```
Human → Intelligent Router → Optimal AI Pattern → Enhanced Response
   ↑                             ↓                        ↓
Approval Interface    ←    Knowledge Graph     ←    Pattern Learning
```

**Result:** 10x more intelligent AI collaboration with human control, cost optimization, and evolving capabilities.

## 🚀 Next Steps

1. **Install CLAEM**: `uv sync && uv run claem init`
2. **Start Server**: `uv run claem serve`
3. **Integrate with Claude Code**: Add MCP configuration
4. **Begin Revolutionary AI Collaboration**: Use `claem_intelligent_collaborate`
5. **Evolve Your Knowledge**: Use `claem_knowledge_evolve`

---

**Built for the future of AI-enhanced development** • **Human-supervised, AI-amplified intelligence** • **Revolutionary collaboration patterns**
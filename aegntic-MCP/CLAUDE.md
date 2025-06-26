# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aegntic MCP** is a sophisticated dynamic MCP (Model Context Protocol) server generator and management system. It serves as a unified orchestration platform that hosts a collection of specialized MCP servers, extending Claude's capabilities through external tools and services with AI-powered intelligent routing.

## Architecture

### Core System Components

#### Main Server Infrastructure
- **Express.js API Server** (`src/core/server.js`) - Main HTTP server on port 9100
- **Super-Hub Neural Network** (`src/core/super-hub.js`) - AI orchestration system with WebSocket on port 9101
- **Neural Router** (`src/core/neural-router.js`) - Intelligent request routing with AI-powered decision making
- **Pattern Engine** (`src/core/pattern-engine.js`) - Learning from successful/failed operations
- **State Synchronizer** (`src/core/state-synchronizer.js`) - Cross-server state management

#### MCP Server Collection (`/servers/`)
Each server is self-contained with standardized structure:
- **Aegntic Knowledge Engine** (Python/UV) - 20 tools for web crawling, RAG, knowledge graphs, task management
- **Claude Export MCP** (Node.js) - Export Claude Desktop projects to Markdown
- **Firebase Studio MCP** (Node.js) - Complete Firebase and Google Cloud services access
- **n8n MCP** (Node.js) - Workflow automation integration
- **Docker MCP** (Python/UVX) - Container and image management

#### Supporting Systems
- **Monitoring Agents** (`src/agents/`) - Proactive system monitoring and optimization
- **API Controllers** (`src/api/controllers/`) - RESTful endpoint management
- **Sesame CSM Integration** (`src/integrations/sesame/`) - Voice synthesis capabilities
- **n8n Workflows** (`config/n8n/`) - Pre-configured automation templates

## Development Commands

### Core Development
```bash
# Start main MCP orchestration server
npm start                      # Production mode on port 9100
npm run dev                    # Development with nodemon

# Docker infrastructure (includes n8n on port 5678)
npm run docker                 # Start all containers
npm run docker:build          # Build containers
npm run docker:down           # Stop all containers

# Testing comprehensive suite
npm test                       # Complete test suite
npm run test:unit             # Unit tests only  
npm run test:integration      # Integration tests
npm run test:e2e              # End-to-end workflow tests
```

### Individual MCP Server Development
```bash
# Python servers (Aegntic Knowledge Engine)
cd servers/aegntic-knowledge-engine
uv sync                       # Install dependencies with UV
uv run python src/crawl4ai_mcp.py  # Start server on port 8052

# Node.js servers (most servers)
cd servers/[server-name]
npm install                   # Install dependencies
npm start                     # Start individual server

# Test server connectivity
curl http://localhost:[PORT]/health
```

### Docker Development Workflow
```bash
# Full stack development
npm run docker                # Start MCP server + n8n
# Access n8n web interface at http://localhost:5678 (admin/password)

# View logs
docker logs mcp-server
docker logs n8n

# Individual container management
docker exec -it mcp-server /bin/bash
```

## Key Architecture Patterns

### MCP Server Standard Structure
Every server follows this pattern:
```
servers/server-name/
├── README.md          # Comprehensive documentation with tool-specific prompts
├── package.json       # npm/UV configuration
├── index.js           # MCP protocol entry point
└── src/               # Implementation
    ├── server.js      # Core server logic and tool definitions
    └── ...            # Additional modules
```

### Neural Network Orchestration
- **Predictive Routing**: AI learns optimal server selection based on request patterns
- **Fallback Strategies**: Automatic failover between servers with performance monitoring
- **Cross-Server Coordination**: Intelligent resource sharing and state synchronization
- **Performance Optimization**: Self-tuning response times with continuous learning

### Configuration Management
- **Main Config** (`src/core/config.js`) - Central configuration for all services
- **Environment Variables** - External service URLs, API keys, performance tuning
- **Docker Compose** (`config/docker/docker-compose.yml`) - Container orchestration
- **n8n Workflows** (`config/n8n/`) - Pre-built automation templates

### API Design Patterns
- **RESTful Endpoints** under `/api` prefix with comprehensive error handling  
- **Health Monitoring** at `/health` with detailed system status
- **Workflow Management** endpoints for n8n integration
- **Voice Synthesis** endpoints for Sesame CSM integration

## Technology Stack

### Core Technologies
- **Backend**: Node.js 18+ with Express.js framework
- **AI Integration**: OpenRouter API, DeepSeek models, local AI fallbacks
- **Database**: SQLite for local storage and vector operations
- **Communication**: WebSocket for real-time inter-server communication
- **Containerization**: Docker + Docker Compose with multi-service orchestration
- **Package Management**: npm (Node.js), UV (Python), UVX (standalone Python)

### Dependencies & Versions
```json
{
  "express": "^4.18.2",
  "ws": "^8.14.2",
  "axios": "^1.6.0", 
  "winston": "^3.10.0",
  "cors": "^2.8.5"
}
```

## Environment Configuration

### Required Environment Variables
```bash
# n8n Integration
N8N_URL=http://localhost:5678
N8N_USER=admin
N8N_PASSWORD=password
N8N_API_KEY=                  # Optional API key for programmatic access

# Sesame CSM Voice Synthesis
SESAME_MODEL_PATH=/opt/csm/models/csm-tiny
AUDIO_OUTPUT_DIR=./media/generated/audio
DEFAULT_VOICE=default
SAMPLE_RATE=22050

# GPU Support (optional)
USE_GPU=false
GPU_DEVICE=0

# AI Agent Configuration
AGENT_MONITOR_INTERVAL=60000   # 1 minute
AGENT_OPTIMIZE_INTERVAL=3600000 # 1 hour
```

### Port Configuration
- **9100**: Main MCP orchestration server (HTTP API)
- **9101**: Super-Hub Neural Network (WebSocket)
- **5678**: n8n workflow automation (Docker)
- **8052**: Aegntic Knowledge Engine (Python/UV)
- **3000-3004**: Individual Node.js MCP servers (dynamic assignment)

## Testing Architecture

### Test Suite Structure (`/tests/`)
- **System Validation** (`system-validation.js`) - 6-phase human-level testing protocol
- **Unit Tests** (`tests/unit/`) - Core component testing with mocking
- **Integration Tests** (`tests/integration/`) - API and cross-service testing
- **E2E Tests** (`tests/e2e/`) - Complete workflow validation

### Testing Protocol
1. **Infrastructure Tests** - Health checks, WebSocket connections, port availability
2. **Core Functionality Tests** - Neural routing, state synchronization, pattern recognition
3. **Neural Intelligence Tests** - AI prediction accuracy, optimization effectiveness
4. **Integration Tests** - Cross-server communication, n8n workflows, Sesame synthesis
5. **Performance Tests** - Response times, concurrent request handling, memory usage
6. **User Experience Simulation** - Realistic workflow testing with error scenarios

### Test Commands
```bash
npm test                      # Complete test suite with coverage
npm run test:unit            # Fast unit tests only
npm run test:integration     # API and service integration
npm run test:e2e             # Full workflow validation
```

## Development Workflow

### Adding New MCP Server
1. **Create Directory**: `servers/new-server-name/`
2. **Copy Template**: Use existing server structure as template
3. **Implement MCP Protocol**: In `src/server.js` with proper tool definitions
4. **Update Documentation**: Add to main README.md with tool-specific prompts
5. **Configure Neural Router**: Add routing patterns to `neural-router.js`
6. **Test Integration**: Verify Claude Desktop/Code connectivity

### Neural Network Training
The system continuously learns from:
- **Request Patterns**: Which servers handle requests most effectively
- **Performance Metrics**: Response times, success rates, error patterns  
- **User Feedback**: Implicit feedback from continued usage
- **Cross-Server Dependencies**: How servers work together optimally

### n8n Workflow Development
1. **Access n8n**: http://localhost:5678 (admin/password)
2. **Import Templates**: From `config/n8n/workflows.json`
3. **Create Custom Workflows**: Using HTTP triggers for MCP communication
4. **Test Integration**: Verify MCP server to n8n connectivity
5. **Deploy**: Save workflows for automatic execution

## Integration Points

### Claude Desktop/Code Integration
Each MCP server can be added to Claude configuration:
```json
{
  "mcpServers": {
    "aegntic-knowledge-engine": {
      "command": "uv",
      "args": ["run", "python", "src/crawl4ai_mcp.py"],
      "cwd": "/path/to/servers/aegntic-knowledge-engine",
      "env": {"OPENROUTER_API_KEY": "your-key"}
    },
    "claude-export-mcp": {
      "command": "npx", 
      "args": ["@aegntic/claude-export-mcp"]
    }
  }
}
```

### Voice Synthesis (Sesame CSM)
- **Audio Generation**: Through `/api/voice` endpoints
- **Model Configuration**: CSM model path and voice selection
- **GPU Acceleration**: Optional for faster synthesis
- **Format Support**: Multiple audio formats and sample rates

### Workflow Automation (n8n)
- **HTTP Triggers**: For MCP server communication
- **Pre-built Templates**: Common MCP operation workflows
- **Custom Integrations**: Build complex multi-server workflows
- **Monitoring**: Workflow execution tracking and error handling

## Common Development Issues

### Port Conflicts
- **Main Server**: Port 9100 must be available
- **Neural Network**: Port 9101 for WebSocket communication
- **n8n Docker**: Port 5678 for web interface
- **Individual Servers**: Dynamic port assignment with conflict resolution

### Python Server Setup (UV/UVX)
```bash
# Install UV package manager (10-100x faster than pip)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Server development
cd servers/aegntic-knowledge-engine
uv sync                       # Install dependencies
uv run python src/crawl4ai_mcp.py  # Start server

# Troubleshooting
uv --version                  # Verify UV installation
uv run python --version      # Check Python environment
```

### n8n Authentication Issues
- **Default Credentials**: admin/password for web interface
- **API Key Setup**: Set N8N_API_KEY for programmatic access
- **Basic Auth**: Required for all web interface access
- **Connection Testing**: Use curl to verify API connectivity

### MCP Protocol Issues
- **Server Discovery**: Verify proper MCP handshake implementation
- **Tool Definitions**: Check `src/server.js` for correct tool exports
- **Claude Connectivity**: Ensure Claude Desktop can connect to server endpoints
- **Protocol Compliance**: Follow MCP specification exactly

## Performance Optimization

### Resource Management
- **Memory Usage**: Monitor Node.js heap size, use `--max-old-space-size=4096` if needed
- **CPU Optimization**: Leverage multi-core systems with cluster mode
- **Network Efficiency**: Connection pooling, request batching
- **Database Performance**: SQLite optimization, index usage

### Neural Network Efficiency
- **Prediction Caching**: Cache routing decisions for similar requests
- **Pattern Recognition**: Optimize learning algorithms for faster convergence
- **State Synchronization**: Minimize cross-server communication overhead
- **Load Balancing**: Dynamic server selection based on current load

### Scaling Considerations
- **Horizontal Scaling**: Multiple MCP server instances
- **Vertical Scaling**: Resource allocation per service
- **Database Scaling**: Distributed storage for large knowledge bases
- **Network Scaling**: CDN for static assets, load balancers

## Security Considerations

### API Security
- **Authentication**: API key validation for sensitive operations
- **CORS Configuration**: Properly configured for web interface access
- **Rate Limiting**: Prevent abuse of AI-powered endpoints
- **Input Validation**: Sanitize all user inputs and API parameters

### Container Security
- **Minimal Images**: Use slim Node.js images for reduced attack surface
- **User Permissions**: Run containers as non-root users
- **Network Isolation**: Separate networks for different services
- **Secret Management**: Environment variables for sensitive configuration

### Data Protection
- **Local Storage**: Keep sensitive data local when possible
- **Encryption**: Encrypt stored knowledge bases and user data
- **API Key Management**: Secure storage and rotation of external API keys
- **Audit Logging**: Track all API access and administrative actions
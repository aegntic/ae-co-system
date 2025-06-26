# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **AgentiX UI** codebase - a revolutionary AI orchestration platform that creates "Orchestrated Reality Sandboxes" where users can pause, manipulate, and branch AI agent interactions in real-time. This is the UI component of the larger DailyDoco/ae-co-system ecosystem.

### Core Concept
AgentiX transforms traditional AI chat interfaces into living scenarios where:
- Multiple AI agents interact with distinct personalities and goals
- Users can pause time, inject context, and create timeline branches
- Scenarios unfold in real-time with WebSocket-powered visualization
- Timeline manipulation enables "what if" exploration of conversations

## Architecture

### Dual Architecture System
The project uses a sophisticated dual-architecture approach:

1. **Legacy MVP** (`/public/` - Vanilla JS/HTML)
   - Simple WebSocket-based real-time interface
   - Direct agent visualization with lighting effects
   - Minimal dependencies for maximum performance

2. **Modern React Interface** (`/web/` - React + Vite)
   - Advanced 3D timeline visualization with Three.js
   - React Flow node-based scenario editor
   - Component-based architecture with TypeScript

### Backend (Bun + TypeScript)
- **Bun Runtime**: Ultra-fast JavaScript runtime with native TypeScript support
- **SQLite Database**: Built-in Bun SQLite for scenario persistence
- **WebSocket Server**: Real-time bidirectional communication
- **OpenRouter Integration**: Multi-model AI provider access

### Key Components
```
src/
├── server.ts           # Main Bun server with WebSocket support
├── scenario-engine.ts  # Core scenario orchestration logic
├── aegnt-manager.ts    # Agent personality and behavior management
├── timeline.ts         # Timeline branching and state management
├── types.ts           # Shared TypeScript interfaces
└── logger.ts          # Structured logging system
```

## Development Commands

### Core Development Workflow
```bash
# Start backend server (Bun)
bun run dev                    # Auto-restart on changes, port 3005

# Start React frontend (Vite)
bun run dev:web               # Development server, port 5174

# Build and preview React app
bun run build:web             # Production build
bun run preview:web           # Preview production build

# Testing
bun test                      # Run all tests
```

### Full Development Setup
```bash
# Install dependencies (uses Bun for speed)
bun install

# Start complete development stack
# Terminal 1: Backend
bun run dev

# Terminal 2: Frontend (optional - can use legacy interface)
bun run dev:web

# Access points:
# Legacy interface: http://localhost:3005
# React interface: http://localhost:5174 (proxies to backend)
```

## Key Features & Implementation

### 1. Multi-Agent Orchestration
- Agents have persistent personalities, goals, and memory
- Real-time decision making with sub-50ms response times
- Context injection allows mid-scenario information updates
- Agent state management with SQLite persistence

### 2. Timeline Control System
- **Pause/Resume**: Freeze scenarios at any point
- **Branching**: Create alternate timelines from any moment
- **Context Injection**: Add information to specific agents
- **State Restoration**: Return to any previous scenario state

### 3. Real-Time Visualization
- WebSocket-powered live updates
- Agent cards with lighting effects during actions
- 3D timeline visualization (React interface)
- Node-based scenario editor with React Flow

### 4. Performance Optimization
- Bun runtime provides 3x faster execution than Node.js
- Native SQLite integration with zero-config setup
- WebSocket connection pooling for multiple clients
- Agent decision caching and memory optimization

## Technology Stack Details

### Runtime & Performance
- **Bun**: Primary runtime (3x faster than Node.js)
- **TypeScript**: Native support, no build step required
- **SQLite**: Built-in database with Bun integration
- **WebSockets**: Real-time bidirectional communication

### Frontend Technologies
- **React 19**: Latest React with concurrent features
- **Vite**: Ultra-fast development and build tool
- **Three.js + React Three Fiber**: 3D timeline visualization
- **React Flow**: Node-based scenario editor
- **Framer Motion**: Smooth animations and transitions
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management

### AI Integration
- **OpenRouter**: Multi-model AI provider (100+ models)
- **Model Flexibility**: Configurable model selection per agent
- **Cost Optimization**: Free tier models for development
- **Fallback Systems**: Graceful degradation when AI unavailable

## Configuration & Environment

### Environment Variables
```bash
# Optional - uses free models if not provided
OPENROUTER_API_KEY=your-key-here

# Development settings
NODE_ENV=development
BUN_ENV=development
```

### Port Configuration
- **Backend**: Port 3005 (configurable in server.ts)
- **Frontend Dev**: Port 5174 (configurable in vite.config.ts)
- **Proxy Setup**: Frontend automatically proxies API calls to backend

### Database Setup
- SQLite database auto-created at `data/aegntix.db`
- Schema initialization handled automatically on startup
- No manual database setup required

## Project Integration Context

### Parent Ecosystem
This AgentiX UI is part of the larger **ae-co-system**:
- **DailyDoco Pro**: Automated documentation platform
- **aegnt-27**: Human authenticity achievement system
- **YouTube Intelligence Engine**: Content analysis platform
- **Aegntic MCP**: Dynamic MCP server ecosystem

### Shared Dependencies
- Inherits TypeScript types from `libs/shared-types`
- Uses shared AI models from `libs/ai-models`
- Integrates with MCP servers for extended functionality

## Development Patterns

### Adding New Scenarios
Create JSON files in `scenarios/` directory:
```json
{
  "name": "Scenario Name",
  "agents": [{
    "id": "unique-id",
    "role": "Agent Role",
    "personality": "Detailed personality description",
    "goals": ["Goal 1", "Goal 2"]
  }],
  "worldState": {
    "key": "Initial world conditions"
  }
}
```

### Agent Behavior Customization
Modify `src/aegnt-manager.ts` to:
- Add new personality archetypes
- Implement custom decision-making logic
- Configure model selection per agent type
- Add memory and context management features

### Timeline Feature Extensions
Extend `src/timeline.ts` for:
- Custom branching strategies
- Advanced state management
- Timeline comparison features
- Export/import functionality

## Testing Strategy

### Test Structure
```
tests/
├── basic.test.ts           # Basic server functionality
├── scenario-engine.test.ts # Scenario creation and management
└── (additional test files)
```

### Test Commands
```bash
bun test                    # Run all tests
bun test --watch           # Watch mode for development
bun test specific.test.ts   # Run specific test file
```

## Deployment Considerations

### Production Build
```bash
# Build React frontend
bun run build:web

# Start production server
bun run start
```

### Docker Support
- Dockerfile included for containerized deployment
- Supports both development and production modes
- Database persistence through volume mounts

### Performance Targets
- Scenario creation: < 10ms
- Agent decisions: < 50ms
- Timeline branching: < 25ms
- WebSocket latency: < 5ms
- Memory usage: < 200MB baseline

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3005/5174 are available
2. **Bun installation**: Ensure Bun is installed (`curl -fsSL https://bun.sh/install | bash`)
3. **Database permissions**: Verify write access to `data/` directory
4. **WebSocket connections**: Check firewall settings for development

### Development Workflow
1. Always start backend (`bun run dev`) before frontend
2. Use legacy interface for rapid testing/demos
3. Use React interface for advanced features and development
4. Check console logs for detailed error information

## Future Roadmap

### Planned Features
- Claude Desktop integration for enhanced AI capabilities
- MCP tool ecosystem integration (5000+ tools via Smithery)
- Advanced 3D visualization with temporal analytics
- Scenario marketplace and community features
- Enterprise deployment with multi-tenancy

### Architecture Evolution
- Migration to full React-based interface
- Advanced agent swarm intelligence
- Real-time collaboration features
- Performance analytics and optimization tools
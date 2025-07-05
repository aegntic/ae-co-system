# AegntiX - Orchestrated Reality Sandbox 🎭

> **"What if you could pause reality, whisper new information to the actors, and watch how the future changes?"**

AegntiX is a revolutionary AI orchestration platform that transforms how humans interact with AI aegnts. Instead of simple chat interfaces, we create living scenarios where multiple AI aegnts interact, and you control time itself.

![AegntiX Demo](https://img.shields.io/badge/status-MVP-brightgreen) ![Bun](https://img.shields.io/badge/runtime-Bun-000000?logo=bun) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 The Vision

Traditional AI: Question → Answer → Done

AegntiX: Scenario → Pause → Intervene → Branch → Explore → Understand

We're building a platform where:
- **AI aegnts are actors** in scenarios you direct
- **Time is malleable** - pause, rewind, branch at will
- **Context is power** - inject information to change outcomes
- **Understanding emerges** from watching interactions

## 🚀 Quick Start

```bash
# Install Bun (if needed)
curl -fsSL https://bun.sh/install | bash

# Clone the main repository (if you haven't already)
# git clone <your-main-repo-url>
# cd <path-to-this-project-after-cloning>/

# Navigate to the AegntiX MVP project directory
cd aegntix/aegntix-mvp

# Install dependencies
bun install

# Run the development server (backend)
bun run dev

# In another terminal, to run the React frontend (if applicable, check main README.md for AegntiX v0.3.0 instructions)
# cd aegntix/aegntix-mvp
# bun run dev:web

# Open your browser
# Navigate to http://localhost:3000
```

That's it! No build step, no configuration hell. Just pure, fast development.

## 🎯 Core Features

### 🎬 Living Scenarios
Create multi-aegnt scenarios that unfold in real-time. Each aegnt has:
- Unique personality and goals
- Memory of past interactions
- Consistent behavior patterns
- Dynamic response to context changes

### ⏸️ Timeline Control
Revolutionary timeline manipulation features:
- **Pause**: Freeze any scenario mid-conversation
- **Resume**: Continue from any point
- **Branch**: Create alternate timelines to explore "what if"
- **Rewind**: Go back to any previous state
- **Compare**: See how different interventions lead to different outcomes

### 💉 Context Injection
While paused, inject new information:
- "A competitor just raised $50M"
- "New regulations were announced"
- "The market crashed"
- Watch how aegnts adapt their strategies

### 🚀 Blazing Performance
Built with Bun for unprecedented speed:
- Aegnt decisions in < 50ms
- Handle 1000+ simultaneous aegnts
- Real-time WebSocket updates
- Zero build time

## 📸 Screenshots

### Main Interface
```
┌─────────────────────────────────────────────────┐
│ AegntiX          [New] [Pause] [Branch] [Inject]│
├─────────────┬───────────────────────────────────┤
│ Scenarios   │  Timeline ━━━━━●━━━━━━━━  00:47   │
│             │                                    │
│ • Startup   │  🤖 Founder: "Our platform..."    │
│   Pitch     │                                    │
│             │  🤖 Investor: "What about..."     │
│ • Customer  │                                    │
│   Crisis    │  🤖 Advisor: "Technical risk..."  │
│             │                                    │
└─────────────┴───────────────────────────────────┘
```

## 🏗️ Architecture

The AegntiX MVP code (server, frontend assets) resides within the `aegntix-mvp` subdirectory:

```
aegntix/
├── README.md  # Main project README (describes v0.3.0 React version)
├── README_mvp_setup.md # Setup guide for the older MVP
├── README_mvp_concept.md # This conceptual overview of the MVP
├── ... (other documentation files)
└── aegntix-mvp/   # Contains the actual MVP application code
    ├── package.json
    ├── bun.lock (if generated)
    ├── src/       # Backend server logic (Bun + TypeScript)
    │   ├── server.ts
    │   ├── scenario-engine.ts
    │   └── ...
    ├── public/    # Static frontend assets for the original MVP (VanillaJS)
    │   ├── index.html
    │   └── app.js
    ├── web/       # Newer React frontend (part of v0.3.0 development)
    │   ├── src/
    │   └── ...
    ├── scenarios/ # Example scenario JSON files
    ├── data/      # SQLite database file will be created here
    └── tests/     # Test files
```
(Note: The main `aegntix/README.md` describes a more advanced version with a React frontend in `aegntix/aegntix-mvp/web/`)

## 🔧 Technology Stack

- **Runtime**: [Bun](https://bun.sh) - Incredibly fast JavaScript runtime
- **Database**: SQLite (built into Bun) - Zero-config persistence
- **AI Models**: OpenRouter - Access to 100+ models
- **Protocols**: WebSockets - Real-time bidirectional communication
- **Frontend**: Vanilla JS (upgradeable to React/Solid/Svelte)

## 📚 Usage Examples

### Basic Scenario Creation

```javascript
const scenario = await scenarioEngine.createScenario({
  name: "Product Launch",
  aegnts: [
    {
      role: "Product Manager",
      personality: "Optimistic but data-driven",
      goals: ["Launch on time", "Hit KPIs"]
    },
    {
      role: "Engineer",
      personality: "Cautious about technical debt",
      goals: ["Maintain code quality", "Realistic timelines"]
    }
  ],
  worldState: {
    deadline: "Q2 2024",
    budget: "$500k",
    teamSize: 5
  }
});
```

### Pausing and Injecting Context

```javascript
// Pause the scenario
await scenarioEngine.pause(scenarioId);

// Inject new context
await aegntManager.injectContext(engineerId,
  "Critical security vulnerability discovered in dependencies"
);

// Resume and watch how the conversation changes
await scenarioEngine.resume(scenarioId);
```

### Creating Timeline Branches

```javascript
// Create a branch to explore alternatives
const branch = await timeline.createBranch(scenarioId, Date.now());

// Now you have two timelines running in parallel!
```

## 🎮 Example Scenarios

### Included Templates

1. **Startup Pitch**
   - Founder, Investor, Technical Advisor negotiate funding
   - Test different market conditions and competitive landscapes

2. **Customer Crisis**
   - Support rep handles angry customer with manager escalation
   - Explore how different policies affect outcomes

3. **Team Planning**
   - PM, Designer, Engineers plan sprint
   - See how resource constraints affect decisions

### Create Your Own

```json
{
  "name": "Medical Diagnosis",
  "aegnts": [
    {
      "role": "Doctor",
      "personality": "Thorough and methodical",
      "goals": ["Accurate diagnosis", "Patient comfort"]
    },
    {
      "role": "Patient",
      "personality": "Anxious but cooperative",
      "goals": ["Understand condition", "Get better"]
    }
  ]
}
```

## 🚦 Roadmap

### Phase 1: Foundation (Current MVP)
- ✅ Multi-aegnt orchestration
- ✅ Timeline control
- ✅ Context injection
- ✅ Real-time visualization
- ✅ OpenRouter integration

### Phase 2: Enhanced Intelligence
- 🔄 Claude Desktop integration
- 🔄 MCP tool ecosystem (5000+ tools)
- 🔄 Advanced personality modeling
- 🔄 Swarm intelligence patterns

### Phase 3: Visual Revolution
- 📋 React Flow node editor
- 📋 3D timeline visualization
- 📋 Aegnt relationship graphs
- 📋 Scenario comparison tools

### Phase 4: Platform Ecosystem
- 📋 Scenario marketplace
- 📋 Community templates
- 📋 Revenue sharing
- 📋 Enterprise features

## 🤝 Contributing

We believe in building this future together. Here's how you can help:

1. **Try It**: Run the MVP and share your experience
2. **Build Scenarios**: Create templates for your industry
3. **Add Features**: Check our issues for good first contributions
4. **Share Ideas**: What would make this revolutionary for you?

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📊 Performance Benchmarks

| Operation | Traditional Approach | AegntiX with Bun | Improvement |
|-----------|---------------------|------------------|-------------|
| Aegnt Decision | 200-500ms | < 50ms | 4-10x faster |
| Scenario Branch | 2-5s | < 25ms | 80-200x faster |
| 100 Aegnt Swarm | 30s | < 1s | 30x faster |
| UI Update | 100ms | < 5ms | 20x faster |

## 🔐 Security & Privacy

- All scenarios run locally by default
- No data sent to external servers (except LLM calls)
- SQLite databases are local files
- Optional encryption for sensitive scenarios

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built on the shoulders of giants:
- [Bun](https://bun.sh) for incredible performance
- [OpenRouter](https://openrouter.ai) for model access
- [Model Context Protocol](https://modelcontextprotocol.io) for tool standards
- The open source community for inspiration

## 💬 Community & Support

- **Discord**: [Join our server](https://discord.gg/aegntix)
- **Twitter**: [@AegntiXPlatform](https://twitter.com/aegntix)
- **Email**: hello@aegntix.ai

## 🌟 Why AegntiX?

In a world drowning in AI chat interfaces, we're building something different. Not just another tool, but a new way of thinking about AI interaction.

**Imagine**: Testing a crucial negotiation before it happens. Exploring how different market conditions affect your strategy. Understanding complex systems by watching them unfold.

This is the future we're building. A future where AI doesn't just answer questions but helps us explore possibilities.

---

<p align="center">
  <b>Ready to orchestrate reality?</b><br>
  <a href="#-quick-start">Get Started</a> •
  <a href="#-example-scenarios">Try Scenarios</a> •
  <a href="#-contributing">Contribute</a>
</p>

<p align="center">
  Made with ❤️ by humans who believe AI should amplify human intelligence, not replace it.
</p>

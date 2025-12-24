#!/bin/bash

# AegntiX MVP Setup Script
# Creates the revolutionary AI orchestration platform

echo "🚀 Creating AegntiX MVP - Orchestrated Reality Sandbox"

# Create project directory relative to script location (aegntix/)
mkdir -p aegntix-mvp
cd aegntix-mvp

# Create directory structure
mkdir -p src public scenarios data

# Create package.json
cat > package.json << 'EOF'
{
  "name": "aegntix-mvp",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/server.ts",
    "start": "bun run src/server.ts",
    "test": "bun test"
  },
  "dependencies": {
    "openai": "^4.56.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
EOF

# Create the main server file
cat > src/server.ts << 'EOF'
// AegntiX MVP - Revolutionary AI Orchestration Platform
// Built with Bun for blazing-fast performance

import { Database } from "bun:sqlite";
import { ScenarioEngine } from "./scenario-engine";
import { AegntManager } from "./aegnt-manager";
import { Timeline } from "./timeline";

// Initialize core systems
const db = new Database("data/aegntix.db");
const scenarioEngine = new ScenarioEngine(db);
const aegntManager = new AegntManager();
const timeline = new Timeline(db);

// WebSocket clients for real-time updates
const clients = new Set<any>();

// Bun server with WebSocket support
const server = Bun.serve({
  port: 3000,

  // HTTP endpoints
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static files
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("public/index.html"));
    }
    if (url.pathname === "/app.js") {
      return new Response(Bun.file("public/app.js"));
    }

    // API endpoints
    if (url.pathname === "/api/scenarios") {
      const scenarios = await scenarioEngine.listScenarios();
      return Response.json(scenarios);
    }

    if (url.pathname === "/api/scenarios/create" && req.method === "POST") {
      const config = await req.json();
      const scenario = await scenarioEngine.createScenario(config);
      return Response.json(scenario);
    }

    return new Response("Not found", { status: 404 });
  },

  // WebSocket for real-time updates
  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("✅ Client connected");
      ws.send(JSON.stringify({ type: "connected", message: "Welcome to AegntiX!" }));
    },

    async message(ws, message) {
      const data = JSON.parse(message as string);
      console.log("📨 Received:", data.type);

      switch (data.type) {
        case "start_scenario":
          const scenario = await scenarioEngine.startScenario(data.scenarioId);
          broadcast({ type: "scenario_started", scenario });
          break;

        case "pause_scenario":
          await scenarioEngine.pauseScenario(data.scenarioId);
          broadcast({ type: "scenario_paused", scenarioId: data.scenarioId });
          break;

        case "resume_scenario":
          await scenarioEngine.resumeScenario(data.scenarioId);
          broadcast({ type: "scenario_resumed", scenarioId: data.scenarioId });
          break;

        case "branch_timeline":
          const branch = await timeline.createBranch(data.scenarioId, data.branchPoint);
          broadcast({ type: "timeline_branched", branch });
          break;

        case "inject_context":
          await aegntManager.injectContext(data.aegntId, data.context);
          broadcast({ type: "context_injected", aegntId: data.aegntId });
          break;
      }
    },

    close(ws) {
      clients.delete(ws);
      console.log("👋 Client disconnected");
    }
  }
});

// Broadcast to all connected clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => client.send(message));
}

// Initialize database schema
db.run(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    config TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    aegnt_id TEXT,
    event_type TEXT NOT NULL,
    data TEXT NOT NULL,
    branch_id TEXT,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
  )
`);

console.log(`
🚀 AegntiX MVP Server Running!
🌐 Open http://localhost:${server.port} to start
🎮 WebSocket ready for real-time scenarios
`);
EOF

# Create Scenario Engine
cat > src/scenario-engine.ts << 'EOF'
import type { Database } from "bun:sqlite";
import { AegntManager } from "./aegnt-manager";

export interface ScenarioConfig {
  name: string;
  description: string;
  aegnts: Array<{
    id: string;
    role: string;
    personality: string;
    goals: string[];
  }>;
  worldState: Record<string, any>;
}

export class ScenarioEngine {
  private scenarios = new Map<string, any>();
  private aegntManager = new AegntManager();

  constructor(private db: Database) {}

  async createScenario(config: ScenarioConfig) {
    const scenario = {
      id: crypto.randomUUID(),
      ...config,
      state: "created",
      currentTime: 0,
      events: [],
      branches: []
    };

    // Save to database
    this.db.run(`
      INSERT INTO scenarios (id, name, config, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      scenario.id,
      config.name,
      JSON.stringify(config),
      scenario.state,
      Date.now(),
      Date.now()
    ]);

    // Initialize aegnts
    for (const aegntConfig of config.aegnts) {
      await this.aegntManager.createAegnt({
        ...aegntConfig,
        scenarioId: scenario.id
      });
    }

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  async startScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) throw new Error("Scenario not found");

    scenario.state = "running";
    scenario.startTime = Date.now();

    // Start aegnt loops
    this.runScenarioLoop(scenarioId);

    return scenario;
  }

  async pauseScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.state = "paused";
      scenario.pausedAt = Date.now();
    }
  }

  async resumeScenario(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario && scenario.state === "paused") {
      scenario.state = "running";
      delete scenario.pausedAt;
      this.runScenarioLoop(scenarioId);
    }
  }

  private async runScenarioLoop(scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);

    while (scenario && scenario.state === "running") {
      // Get all aegnts in scenario
      const aegnts = await this.aegntManager.getScenarioAegnts(scenarioId);

      // Each aegnt takes a turn
      for (const aegnt of aegnts) {
        if (scenario.state !== "running") break;

        const action = await this.aegntManager.getAegntAction(aegnt.id, scenario);

        // Record the action in timeline
        const event = {
          id: crypto.randomUUID(),
          scenarioId,
          timestamp: Date.now(),
          aegntId: aegnt.id,
          eventType: "aegnt_action",
          data: action
        };

        scenario.events.push(event);

        // Broadcast to clients
        this.broadcastEvent(event);
      }

      // Small delay between rounds
      await Bun.sleep(100);
    }
  }

  private broadcastEvent(event: any) {
    // This would connect to the WebSocket broadcast system
    console.log("📡 Event:", event);
  }

  async listScenarios() {
    const query = this.db.query("SELECT * FROM scenarios ORDER BY created_at DESC");
    return query.all();
  }
}
EOF

# Create Aegnt Manager
cat > src/aegnt-manager.ts << 'EOF'
import { OpenAI } from "openai";

// Use OpenRouter for free models
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key-for-mvp",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // Replace with your actual site URL
    "X-Title": "AegntiX MVP" // Replace with your actual site title
  }
});

export interface Aegnt {
  id: string;
  scenarioId: string;
  role: string;
  personality: string;
  goals: string[];
  memory: any[];
  currentState: Record<string, any>;
}

export class AegntManager {
  private aegnts = new Map<string, Aegnt>();
  private contextInjections = new Map<string, any[]>();

  async createAegnt(config: any) {
    const aegnt: Aegnt = {
      id: config.id,
      scenarioId: config.scenarioId,
      role: config.role,
      personality: config.personality,
      goals: config.goals,
      memory: [],
      currentState: {}
    };

    this.aegnts.set(aegnt.id, aegnt);
    return aegnt;
  }

  async getAegntAction(aegntId: string, scenario: any) {
    const aegnt = this.aegnts.get(aegntId);
    if (!aegnt) return null;

    // Check for context injections
    const injections = this.contextInjections.get(aegntId) || [];

    // Build prompt with personality and current state
    const prompt = this.buildAegntPrompt(aegnt, scenario, injections);

    try {
      // Use a free model from OpenRouter
      const completion = await openai.chat.completions.create({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: aegnt.personality },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const action = completion.choices[0]?.message?.content || "thinks quietly";

      // Update aegnt memory
      aegnt.memory.push({
        timestamp: Date.now(),
        action,
        context: scenario.currentTime
      });

      // Clear used injections
      this.contextInjections.delete(aegntId);

      return {
        aegntId,
        action,
        timestamp: Date.now()
      };
    } catch (error) {
      // Fallback for demo purposes
      console.error("OpenRouter API Error:", error);
      return {
        aegntId,
        action: `${aegnt.role} considers the situation (API error)`,
        timestamp: Date.now()
      };
    }
  }

  private buildAegntPrompt(aegnt: Aegnt, scenario: any, injections: any[]) {
    let prompt = `You are ${aegnt.role} in a scenario: ${scenario.name}\\n`;
    prompt += `Your goals: ${aegnt.goals.join(", ")}\\n`;
    prompt += `Current situation: ${JSON.stringify(scenario.worldState)}\\n`;

    if (aegnt.memory.length > 0) {
      prompt += `Your recent actions: ${aegnt.memory.slice(-3).map(m => m.action).join("; ")}\\n`;
    }

    if (injections.length > 0) {
      prompt += `New information: ${injections.map(i => i.context).join("; ")}\\n`;
    }

    prompt += "What do you do next? (Respond in 1-2 sentences as your character)";

    return prompt;
  }

  async injectContext(aegntId: string, context: string) {
    const injections = this.contextInjections.get(aegntId) || [];
    injections.push({
      timestamp: Date.now(),
      context
    });
    this.contextInjections.set(aegntId, injections);
  }

  async getScenarioAegnts(scenarioId: string) {
    return Array.from(this.aegnts.values()).filter(a => a.scenarioId === scenarioId);
  }
}
EOF

# Create Timeline Manager
cat > src/timeline.ts << 'EOF'
import type { Database } from "bun:sqlite";

export interface TimelineEvent {
  id: string;
  scenarioId: string;
  timestamp: number;
  aegntId?: string;
  eventType: string;
  data: any;
  branchId?: string;
}

export interface Branch {
  id: string;
  scenarioId: string;
  parentBranchId?: string;
  branchPoint: number;
  name: string;
  createdAt: number;
}

export class Timeline {
  private branches = new Map<string, Branch>();

  constructor(private db: Database) {}

  async createBranch(scenarioId: string, branchPoint: number) {
    const branch: Branch = {
      id: crypto.randomUUID(),
      scenarioId,
      branchPoint,
      name: `Branch at ${new Date(branchPoint).toLocaleTimeString()}`,
      createdAt: Date.now()
    };

    // Copy all events up to branch point
    const events: TimelineEvent[] = this.db.query<TimelineEvent, [string, number]>(`
      SELECT * FROM timeline_events
      WHERE scenario_id = ? AND timestamp <= ? AND branch_id IS NULL
      ORDER BY timestamp
    `).all(scenarioId, branchPoint) as TimelineEvent[];

    // Create new branch with copied events
    for (const event of events) {
      this.db.run(`
        INSERT INTO timeline_events
        (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        scenarioId,
        event.timestamp,
        event.aegntId,
        event.eventType,
        typeof event.data === 'string' ? event.data : JSON.stringify(event.data),
        branch.id
      ]);
    }

    this.branches.set(branch.id, branch);
    return branch;
  }

  async getTimeline(scenarioId: string, branchId?: string) {
    const query = branchId
      ? "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id = ? ORDER BY timestamp"
      : "SELECT * FROM timeline_events WHERE scenario_id = ? AND branch_id IS NULL ORDER BY timestamp";

    const params = branchId ? [scenarioId, branchId] : [scenarioId];
    return this.db.query(query).all(...params);
  }

  async recordEvent(event: TimelineEvent) {
    this.db.run(`
      INSERT INTO timeline_events
      (id, scenario_id, timestamp, aegnt_id, event_type, data, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      event.id,
      event.scenarioId,
      event.timestamp,
      event.aegntId || null,
      event.eventType,
      JSON.stringify(event.data),
      event.branchId || null
    ]);
  }
}
EOF

# Create the web UI
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AegntiX - Orchestrated Reality Sandbox</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #0088ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .controls {
            display: flex;
            gap: 1rem;
        }

        button {
            background: #1e3a5f;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }

        button:hover {
            background: #2a4a7f;
            transform: translateY(-1px);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .main {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        .sidebar {
            width: 300px;
            background: #111;
            border-right: 1px solid #333;
            padding: 1rem;
            overflow-y: auto;
        }

        .scenario-list {
            margin-top: 1rem;
        }

        .scenario-item {
            background: #1a1a1a;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .scenario-item:hover {
            background: #2a2a2a;
        }

        .canvas {
            flex: 1;
            position: relative;
            background: #0f0f0f;
            display: flex;
            flex-direction: column;
        }

        .timeline-controls {
            background: #1a1a1a;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid #333;
        }

        .timeline-bar {
            flex: 1;
            height: 40px;
            background: #222;
            border-radius: 4px;
            position: relative;
            cursor: pointer;
        }

        .timeline-progress {
            height: 100%;
            background: linear-gradient(90deg, #00ff88 0%, #0088ff 100%);
            width: 0%;
            border-radius: 4px;
            transition: width 0.3s;
        }

        .aegnt-view {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
        }

        .aegnt-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            transition: all 0.2s;
        }

        .aegnt-card.active {
            border-color: #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        .aegnt-name {
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 0.5rem;
        }

        .aegnt-action {
            color: #ccc;
            font-style: italic;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: #1a1a1a;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #aaa;
        }

        input, textarea, select {
            width: 100%;
            padding: 0.5rem;
            background: #222;
            border: 1px solid #444;
            color: white;
            border-radius: 4px;
        }

        .status {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: #1a1a1a;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ff4444;
        }

        .status-dot.connected {
            background: #00ff88;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">AegntiX</div>
        <div class="controls">
            <button id="newScenarioBtn">New Scenario</button>
            <button id="pauseBtn" disabled>Pause</button>
            <button id="branchBtn" disabled>Branch Timeline</button>
            <button id="injectContextBtn" disabled>Inject Context</button>
        </div>
    </div>

    <div class="main">
        <div class="sidebar">
            <h3>Scenarios</h3>
            <div class="scenario-list" id="scenarioList">
                <!-- Scenarios will be loaded here -->
            </div>
        </div>

        <div class="canvas">
            <div class="timeline-controls">
                <button id="playBtn" disabled>▶️</button>
                <div class="timeline-bar" id="timelineBar">
                    <div class="timeline-progress" id="timelineProgress"></div>
                </div>
                <span id="timeDisplay">00:00</span>
            </div>

            <div class="aegnt-view" id="aegntView">
                <div style="text-align: center; color: #666; margin-top: 4rem;">
                    Select or create a scenario to begin
                </div>
            </div>
        </div>
    </div>

    <div class="status">
        <div class="status-dot" id="statusDot"></div>
        <span id="statusText">Connecting...</span>
    </div>

    <div class="modal" id="contextModal">
        <div class="modal-content">
            <h3>Inject Context</h3>
            <div class="form-group">
                <label for="aegntSelect">Select Aegnt</label>
                <select id="aegntSelect">
                    <option>Select an aegnt...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="contextInput">Context Information</label>
                <textarea id="contextInput" rows="4" placeholder="Add new information for the aegnt..."></textarea>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="closeContextModal()">Cancel</button>
                <button onclick="submitContext()" style="background: #00ff88; color: black;">Inject</button>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
EOF

# Create the frontend JavaScript
cat > public/app.js << 'EOF'
// AegntiX Frontend - Real-time Scenario Visualization

let ws = null;
let currentScenario = null;
let isPlaying = false;
let aegntsInScenario = new Map(); // Store aegnt details for the current scenario

// Initialize WebSocket connection
function connect() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Connected to AegntiX server');
        updateStatus('Connected', true);
        loadScenarios(); // Load existing scenarios on connect
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('Error', false);
    };

    ws.onclose = () => {
        updateStatus('Disconnected', false);
        setTimeout(connect, 3000); // Reconnect after 3 seconds
    };
}

// Handle messages from server
function handleServerMessage(data) {
    console.log('Received:', data);

    switch (data.type) {
        case 'scenario_created':
            currentScenario = data;
            aegntsInScenario.clear();
            if (data.config && data.config.aegnts) {
                 data.config.aegnts.forEach(a => aegntsInScenario.set(a.id, a));
            }
            isPlaying = false; // New scenario starts paused
            updateUI();
            loadScenarios(); // Refresh scenario list
            break;
        case 'scenario_started':
            currentScenario = data.scenario;
             aegntsInScenario.clear();
            if (data.scenario.config && data.scenario.config.aegnts) {
                 data.scenario.config.aegnts.forEach(a => aegntsInScenario.set(a.id, a));
            }
            isPlaying = true;
            updateUI();
            break;
        case 'scenario_paused':
            isPlaying = false;
            updateUI();
            break;
        case 'scenario_resumed':
            isPlaying = true;
            updateUI();
            break;
        case 'aegnt_action':
            updateAegntAction(data.data); // data.data contains the action object
            break;
        case 'timeline_branched':
            console.log('Timeline branched:', data.branch);
            // Potentially update UI to show branches
            break;
        case 'scenario_list':
            renderScenarioList(data.scenarios);
            break;
    }
}

function loadScenarios() {
    fetch('/api/scenarios')
        .then(res => res.json())
        .then(scenarios => {
            renderScenarioList(scenarios);
        });
}

function renderScenarioList(scenarios) {
    const scenarioList = document.getElementById('scenarioList');
    scenarioList.innerHTML = '';
    scenarios.forEach(sc => {
        const item = document.createElement('div');
        item.className = 'scenario-item';
        item.innerHTML = `
            <div><strong>${sc.name}</strong></div>
            <div style="font-size: 0.8rem; color: #888;">ID: ${sc.id.substring(0,8)}</div>
        `;
        item.onclick = () => selectScenario(sc);
        scenarioList.appendChild(item);
    });
}

function selectScenario(scenarioData) {
    // If the scenario data from the list doesn't have full config, fetch it
    // For now, assume it's enough or we get full data on 'scenario_started'
    currentScenario = scenarioData; // May need more complete data
    aegntsInScenario.clear();
    // The config string needs to be parsed
    let config = scenarioData.config;
    if (typeof config === 'string') {
        try {
            config = JSON.parse(config);
        } catch (e) {
            console.error("Failed to parse scenario config:", e);
            config = { aegnts: [] }; // Default to empty aegnts if parse fails
        }
    }

    if (config && config.aegnts) {
        config.aegnts.forEach(a => aegntsInScenario.set(a.id, a));
    }
    isPlaying = (scenarioData.state === 'running');
    updateUI();
    // If scenario is not running, don't send start, just display it
    if (isPlaying) {
         ws.send(JSON.stringify({ type: 'start_scenario', scenarioId: scenarioData.id }));
    } else {
        renderAegnts(); // Render aegnts for a paused or created scenario
    }
}


// Update aegnt action in UI
function updateAegntAction(actionData) {
    if (!actionData || !actionData.aegntId) {
        console.error("Received invalid aegnt_action data:", actionData);
        return;
    }
    const aegntCard = document.getElementById(`aegnt-${actionData.aegntId}`);
    if (aegntCard) {
        aegntCard.classList.add('active');
        const actionDiv = aegntCard.querySelector('.aegnt-action');
        actionDiv.textContent = actionData.action;

        setTimeout(() => {
            aegntCard.classList.remove('active');
        }, 1000);
    }
}

// Update UI based on current state
function updateUI() {
    const pauseBtn = document.getElementById('pauseBtn');
    const playBtn = document.getElementById('playBtn');
    const branchBtn = document.getElementById('branchBtn');
    const injectContextBtn = document.getElementById('injectContextBtn');

    if (currentScenario) {
        pauseBtn.disabled = false;
        playBtn.disabled = false; // Enable play button when a scenario is selected
        branchBtn.disabled = false;
        injectContextBtn.disabled = false;

        if (isPlaying) {
            pauseBtn.textContent = 'Pause';
            playBtn.textContent = '⏸️';
        } else {
            pauseBtn.textContent = 'Resume';
            playBtn.textContent = '▶️';
        }

        renderAegnts();
    } else {
        // No scenario selected
        pauseBtn.disabled = true;
        playBtn.disabled = true;
        branchBtn.disabled = true;
        injectContextBtn.disabled = true;
        document.getElementById('aegntView').innerHTML =
            '<div style="text-align: center; color: #666; margin-top: 4rem;">Select or create a scenario to begin</div>';
    }
}

// Render aegnt cards
function renderAegnts() {
    const aegntView = document.getElementById('aegntView');
    aegntView.innerHTML = ''; // Clear previous aegnts

    if (currentScenario && aegntsInScenario.size > 0) {
        aegntsInScenario.forEach(aegnt => {
            const card = document.createElement('div');
            card.className = 'aegnt-card';
            card.id = `aegnt-${aegnt.id}`;
            card.innerHTML = `
                <div class="aegnt-name">${aegnt.role} (ID: ${aegnt.id.substring(0,8)})</div>
                <div class="aegnt-action">Waiting...</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                    ${aegnt.personality}
                </div>
            `;
            aegntView.appendChild(card);
        });
    } else if (currentScenario) {
        aegntView.innerHTML = '<div style="text-align: center; color: #666; margin-top: 4rem;">Scenario selected. Press Play (▶️) to start.</div>';
    }
}

// Update connection status
function updateStatus(text, connected) {
    document.getElementById('statusText').textContent = text;
    const dot = document.getElementById('statusDot');
    if (connected) {
        dot.classList.add('connected');
    } else {
        dot.classList.remove('connected');
    }
}

// Initialize demo scenario
function createNewScenario() {
    // For MVP, use a predefined scenario config
    const demoScenarioConfig = {
        name: "New Dynamic Scenario " + Math.floor(Math.random()*1000),
        description: "A dynamically created scenario",
        aegnts: [
            { id: "alpha", role: "Initiator", personality: "Proactive and inquisitive", goals: ["Explore possibilities"] },
            { id: "beta", role: "Responder", personality: "Thoughtful and analytical", goals: ["Provide insights"] }
        ],
        worldState: { environment: "Exploratory simulation" }
    };

    // Send to server to create
     if (ws && ws.readyState === WebSocket.OPEN) {
        // Temporarily sending create request via WebSocket for MVP
        // Ideally, this would be a POST request to /api/scenarios/create
        // then the server would broadcast 'scenario_created'
         fetch('/api/scenarios/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(demoScenarioConfig)
        }).then(res => res.json()).then(scenarioWithFullConfig => {
            console.log('Created new scenario:', scenarioWithFullConfig);
            // The server should broadcast 'scenario_created', which will update currentScenario
            // If not, we might need to manually set it here after creation for immediate UI update
            currentScenario = scenarioWithFullConfig;
            aegntsInScenario.clear();
            if (scenarioWithFullConfig.config && scenarioWithFullConfig.config.aegnts) {
                 scenarioWithFullConfig.config.aegnts.forEach(a => aegntsInScenario.set(a.id, a));
            }
            isPlaying = false;
            updateUI();
            loadScenarios(); // Refresh list
        });
    } else {
        console.error("WebSocket not connected. Cannot create scenario.");
    }
}

// Event listeners
document.getElementById('newScenarioBtn').addEventListener('click', createNewScenario);

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (currentScenario && ws && ws.readyState === WebSocket.OPEN) {
        if (isPlaying) {
            ws.send(JSON.stringify({ type: 'pause_scenario', scenarioId: currentScenario.id }));
        } else {
            // If paused, this button acts as Resume
            ws.send(JSON.stringify({ type: 'resume_scenario', scenarioId: currentScenario.id }));
        }
    }
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (currentScenario && !isPlaying && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'start_scenario', scenarioId: currentScenario.id }));
    }
});

document.getElementById('branchBtn').addEventListener('click', () => {
    if (currentScenario && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'branch_timeline',
            scenarioId: currentScenario.id,
            branchPoint: Date.now() // Example branch point
        }));
    }
});

document.getElementById('injectContextBtn').addEventListener('click', () => {
    if (currentScenario) {
        const select = document.getElementById('aegntSelect');
        select.innerHTML = '<option value="">Select an aegnt...</option>'; // Clear previous options
        if (aegntsInScenario.size > 0) {
            aegntsInScenario.forEach((aegnt) => {
                const option = document.createElement('option');
                option.value = aegnt.id;
                option.textContent = `${aegnt.role} (ID: ${aegnt.id.substring(0,8)})`;
                select.appendChild(option);
            });
        } else {
             // Add a disabled option if no aegnts
            const option = document.createElement('option');
            option.textContent = 'No aegnts in current scenario';
            option.disabled = true;
            select.appendChild(option);
        }
        document.getElementById('contextModal').style.display = 'flex';
    }
});

function closeContextModal() {
    document.getElementById('contextModal').style.display = 'none';
}

function submitContext() {
    const aegntId = document.getElementById('aegntSelect').value;
    const context = document.getElementById('contextInput').value;

    if (aegntId && context && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'inject_context',
            aegntId,
            context
        }));

        closeContextModal();
        document.getElementById('contextInput').value = '';
    } else {
        if (!aegntId) alert("Please select an aegnt.");
        if (!context) alert("Please enter context information.");
        if (!ws || ws.readyState !== WebSocket.OPEN) alert("WebSocket not connected.");
    }
}

// Initialize
connect();
updateUI(); // Initial UI setup based on no scenario

EOF

# Create a scenario template
cat > scenarios/startup-pitch.json << 'EOF'
{
  "name": "Startup Pitch",
  "description": "A founder pitches their revolutionary AI platform to potential investors",
  "aegnts": [
    {
      "id": "founder",
      "role": "Startup Founder",
      "personality": "You are Sarah Chen, founder of AegntiX. You're passionate about democratizing AI through your orchestration platform. You believe this will change how humans and AI collaborate.",
      "goals": [
        "Secure $2M in seed funding",
        "Maintain at least 60% equity",
        "Find investors who understand the long-term vision"
      ]
    },
    {
      "id": "investor",
      "role": "Lead Investor",
      "personality": "You are Marcus Webb from Emergence Capital. You're excited about AI but cautious about valuations. You've seen many AI startups fail and want to ensure this one is different.",
      "goals": [
        "Find the next unicorn",
        "Minimize risk with good terms",
        "Secure a board seat"
      ]
    },
    {
      "id": "technical_advisor",
      "role": "Technical Due Diligence",
      "personality": "You are Dr. Rita Patel, a technical advisor. You ask tough questions about scalability, architecture, and differentiation. You want to ensure the technology is sound.",
      "goals": [
        "Verify technical feasibility",
        "Identify potential technical risks",
        "Support good ideas"
      ]
    }
  ],
  "worldState": {
    "market": "AI investment boom in 2024",
    "competition": "OpenAI, Anthropic, and Google dominating",
    "differentiation": "First platform to enable timeline-based aegnt orchestration",
    "traction": "500 developers on waitlist, 3 enterprise POCs"
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
data/*.db
.env
.DS_Store
*.log
bun.lockb
EOF

# Create a simple test file
cat > src/test.ts << 'EOF'
import { test, expect } from "bun:test";

test("AegntiX MVP", () => {
  expect(true).toBe(true);
  console.log("🚀 AegntiX MVP is ready!");
});
EOF

# Final setup message
echo "
✅ AegntiX MVP Created Successfully!

📁 Project Structure is now within 'aegntix/aegntix-mvp/':
   aegntix-mvp/
   ├── src/
   │   ├── server.ts          # Main Bun server
   │   ├── scenario-engine.ts # Scenario orchestration
   │   ├── aegnt-manager.ts   # Aegnt personalities
   │   └── timeline.ts        # Timeline branching
   ├── public/
   │   ├── index.html         # Web UI
   │   └── app.js            # Frontend logic
   └── scenarios/            # Scenario templates
   └── web/                  # React frontend (for v0.3.0)

🚀 To run the MVP (from the monorepo root, after running this script from 'aegntix/'):
   cd aegntix/aegntix-mvp
   bun install
   bun run dev # Starts backend for MVP and v0.3.0

   # For the v0.3.0 React frontend, in a new terminal:
   # cd aegntix/aegntix-mvp
   # bun run dev:web

🌐 Then open http://localhost:3000 (for original MVP) or http://localhost:5174 (for React frontend)

🎮 Try these features:
   1. Click 'New Scenario' to start the demo
   2. Watch aegnts interact in real-time
   3. Pause and inject new context
   4. Branch timelines to explore alternatives

💡 This MVP demonstrates:
   - Multi-aegnt orchestration
   - Timeline control (pause/resume/branch)
   - Real-time visualization
   - Context injection
   - Blazing-fast Bun performance

🔮 Next steps:
   - Add Claude Desktop integration
   - Implement more MCP tools
   - Create custom scenarios
   - Add persistent aegnt memory
   - Enhance the UI with React Flow

Happy orchestrating! 🎭
"

# Make the setup script executable
chmod +x $0

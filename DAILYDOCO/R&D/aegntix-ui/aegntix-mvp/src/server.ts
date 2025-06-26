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
  port: 3005,
  
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

// AegntiX MVP - Revolutionary AI Orchestration Platform
// Built with Bun for blazing-fast performance

import { Database } from "bun:sqlite";
import { ScenarioEngine } from "./scenario-engine";
import { AegntManager } from "./aegnt-manager";
import { Timeline } from "./timeline";
import { logger, LogLevel } from "./logger"; // Import logger

// Initialize core systems
const db = new Database("data/aegntix.db"); // Ensure this path is correct relative to execution
logger.info("Server", "Database initialized at data/aegntix.db");

const scenarioEngine = new ScenarioEngine(db);
const aegntManager = new AegntManager(); // Assuming AegntManager does not need db directly
const timeline = new Timeline(db);

// WebSocket clients for real-time updates
const clients = new Set<any>(); // Consider using a more specific type if available

// Bun server with WebSocket support
const server = Bun.serve({
  port: 3005, // Default port, consider making it configurable via ENV

  // HTTP endpoints
  async fetch(req) {
    const url = new URL(req.url);
    logger.debug("Server", `HTTP request: ${req.method} ${url.pathname}`);

    // Serve static files from 'public' directory which is at the same level as 'src'
    // The path for Bun.file should be relative to the project root where package.json is.
    // If server.ts is in src/, then public/ is ../public/
    // However, `Bun.file` resolves paths relative to `process.cwd()`.
    // Assuming the server is run from `aegntix-mvp` directory.
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("public/index.html"));
    }
    if (url.pathname === "/app.js") {
      return new Response(Bun.file("public/app.js"));
    }

    // API endpoints
    if (url.pathname === "/api/scenarios" && req.method === "GET") {
      const scenarios = await scenarioEngine.listScenarios();
      return Response.json(scenarios);
    }

    if (url.pathname === "/api/scenarios/create" && req.method === "POST") {
      try {
        const config = await req.json();
        const scenarioResult = await scenarioEngine.createScenario(config);
        if (scenarioResult && scenarioResult.success) {
          broadcast({ type: "scenario_created", ...scenarioResult.data }); // Broadcast the created scenario data
          return Response.json(scenarioResult.data);
        } else {
          logger.error("Server", "Failed to create scenario", scenarioResult?.error);
          return new Response(JSON.stringify({ error: scenarioResult?.error || "Failed to create scenario" }), { status: 500 });
        }
      } catch (e: any) {
        logger.error("Server", "Error processing /api/scenarios/create", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }

    logger.warn("Server", `404 Not Found: ${url.pathname}`);
    return new Response("Not found", { status: 404 });
  },

  // WebSocket for real-time updates
  websocket: {
    open(ws) {
      clients.add(ws);
      logger.info("Server", "Client connected via WebSocket", { clientId: ws.remoteAddress }); // Using remoteAddress as an example ID
      ws.send(JSON.stringify({ type: "connected", message: "Welcome to AegntiX!" }));
    },

    async message(ws, message) {
      try {
        const data = JSON.parse(message as string);
        logger.info("Server", "WebSocket message received", { type: data.type, clientId: ws.remoteAddress });

        let responseData: any = null;

        switch (data.type) {
          case "start_scenario":
            const scenarioToStart = await scenarioEngine.startScenario(data.scenarioId);
            responseData = { type: "scenario_started", scenario: scenarioToStart };
            break;

          case "pause_scenario":
            await scenarioEngine.pauseScenario(data.scenarioId);
            responseData = { type: "scenario_paused", scenarioId: data.scenarioId };
            break;

          case "resume_scenario":
            await scenarioEngine.resumeScenario(data.scenarioId);
            responseData = { type: "scenario_resumed", scenarioId: data.scenarioId };
            break;

          case "branch_timeline":
            const branch = await timeline.createBranch(data.scenarioId, data.branchPoint);
            responseData = { type: "timeline_branched", branch };
            break;

          case "inject_context":
            await aegntManager.injectContext(data.aegntId, data.context);
            // This action might trigger other events; for now, just acknowledge or send specific update
            responseData = { type: "context_injected", aegntId: data.aegntId, status: "success" };
            break;
          default:
            logger.warn("Server", "Unknown WebSocket message type", { type: data.type });
            ws.send(JSON.stringify({ type: "error", message: "Unknown command" }));
            return;
        }
        if (responseData) {
            broadcast(responseData); // Broadcast relevant updates to all clients
        }

      } catch (e: any) {
        logger.error("Server", "Error processing WebSocket message", e);
        ws.send(JSON.stringify({ type: "error", message: e.message }));
      }
    },

    close(ws, code, reason) {
      clients.delete(ws);
      logger.info("Server", "Client disconnected via WebSocket", { clientId: ws.remoteAddress, code, reason });
    },
    error(ws, error) {
      logger.error("Server", "WebSocket error", { clientId: ws.remoteAddress, error });
    }
  },
  error(error: Error) {
    logger.critical("Server", "Unhandled Bun server error", error);
    return new Response("Something went wrong!", { status: 500 });
  }
});

// Broadcast to all connected clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  logger.debug("Server", "Broadcasting WebSocket message", data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) { // Check if client is still open
        client.send(message);
    }
  });
}

// Initialize database schema (idempotent)
try {
  db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      config TEXT NOT NULL, /* Store ScenarioConfig as JSON string */
      state TEXT NOT NULL, /* ScenarioState */
      created_at INTEGER NOT NULL, /* Timestamp */
      updated_at INTEGER NOT NULL, /* Timestamp */
      started_at INTEGER, /* Timestamp, nullable */
      ended_at INTEGER, /* Timestamp, nullable */
      current_time INTEGER /* Timestamp, for simulation time */
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY, /* UUID */
      scenario_id TEXT NOT NULL, /* UUID, foreign key to scenarios */
      timestamp INTEGER NOT NULL, /* Timestamp */
      aegnt_id TEXT, /* UUID, nullable */
      event_type TEXT NOT NULL, /* EventType */
      data TEXT NOT NULL, /* JSON string of event data */
      branch_id TEXT, /* UUID, nullable for main timeline */
      sequence_number INTEGER, /* For ordering, if needed */
      caused_by TEXT, /* UUID of causing event, nullable */
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    )
  `);
  logger.info("Server", "Database schema checked/initialized.");
} catch (dbError: any) {
    logger.critical("Server", "Failed to initialize database schema", dbError);
    process.exit(1); // Exit if DB schema fails
}


logger.info("Server", `AegntiX MVP Server Running on port ${server.port}!`);
console.log(`
🚀 AegntiX MVP Server Running!
🌐 Open http://localhost:${server.port} to start (if serving UI from here)
OR ensure your frontend (e.g., Vite dev server on 5174) is pointing to this backend on port ${server.port}.
🎮 WebSocket ready for real-time scenarios on ws://localhost:${server.port}
`);

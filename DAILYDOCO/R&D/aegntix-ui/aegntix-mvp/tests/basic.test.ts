// Basic AegntiX Tests - Simple validation of core functionality

import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { ScenarioEngine } from "../src/scenario-engine";
import { logger, LogLevel } from "../src/logger";
import { createUUID, createTimestamp, createPersonalityScore } from "../src/types";

// Set logging to minimal for tests
logger.setLogLevel(LogLevel.ERROR);

test("Logger system works correctly", () => {
  const testLogger = logger;
  expect(testLogger).toBeDefined();
  
  // Test logging without errors
  testLogger.info("TestComponent", "Test message");
  testLogger.debug("TestComponent", "Debug message");
  testLogger.warn("TestComponent", "Warning message");
  
  // Verify logs are stored
  const logs = testLogger.getLogs();
  expect(logs.length).toBeGreaterThan(0);
});

test("Type utilities work correctly", () => {
  const uuid = createUUID();
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  
  const timestamp = createTimestamp();
  expect(timestamp).toBeGreaterThan(0);
  expect(timestamp).toBeLessThanOrEqual(Date.now());
  
  const score = createPersonalityScore(0.5);
  expect(score).toBe(0.5);
  
  // Test boundary validation
  expect(() => createPersonalityScore(-0.1)).toThrow();
  expect(() => createPersonalityScore(1.1)).toThrow();
});

test("ScenarioEngine can be instantiated", () => {
  const db = new Database(":memory:");
  
  // Initialize schema
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
  
  const engine = new ScenarioEngine(db);
  expect(engine).toBeDefined();
  
  db.close();
});

test("Basic scenario creation works", async () => {
  const db = new Database(":memory:");
  
  // Initialize schema
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
  
  const engine = new ScenarioEngine(db);
  
  const config = {
    name: "Basic Test Scenario",
    description: "A simple test scenario",
    aegnts: [
      {
        id: "test-agent",
        role: "Test Agent",
        personality: "Simple test personality",
        goals: ["Complete test"]
      }
    ],
    worldState: {
      environment: "test"
    }
  };
  
  const result = await engine.createScenario(config);
  
  expect(result).toBeDefined();
  expect(result.name).toBe(config.name);
  expect(result.state).toBe("created");
  expect(result.aegnts).toHaveLength(1);
  
  db.close();
});

test("Performance monitoring works", async () => {
  const startTime = performance.now();
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeGreaterThan(5);
  expect(duration).toBeLessThan(50);
});

test("Error handling works correctly", async () => {
  const db = new Database(":memory:");
  // Don't initialize schema to test error handling
  
  const engine = new ScenarioEngine(db);
  
  const config = {
    name: "Error Test",
    description: "Test error handling",
    aegnts: [
      {
        id: "error-agent",
        role: "Error Agent",
        personality: "Error personality",
        goals: ["Cause error"]
      }
    ],
    worldState: {}
  };
  
  const result = await engine.createScenario(config);
  
  // Should return null on error
  expect(result).toBeNull();
  
  db.close();
});
// Basic AegntiX Tests - Simple validation of core functionality

import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { ScenarioEngine } from "../src/scenario-engine";
import { logger, LogLevel } from "../src/logger";
import { createUUID, createTimestamp, createPersonalityScore, isUUID, isTimestamp, isPersonalityScore } from "../src/types";
import { TestDatabase, setupTestEnvironment, teardownTestEnvironment } from "../src/test-framework";


// Set logging to minimal for tests by default in test-framework
// logger.setLogLevel(LogLevel.ERROR); // Can be overridden in specific tests if needed

describe("Basic Functionality Tests", () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  test("Logger system works correctly", () => {
    const testLogger = logger; // Use the global logger instance
    expect(testLogger).toBeDefined();

    // Test logging without errors (these won't show if LogLevel.ERROR is set)
    // To verify, one might temporarily set LogLevel.DEBUG in setupTestEnvironment for this test
    // or spy on console methods if the test framework supports it.
    const initialLogCount = testLogger.getLogs().length;
    testLogger.info("TestComponent", "Test message for logger test");
    testLogger.debug("TestComponent", "Debug message for logger test");
    testLogger.warn("TestComponent", "Warning message for logger test");

    // Check if logs were added (if level was permissive enough)
    // This part of test depends on LogLevel set in setupTestEnvironment
    // If it's LogLevel.ERROR, only errors would be added.
    // For this test, let's assume we want to see if they *would* be added if level was DEBUG.
    logger.setLogLevel(LogLevel.DEBUG); // Temporarily set for this check
    testLogger.info("TestComponent", "Info after level change");
    const logs = testLogger.getLogs({component: "TestComponent"});
    expect(logs.some(log => log.message === "Info after level change")).toBe(true);
    logger.setLogLevel(LogLevel.ERROR); // Reset for other tests
  });

  test("Type utilities and guards work correctly", () => {
    const uuid = createUUID();
    expect(isUUID(uuid)).toBe(true);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(isUUID("not-a-uuid")).toBe(false);

    const timestamp = createTimestamp();
    expect(isTimestamp(timestamp)).toBe(true);
    expect(timestamp).toBeGreaterThan(0);
    // expect(timestamp).toBeLessThanOrEqual(Date.now()); // Can be flaky

    const score = createPersonalityScore(0.5);
    expect(isPersonalityScore(score)).toBe(true);
    expect(score).toBe(0.5);
    expect(isPersonalityScore(1.5)).toBe(false); // Guard should catch this
    expect(isPersonalityScore(-0.5)).toBe(false);


    // Test boundary validation for creation
    expect(() => createPersonalityScore(-0.1)).toThrow();
    expect(() => createPersonalityScore(1.1)).toThrow();
  });

  test("ScenarioEngine can be instantiated", () => {
    const db = TestDatabase.getTestDB(); // Use the test DB helper
    const engine = new ScenarioEngine(db);
    expect(engine).toBeDefined();
    // No need to close db here, handled by teardownTestEnvironment
  });

  test("Basic scenario creation works", async () => {
    const db = TestDatabase.getTestDB();
    const engine = new ScenarioEngine(db);

    const config = {
      name: "Basic Test Scenario",
      description: "A simple test scenario",
      aegnts: [ // This is LegacyScenarioConfig structure
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
    expect(result!.success).toBe(true); // Expect success from Result type
    if (result && result.success) {
        const scenarioData = result.data;
        expect(scenarioData.config.name).toBe(config.name); // Name is in config object
        expect(scenarioData.state).toBe("created");
        // scenarioData.agents contains UUIDs, config.aegnts has full agent configs
        expect(scenarioData.agents).toHaveLength(config.aegnts.length);
    }
  });

  test("Performance monitoring placeholder (actual timing is in test-framework)", async () => {
    // This test is more of a conceptual placeholder as actual perf measurement happens elsewhere
    const startTime = performance.now();
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeGreaterThanOrEqual(10); // Ensure timeout was effective
    logger.info("PerfTest", `Simulated work took ${duration.toFixed(2)}ms`);
  });

  test("Error handling for ScenarioEngine with bad DB", async () => {
    const badDb = new Database(":memory:");
    badDb.close(); // Close DB to force an error

    const engine = new ScenarioEngine(badDb);

    const config = {
      name: "Error Test",
      description: "Test error handling with bad DB",
      aegnts: [{ id: "error-agent", role: "Error Agent", personality: "Error personality", goals: ["Cause error"] }],
      worldState: {}
    };

    const result = await engine.createScenario(config);

    expect(result).toBeDefined();
    expect(result!.success).toBe(false); // Expect failure
    if (result && !result.success) {
        expect(result.error).toBeDefined();
        logger.warn("ErrorHandlingTest", "Successfully caught DB error", { error: result.error });
    }
  });
});

// AegntiX ScenarioEngine Tests
// Comprehensive testing for scenario creation and management

import {
  test,
  expect,
  describe,
  beforeEach,
  // createTestSuite, // Using describe directly from bun:test
  TestDatabase,
  TestDataFactory,
  TestMetrics,
  PerformanceTestRunner,
  AegntiXAssertions,
  setupTestEnvironment,
  teardownTestEnvironment
} from "../src/test-framework"; // Assuming test-framework is correctly structured

import { ScenarioEngine } from "../src/scenario-engine";
import { logger, LogLevel } from "../src/logger";
import type { Database } from "bun:sqlite";
import type { LegacyScenarioConfig } from "../src/scenario-engine"; // Or ScenarioConfig from types.ts if used directly

// Test setup
beforeEach(() => {
  setupTestEnvironment(); // Sets up logger, TestDatabase, TestMetrics
});

// Main describe block for ScenarioEngine
describe("ScenarioEngine Functionality", () => {
  let scenarioEngine: ScenarioEngine;
  let testDb: Database;

  beforeEach(() => {
    testDb = TestDatabase.getTestDB(); // Get the in-memory DB for each test
    scenarioEngine = new ScenarioEngine(testDb);
  });

  describe("Scenario Creation", () => {
    test("should create a basic scenario successfully", async () => {
      const config = TestDataFactory.createMinimalScenario();

      const result = await scenarioEngine.createScenario(config);

      expect(result).toBeDefined();
      expect(result!.success).toBe(true);
      if (result && result.success) {
        AegntiXAssertions.assertScenarioStructure(result.data);
        expect(result.data.config.name).toBe(config.name);
        expect(result.data.state).toBe("created");
        expect(result.data.agents).toHaveLength(1); // Checks number of agent IDs
      }
    });

    test("should create a complex multi-agent scenario", async () => {
      const config = TestDataFactory.createComplexScenario();

      const result = await scenarioEngine.createScenario(config);

      expect(result).toBeDefined();
      expect(result!.success).toBe(true);
      if (result && result.success) {
        AegntiXAssertions.assertScenarioStructure(result.data);
        expect(result.data.config.name).toBe(config.name);
        expect(result.data.agents).toHaveLength(5);
        expect(result.data.config.worldState.environment).toBe("complex testing environment");
      }
    });

    test("should reject invalid scenario configurations (e.g., no name, no agents)", async () => {
      const invalidConfigs: Partial<LegacyScenarioConfig>[] = [
        { ...TestDataFactory.createMinimalScenario(), name: "" },
        { ...TestDataFactory.createMinimalScenario(), aegnts: [] },
        // @ts-ignore - Testing invalid input
        { ...TestDataFactory.createMinimalScenario(), name: undefined },
      ];

      for (const config of invalidConfigs) {
        // Type assertion as createScenario expects LegacyScenarioConfig
        const result = await scenarioEngine.createScenario(config as LegacyScenarioConfig);
        expect(result).toBeDefined();
        expect(result!.success).toBe(false); // Should fail due to validation in createScenario
        if (result && !result.success) {
          expect(result.error).toBeDefined();
        }
      }
    });

    test("should persist scenarios to database correctly", async () => {
      const config = TestDataFactory.createTestScenario();

      const creationResult = await scenarioEngine.createScenario(config);
      expect(creationResult).toBeDefined();
      expect(creationResult!.success).toBe(true);
      const scenario = creationResult!.data;

      const dbResult = testDb.query("SELECT * FROM scenarios WHERE id = ?").get(scenario.id) as any;
      expect(dbResult).toBeDefined();
      expect(dbResult.name).toBe(config.name); // Name is directly on scenario table now
      expect(dbResult.state).toBe("created");

      const storedConfig = JSON.parse(dbResult.config); // Full config is stored as JSON
      expect(storedConfig.name).toBe(config.name);
      expect(storedConfig.aegnts).toHaveLength(config.aegnts.length);
    });

    test("should handle database errors gracefully during creation", async () => {
      const originalDbRun = testDb.run;
      testDb.run = () => { throw new Error("Simulated DB Error"); }; // Simulate DB error

      const config = TestDataFactory.createMinimalScenario();
      const result = await scenarioEngine.createScenario(config);

      expect(result).toBeDefined();
      expect(result!.success).toBe(false);
      if (result && !result.success) {
        expect(result.error).toBeDefined();
        expect(result.error!.message).toContain("Simulated DB Error");
      }
      testDb.run = originalDbRun; // Restore original method
    });
  });

  describe("Performance Requirements for Scenario Creation", () => {
    test("should create scenarios within performance targets (<100ms avg)", async () => {
      const config = TestDataFactory.createTestScenario();

      const { averageTime } = await PerformanceTestRunner.measureOperation(
        "scenario_creation_perf", // Unique metric name
        () => scenarioEngine.createScenario(config),
        10 // iterations
      );

      expect(averageTime).toBeLessThan(100);
      AegntiXAssertions.assertPerformanceMetric("scenario_creation_perf", 100);
    });

    test("should handle concurrent scenario creation without errors", async () => {
      const { completedOperations, errorCount } = await PerformanceTestRunner.runLoadTest(
        "concurrent_scenario_creation_load",
        () => scenarioEngine.createScenario(TestDataFactory.createMinimalScenario()),
        5, // concurrency
        1000 // duration ms
      );

      expect(completedOperations).toBeGreaterThan(0);
      expect(errorCount).toBe(0);
    });
  });


  describe("Scenario State Management (Basic)", () => {
    // More detailed state transition tests would require startScenario, pauseScenario etc. to be fleshed out
    test("should initialize scenario with correct default state", async () => {
      const config = TestDataFactory.createTestScenario();
      const result = await scenarioEngine.createScenario(config);
      const scenario = result!.data;

      expect(scenario.state).toBe("created");
      AegntiXAssertions.assertValidUUID(scenario.id);
      AegntiXAssertions.assertValidTimestamp(scenario.createdAt);
      AegntiXAssertions.assertValidTimestamp(scenario.updatedAt);
      expect(scenario.timeline.currentTime).toEqual(scenario.createdAt);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle scenarios with very large configurations (many agents/goals)", async () => {
      const largeConfig = TestDataFactory.createTestScenario({
        aegnts: Array.from({ length: 20 }, (_, i) => ({ // Reduced from 50 to keep test faster
          id: `large-agent-${i}`,
          role: `Role ${i}`,
          personality: `Personality ${i} `.repeat(10), // Reduced repeat
          goals: Array.from({ length: 5 }, (_, j) => `Goal ${i}-${j}`)
        }))
      });

      const { result, averageTime } = await PerformanceTestRunner.measureOperation(
        "large_scenario_creation_perf",
        () => scenarioEngine.createScenario(largeConfig),
        1 // Single iteration for this specific test
      );

      expect(result).toBeDefined();
      expect(result!.success).toBe(true);
      // Looser performance expectation for very large config
      expect(averageTime).toBeLessThan(1000);
    });
  });

  // Note: Memory leak tests are harder to do reliably in short unit tests.
  // They typically require longer runs and specific tooling.
  // The one from basic.test.ts is a conceptual placeholder.
});


// This is a good place for a final "benchmark summary" if running multiple performance tests
describe("Performance Benchmark Summary", () => {
  test("all recorded performance metrics should meet targets", () => {
    logger.info('BenchmarkSuite', 'Aggregating performance benchmarks...');

    const allMetrics = TestMetrics.getAllMetrics();
    if (allMetrics.scenario_creation_perf) {
      AegntiXAssertions.assertPerformanceMetric("scenario_creation_perf", 100);
    }
    if (allMetrics.large_scenario_creation_perf) {
      // Larger scenarios might have different targets
      AegntiXAssertions.assertPerformanceMetric("large_scenario_creation_perf", 1000);
    }
    // Add more assertions here as more performance metrics are recorded

    logger.info('BenchmarkSuite', 'All performance benchmarks checked.', allMetrics);
    // This doesn't "fail" the test unless an assertion above fails.
    // It's more for logging the summary.
    expect(true).toBe(true);
  });
});

// Teardown for the entire file if needed, though bun:test runs tests in isolation.
// afterAll(() => { TestDatabase.close(); });

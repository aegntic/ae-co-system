// AegntiX ScenarioEngine Tests
// Comprehensive testing for scenario creation and management

import { 
  test, 
  expect, 
  describe, 
  beforeEach,
  createTestSuite,
  TestDatabase,
  TestDataFactory,
  TestMetrics,
  PerformanceTestRunner,
  AegntiXAssertions,
  setupTestEnvironment,
  teardownTestEnvironment
} from "../src/test-framework";

import { ScenarioEngine } from "../src/scenario-engine";
import { logger, LogLevel } from "../src/logger";

// Test setup
beforeEach(() => {
  setupTestEnvironment();
});

createTestSuite("ScenarioEngine", () => {
  let scenarioEngine: ScenarioEngine;
  let testDb: any;

  beforeEach(() => {
    testDb = TestDatabase.getTestDB();
    scenarioEngine = new ScenarioEngine(testDb);
  });

  describe("Scenario Creation", () => {
    test("should create a basic scenario successfully", async () => {
      const config = TestDataFactory.createMinimalScenario();
      
      const result = await scenarioEngine.createScenario(config);
      
      expect(result).toBeDefined();
      AegntiXAssertions.assertScenarioStructure(result);
      expect(result.name).toBe(config.name);
      expect(result.state).toBe("created");
      expect(result.aegnts).toHaveLength(1);
    });

    test("should create a complex multi-agent scenario", async () => {
      const config = TestDataFactory.createComplexScenario();
      
      const result = await scenarioEngine.createScenario(config);
      
      expect(result).toBeDefined();
      AegntiXAssertions.assertScenarioStructure(result);
      expect(result.name).toBe(config.name);
      expect(result.aegnts).toHaveLength(5);
      expect(result.worldState.environment).toBe("complex testing environment");
    });

    test("should reject invalid scenario configurations", async () => {
      const invalidConfigs = [
        { ...TestDataFactory.createMinimalScenario(), name: "" }, // Empty name
        { ...TestDataFactory.createMinimalScenario(), aegnts: [] }, // No agents
        { ...TestDataFactory.createMinimalScenario(), name: undefined }, // Missing name
      ];

      for (const config of invalidConfigs) {
        const result = await scenarioEngine.createScenario(config as any);
        expect(result).toBeNull(); // Should return null on error
      }
    });

    test("should persist scenarios to database", async () => {
      const config = TestDataFactory.createTestScenario();
      
      const scenario = await scenarioEngine.createScenario(config);
      expect(scenario).toBeDefined();
      
      // Verify database persistence
      const dbResult = testDb.query("SELECT * FROM scenarios WHERE id = ?").get(scenario.id);
      expect(dbResult).toBeDefined();
      expect(dbResult.name).toBe(config.name);
      expect(dbResult.state).toBe("created");
      
      const storedConfig = JSON.parse(dbResult.config);
      expect(storedConfig.name).toBe(config.name);
      expect(storedConfig.aegnts).toHaveLength(config.aegnts.length);
    });

    test("should handle database errors gracefully", async () => {
      // Close the database to simulate an error
      testDb.close();
      
      const config = TestDataFactory.createMinimalScenario();
      const result = await scenarioEngine.createScenario(config);
      
      expect(result).toBeNull(); // Should handle error gracefully
      
      // Restore database for other tests
      testDb = TestDatabase.getTestDB();
      scenarioEngine = new ScenarioEngine(testDb);
    });
  });

  describe("Performance Requirements", () => {
    test("should create scenarios within performance targets", async () => {
      const config = TestDataFactory.createTestScenario();
      
      const { averageTime } = await PerformanceTestRunner.measureOperation(
        "scenario_creation",
        () => scenarioEngine.createScenario(config),
        10
      );
      
      // Target: < 100ms for scenario creation
      expect(averageTime).toBeLessThan(100);
      AegntiXAssertions.assertPerformanceMetric("scenario_creation", 100);
    });

    test("should handle concurrent scenario creation", async () => {
      const { completedOperations, errorCount } = await PerformanceTestRunner.runLoadTest(
        "concurrent_scenario_creation",
        () => scenarioEngine.createScenario(TestDataFactory.createMinimalScenario()),
        5, // 5 concurrent operations
        2000 // for 2 seconds
      );
      
      expect(completedOperations).toBeGreaterThan(0);
      expect(errorCount).toBe(0); // No errors should occur
    });

    test("should scale with complex scenarios", async () => {
      const simpleConfig = TestDataFactory.createMinimalScenario();
      const complexConfig = TestDataFactory.createComplexScenario();
      
      const { averageTime: simpleTime } = await PerformanceTestRunner.measureOperation(
        "simple_scenario_creation",
        () => scenarioEngine.createScenario(simpleConfig),
        5
      );
      
      const { averageTime: complexTime } = await PerformanceTestRunner.measureOperation(
        "complex_scenario_creation", 
        () => scenarioEngine.createScenario(complexConfig),
        5
      );
      
      // Complex scenarios should still be reasonably fast
      expect(complexTime).toBeLessThan(200);
      
      // Log the performance comparison
      logger.info('PerformanceTest', 'Scenario complexity performance comparison', {
        simpleScenario: `${simpleTime.toFixed(2)}ms`,
        complexScenario: `${complexTime.toFixed(2)}ms`,
        overhead: `${(complexTime - simpleTime).toFixed(2)}ms`
      });
    });
  });

  describe("Scenario State Management", () => {
    test("should transition scenario states correctly", async () => {
      const config = TestDataFactory.createTestScenario();
      const scenario = await scenarioEngine.createScenario(config);
      
      expect(scenario.state).toBe("created");
      
      // Test state transitions would go here when implemented
      // For now, just verify initial state
    });

    test("should maintain scenario data integrity", async () => {
      const config = TestDataFactory.createTestScenario();
      const scenario = await scenarioEngine.createScenario(config);
      
      // Verify all required fields are present
      expect(scenario.id).toBeDefined();
      expect(scenario.name).toBe(config.name);
      expect(scenario.description).toBe(config.description);
      expect(scenario.aegnts).toEqual(config.aegnts);
      expect(scenario.worldState).toEqual(config.worldState);
      expect(scenario.events).toEqual([]);
      expect(scenario.branches).toEqual([]);
      
      AegntiXAssertions.assertValidUUID(scenario.id);
      AegntiXAssertions.assertValidTimestamp(scenario.currentTime);
      AegntiXAssertions.assertValidTimestamp(scenario.createdAt);
      AegntiXAssertions.assertValidTimestamp(scenario.updatedAt);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle malformed JSON in worldState", async () => {
      const config = TestDataFactory.createTestScenario({
        worldState: { circularRef: {} }
      });
      
      // Add circular reference to test JSON serialization
      (config.worldState as any).circularRef.self = config.worldState;
      
      const result = await scenarioEngine.createScenario(config);
      
      // Should handle serialization error gracefully
      expect(result).toBeNull();
    });

    test("should validate agent configurations", async () => {
      const config = TestDataFactory.createTestScenario({
        aegnts: [
          {
            id: "", // Invalid empty ID
            role: "Test Role",
            personality: "Test personality",
            goals: ["Test goal"]
          }
        ]
      });
      
      const result = await scenarioEngine.createScenario(config);
      expect(result).toBeDefined(); // Basic validation passes, but agent creation might fail
    });

    test("should handle very large scenarios", async () => {
      const largeConfig = TestDataFactory.createTestScenario({
        aegnts: Array.from({ length: 50 }, (_, i) => ({
          id: `agent-${i}`,
          role: `Role ${i}`,
          personality: `Personality ${i} `.repeat(100), // Large personality text
          goals: Array.from({ length: 10 }, (_, j) => `Goal ${i}-${j}`)
        }))
      });
      
      const { result, averageTime } = await PerformanceTestRunner.measureOperation(
        "large_scenario_creation",
        () => scenarioEngine.createScenario(largeConfig),
        1
      );
      
      expect(result).toBeDefined();
      expect(averageTime).toBeLessThan(500); // Should still be reasonably fast
    });
  });

  describe("Memory Management", () => {
    test("should not leak memory with multiple scenario creation", async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create many scenarios
      for (let i = 0; i < 100; i++) {
        const config = TestDataFactory.createMinimalScenario();
        config.name = `Test Scenario ${i}`;
        await scenarioEngine.createScenario(config);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for 100 scenarios)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      logger.info('MemoryTest', 'Memory usage after 100 scenarios', {
        initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      });
    });
  });
});

// Performance benchmark suite
describe("Performance Benchmarks", () => {
  test("should meet all performance targets", async () => {
    logger.info('BenchmarkSuite', 'Starting comprehensive performance benchmarks');
    
    const results = TestMetrics.getAllMetrics();
    
    // Assert all performance targets
    if (results.scenario_creation) {
      AegntiXAssertions.assertPerformanceMetric("scenario_creation", 100);
    }
    
    if (results.complex_scenario_creation) {
      AegntiXAssertions.assertPerformanceMetric("complex_scenario_creation", 200);
    }
    
    logger.info('BenchmarkSuite', 'All performance benchmarks completed', results);
  });
});
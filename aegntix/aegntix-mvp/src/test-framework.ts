// AegntiX Advanced Testing Framework
// Comprehensive testing for AI orchestration platform

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { logger, LogLevel } from "./logger"; // Assuming logger.ts is in the same directory
import {
  type LegacyScenarioConfig, // Using Legacy for factory, actual engine uses ScenarioConfig
  type UUID,
  createUUID,
  createTimestamp,
  createPersonalityScore // Assuming this exists in types.ts
} from "./types"; // Assuming types.ts is in the same directory

// Test utilities and helpers
export class TestDatabase {
  private static instance: Database | null = null;

  static getTestDB(): Database {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new Database(":memory:");
      TestDatabase.initializeSchema(TestDatabase.instance);
    }
    return TestDatabase.instance;
  }

  static initializeSchema(db: Database): void {
    // Adjusted to match server.ts schema for consistency
    db.run(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        started_at INTEGER,
        ended_at INTEGER,
        current_time INTEGER
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
        sequence_number INTEGER,
        caused_by TEXT,
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
      )
    `);
    logger.debug('TestDatabase', 'Test schema initialized');
  }

  static cleanup(): void {
    if (TestDatabase.instance) {
      try {
        TestDatabase.instance.run("DELETE FROM timeline_events"); // Delete referencing table first
        TestDatabase.instance.run("DELETE FROM scenarios");
        logger.debug('TestDatabase', 'Test data cleaned up');
      } catch (error: any) {
        logger.error('TestDatabase', 'Cleanup failed, reinitializing.', error);
        // Database might be closed or schema dropped, reinitialize
        TestDatabase.instance = new Database(":memory:");
        TestDatabase.initializeSchema(TestDatabase.instance);
      }
    }
  }

  static close(): void {
    if (TestDatabase.instance) {
      TestDatabase.instance.close();
      TestDatabase.instance = null;
      logger.debug('TestDatabase', 'Test database closed');
    }
  }
}

export class TestDataFactory {
  static createTestScenario(overrides: Partial<LegacyScenarioConfig> = {}): LegacyScenarioConfig {
    return {
      name: "Test Scenario " + createUUID().substring(0,8),
      description: "A test scenario for automated testing",
      aegnts: [
        {
          id: "test-agent-1-" + createUUID().substring(0,4),
          role: "Test Role 1",
          personality: "You are a test agent with predictable behavior for testing purposes.",
          goals: ["Test goal 1", "Test goal 2"]
        },
        {
          id: "test-agent-2-" + createUUID().substring(0,4),
          role: "Test Role 2",
          personality: "You are another test agent for multi-agent scenarios.",
          goals: ["Test goal 3", "Test goal 4"]
        }
      ],
      worldState: {
        environment: "test",
        timeContext: "testing phase",
        constraints: ["test constraint 1", "test constraint 2"]
      },
      ...overrides
    };
  }

  static createMinimalScenario(): LegacyScenarioConfig {
    return {
      name: "Minimal Test " + createUUID().substring(0,8),
      description: "Minimal scenario for basic testing",
      aegnts: [
        {
          id: "minimal-agent-" + createUUID().substring(0,4),
          role: "Minimal Agent",
          personality: "Simple test personality",
          goals: ["Basic goal"]
        }
      ],
      worldState: {}
    };
  }

  static createComplexScenario(): LegacyScenarioConfig {
    const agents = Array.from({ length: 5 }, (_, i) => ({
      id: `complex-agent-${i + 1}-` + createUUID().substring(0,4),
      role: `Role ${i + 1}`,
      personality: `Complex personality ${i + 1} with detailed traits and behaviors.`,
      goals: [`Goal ${i * 2 + 1}`, `Goal ${i * 2 + 2}`, `Goal ${i * 2 + 3}`]
    }));

    return {
      name: "Complex Multi-Agent Scenario " + createUUID().substring(0,8),
      description: "Complex scenario with multiple agents for performance testing",
      aegnts: agents,
      worldState: {
        environment: "complex testing environment",
        timeContext: "stress testing phase",
        constraints: Array.from({ length: 10 }, (_, i) => `constraint ${i + 1}`),
        resources: { budget: 100000, time: 180, team_size: 10 },
        externalFactors: {
          market_conditions: "volatile",
          competition: "high",
          regulatory_environment: "strict"
        }
      }
    };
  }
}

export class TestMetrics {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number): void {
    if (!TestMetrics.metrics.has(name)) {
      TestMetrics.metrics.set(name, []);
    }
    TestMetrics.metrics.get(name)!.push(value);
  }

  static getMetricStats(name: string): { min: number; max: number; avg: number; count: number } | null {
    const values = TestMetrics.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    };
  }

  static clearMetrics(): void {
    TestMetrics.metrics.clear();
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name] of TestMetrics.metrics) {
      result[name] = TestMetrics.getMetricStats(name);
    }
    return result;
  }
}

export class PerformanceTestRunner {
  static async measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
    iterations: number = 1
  ): Promise<{ result: T; averageTime: number; allTimes: number[] }> {
    const times: number[] = [];
    let lastResult!: T; // Definite assignment assertion

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      lastResult = await operation();
      const end = performance.now();
      const duration = end - start;

      times.push(duration);
      TestMetrics.recordMetric(name, duration);
    }

    const averageTime = iterations > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    logger.info('PerformanceTest', `${name} completed`, {
      iterations,
      averageTime: `${averageTime.toFixed(2)}ms`,
      minTime: iterations > 0 ? `${Math.min(...times).toFixed(2)}ms` : 'N/A',
      maxTime: iterations > 0 ? `${Math.max(...times).toFixed(2)}ms` : 'N/A'
    });

    return {
      result: lastResult!,
      averageTime,
      allTimes: times
    };
  }

  static async runLoadTest<T>(
    name: string,
    operation: () => Promise<T>,
    concurrency: number,
    duration: number = 5000 // 5 seconds
  ): Promise<{ completedOperations: number; averageTime: number; errorCount: number }> {
    const startTime = Date.now();
    const results: Array<{ success: boolean; time: number }> = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      const promise = (async () => {
        while (Date.now() - startTime < duration) {
          const operationStart = performance.now();
          try {
            await operation();
            const operationTime = performance.now() - operationStart;
            results.push({ success: true, time: operationTime });
            TestMetrics.recordMetric(`${name}_load_test`, operationTime);
          } catch (error: any) {
            results.push({ success: false, time: performance.now() - operationStart });
            logger.error('LoadTest', `Operation failed in ${name}`, error);
          }
        }
      })();
      promises.push(promise);
    }

    await Promise.all(promises);

    const successfulResults = results.filter(r => r.success);
    const averageTime = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length
      : 0;

    logger.info('LoadTest', `${name} load test completed`, {
      concurrency,
      duration: `${duration}ms`,
      completedOperations: results.length,
      successfulOperations: successfulResults.length,
      errorCount: results.length - successfulResults.length,
      averageTime: `${averageTime.toFixed(2)}ms`
    });

    return {
      completedOperations: results.length,
      averageTime,
      errorCount: results.length - successfulResults.length
    };
  }
}

// Test assertion helpers
export class AegntiXAssertions {
  static assertValidUUID(value: any, message?: string): void {
    expect(typeof value).toBe('string');
    expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  }

  static assertValidTimestamp(value: any, message?: string): void {
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThan(0);
    // Removed upper bound check against Date.now() as it can cause flaky tests if clock moves.
    // Consider checking if it's a reasonable past or current timestamp if needed.
  }

  static assertValidPersonalityScore(value: any, message?: string): void {
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  }

  static assertScenarioStructure(scenario: any): void {
    expect(scenario).toBeDefined();
    expect(scenario.id).toBeDefined();
    // In ScenarioEngine, config is stored, so name is scenario.config.name
    expect(scenario.config.name).toBeDefined();
    expect(scenario.state).toBeDefined();
    // In ScenarioEngine, agent IDs are stored in scenario.agents
    expect(scenario.agents).toBeDefined();
    expect(Array.isArray(scenario.agents)).toBe(true);

    AegntiXAssertions.assertValidUUID(scenario.id);
    AegntiXAssertions.assertValidTimestamp(scenario.createdAt || scenario.currentTime);
  }

  static assertPerformanceMetric(
    metricName: string,
    targetMs: number,
    tolerance: number = 0.2 // 20% tolerance
  ): void {
    const stats = TestMetrics.getMetricStats(metricName);
    expect(stats).toBeDefined();

    if (stats) { // Type guard
        const maxAllowed = targetMs * (1 + tolerance);
        expect(stats.avg).toBeLessThanOrEqual(maxAllowed);

        logger.info('PerformanceAssertion', `${metricName} performance check passed`, {
          average: `${stats.avg.toFixed(2)}ms`,
          target: `${targetMs}ms`,
          maxAllowed: `${maxAllowed.toFixed(2)}ms`
        });
    }
  }
}

// Global test setup and teardown
export function setupTestEnvironment(): void {
  logger.setLogLevel(LogLevel.ERROR); // Reduce noise during testing, only show errors
  TestDatabase.getTestDB(); // Initialize test database
  TestMetrics.clearMetrics();
  logger.debug('TestFramework', 'Test environment set up.');
}

export function teardownTestEnvironment(): void {
  TestDatabase.cleanup();
  // TestDatabase.close(); // Closing DB after each suite might be too much if tests are frequent
  TestMetrics.clearMetrics();
  logger.debug('TestFramework', 'Test environment torn down.');
}

// Test suite helpers
export function createTestSuite(name: string, tests: () => void): void {
  describe(name, () => {
    beforeEach(() => {
      setupTestEnvironment(); // Setup before each test in the suite
    });

    afterEach(() => {
      teardownTestEnvironment(); // Teardown after each test
    });

    tests(); // Execute the tests defined by the caller
  });
}

// Export all test utilities
export {
  test,
  expect,
  describe,
  beforeEach,
  afterEach
};

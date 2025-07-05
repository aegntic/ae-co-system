import { test, expect } from "bun:test";
import { logger, LogLevel } from "./logger";
import { setupTestEnvironment, teardownTestEnvironment } from "./test-framework";

// Example basic test using the framework
describe("Basic AegntiX Tests", () => {
  beforeEach(() => {
    setupTestEnvironment();
    // You can set a higher log level for specific tests if needed
    // logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  test("Sanity check", () => {
    logger.info("SanityTest", "Running sanity check test.");
    expect(true).toBe(true);
    logger.info("SanityTest", "Sanity check passed.");
  });

  test("Logger functionality", () => {
    // This test might be noisy if logger is not set to a high level for tests
    // Or, we can spyOn console methods if Bun's test framework supports it.
    // For now, just a simple check.
    logger.debug("LoggerTest", "This is a debug message for logger test.");
    // No direct assertion here, relies on visual inspection or more advanced mocking.
    expect(typeof logger.info).toBe('function');
  });
});

// It's good practice to indicate the main purpose of this file if it's just for example.
logger.info("TestFile", "AegntiX MVP base test file loaded. Add more specific tests.");

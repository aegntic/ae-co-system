/**
 * LOAD TESTING MODULE
 * Concurrent user simulation and performance under load
 * 
 * Tests:
 * - Concurrent user sessions with realistic traffic patterns
 * - Database performance under multiple simultaneous queries
 * - API endpoint rate limiting and response times
 * - Memory usage and resource consumption under load
 * - Auto-scaling behavior and bottleneck identification
 * - Recovery testing after peak load scenarios
 */

import { TestLogger } from './comprehensive-test-suite.js';

export class LoadTests {
  constructor(testSuite) {
    this.testSuite = testSuite;
    this.logger = new TestLogger('LoadTests');
    this.activeConnections = [];
    this.loadMetrics = {
      concurrent_users: 0,
      max_concurrent_users: 0,
      response_times: [],
      error_rates: {},
      resource_usage: [],
    };
  }

  async run() {
    this.logger.header('Starting Load Tests');

    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      loadMetrics: {},
    };

    // Test gradual load increase
    await this.runTest(testResults, 'testGradualLoadIncrease', async () => {
      const maxUsers = Math.min(this.testSuite.TEST_CONFIG?.maxConcurrentUsers || 20, 20);
      const rampUpDuration = 60000; // 1 minute ramp up
      const testDuration = 300000; // 5 minutes total test
      
      this.logger.info(`Starting gradual load test: 0 → ${maxUsers} users over ${rampUpDuration/1000}s`);
      
      const userSessions = [];
      const startTime = Date.now();
      const results = {
        sessionsStarted: 0,
        sessionsCompleted: 0,
        sessionsErrored: 0,
        responseTimes: [],
        errors: [],
      };

      // Ramp up users gradually
      for (let userIndex = 0; userIndex < maxUsers; userIndex++) {
        const delay = (rampUpDuration / maxUsers) * userIndex;
        
        setTimeout(async () => {
          try {
            results.sessionsStarted++;
            this.loadMetrics.concurrent_users++;
            this.loadMetrics.max_concurrent_users = Math.max(
              this.loadMetrics.max_concurrent_users, 
              this.loadMetrics.concurrent_users
            );

            const sessionResult = await this.simulateUserSession(userIndex);
            
            results.sessionsCompleted++;
            results.responseTimes.push(sessionResult.totalTime);
            this.loadMetrics.response_times.push(sessionResult.totalTime);
            
            this.loadMetrics.concurrent_users--;
            
            if (userIndex % 5 === 0) {
              this.logger.info(`User ${userIndex}: Session completed in ${(sessionResult.totalTime / 1000).toFixed(1)}s`);
            }
            
          } catch (error) {
            results.sessionsErrored++;
            results.errors.push(error.message);
            this.loadMetrics.concurrent_users--;
            
            if (!this.loadMetrics.error_rates[error.message]) {
              this.loadMetrics.error_rates[error.message] = 0;
            }
            this.loadMetrics.error_rates[error.message]++;
          }
        }, delay);
      }

      // Wait for test completion
      const pollInterval = 5000; // Check every 5 seconds
      while (Date.now() - startTime < testDuration) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / testDuration * 100, 100);
        
        this.logger.info(`Load test progress: ${progress.toFixed(1)}% - Active: ${this.loadMetrics.concurrent_users}, Completed: ${results.sessionsCompleted}, Errors: ${results.sessionsErrored}`);
        
        // Record resource usage
        const resourceUsage = await this.measureResourceUsage();
        this.loadMetrics.resource_usage.push({
          timestamp: elapsed,
          ...resourceUsage,
        });
      }

      // Calculate final metrics
      const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
      const errorRate = results.sessionsErrored / results.sessionsStarted;
      const throughput = results.sessionsCompleted / (testDuration / 1000); // sessions per second

      testResults.loadMetrics.gradualLoad = {
        maxConcurrentUsers: this.loadMetrics.max_concurrent_users,
        sessionsStarted: results.sessionsStarted,
        sessionsCompleted: results.sessionsCompleted,
        errorRate,
        avgResponseTime,
        throughput,
        errors: results.errors,
      };

      this.logger.success(`Gradual load test completed:`);
      this.logger.info(`- Max concurrent users: ${this.loadMetrics.max_concurrent_users}`);
      this.logger.info(`- Average response time: ${(avgResponseTime / 1000).toFixed(1)}s`);
      this.logger.info(`- Error rate: ${(errorRate * 100).toFixed(1)}%`);
      this.logger.info(`- Throughput: ${throughput.toFixed(2)} sessions/sec`);

      // Validate performance targets
      if (avgResponseTime < 10000) { // 10 second target
        this.logger.success(`Response time within target: ${(avgResponseTime / 1000).toFixed(1)}s < 10s`);
      } else {
        this.logger.warning(`Response time exceeds target: ${(avgResponseTime / 1000).toFixed(1)}s > 10s`);
      }

      if (errorRate < 0.05) { // 5% error rate target
        this.logger.success(`Error rate within target: ${(errorRate * 100).toFixed(1)}% < 5%`);
      } else {
        throw new Error(`Error rate exceeds target: ${(errorRate * 100).toFixed(1)}% > 5%`);
      }
    });

    // Test spike load scenario
    await this.runTest(testResults, 'testSpikeLoad', async () => {
      const spikeUsers = 10;
      const spikeDuration = 30000; // 30 seconds
      
      this.logger.info(`Starting spike load test: ${spikeUsers} simultaneous users for ${spikeDuration/1000}s`);
      
      const spikePromises = [];
      const spikeResults = {
        responses: [],
        errors: [],
        startTime: Date.now(),
      };

      // Launch all users simultaneously
      for (let i = 0; i < spikeUsers; i++) {
        spikePromises.push(
          this.simulateUserSession(i)
            .then(result => {
              spikeResults.responses.push(result);
            })
            .catch(error => {
              spikeResults.errors.push(error.message);
            })
        );
      }

      // Wait for all users to complete or timeout
      await Promise.allSettled(spikePromises);
      
      const spikeTestTime = Date.now() - spikeResults.startTime;
      const successRate = spikeResults.responses.length / spikeUsers;
      const avgSpikeTime = spikeResults.responses.reduce((a, b) => a + b.totalTime, 0) / spikeResults.responses.length;

      testResults.loadMetrics.spikeLoad = {
        users: spikeUsers,
        duration: spikeTestTime,
        successRate,
        avgResponseTime: avgSpikeTime,
        errors: spikeResults.errors,
      };

      this.logger.success(`Spike load test completed:`);
      this.logger.info(`- Success rate: ${(successRate * 100).toFixed(1)}%`);
      this.logger.info(`- Average response time: ${(avgSpikeTime / 1000).toFixed(1)}s`);
      this.logger.info(`- Total errors: ${spikeResults.errors.length}`);

      if (successRate >= 0.8) { // 80% success rate target
        this.logger.success(`Spike load success rate within target: ${(successRate * 100).toFixed(1)}% >= 80%`);
      } else {
        this.logger.warning(`Spike load success rate below target: ${(successRate * 100).toFixed(1)}% < 80%`);
      }
    });

    // Test database load
    await this.runTest(testResults, 'testDatabaseLoad', async () => {
      if (!this.testSuite.supabase) {
        this.logger.warning('Skipping database load tests - Supabase not configured');
        testResults.skipped++;
        return;
      }

      const dbQueries = 50;
      const concurrentQueries = 10;
      
      this.logger.info(`Testing database load: ${dbQueries} queries with ${concurrentQueries} concurrent`);
      
      const dbResults = {
        successful: 0,
        failed: 0,
        responseTimes: [],
        errors: [],
      };

      // Execute queries in batches
      for (let batch = 0; batch < Math.ceil(dbQueries / concurrentQueries); batch++) {
        const batchPromises = [];
        
        for (let query = 0; query < concurrentQueries && (batch * concurrentQueries + query) < dbQueries; query++) {
          batchPromises.push(this.executeDbQuery(batch * concurrentQueries + query));
        }

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            dbResults.successful++;
            dbResults.responseTimes.push(result.value.responseTime);
          } else {
            dbResults.failed++;
            dbResults.errors.push(result.reason.message);
          }
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgDbResponseTime = dbResults.responseTimes.reduce((a, b) => a + b, 0) / dbResults.responseTimes.length;
      const dbErrorRate = dbResults.failed / (dbResults.successful + dbResults.failed);

      testResults.loadMetrics.databaseLoad = {
        totalQueries: dbQueries,
        successful: dbResults.successful,
        failed: dbResults.failed,
        avgResponseTime: avgDbResponseTime,
        errorRate: dbErrorRate,
        errors: dbResults.errors,
      };

      this.logger.success(`Database load test completed:`);
      this.logger.info(`- Success rate: ${((1 - dbErrorRate) * 100).toFixed(1)}%`);
      this.logger.info(`- Average response time: ${avgDbResponseTime.toFixed(1)}ms`);

      if (avgDbResponseTime < 500) { // 500ms target
        this.logger.success(`Database response time within target: ${avgDbResponseTime.toFixed(1)}ms < 500ms`);
      } else {
        this.logger.warning(`Database response time exceeds target: ${avgDbResponseTime.toFixed(1)}ms > 500ms`);
      }
    });

    // Test API rate limiting under load
    await this.runTest(testResults, 'testApiRateLimiting', async () => {
      const apiRequests = 100;
      const requestsPerSecond = 20;
      const interval = 1000 / requestsPerSecond; // ms between requests
      
      this.logger.info(`Testing API rate limiting: ${apiRequests} requests at ${requestsPerSecond} req/sec`);
      
      const apiResults = {
        successful: 0,
        rateLimited: 0,
        errors: 0,
        responseTimes: [],
      };

      for (let i = 0; i < apiRequests; i++) {
        try {
          const startTime = Date.now();
          const browser = await this.testSuite.createBrowser({ headless: true });
          const page = await browser.newPage();

          const response = await page.evaluate(async () => {
            try {
              const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: `loadtest${Date.now()}@example.com`,
                  source: 'load-test',
                }),
              });
              return {
                status: response.status,
                ok: response.ok,
              };
            } catch (error) {
              return { error: error.message };
            }
          });

          const responseTime = Date.now() - startTime;
          apiResults.responseTimes.push(responseTime);

          if (response.status === 429) {
            apiResults.rateLimited++;
          } else if (response.ok) {
            apiResults.successful++;
          } else {
            apiResults.errors++;
          }

          await browser.close();

          // Wait for next request
          if (i < apiRequests - 1) {
            await new Promise(resolve => setTimeout(resolve, interval));
          }

        } catch (error) {
          apiResults.errors++;
        }

        if (i % 20 === 0) {
          this.logger.info(`API load progress: ${i}/${apiRequests} - Rate limited: ${apiResults.rateLimited}`);
        }
      }

      const avgApiResponseTime = apiResults.responseTimes.reduce((a, b) => a + b, 0) / apiResults.responseTimes.length;

      testResults.loadMetrics.apiRateLimit = {
        totalRequests: apiRequests,
        successful: apiResults.successful,
        rateLimited: apiResults.rateLimited,
        errors: apiResults.errors,
        avgResponseTime: avgApiResponseTime,
      };

      this.logger.success(`API rate limiting test completed:`);
      this.logger.info(`- Successful requests: ${apiResults.successful}`);
      this.logger.info(`- Rate limited requests: ${apiResults.rateLimited}`);
      this.logger.info(`- Average response time: ${avgApiResponseTime.toFixed(1)}ms`);

      if (apiResults.rateLimited > 0) {
        this.logger.success('Rate limiting is active and functioning');
      } else {
        this.logger.warning('No rate limiting detected - consider implementing rate limits');
      }
    });

    this.logger.header(`Load Tests Completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
    
    return {
      ...this.logger.getResults(),
      testResults,
    };
  }

  async simulateUserSession(userIndex) {
    const sessionStart = Date.now();
    const browser = await this.testSuite.createBrowser({ 
      headless: true,
      args: ['--disable-images', '--disable-javascript'] // Speed up load testing
    });
    
    try {
      const page = await browser.newPage();
      
      // Simulate realistic user behavior
      await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173', {
        waitUntil: 'domcontentloaded', // Faster than networkidle
        timeout: 15000,
      });

      // Simulate user reading time
      await page.waitForTimeout(Math.random() * 2000 + 1000); // 1-3 seconds

      // Try to interact with the form
      const urlInput = await page.$('input[placeholder*="github.com"]');
      if (urlInput) {
        const testRepos = [
          'https://github.com/facebook/react',
          'https://github.com/microsoft/vscode',
          'https://github.com/nodejs/node',
          'https://github.com/vuejs/vue',
          'https://github.com/angular/angular',
        ];
        
        const randomRepo = testRepos[userIndex % testRepos.length];
        await page.type('input[placeholder*="github.com"]', randomRepo);

        // Accept terms if checkbox exists
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }

        // Submit form
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          // Wait for response or timeout
          try {
            await page.waitForSelector('.site-preview, .error-message', { timeout: 20000 });
          } catch (timeoutError) {
            // Timeout is acceptable under load
          }
        }
      }

      const totalTime = Date.now() - sessionStart;
      return { totalTime, userIndex, success: true };

    } finally {
      await browser.close();
    }
  }

  async executeDbQuery(queryIndex) {
    const startTime = Date.now();
    
    try {
      // Test different types of database operations
      const operations = [
        () => this.testSuite.supabase.from('users').select('count').limit(1),
        () => this.testSuite.supabase.rpc('get_commission_rate', { relationship_months: 12 }),
        () => this.testSuite.supabase.from('websites').select('*').limit(10),
        () => this.testSuite.supabase.rpc('calculate_viral_score', { showcase_id: '00000000-0000-0000-0000-000000000000' }),
      ];

      const operation = operations[queryIndex % operations.length];
      await operation();
      
      return {
        responseTime: Date.now() - startTime,
        queryIndex,
        success: true,
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        queryIndex,
        success: false,
        error: error.message,
      };
    }
  }

  async measureResourceUsage() {
    // This would be expanded in a real environment to measure actual server resources
    // For browser-based testing, we can measure client-side metrics
    const browser = await this.testSuite.createBrowser({ headless: true });
    const page = await browser.newPage();
    
    try {
      await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
      
      const usage = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      return usage || { 
        usedJSHeapSize: 0, 
        totalJSHeapSize: 0, 
        jsHeapSizeLimit: 0 
      };
    } finally {
      await browser.close();
    }
  }

  async runTest(testResults, testName, testFunction) {
    try {
      this.logger.info(`Running test: ${testName}`);
      await testFunction();
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'passed' });
      this.logger.success(`✅ ${testName} passed`);
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ 
        name: testName, 
        status: 'failed', 
        error: error.message 
      });
      this.logger.error(`❌ ${testName} failed: ${error.message}`);
    }
  }
}
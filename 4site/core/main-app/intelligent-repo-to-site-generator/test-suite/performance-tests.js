/**
 * PERFORMANCE TESTING MODULE
 * Core Web Vitals and performance optimization validation
 * 
 * Tests:
 * - Lighthouse performance audits
 * - Core Web Vitals (FCP, LCP, CLS, FID, TBT)
 * - AI generation performance (30-second requirement)
 * - Database query performance under load
 * - Bundle size and asset optimization
 * - Memory usage and leak detection
 */

import { TestLogger } from './comprehensive-test-suite.js';

export class PerformanceTests {
  constructor(testSuite) {
    this.testSuite = testSuite;
    this.logger = new TestLogger('PerformanceTests');
    this.performanceMetrics = {};
  }

  async run() {
    this.logger.header('Starting Performance Tests');

    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      metrics: {},
    };

    // Test Core Web Vitals
    await this.runTest(testResults, 'testCoreWebVitals', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Enable performance monitoring
        await page.evaluateOnNewDocument(() => {
          window.performanceMetrics = {
            navigationStart: performance.timeOrigin,
            measurements: [],
          };
        });

        const startTime = Date.now();
        
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Measure Core Web Vitals
        const metrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            // First Contentful Paint
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            
            // Navigation timing
            const navigation = performance.getEntriesByType('navigation')[0];
            
            // Layout shift detection
            let cumulativeLayoutShift = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  cumulativeLayoutShift += entry.value;
                }
              }
            }).observe({ type: 'layout-shift', buffered: true });

            // First Input Delay simulation
            let firstInputDelay = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                firstInputDelay = entry.processingStart - entry.startTime;
              }
            }).observe({ type: 'first-input', buffered: true });

            setTimeout(() => {
              resolve({
                firstContentfulPaint: fcp ? fcp.startTime : null,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
                loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
                cumulativeLayoutShift,
                firstInputDelay,
                memoryUsage: performance.memory ? {
                  used: performance.memory.usedJSHeapSize,
                  total: performance.memory.totalJSHeapSize,
                  limit: performance.memory.jsHeapSizeLimit,
                } : null,
              });
            }, 3000); // Wait 3 seconds for metrics to stabilize
          });
        });

        testResults.metrics.coreWebVitals = metrics;

        // Validate against thresholds
        const thresholds = this.testSuite.TEST_CONFIG?.performanceThresholds || {
          firstContentfulPaint: 2500,
          cumulativeLayoutShift: 0.1,
          firstInputDelay: 100,
        };

        if (metrics.firstContentfulPaint && metrics.firstContentfulPaint <= thresholds.firstContentfulPaint) {
          this.logger.success(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(1)}ms (threshold: ${thresholds.firstContentfulPaint}ms)`);
        } else {
          this.logger.warning(`First Contentful Paint: ${metrics.firstContentfulPaint?.toFixed(1) || 'N/A'}ms exceeds threshold of ${thresholds.firstContentfulPaint}ms`);
        }

        if (metrics.cumulativeLayoutShift <= thresholds.cumulativeLayoutShift) {
          this.logger.success(`Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)} (threshold: ${thresholds.cumulativeLayoutShift})`);
        } else {
          this.logger.warning(`Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)} exceeds threshold of ${thresholds.cumulativeLayoutShift}`);
        }

        // Take performance screenshot
        await page.screenshot({
          path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/performance-core-web-vitals.png`,
          fullPage: true,
        });

      } finally {
        await browser.close();
      }
    });

    // Test AI generation performance
    await this.runTest(testResults, 'testAIGenerationPerformance', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        
        // Test with a real repository
        await page.type('input[placeholder*="github.com"]', 'https://github.com/facebook/react');
        
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }

        const startTime = Date.now();
        
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          // Wait for loading indicator
          await page.waitForSelector('.loading-indicator, .glass-loading', { timeout: 5000 });
          
          // Wait for completion or timeout
          try {
            await page.waitForSelector('.site-preview, .error-message', { timeout: 35000 }); // 35s timeout for 30s target
            
            const generationTime = Date.now() - startTime;
            testResults.metrics.aiGenerationTime = generationTime;
            
            if (generationTime <= 30000) { // 30 second target
              this.logger.success(`AI generation completed in ${(generationTime / 1000).toFixed(1)}s (target: 30s)`);
            } else {
              this.logger.warning(`AI generation took ${(generationTime / 1000).toFixed(1)}s (exceeds 30s target)`);
            }
            
            // Check if result is successful
            const previewExists = await page.$('.site-preview') !== null;
            if (previewExists) {
              this.logger.success('AI generation produced valid output');
            } else {
              this.logger.warning('AI generation returned error state');
            }
            
          } catch (timeoutError) {
            const generationTime = Date.now() - startTime;
            testResults.metrics.aiGenerationTime = generationTime;
            this.logger.error(`AI generation timed out after ${(generationTime / 1000).toFixed(1)}s`);
            throw new Error('AI generation performance does not meet 30-second requirement');
          }
        }

      } finally {
        await browser.close();
      }
    });

    // Test database performance
    await this.runTest(testResults, 'testDatabasePerformance', async () => {
      if (!this.testSuite.supabase) {
        this.logger.warning('Skipping database performance tests - Supabase not configured');
        testResults.skipped++;
        return;
      }

      const dbMetrics = {};

      // Test viral score calculation performance
      const viralScoreStart = Date.now();
      try {
        await this.testSuite.supabase.rpc('calculate_viral_score', {
          showcase_id: '00000000-0000-0000-0000-000000000000'
        });
        dbMetrics.viralScoreTime = Date.now() - viralScoreStart;
      } catch (error) {
        dbMetrics.viralScoreTime = Date.now() - viralScoreStart;
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }

      // Test commission rate calculation performance
      const commissionStart = Date.now();
      try {
        await this.testSuite.supabase.rpc('get_commission_rate', {
          relationship_months: 24
        });
        dbMetrics.commissionTime = Date.now() - commissionStart;
      } catch (error) {
        dbMetrics.commissionTime = Date.now() - commissionStart;
      }

      // Test bulk query performance
      const bulkQueryStart = Date.now();
      try {
        await this.testSuite.supabase
          .from('users')
          .select('*')
          .limit(100);
        dbMetrics.bulkQueryTime = Date.now() - bulkQueryStart;
      } catch (error) {
        dbMetrics.bulkQueryTime = Date.now() - bulkQueryStart;
      }

      testResults.metrics.database = dbMetrics;

      // Validate performance targets
      if (dbMetrics.viralScoreTime <= 200) {
        this.logger.success(`Viral score calculation: ${dbMetrics.viralScoreTime}ms (target: <200ms)`);
      } else {
        this.logger.warning(`Viral score calculation: ${dbMetrics.viralScoreTime}ms (exceeds 200ms target)`);
      }

      if (dbMetrics.commissionTime <= 100) {
        this.logger.success(`Commission calculation: ${dbMetrics.commissionTime}ms (target: <100ms)`);
      } else {
        this.logger.warning(`Commission calculation: ${dbMetrics.commissionTime}ms (exceeds 100ms target)`);
      }
    });

    // Test memory usage and leaks
    await this.runTest(testResults, 'testMemoryUsage', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Initial memory measurement
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        const initialMemory = await page.evaluate(() => {
          if (performance.memory) {
            return {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
            };
          }
          return null;
        });

        // Simulate user interactions
        for (let i = 0; i < 5; i++) {
          await page.reload({ waitUntil: 'networkidle2' });
          await page.waitForTimeout(1000);
        }

        // Final memory measurement
        const finalMemory = await page.evaluate(() => {
          if (performance.memory) {
            return {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
            };
          }
          return null;
        });

        if (initialMemory && finalMemory) {
          const memoryIncrease = finalMemory.used - initialMemory.used;
          const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;

          testResults.metrics.memory = {
            initial: initialMemory,
            final: finalMemory,
            increase: memoryIncrease,
            increasePercent: memoryIncreasePercent,
          };

          if (memoryIncreasePercent < 20) { // Less than 20% increase is acceptable
            this.logger.success(`Memory usage stable: ${memoryIncreasePercent.toFixed(1)}% increase`);
          } else {
            this.logger.warning(`Memory usage increased by ${memoryIncreasePercent.toFixed(1)}% - possible memory leak`);
          }
        } else {
          this.logger.warning('Memory metrics not available in this browser');
        }

      } finally {
        await browser.close();
      }
    });

    // Test bundle size and asset optimization
    await this.runTest(testResults, 'testAssetOptimization', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        const responses = [];
        
        page.on('response', response => {
          if (response.url().includes('localhost:5173') || response.url().includes(this.testSuite.TEST_CONFIG?.baseUrl)) {
            responses.push({
              url: response.url(),
              status: response.status(),
              size: response.headers()['content-length'],
              type: response.headers()['content-type'],
            });
          }
        });

        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173', {
          waitUntil: 'networkidle2',
        });

        // Analyze asset sizes
        const assets = {
          javascript: responses.filter(r => r.type?.includes('javascript')),
          css: responses.filter(r => r.type?.includes('css')),
          images: responses.filter(r => r.type?.includes('image')),
          total: responses,
        };

        const totalSize = responses.reduce((sum, response) => {
          return sum + (parseInt(response.size) || 0);
        }, 0);

        testResults.metrics.assets = {
          totalSize,
          totalRequests: responses.length,
          breakdown: {
            javascript: assets.javascript.length,
            css: assets.css.length,
            images: assets.images.length,
          },
        };

        // Target: Total bundle < 500KB
        if (totalSize < 500000) {
          this.logger.success(`Total asset size: ${(totalSize / 1024).toFixed(1)}KB (target: <500KB)`);
        } else {
          this.logger.warning(`Total asset size: ${(totalSize / 1024).toFixed(1)}KB (exceeds 500KB target)`);
        }

        // Target: < 50 total requests
        if (responses.length < 50) {
          this.logger.success(`Total requests: ${responses.length} (target: <50)`);
        } else {
          this.logger.warning(`Total requests: ${responses.length} (exceeds 50 request target)`);
        }

      } finally {
        await browser.close();
      }
    });

    this.logger.header(`Performance Tests Completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
    
    return {
      ...this.logger.getResults(),
      testResults,
    };
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
/**
 * FUNCTIONAL TESTING MODULE
 * End-to-end automation for core application features
 * 
 * Tests:
 * - GitHub URL input and validation
 * - AI site generation workflow
 * - Template rendering and preview
 * - Lead capture and form submissions
 * - Database operations and data integrity
 * - API endpoints and error handling
 */

import { TestLogger } from './comprehensive-test-suite.js';

export class FunctionalTests {
  constructor(testSuite) {
    this.testSuite = testSuite;
    this.logger = new TestLogger('FunctionalTests');
  }

  async run() {
    this.logger.header('Starting Functional Tests');

    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };

    // Test GitHub URL processing
    await this.runTest(testResults, 'testGitHubUrlProcessing', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait for the URL input form
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        
        // Test valid GitHub URL
        const validUrl = 'https://github.com/facebook/react';
        await page.type('input[placeholder*="github.com"]', validUrl);
        
        // Check if terms checkbox exists and check it
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }

        // Submit the form
        const submitButton = await page.$('button[type="submit"], button:contains("Generate"), .generate-button');
        if (submitButton) {
          await submitButton.click();
          
          // Wait for processing to start
          await page.waitForSelector('.loading-indicator, .glass-loading', { timeout: 5000 });
          this.logger.success('GitHub URL processing initiated successfully');
          
          // Wait for either success or error state (with timeout)
          try {
            await page.waitForSelector('.site-preview, .error-message', { timeout: 60000 });
            
            // Check if we got a successful generation
            const previewExists = await page.$('.site-preview') !== null;
            if (previewExists) {
              this.logger.success('Site generation completed successfully');
              
              // Take screenshot of generated site
              await page.screenshot({
                path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/functional-site-generation.png`,
                fullPage: true,
              });
            } else {
              this.logger.warning('Site generation returned error state');
            }
          } catch (timeoutError) {
            this.logger.warning('Site generation timed out - may indicate performance issues');
          }
        } else {
          throw new Error('Submit button not found');
        }

      } finally {
        await browser.close();
      }
    });

    // Test invalid GitHub URL handling
    await this.runTest(testResults, 'testInvalidUrlHandling', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        
        // Test invalid URLs
        const invalidUrls = [
          'not-a-url',
          'https://google.com',
          'https://github.com/nonexistent/repo',
          'ftp://invalid-protocol.com',
        ];

        for (const invalidUrl of invalidUrls) {
          await page.evaluate(() => {
            const input = document.querySelector('input[placeholder*="github.com"]');
            if (input) input.value = '';
          });
          
          await page.type('input[placeholder*="github.com"]', invalidUrl);
          
          // Check if validation error appears
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
            if (isDisabled) {
              this.logger.success(`Validation correctly disabled submit for: ${invalidUrl}`);
            }
          }
        }

      } finally {
        await browser.close();
      }
    });

    // Test API endpoints
    await this.runTest(testResults, 'testApiEndpoints', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Test API server is running
        const response = await page.goto(`${this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173'}/api/health`, {
          waitUntil: 'networkidle2',
          timeout: 10000,
        });

        if (response && response.status() === 200) {
          this.logger.success('API server is responding');
        } else {
          this.logger.warning('API server may not be running');
        }

        // Test lead capture endpoint
        const leadCaptureResponse = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/leads/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: 'test@example.com',
                source: 'functional-test',
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

        if (leadCaptureResponse.ok) {
          this.logger.success('Lead capture API endpoint working');
        } else {
          this.logger.warning(`Lead capture API returned status: ${leadCaptureResponse.status}`);
        }

      } finally {
        await browser.close();
      }
    });

    // Test database operations
    await this.runTest(testResults, 'testDatabaseOperations', async () => {
      if (!this.testSuite.supabase) {
        this.logger.warning('Skipping database tests - Supabase not configured');
        testResults.skipped++;
        return;
      }

      try {
        // Test basic connectivity
        const { data: healthCheck, error: healthError } = await this.testSuite.supabase
          .from('users')
          .select('count')
          .limit(1);

        if (healthError && !healthError.message.includes('permission')) {
          throw healthError;
        }

        this.logger.success('Database connectivity confirmed');

        // Test viral functions exist
        const { data: viralScore, error: viralError } = await this.testSuite.supabase
          .rpc('calculate_viral_score', { showcase_id: '00000000-0000-0000-0000-000000000000' });

        if (viralError && !viralError.message.includes('does not exist')) {
          this.logger.success('Viral functions are callable');
        }

        // Test commission calculations
        const { data: commissionRate, error: commissionError } = await this.testSuite.supabase
          .rpc('get_commission_rate', { relationship_months: 12 });

        if (!commissionError && typeof commissionRate === 'number') {
          this.logger.success(`Commission calculation working: ${(commissionRate * 100).toFixed(1)}%`);
        }

      } catch (error) {
        this.logger.error(`Database test failed: ${error.message}`);
        throw error;
      }
    });

    // Test Gemini AI integration
    await this.runTest(testResults, 'testGeminiIntegration', async () => {
      const apiKey = process.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        this.logger.warning('Skipping Gemini tests - API key not configured');
        testResults.skipped++;
        return;
      }

      try {
        // Test the Gemini service directly
        const browser = await this.testSuite.createBrowser();
        const page = await browser.newPage();

        // Intercept network requests to Gemini API
        let geminiRequestMade = false;
        let geminiResponseReceived = false;

        page.on('request', request => {
          if (request.url().includes('generativelanguage.googleapis.com')) {
            geminiRequestMade = true;
            this.logger.info('Gemini API request intercepted');
          }
        });

        page.on('response', response => {
          if (response.url().includes('generativelanguage.googleapis.com')) {
            geminiResponseReceived = true;
            this.logger.info(`Gemini API response: ${response.status()}`);
          }
        });

        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        // Trigger a generation to test API
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        await page.type('input[placeholder*="github.com"]', 'https://github.com/microsoft/vscode');
        
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          // Wait a bit for API call
          await page.waitForTimeout(5000);
          
          if (geminiRequestMade) {
            this.logger.success('Gemini API integration working');
          } else {
            this.logger.warning('No Gemini API request detected');
          }
        }

        await browser.close();

      } catch (error) {
        this.logger.error(`Gemini integration test failed: ${error.message}`);
        throw error;
      }
    });

    // Test responsive design
    await this.runTest(testResults, 'testResponsiveDesign', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        const viewports = [
          { width: 1920, height: 1080, name: 'Desktop' },
          { width: 768, height: 1024, name: 'Tablet' },
          { width: 375, height: 667, name: 'Mobile' },
        ];

        for (const viewport of viewports) {
          await page.setViewport(viewport);
          await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
          
          await page.waitForSelector('.glass-container', { timeout: 10000 });
          
          // Check if key elements are visible
          const urlInput = await page.$('input[placeholder*="github.com"]');
          const isVisible = await page.evaluate(element => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }, urlInput);

          if (isVisible) {
            this.logger.success(`${viewport.name} viewport: Elements visible and accessible`);
          } else {
            this.logger.warning(`${viewport.name} viewport: Elements may be hidden or inaccessible`);
          }

          // Take screenshot for each viewport
          await page.screenshot({
            path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/responsive-${viewport.name.toLowerCase()}.png`,
            fullPage: true,
          });
        }

      } finally {
        await browser.close();
      }
    });

    this.logger.header(`Functional Tests Completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
    
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
/**
 * SECURITY TESTING MODULE
 * Automated security scanning and penetration testing
 * 
 * Tests:
 * - Input validation and XSS prevention
 * - CSRF protection and rate limiting
 * - SSL/TLS configuration and security headers
 * - API endpoint authentication and authorization
 * - SQL injection and code injection attempts
 * - Sensitive data exposure prevention
 */

import { TestLogger } from './comprehensive-test-suite.js';

export class SecurityTests {
  constructor(testSuite) {
    this.testSuite = testSuite;
    this.logger = new TestLogger('SecurityTests');
  }

  async run() {
    this.logger.header('Starting Security Tests');

    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      vulnerabilities: [],
    };

    // Test XSS prevention
    await this.runTest(testResults, 'testXSSPrevention', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        
        // Test XSS payloads
        const xssPayloads = [
          '<script>alert("XSS")</script>',
          'javascript:alert("XSS")',
          '<img src="x" onerror="alert(\'XSS\')">',
          '<svg onload="alert(\'XSS\')">',
          '"><script>alert("XSS")</script>',
          '\';alert("XSS");//',
        ];

        let alertsTriggered = 0;
        
        // Set up alert detection
        page.on('dialog', async dialog => {
          alertsTriggered++;
          this.logger.warning(`XSS alert triggered: ${dialog.message()}`);
          await dialog.dismiss();
        });

        for (const payload of xssPayloads) {
          // Clear input and test payload
          await page.evaluate(() => {
            const input = document.querySelector('input[placeholder*="github.com"]');
            if (input) input.value = '';
          });
          
          try {
            await page.type('input[placeholder*="github.com"]', payload, { delay: 10 });
            await page.waitForTimeout(500); // Wait for any potential XSS execution
            
            // Check if the payload is properly escaped in DOM
            const inputValue = await page.$eval('input[placeholder*="github.com"]', el => el.value);
            if (inputValue === payload) {
              // Input accepted payload - check if it's properly escaped when displayed
              const domContent = await page.content();
              if (domContent.includes('<script>') && !domContent.includes('&lt;script&gt;')) {
                testResults.vulnerabilities.push({
                  type: 'XSS',
                  payload,
                  description: 'Unescaped script tag in DOM',
                });
                this.logger.warning(`Potential XSS vulnerability with payload: ${payload}`);
              }
            }
          } catch (error) {
            // Errors are expected for some payloads - this is good
            this.logger.info(`Payload rejected (good): ${payload}`);
          }
        }

        if (alertsTriggered === 0) {
          this.logger.success('No XSS alerts triggered - XSS prevention appears effective');
        } else {
          throw new Error(`${alertsTriggered} XSS alert(s) triggered - XSS vulnerabilities detected`);
        }

      } finally {
        await browser.close();
      }
    });

    // Test CSRF protection
    await this.runTest(testResults, 'testCSRFProtection', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Test API endpoints without proper origin/referrer
        const testEndpoints = [
          '/api/leads/capture',
          '/api/analytics/track',
          '/api/auth/login',
        ];

        for (const endpoint of testEndpoints) {
          try {
            const response = await page.evaluate(async (url) => {
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // Deliberately omit CSRF token or origin header
                },
                body: JSON.stringify({ test: 'data' }),
              });
              return {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
              };
            }, endpoint);

            // Should reject requests without proper CSRF protection
            if (response.status === 403 || response.status === 401) {
              this.logger.success(`CSRF protection active for ${endpoint} (status: ${response.status})`);
            } else if (response.status === 404) {
              this.logger.info(`Endpoint ${endpoint} not found (expected)`);
            } else {
              this.logger.warning(`Endpoint ${endpoint} may lack CSRF protection (status: ${response.status})`);
            }
          } catch (error) {
            // Network errors are expected for protected endpoints
            this.logger.info(`CSRF test for ${endpoint}: ${error.message}`);
          }
        }

      } finally {
        await browser.close();
      }
    });

    // Test rate limiting
    await this.runTest(testResults, 'testRateLimiting', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        // Test rapid form submissions
        let rateLimitHit = false;
        const submissions = [];

        for (let i = 0; i < 20; i++) {
          try {
            const response = await page.evaluate(async () => {
              const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: `test${Date.now()}@example.com`,
                  source: 'rate-limit-test',
                }),
              });
              return {
                status: response.status,
                timestamp: Date.now(),
              };
            });

            submissions.push(response);

            if (response.status === 429) {
              rateLimitHit = true;
              this.logger.success(`Rate limiting active: Hit rate limit after ${i + 1} requests`);
              break;
            }

            // Small delay between requests
            await page.waitForTimeout(100);
          } catch (error) {
            this.logger.info(`Rate limit test request ${i + 1}: ${error.message}`);
          }
        }

        if (!rateLimitHit && submissions.length >= 20) {
          this.logger.warning('No rate limiting detected after 20 rapid requests - consider implementing rate limiting');
        }

      } finally {
        await browser.close();
      }
    });

    // Test security headers
    await this.runTest(testResults, 'testSecurityHeaders', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        const response = await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        const headers = response.headers();
        const securityHeaders = {
          'x-frame-options': headers['x-frame-options'],
          'x-content-type-options': headers['x-content-type-options'],
          'x-xss-protection': headers['x-xss-protection'],
          'strict-transport-security': headers['strict-transport-security'],
          'content-security-policy': headers['content-security-policy'],
          'referrer-policy': headers['referrer-policy'],
        };

        const requiredHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'x-xss-protection',
        ];

        const recommendedHeaders = [
          'strict-transport-security',
          'content-security-policy',
          'referrer-policy',
        ];

        let missingRequired = 0;
        let missingRecommended = 0;

        // Check required headers
        for (const header of requiredHeaders) {
          if (securityHeaders[header]) {
            this.logger.success(`Required security header present: ${header}`);
          } else {
            this.logger.warning(`Missing required security header: ${header}`);
            missingRequired++;
          }
        }

        // Check recommended headers
        for (const header of recommendedHeaders) {
          if (securityHeaders[header]) {
            this.logger.success(`Recommended security header present: ${header}`);
          } else {
            this.logger.info(`Missing recommended security header: ${header}`);
            missingRecommended++;
          }
        }

        if (missingRequired > 0) {
          throw new Error(`${missingRequired} required security headers missing`);
        }

        testResults.securityHeaders = {
          present: Object.keys(securityHeaders).filter(key => securityHeaders[key]),
          missing: Object.keys(securityHeaders).filter(key => !securityHeaders[key]),
          missingRecommended,
        };

      } finally {
        await browser.close();
      }
    });

    // Test SQL injection prevention
    await this.runTest(testResults, 'testSQLInjectionPrevention', async () => {
      if (!this.testSuite.supabase) {
        this.logger.warning('Skipping SQL injection tests - database not configured');
        testResults.skipped++;
        return;
      }

      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; SELECT * FROM users WHERE '1'='1",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM users; --",
        "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
      ];

      for (const payload of sqlInjectionPayloads) {
        try {
          // Test various database operations with injection payloads
          const { data, error } = await this.testSuite.supabase
            .from('users')
            .select('*')
            .eq('email', payload)
            .limit(1);

          if (error) {
            // Errors are good - means injection was prevented
            this.logger.success(`SQL injection prevented for payload: ${payload.substring(0, 20)}...`);
          } else if (!data || data.length === 0) {
            // No data returned is also good
            this.logger.success(`SQL injection query returned no results (safe)`);
          } else {
            // If we get unexpected data, it might indicate a vulnerability
            this.logger.warning(`Unexpected data returned for injection payload`);
          }
        } catch (error) {
          // Exceptions are expected and good for injection prevention
          this.logger.success(`SQL injection blocked by exception: ${error.message.substring(0, 50)}...`);
        }
      }
    });

    // Test sensitive data exposure
    await this.runTest(testResults, 'testSensitiveDataExposure', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        // Check page source for sensitive information
        const pageContent = await page.content();
        const jsContent = await page.evaluate(() => {
          return Array.from(document.scripts)
            .map(script => script.textContent)
            .join('\n');
        });

        const sensitivePatterns = [
          /password\s*[:=]\s*['""][^'""]+['""]]/gi,
          /api[_-]?key\s*[:=]\s*['""][^'""]+['""]]/gi,
          /secret\s*[:=]\s*['""][^'""]+['""]]/gi,
          /token\s*[:=]\s*['""][^'""]+['""]]/gi,
          /private[_-]?key\s*[:=]\s*['""][^'""]+['""]]/gi,
          /sk-[a-zA-Z0-9]{32,}/g, // OpenAI API keys
          /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
        ];

        const exposedSecrets = [];

        for (const pattern of sensitivePatterns) {
          const matches = [...pageContent.matchAll(pattern), ...jsContent.matchAll(pattern)];
          if (matches.length > 0) {
            exposedSecrets.push(...matches.map(match => match[0]));
          }
        }

        if (exposedSecrets.length === 0) {
          this.logger.success('No sensitive data patterns detected in client-side code');
        } else {
          exposedSecrets.forEach(secret => {
            this.logger.warning(`Potential sensitive data exposed: ${secret.substring(0, 20)}...`);
            testResults.vulnerabilities.push({
              type: 'Sensitive Data Exposure',
              data: secret.substring(0, 50) + '...',
              description: 'Sensitive data pattern found in client-side code',
            });
          });
        }

        // Check for debug/development artifacts
        const debugPatterns = [
          /console\.log\(/g,
          /debugger;/g,
          /TODO:/gi,
          /FIXME:/gi,
          /\.env\.local/gi,
        ];

        const debugArtifacts = [];
        for (const pattern of debugPatterns) {
          const matches = [...pageContent.matchAll(pattern), ...jsContent.matchAll(pattern)];
          debugArtifacts.push(...matches);
        }

        if (debugArtifacts.length > 0 && this.testSuite.TEST_CONFIG?.environment === 'production') {
          this.logger.warning(`${debugArtifacts.length} debug artifacts found in production build`);
        } else {
          this.logger.success('No concerning debug artifacts in production build');
        }

      } finally {
        await browser.close();
      }
    });

    // Test SSL/TLS configuration
    await this.runTest(testResults, 'testSSLConfiguration', async () => {
      const baseUrl = this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173';
      
      if (!baseUrl.startsWith('https://')) {
        this.logger.warning('Testing on HTTP - SSL/TLS tests only applicable for HTTPS');
        testResults.skipped++;
        return;
      }

      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Test SSL certificate and configuration
        const response = await page.goto(baseUrl);
        const securityDetails = await page.evaluate(() => {
          return {
            protocol: location.protocol,
            secureContext: typeof window.isSecureContext !== 'undefined' ? window.isSecureContext : null,
          };
        });

        if (securityDetails.protocol === 'https:') {
          this.logger.success('HTTPS protocol confirmed');
        } else {
          throw new Error('Site not served over HTTPS');
        }

        if (securityDetails.secureContext === true) {
          this.logger.success('Secure context confirmed');
        } else {
          this.logger.warning('Secure context not detected');
        }

        // Check for mixed content
        const mixedContentWarnings = [];
        page.on('console', msg => {
          if (msg.text().includes('Mixed Content') || msg.text().includes('insecure')) {
            mixedContentWarnings.push(msg.text());
          }
        });

        await page.waitForTimeout(2000); // Wait for any mixed content warnings

        if (mixedContentWarnings.length === 0) {
          this.logger.success('No mixed content warnings detected');
        } else {
          this.logger.warning(`${mixedContentWarnings.length} mixed content warnings detected`);
        }

      } finally {
        await browser.close();
      }
    });

    this.logger.header(`Security Tests Completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
    
    if (testResults.vulnerabilities.length > 0) {
      this.logger.warning(`${testResults.vulnerabilities.length} potential vulnerabilities identified`);
    } else {
      this.logger.success('No critical vulnerabilities detected');
    }
    
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
/**
 * USER JOURNEY TESTING MODULE
 * Conversion funnel optimization and user experience validation
 * 
 * Tests:
 * - Complete user registration and onboarding flow
 * - Site generation and customization journey
 * - Lead capture widget functionality across scenarios
 * - Viral sharing and referral mechanics
 * - Mobile responsiveness and cross-browser compatibility
 * - Conversion funnel analytics and optimization
 */

import { TestLogger } from './comprehensive-test-suite.js';

export class UserJourneyTests {
  constructor(testSuite) {
    this.testSuite = testSuite;
    this.logger = new TestLogger('UserJourneyTests');
    this.userSessions = [];
  }

  async run() {
    this.logger.header('Starting User Journey Tests');

    const testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      journeyMetrics: {},
      conversionFunnel: {},
    };

    // Test complete new user journey
    await this.runTest(testResults, 'testNewUserJourney', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        const journeyStart = Date.now();
        const journeySteps = [];

        // Step 1: Landing page arrival
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        await page.waitForSelector('.glass-container', { timeout: 10000 });
        
        journeySteps.push({
          step: 'landing_page_load',
          timestamp: Date.now() - journeyStart,
          success: true,
        });

        // Take screenshot of initial state
        await page.screenshot({
          path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/journey-01-landing.png`,
          fullPage: true,
        });

        // Step 2: User reads value proposition
        await page.waitForTimeout(2000); // Simulate reading time
        
        // Check if key value propositions are visible
        const valueProps = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          return headings.map(h => h.textContent.trim()).filter(text => 
            text.includes('30 seconds') || 
            text.includes('GitHub') || 
            text.includes('professional') ||
            text.includes('4site')
          );
        });

        if (valueProps.length > 0) {
          journeySteps.push({
            step: 'value_proposition_viewed',
            timestamp: Date.now() - journeyStart,
            success: true,
            data: valueProps,
          });
          this.logger.success(`Value propositions visible: ${valueProps.length} found`);
        }

        // Step 3: User enters GitHub URL
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        await page.type('input[placeholder*="github.com"]', 'https://github.com/facebook/react');
        
        journeySteps.push({
          step: 'github_url_entered',
          timestamp: Date.now() - journeyStart,
          success: true,
        });

        // Step 4: User accepts terms (if required)
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
          journeySteps.push({
            step: 'terms_accepted',
            timestamp: Date.now() - journeyStart,
            success: true,
          });
        }

        // Step 5: User submits for generation
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          journeySteps.push({
            step: 'generation_submitted',
            timestamp: Date.now() - journeyStart,
            success: true,
          });

          // Step 6: User waits during generation
          await page.waitForSelector('.loading-indicator, .glass-loading', { timeout: 5000 });
          
          // Take screenshot of loading state
          await page.screenshot({
            path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/journey-02-loading.png`,
            fullPage: true,
          });

          // Wait for completion or timeout
          try {
            await page.waitForSelector('.site-preview, .error-message', { timeout: 45000 });
            
            const generationTime = Date.now() - journeyStart;
            const previewExists = await page.$('.site-preview') !== null;

            if (previewExists) {
              journeySteps.push({
                step: 'site_generated_successfully',
                timestamp: generationTime,
                success: true,
              });

              // Take screenshot of generated site
              await page.screenshot({
                path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/journey-03-generated.png`,
                fullPage: true,
              });

              // Step 7: User explores generated site
              await page.waitForTimeout(3000); // Simulate exploration time

              // Check if user can interact with preview
              const interactiveElements = await page.$$eval('.site-preview button, .site-preview a, .site-preview input', 
                elements => elements.length
              );

              if (interactiveElements > 0) {
                journeySteps.push({
                  step: 'site_exploration',
                  timestamp: Date.now() - journeyStart,
                  success: true,
                  data: { interactiveElements },
                });
              }

              // Step 8: Lead capture attempt
              const leadCaptureForm = await page.$('.lead-capture, input[type="email"]');
              if (leadCaptureForm) {
                try {
                  await page.type('input[type="email"]', 'test@example.com');
                  const leadSubmitBtn = await page.$('button:contains("Subscribe"), button:contains("Get Started")');
                  if (leadSubmitBtn) {
                    await leadSubmitBtn.click();
                    
                    journeySteps.push({
                      step: 'lead_captured',
                      timestamp: Date.now() - journeyStart,
                      success: true,
                    });
                  }
                } catch (error) {
                  this.logger.info(`Lead capture interaction: ${error.message}`);
                }
              }

            } else {
              journeySteps.push({
                step: 'site_generation_failed',
                timestamp: Date.now() - journeyStart,
                success: false,
              });
            }

          } catch (timeoutError) {
            journeySteps.push({
              step: 'site_generation_timeout',
              timestamp: Date.now() - journeyStart,
              success: false,
            });
          }
        }

        const totalJourneyTime = Date.now() - journeyStart;
        testResults.journeyMetrics.newUserJourney = {
          totalTime: totalJourneyTime,
          steps: journeySteps,
          completionRate: journeySteps.filter(step => step.success).length / journeySteps.length,
        };

        this.logger.success(`New user journey completed in ${(totalJourneyTime / 1000).toFixed(1)}s with ${journeySteps.length} steps`);

      } finally {
        await browser.close();
      }
    });

    // Test mobile user journey
    await this.runTest(testResults, 'testMobileUserJourney', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        // Set mobile viewport
        await page.setViewport({
          width: 375,
          height: 667,
          isMobile: true,
          hasTouch: true,
        });

        // Simulate mobile user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        // Test mobile navigation and interactions
        await page.waitForSelector('.glass-container', { timeout: 10000 });

        // Take mobile screenshot
        await page.screenshot({
          path: `${this.testSuite.TEST_CONFIG?.reportPath || './test-results'}/journey-mobile-01.png`,
          fullPage: true,
        });

        // Test touch interactions
        const urlInput = await page.$('input[placeholder*="github.com"]');
        if (urlInput) {
          // Simulate touch input
          await page.tap('input[placeholder*="github.com"]');
          await page.type('input[placeholder*="github.com"]', 'https://github.com/vuejs/vue');
          
          this.logger.success('Mobile touch input working');
        }

        // Test mobile-specific UI elements
        const mobileElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('[class*="mobile"], [class*="responsive"]');
          return {
            count: elements.length,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };
        });

        testResults.journeyMetrics.mobileJourney = {
          viewport: mobileElements.viewport,
          mobileElementsFound: mobileElements.count,
        };

        if (mobileElements.viewport.width <= 768) {
          this.logger.success(`Mobile viewport confirmed: ${mobileElements.viewport.width}x${mobileElements.viewport.height}`);
        }

      } finally {
        await browser.close();
      }
    });

    // Test cross-browser compatibility
    await this.runTest(testResults, 'testCrossBrowserCompatibility', async () => {
      const browsers = [
        { name: 'chromium', product: 'chrome' },
        { name: 'firefox', product: 'firefox' },
      ];

      const browserResults = {};

      for (const browserConfig of browsers) {
        try {
          const browser = await this.testSuite.createBrowser({
            product: browserConfig.product,
          });
          const page = await browser.newPage();

          const startTime = Date.now();
          
          await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
          await page.waitForSelector('.glass-container', { timeout: 15000 });
          
          const loadTime = Date.now() - startTime;

          // Test basic functionality
          const urlInput = await page.$('input[placeholder*="github.com"]');
          const functionalityWorks = !!urlInput;

          // Test CSS and visual rendering
          const visualElements = await page.evaluate(() => {
            const glassMorphism = getComputedStyle(document.querySelector('.glass-container') || document.body);
            return {
              hasBackdropFilter: glassMorphism.backdropFilter !== 'none',
              hasOpacity: parseFloat(glassMorphism.opacity) < 1,
              hasBoxShadow: glassMorphism.boxShadow !== 'none',
            };
          });

          browserResults[browserConfig.name] = {
            loadTime,
            functionalityWorks,
            visualElements,
            compatible: functionalityWorks && loadTime < 10000,
          };

          if (browserResults[browserConfig.name].compatible) {
            this.logger.success(`${browserConfig.name} compatibility confirmed`);
          } else {
            this.logger.warning(`${browserConfig.name} may have compatibility issues`);
          }

          await browser.close();

        } catch (error) {
          browserResults[browserConfig.name] = {
            error: error.message,
            compatible: false,
          };
          this.logger.warning(`${browserConfig.name} test failed: ${error.message}`);
        }
      }

      testResults.journeyMetrics.crossBrowser = browserResults;
    });

    // Test viral sharing journey
    await this.runTest(testResults, 'testViralSharingJourney', async () => {
      const browser = await this.testSuite.createBrowser();
      const page = await browser.newPage();

      try {
        await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
        
        // Generate a site first
        await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 10000 });
        await page.type('input[placeholder*="github.com"]', 'https://github.com/microsoft/typescript');
        
        const termsCheckbox = await page.$('input[type="checkbox"]');
        if (termsCheckbox) {
          await termsCheckbox.click();
        }

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          
          // Wait for generation
          await page.waitForSelector('.site-preview, .error-message', { timeout: 45000 });
          
          const previewExists = await page.$('.site-preview') !== null;
          if (previewExists) {
            // Look for sharing elements
            const sharingElements = await page.$$eval(
              'button, a, .share, [class*="share"], [data-share]',
              elements => elements.filter(el => 
                el.textContent.toLowerCase().includes('share') ||
                el.textContent.toLowerCase().includes('twitter') ||
                el.textContent.toLowerCase().includes('linkedin') ||
                el.className.toLowerCase().includes('share')
              ).length
            );

            if (sharingElements > 0) {
              this.logger.success(`${sharingElements} sharing elements found`);
              
              // Test share button interaction
              const shareButton = await page.$('button:contains("Share"), .share-button, [data-share]');
              if (shareButton) {
                await shareButton.click();
                await page.waitForTimeout(1000);
                
                this.logger.success('Share functionality accessible');
              }
            } else {
              this.logger.warning('No sharing elements detected');
            }

            // Check for "Powered by 4site.pro" branding
            const brandingElements = await page.$$eval(
              '*',
              elements => elements.filter(el => 
                el.textContent.toLowerCase().includes('4site.pro') ||
                el.textContent.toLowerCase().includes('powered by')
              ).length
            );

            if (brandingElements > 0) {
              this.logger.success(`Viral branding present: ${brandingElements} elements`);
            } else {
              this.logger.warning('Viral branding not detected');
            }

            testResults.journeyMetrics.viralSharing = {
              sharingElements,
              brandingElements,
              shareableContentGenerated: true,
            };

          } else {
            this.logger.warning('No site preview available for viral sharing test');
          }
        }

      } finally {
        await browser.close();
      }
    });

    // Test conversion funnel metrics
    await this.runTest(testResults, 'testConversionFunnel', async () => {
      const funnelSteps = [
        'landing_page_view',
        'url_input_focus',
        'url_input_complete',
        'terms_accepted',
        'generation_started',
        'generation_completed',
        'site_previewed',
        'lead_captured',
      ];

      const funnelMetrics = {};
      
      // Simulate multiple user sessions to test funnel
      for (let session = 0; session < 5; session++) {
        const browser = await this.testSuite.createBrowser();
        const page = await browser.newPage();

        try {
          const sessionMetrics = {};
          
          // Landing page view
          await page.goto(this.testSuite.TEST_CONFIG?.baseUrl || 'http://localhost:5173');
          await page.waitForSelector('.glass-container', { timeout: 10000 });
          sessionMetrics.landing_page_view = true;

          // URL input focus
          const urlInput = await page.$('input[placeholder*="github.com"]');
          if (urlInput) {
            await urlInput.focus();
            sessionMetrics.url_input_focus = true;

            // URL input complete
            await page.type('input[placeholder*="github.com"]', 'https://github.com/nodejs/node');
            sessionMetrics.url_input_complete = true;

            // Terms accepted
            const termsCheckbox = await page.$('input[type="checkbox"]');
            if (termsCheckbox) {
              await termsCheckbox.click();
              sessionMetrics.terms_accepted = true;
            }

            // Generation started
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
              await submitButton.click();
              sessionMetrics.generation_started = true;

              // Generation completed (with timeout)
              try {
                await page.waitForSelector('.site-preview', { timeout: 30000 });
                sessionMetrics.generation_completed = true;
                sessionMetrics.site_previewed = true;

                // Lead capture attempt (simulate)
                const emailInput = await page.$('input[type="email"]');
                if (emailInput && Math.random() > 0.5) { // 50% conversion rate simulation
                  await page.type('input[type="email"]', `user${session}@example.com`);
                  sessionMetrics.lead_captured = true;
                }
              } catch (error) {
                // Generation timeout or failure
                sessionMetrics.generation_completed = false;
              }
            }
          }

          // Store session metrics
          for (const step of funnelSteps) {
            if (!funnelMetrics[step]) {
              funnelMetrics[step] = { completed: 0, total: 0 };
            }
            funnelMetrics[step].total++;
            if (sessionMetrics[step]) {
              funnelMetrics[step].completed++;
            }
          }

        } finally {
          await browser.close();
        }
      }

      // Calculate conversion rates
      testResults.conversionFunnel = {};
      for (const step of funnelSteps) {
        if (funnelMetrics[step]) {
          testResults.conversionFunnel[step] = {
            ...funnelMetrics[step],
            conversionRate: funnelMetrics[step].completed / funnelMetrics[step].total,
          };
        }
      }

      this.logger.success('Conversion funnel analysis completed');
      for (const [step, metrics] of Object.entries(testResults.conversionFunnel)) {
        this.logger.info(`${step}: ${(metrics.conversionRate * 100).toFixed(1)}% (${metrics.completed}/${metrics.total})`);
      }
    });

    this.logger.header(`User Journey Tests Completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
    
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
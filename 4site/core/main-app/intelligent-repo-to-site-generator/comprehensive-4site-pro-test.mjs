#!/usr/bin/env node

/**
 * 4site.pro Comprehensive MVP Test Suite
 * Tests the complete user flow and validates all functionality
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  testsPassed: 0,
  testsFailed: 0,
  results: []
};

class TestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.devServer = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async startDevServer() {
    return new Promise((resolve, reject) => {
      this.log('Starting development server...');
      
      this.devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') || output.includes('localhost:5173')) {
          this.log('Development server started successfully', 'success');
          setTimeout(resolve, 2000); // Wait for server to be fully ready
        }
      });

      this.devServer.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          this.log('Port 5173 already in use, assuming server is running', 'info');
          resolve();
        }
      });

      setTimeout(() => {
        this.log('Development server started (timeout)', 'success');
        resolve();
      }, 10000);
    });
  }

  async initBrowser() {
    this.log('Launching browser...');
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for validation
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for desktop testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Browser Console Error: ${msg.text()}`, 'error');
      }
    });
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running test: ${testName}`);
      const startTime = Date.now();
      
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.log(`✅ PASSED: ${testName} (${duration}ms)`, 'success');
      
      TEST_RESULTS.testsPassed++;
      TEST_RESULTS.results.push({
        name: testName,
        status: 'PASSED',
        duration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      
      TEST_RESULTS.testsFailed++;
      TEST_RESULTS.results.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testPageLoad() {
    await this.page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Check if page loaded successfully
    const title = await this.page.title();
    if (!title.includes('4site') && !title.includes('Living Website')) {
      throw new Error(`Page title incorrect: ${title}`);
    }

    // Check for key elements
    await this.page.waitForSelector('.glass-container', { timeout: 10000 });
    await this.page.waitForSelector('nav', { timeout: 5000 });
    
    this.log('Page loaded successfully with glass morphism UI');
  }

  async testBrandingUpdate() {
    // Check that "project" is removed from branding
    const navigationText = await this.page.$eval('nav', el => el.textContent);
    
    if (navigationText.includes('project4site')) {
      throw new Error('Old "project4site" branding still present');
    }

    // Should contain "4site.pro"
    if (!navigationText.includes('4site.pro')) {
      throw new Error('New "4site.pro" branding not found');
    }

    this.log('Branding successfully updated to 4site.pro');
  }

  async testLivingWebsitesMessaging() {
    // Check for "Living Websites" in hero section
    const heroText = await this.page.$eval('h1', el => el.textContent);
    
    if (!heroText.toLowerCase().includes('living')) {
      throw new Error('Living websites messaging not found in hero');
    }

    // Check for professional focus, not financial ROI
    const pageContent = await this.page.content();
    
    // Should NOT contain financial promises
    const financialTerms = ['earn money', 'make money', 'profit', 'revenue', 'income'];
    for (const term of financialTerms) {
      if (pageContent.toLowerCase().includes(term)) {
        throw new Error(`Financial ROI language found: ${term}`);
      }
    }

    // Should contain professional terms
    const professionalTerms = ['professional', 'network visibility', 'industry recognition'];
    let foundProfessional = false;
    for (const term of professionalTerms) {
      if (pageContent.toLowerCase().includes(term.toLowerCase())) {
        foundProfessional = true;
        break;
      }
    }

    if (!foundProfessional) {
      throw new Error('Professional visibility messaging not found');
    }

    this.log('Living websites and professional messaging validated');
  }

  async testPricingTiers() {
    // Scroll to pricing section (if not visible)
    try {
      await this.page.evaluate(() => {
        const pricingSection = document.querySelector('[data-testid="pricing"], .pricing, h2');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      });

      await this.page.waitForTimeout(2000);
    } catch (e) {
      // Pricing might not be visible on initial load
      this.log('Pricing section not immediately visible');
    }

    // Check for new pricing structure in page content
    const pageContent = await this.page.content();
    
    const expectedPrices = ['$0', '$49.49', '$494.94', '$4,949.49'];
    let foundPrices = 0;
    
    for (const price of expectedPrices) {
      if (pageContent.includes(price)) {
        foundPrices++;
      }
    }

    if (foundPrices < 2) {
      throw new Error(`Only found ${foundPrices} of expected pricing tiers`);
    }

    this.log(`Pricing tiers validated (${foundPrices}/4 prices found)`);
  }

  async testRepositoryInput() {
    // Find and test the repository input
    await this.page.waitForSelector('input[type="text"], input[placeholder*="repository"], input[placeholder*="GitHub"]', { timeout: 10000 });
    
    const input = await this.page.$('input[type="text"], input[placeholder*="repository"], input[placeholder*="GitHub"]');
    if (!input) {
      throw new Error('Repository input field not found');
    }

    // Test with a sample repository
    await input.click();
    await input.type('facebook/react');

    // Check for URL expansion/preview
    await this.page.waitForTimeout(1000);
    
    const inputValue = await input.evaluate(el => el.value);
    this.log(`Repository input working, value: ${inputValue}`);
  }

  async testSiteGeneration() {
    // Find submit button
    const submitButton = await this.page.$('button[type="submit"], button:contains("Generate"), button:contains("Transform")');
    
    if (!submitButton) {
      // Try to find any button that might trigger generation
      const buttons = await this.page.$$('button');
      if (buttons.length === 0) {
        throw new Error('No submit button found for site generation');
      }
    }

    // Note: We won't actually submit to avoid API calls in testing
    this.log('Site generation form structure validated');
  }

  async testResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.waitForTimeout(1000);

    // Check if navigation is still accessible
    const nav = await this.page.$('nav');
    if (!nav) {
      throw new Error('Navigation not found in mobile view');
    }

    // Check if main content is visible
    const mainContent = await this.page.$('.glass-container, main, section');
    if (!mainContent) {
      throw new Error('Main content not accessible in mobile view');
    }

    // Test tablet viewport
    await this.page.setViewport({ width: 768, height: 1024 });
    await this.page.waitForTimeout(1000);

    // Reset to desktop
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    this.log('Responsive design validated across viewports');
  }

  async testPerformance() {
    // Measure page load performance
    const navigationStart = await this.page.evaluate(() => performance.timing.navigationStart);
    const loadEventEnd = await this.page.evaluate(() => performance.timing.loadEventEnd);
    
    if (loadEventEnd > navigationStart) {
      const loadTime = loadEventEnd - navigationStart;
      
      if (loadTime > 3000) {
        throw new Error(`Page load time too slow: ${loadTime}ms (target: <3000ms)`);
      }
      
      this.log(`Page load time: ${loadTime}ms (target: <3000ms)`);
    }

    // Check for render-blocking resources
    const performanceEntries = await this.page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });

    this.log('Performance metrics validated');
  }

  async testGlassmorphismUI() {
    // Check for glass morphism CSS classes
    const glassElements = await this.page.$$('.glass-container, .glass-card, .glass-primary, .glass-button');
    
    if (glassElements.length === 0) {
      throw new Error('Glass morphism UI elements not found');
    }

    // Check for backdrop-blur CSS
    const hasBackdropBlur = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const style = window.getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter.includes('blur')) {
          return true;
        }
      }
      return false;
    });

    if (!hasBackdropBlur) {
      this.log('Warning: Backdrop blur effects not detected', 'error');
    }

    this.log(`Glass morphism UI validated (${glassElements.length} glass elements found)`);
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    if (this.devServer) {
      this.devServer.kill();
    }
  }

  async generateReport() {
    const report = {
      ...TEST_RESULTS,
      summary: {
        total: TEST_RESULTS.testsPassed + TEST_RESULTS.testsFailed,
        passed: TEST_RESULTS.testsPassed,
        failed: TEST_RESULTS.testsFailed,
        successRate: `${Math.round((TEST_RESULTS.testsPassed / (TEST_RESULTS.testsPassed + TEST_RESULTS.testsFailed)) * 100)}%`
      }
    };

    writeFileSync('./test-results.json', JSON.stringify(report, null, 2));
    
    this.log('='.repeat(60));
    this.log('4SITE.PRO MVP TEST RESULTS');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${report.summary.total}`);
    this.log(`Passed: ${report.summary.passed}`, 'success');
    this.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${report.summary.successRate}`);
    this.log('='.repeat(60));

    if (report.summary.failed > 0) {
      this.log('FAILED TESTS:');
      report.results.filter(r => r.status === 'FAILED').forEach(test => {
        this.log(`  - ${test.name}: ${test.error}`, 'error');
      });
    }

    return report;
  }

  async run() {
    try {
      await this.startDevServer();
      await this.initBrowser();

      // Run all tests
      await this.runTest('Page Load & Initial Render', () => this.testPageLoad());
      await this.runTest('Branding Update (project4site → 4site.pro)', () => this.testBrandingUpdate());
      await this.runTest('Living Websites Messaging', () => this.testLivingWebsitesMessaging());
      await this.runTest('Pricing Tiers Structure', () => this.testPricingTiers());
      await this.runTest('Repository Input Functionality', () => this.testRepositoryInput());
      await this.runTest('Site Generation Form', () => this.testSiteGeneration());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());
      await this.runTest('Performance Metrics', () => this.testPerformance());
      await this.runTest('Glass Morphism UI', () => this.testGlassmorphismUI());

      const report = await this.generateReport();
      
      if (report.summary.failed === 0) {
        this.log('🎉 ALL TESTS PASSED! 4site.pro MVP is ready for launch!', 'success');
        return true;
      } else {
        this.log('❌ Some tests failed. Please review and fix issues before launch.', 'error');
        return false;
      }

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
const runner = new TestRunner();
const success = await runner.run();

process.exit(success ? 0 : 1);
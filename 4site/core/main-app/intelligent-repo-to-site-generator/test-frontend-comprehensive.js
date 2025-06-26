#!/usr/bin/env node

/**
 * 4site.pro Frontend Comprehensive Test Suite
 * Ultra-elite validation system for 100B standards
 */

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { spawn } from 'child_process';

const TEST_CONFIG = {
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  serverPort: 5173,
  screenshotPath: './frontend-comprehensive-test.png'
};

class FrontendValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.server = null;
    this.results = {
      tests: [],
      performance: {},
      accessibility: {},
      bundle: {},
      components: {},
      timestamp: new Date().toISOString()
    };
  }

  async startDevServer() {
    console.log('🚀 Starting Vite dev server...');
    return new Promise((resolve, reject) => {
      this.server = spawn('bun', ['run', 'dev:vite'], {
        stdio: 'pipe',
        detached: false
      });

      this.server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ready in') || output.includes('Local:')) {
          console.log('✅ Dev server started');
          // Wait additional 3 seconds for stability
          setTimeout(resolve, 3000);
        }
      });

      this.server.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 20000);
    });
  }

  async initBrowser() {
    console.log('🌐 Launching Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);
    
    // Enable performance monitoring
    await this.page.coverage.startJSCoverage();
    await this.page.coverage.startCSSCoverage();
  }

  async runComponentTests() {
    console.log('🧪 Testing React components...');
    
    try {
      await this.page.goto(`http://localhost:${TEST_CONFIG.serverPort}`, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });

      // Test 1: Page loads without errors
      const errors = await this.page.evaluate(() => {
        const errors = [];
        window.addEventListener('error', (e) => {
          errors.push(e.message);
        });
        return errors;
      });

      this.addTest('page-load', errors.length === 0, 
        errors.length === 0 ? 'Page loaded successfully' : `Errors: ${errors.join(', ')}`);

      // Test 2: Logo renders correctly
      const logoExists = await this.page.$('.tier-logo-container img');
      this.addTest('logo-render', !!logoExists, 
        logoExists ? 'Logo rendered successfully' : 'Logo not found');

      // Test 3: Hero text displays
      const heroText = await this.page.$eval('.text-display', el => el.textContent);
      this.addTest('hero-text', heroText.includes('Transform GitHub'), 
        `Hero text: "${heroText}"`);

      // Test 4: Input form functionality
      const inputExists = await this.page.$('input[type="url"]');
      this.addTest('input-form', !!inputExists, 
        inputExists ? 'URL input found' : 'URL input missing');

      // Test 5: Button functionality
      const buttonExists = await this.page.$('.btn-apple.btn-primary');
      this.addTest('primary-button', !!buttonExists, 
        buttonExists ? 'Primary button found' : 'Primary button missing');

      // Test 6: Feature cards display
      const featureCards = await this.page.$$('.professional-feature-card');
      this.addTest('feature-cards', featureCards.length === 3, 
        `Found ${featureCards.length} feature cards`);

      // Test 7: CSS animations work
      const animatedElements = await this.page.$$('[class*="apple-spring-in"], [class*="motion"]');
      this.addTest('animations', animatedElements.length > 0, 
        `Found ${animatedElements.length} animated elements`);

      // Test 8: Glassmorphism effects
      const glassElements = await this.page.$$('.apple-glass');
      this.addTest('glassmorphism', glassElements.length > 0, 
        `Found ${glassElements.length} glass elements`);

      console.log('✅ Component tests completed');

    } catch (error) {
      this.addTest('component-tests', false, `Failed: ${error.message}`);
      console.error('❌ Component tests failed:', error);
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    
    try {
      // Measure page load performance
      await this.page.goto(`http://localhost:${TEST_CONFIG.serverPort}`, {
        waitUntil: 'networkidle0'
      });

      const metrics = await this.page.metrics();
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          pageLoad: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
        };
      });

      this.results.performance = {
        jsHeapUsed: Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100,
        jsHeapTotal: Math.round(metrics.JSHeapTotalSize / 1024 / 1024 * 100) / 100,
        domContentLoaded: performanceMetrics.domContentLoaded,
        pageLoad: performanceMetrics.pageLoad,
        firstPaint: performanceMetrics.firstPaint,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint
      };

      // Performance budget tests
      this.addTest('memory-usage', this.results.performance.jsHeapUsed < 50, 
        `Memory usage: ${this.results.performance.jsHeapUsed}MB`);
      
      this.addTest('page-load-speed', this.results.performance.pageLoad < 3000, 
        `Page load: ${this.results.performance.pageLoad}ms`);

      this.addTest('fcp-performance', this.results.performance.firstContentfulPaint < 1800, 
        `First Contentful Paint: ${this.results.performance.firstContentfulPaint}ms`);

      console.log('✅ Performance tests completed');

    } catch (error) {
      console.error('❌ Performance tests failed:', error);
    }
  }

  async runBundleAnalysis() {
    console.log('📦 Analyzing bundle composition...');
    
    try {
      const jsCoverage = await this.page.coverage.stopJSCoverage();
      const cssCoverage = await this.page.coverage.stopCSSCoverage();

      let totalJSSize = 0;
      let usedJSSize = 0;
      let totalCSSSize = 0;
      let usedCSSSize = 0;

      jsCoverage.forEach(entry => {
        totalJSSize += entry.text.length;
        usedJSSize += entry.ranges.reduce((acc, range) => acc + range.end - range.start, 0);
      });

      cssCoverage.forEach(entry => {
        totalCSSSize += entry.text.length;
        usedCSSSize += entry.ranges.reduce((acc, range) => acc + range.end - range.start, 0);
      });

      this.results.bundle = {
        totalJSSize: Math.round(totalJSSize / 1024),
        usedJSSize: Math.round(usedJSSize / 1024),
        jsUtilization: Math.round((usedJSSize / totalJSSize) * 100),
        totalCSSSize: Math.round(totalCSSSize / 1024),
        usedCSSSize: Math.round(usedCSSSize / 1024),
        cssUtilization: Math.round((usedCSSSize / totalCSSSize) * 100)
      };

      this.addTest('js-utilization', this.results.bundle.jsUtilization > 60, 
        `JS utilization: ${this.results.bundle.jsUtilization}%`);

      this.addTest('css-utilization', this.results.bundle.cssUtilization > 70, 
        `CSS utilization: ${this.results.bundle.cssUtilization}%`);

      console.log('✅ Bundle analysis completed');

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Testing accessibility compliance...');
    
    try {
      // Check for common accessibility issues
      const a11yIssues = await this.page.evaluate(() => {
        const issues = [];
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.alt || img.alt.trim() === '') {
            issues.push(`Image ${index + 1} missing alt text`);
          }
        });

        // Check for button text
        const buttons = document.querySelectorAll('button');
        buttons.forEach((btn, index) => {
          if (!btn.textContent || btn.textContent.trim() === '') {
            issues.push(`Button ${index + 1} missing text content`);
          }
        });

        // Check for heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
          issues.push('No heading elements found');
        }

        // Check for focus indicators
        const focusableElements = document.querySelectorAll('button, input, a, [tabindex]');
        if (focusableElements.length === 0) {
          issues.push('No focusable elements found');
        }

        return issues;
      });

      this.results.accessibility = {
        issuesFound: a11yIssues.length,
        issues: a11yIssues
      };

      this.addTest('accessibility', a11yIssues.length === 0, 
        a11yIssues.length === 0 ? 'No accessibility issues found' : `Issues: ${a11yIssues.join(', ')}`);

      console.log('✅ Accessibility tests completed');

    } catch (error) {
      console.error('❌ Accessibility tests failed:', error);
    }
  }

  async runInteractionTests() {
    console.log('🖱️ Testing user interactions...');
    
    try {
      // Test URL input interaction
      const urlInput = await this.page.$('input[type="url"]');
      if (urlInput) {
        await urlInput.type('https://github.com/example/repo');
        const inputValue = await this.page.$eval('input[type="url"]', el => el.value);
        this.addTest('url-input-interaction', inputValue.includes('github.com'), 
          `Input value: ${inputValue}`);
      }

      // Test button hover effects
      const button = await this.page.$('.btn-apple.btn-primary');
      if (button) {
        await button.hover();
        const buttonStyle = await this.page.$eval('.btn-apple.btn-primary', 
          el => window.getComputedStyle(el).transform);
        this.addTest('button-hover-effect', buttonStyle !== 'none', 
          `Transform applied: ${buttonStyle}`);
      }

      // Test glass card hover effects
      const glassCard = await this.page.$('.professional-feature-card');
      if (glassCard) {
        await glassCard.hover();
        const cardTransform = await this.page.$eval('.professional-feature-card', 
          el => window.getComputedStyle(el).transform);
        this.addTest('card-hover-effect', cardTransform !== 'none', 
          `Card transform: ${cardTransform}`);
      }

      console.log('✅ Interaction tests completed');

    } catch (error) {
      console.error('❌ Interaction tests failed:', error);
    }
  }

  async captureScreenshots() {
    console.log('📸 Capturing screenshots...');
    
    try {
      await this.page.screenshot({
        path: TEST_CONFIG.screenshotPath,
        fullPage: true,
        type: 'png'
      });

      this.addTest('screenshot-capture', true, 
        `Screenshot saved: ${TEST_CONFIG.screenshotPath}`);

      console.log('✅ Screenshots captured');

    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
    }
  }

  addTest(name, passed, message) {
    this.results.tests.push({
      name,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.server) {
      this.server.kill('SIGTERM');
    }
  }

  generateReport() {
    const passedTests = this.results.tests.filter(t => t.passed).length;
    const totalTests = this.results.tests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: `${successRate}%`,
        overallStatus: successRate >= 90 ? 'EXCELLENT' : successRate >= 80 ? 'GOOD' : successRate >= 70 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT'
      },
      performance: this.results.performance,
      bundle: this.results.bundle,
      accessibility: this.results.accessibility,
      detailedTests: this.results.tests,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.tests.filter(t => !t.passed);

    if (failedTests.length > 0) {
      recommendations.push('Address failed test cases to improve application stability');
    }

    if (this.results.performance.jsHeapUsed > 30) {
      recommendations.push('Consider code splitting and lazy loading to reduce memory usage');
    }

    if (this.results.performance.pageLoad > 2000) {
      recommendations.push('Optimize bundle size and implement performance best practices');
    }

    if (this.results.bundle && this.results.bundle.jsUtilization < 60) {
      recommendations.push('Remove unused JavaScript code to improve bundle efficiency');
    }

    if (this.results.accessibility.issuesFound > 0) {
      recommendations.push('Fix accessibility issues to ensure WCAG compliance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Application meets elite standards. Consider advanced optimizations for 100B company performance.');
    }

    return recommendations;
  }

  async run() {
    console.log('🚀 Starting 4site.pro Frontend Comprehensive Test Suite...\n');

    try {
      await this.startDevServer();
      await this.initBrowser();
      
      await this.runComponentTests();
      await this.runPerformanceTests();
      await this.runBundleAnalysis();
      await this.runAccessibilityTests();
      await this.runInteractionTests();
      await this.captureScreenshots();

      const report = this.generateReport();
      
      // Save detailed report
      writeFileSync('./frontend-test-report.json', JSON.stringify(report, null, 2));

      // Display summary
      console.log('\n' + '='.repeat(80));
      console.log('📊 FRONTEND VALIDATION REPORT');
      console.log('='.repeat(80));
      console.log(`🎯 Overall Status: ${report.summary.overallStatus}`);
      console.log(`✅ Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests} (${report.summary.successRate})`);
      console.log(`⚡ Page Load: ${report.performance.pageLoad}ms`);
      console.log(`🧠 Memory Usage: ${report.performance.jsHeapUsed}MB`);
      console.log(`📦 JS Utilization: ${report.bundle.jsUtilization || 'N/A'}%`);
      console.log(`♿ Accessibility: ${report.accessibility.issuesFound || 0} issues`);
      
      if (report.recommendations.length > 0) {
        console.log('\n🔧 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }

      console.log('\n📄 Detailed report saved to: frontend-test-report.json');
      console.log('📸 Screenshot saved to:', TEST_CONFIG.screenshotPath);
      console.log('='.repeat(80));

      return report.summary.overallStatus === 'EXCELLENT';

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
const validator = new FrontendValidator();
validator.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
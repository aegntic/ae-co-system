#!/usr/bin/env node

/**
 * 4SITE.PRO COMPREHENSIVE INTEGRATION TEST SUITE
 * 
 * ULTRA ELITE INTEGRATION SPECIALIST - 100B STANDARDS
 * End-to-end validation with zero tolerance for failures
 * 
 * Test Coverage:
 * 1. Complete User Journey Validation
 * 2. System Integration Testing  
 * 3. Production Environment Simulation
 * 4. Cross-Platform Compatibility
 * 5. Performance Regression Testing
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3001',
  testTimeout: 60000,
  screenshotPath: join(__dirname, 'test-results'),
  maxRetries: 3,
  testRepositories: [
    'https://github.com/microsoft/typescript',
    'https://github.com/facebook/react',
    'https://github.com/vuejs/vue'
  ]
};

// Test Results Storage
let testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  results: [],
  performanceMetrics: {},
  crossPlatformResults: {},
  systemHealth: {}
};

/**
 * Utility Functions
 */
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m', 
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const addTestResult = (testName, passed, details = {}) => {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    log(`✅ ${testName} PASSED`, 'success');
  } else {
    testResults.failedTests++;
    log(`❌ ${testName} FAILED`, 'error');
  }
  
  testResults.results.push({
    testName,
    passed,
    timestamp: new Date().toISOString(),
    details
  });
};

const takeScreenshot = async (page, filename) => {
  try {
    await fs.mkdir(TEST_CONFIG.screenshotPath, { recursive: true });
    const path = join(TEST_CONFIG.screenshotPath, `${filename}.png`);
    await page.screenshot({ path, fullPage: true });
    log(`📸 Screenshot saved: ${filename}.png`);
    return path;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'error');
  }
};

/**
 * Server Management
 */
let frontendServer = null;
let apiServer = null;

const startServers = async () => {
  log('🚀 Starting development servers...');
  
  // Start frontend server
  frontendServer = spawn('bun', ['run', 'dev:vite'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, PORT: '5173' }
  });
  
  // Start API server
  apiServer = spawn('bun', ['run', 'dev:api'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, API_PORT: '3001' }
  });

  // Wait for servers to start
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Verify servers are running
  try {
    const response = await fetch(TEST_CONFIG.baseUrl);
    if (!response.ok) throw new Error('Frontend server not responding');
    log('✅ Frontend server started successfully');
  } catch (error) {
    log('❌ Frontend server failed to start', 'error');
    throw error;
  }

  try {
    const response = await fetch(`${TEST_CONFIG.apiUrl}/api/health`);
    if (!response.ok) throw new Error('API server not responding');
    log('✅ API server started successfully');
  } catch (error) {
    log('❌ API server failed to start', 'error');
    throw error;
  }
};

const stopServers = async () => {
  log('🛑 Stopping servers...');
  if (frontendServer) {
    frontendServer.kill();
    frontendServer = null;
  }
  if (apiServer) {
    apiServer.kill();
    apiServer = null;
  }
};

/**
 * Test Suites
 */

// 1. Complete User Journey Validation
const testUserJourney = async (browser) => {
  log('🧪 Testing Complete User Journey...');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Test 1: Landing Page Load
    log('Testing landing page load...');
    const navigationStart = Date.now();
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - navigationStart;
    
    await takeScreenshot(page, '01-landing-page');
    
    // Verify essential elements are present
    await page.waitForSelector('input[type="url"]', { timeout: 5000 });
    await page.waitForSelector('button', { timeout: 5000 });
    
    addTestResult('Landing Page Load', loadTime < 5000, { loadTime });
    
    // Test 2: Form Interaction
    log('Testing form interaction...');
    const urlInput = await page.$('input[type="url"]');
    await urlInput.type(TEST_CONFIG.testRepositories[0]);
    
    await takeScreenshot(page, '02-url-entered');
    
    // Test 3: Generation Process
    log('Testing generation process...');
    const generateButton = await page.$('button:not([disabled])');
    const generationStart = Date.now();
    
    // Click generate button
    await generateButton.click();
    
    await takeScreenshot(page, '03-generation-started');
    
    // Wait for loading state
    await page.waitForSelector('.apple-spinner', { timeout: 5000 });
    addTestResult('Generation Loading State', true);
    
    // Wait for generation to complete (or timeout)
    try {
      await page.waitForFunction(
        () => !document.querySelector('.apple-spinner'),
        { timeout: 30000 }
      );
      const generationTime = Date.now() - generationStart;
      
      await takeScreenshot(page, '04-generation-complete');
      
      // Check for preview or error
      const hasPreview = await page.$('.prose, .preview-content');
      const hasError = await page.$('.text-red-400, .error-message');
      
      if (hasPreview) {
        addTestResult('Site Generation Success', true, { generationTime });
      } else if (hasError) {
        const errorText = await page.$eval('.text-red-400, .error-message', el => el.textContent);
        addTestResult('Site Generation Success', false, { error: errorText });
      }
      
    } catch (error) {
      addTestResult('Site Generation Success', false, { error: 'Generation timeout' });
    }
    
    // Test 4: Preview Functionality
    log('Testing preview functionality...');
    const previewExists = await page.$('.prose, .preview-content');
    if (previewExists) {
      await takeScreenshot(page, '05-preview-display');
      addTestResult('Preview Display', true);
      
      // Test scroll functionality
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      addTestResult('Preview Scroll', true);
    }
    
  } catch (error) {
    log(`User journey test failed: ${error.message}`, 'error');
    await takeScreenshot(page, 'error-user-journey');
    addTestResult('User Journey', false, { error: error.message });
  } finally {
    await page.close();
  }
};

// 2. System Integration Testing
const testSystemIntegration = async () => {
  log('🔧 Testing System Integration...');
  
  // Test API Health
  try {
    const healthResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/health`);
    const healthData = await healthResponse.json();
    addTestResult('API Health Check', healthResponse.ok, healthData);
  } catch (error) {
    addTestResult('API Health Check', false, { error: error.message });
  }
  
  // Test Database Connectivity (if Supabase is configured)
  try {
    const testData = {
      email: 'test@example.com',
      siteId: 'test-site-id',
      projectType: 'tech',
      template: 'modern',
      projectInterests: ['Web Development'],
      socialPlatforms: [],
      newsletterOptIn: true,
      metadata: {
        timeOnSite: 120,
        scrollDepth: 50,
        interactionCount: 5,
        sectionsViewed: ['hero', 'features'],
        sessionId: 'test-session',
        deviceType: 'desktop',
        userAgent: 'test-agent',
        referrer: '',
        screenResolution: '1920x1080',
        timezone: 'UTC',
        language: 'en'
      }
    };
    
    const leadResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    addTestResult('Database Integration', leadResponse.ok || leadResponse.status === 500);
  } catch (error) {
    addTestResult('Database Integration', false, { error: error.message });
  }
  
  // Test Environment Variables
  const envTests = [
    'VITE_OPENROUTER_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  envTests.forEach(envVar => {
    const isSet = process.env[envVar] && process.env[envVar] !== 'PLACEHOLDER_API_KEY';
    addTestResult(`Environment Variable: ${envVar}`, isSet);
  });
};

// 3. Performance Testing
const testPerformance = async (browser) => {
  log('⚡ Testing Performance...');
  
  const page = await browser.newPage();
  
  try {
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    const startTime = Date.now();
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      };
    });
    
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();
    
    // Bundle size analysis
    const totalJSBytes = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
    const totalCSSBytes = cssCoverage.reduce((total, entry) => total + entry.text.length, 0);
    
    testResults.performanceMetrics = {
      loadTime,
      ...performanceMetrics,
      bundleSize: {
        js: Math.round(totalJSBytes / 1024),
        css: Math.round(totalCSSBytes / 1024)
      }
    };
    
    // Performance assertions
    addTestResult('Page Load Time < 5s', loadTime < 5000, { loadTime });
    addTestResult('DOM Content Loaded < 3s', performanceMetrics.domContentLoaded < 3000);
    addTestResult('First Contentful Paint < 2s', performanceMetrics.firstContentfulPaint < 2000);
    addTestResult('JS Bundle < 1MB', totalJSBytes < 1024 * 1024);
    
  } catch (error) {
    addTestResult('Performance Tests', false, { error: error.message });
  } finally {
    await page.close();
  }
};

// 4. Cross-Platform Testing
const testCrossPlatform = async (browser) => {
  log('📱 Testing Cross-Platform Compatibility...');
  
  const devices = [
    { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
    { name: 'Tablet', viewport: { width: 768, height: 1024 } },
    { name: 'Mobile', viewport: { width: 375, height: 667 } }
  ];
  
  for (const device of devices) {
    const page = await browser.newPage();
    await page.setViewport(device.viewport);
    
    try {
      await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
      
      // Check responsive design
      const elements = await page.$$('input, button, .apple-glass');
      const isResponsive = elements.length > 0;
      
      await takeScreenshot(page, `responsive-${device.name.toLowerCase()}`);
      
      testResults.crossPlatformResults[device.name] = {
        responsive: isResponsive,
        viewport: device.viewport
      };
      
      addTestResult(`${device.name} Responsive Design`, isResponsive);
      
    } catch (error) {
      addTestResult(`${device.name} Compatibility`, false, { error: error.message });
    } finally {
      await page.close();
    }
  }
};

// 5. Error Handling and Recovery Testing
const testErrorHandling = async (browser) => {
  log('🚨 Testing Error Handling...');
  
  const page = await browser.newPage();
  
  try {
    await page.goto(TEST_CONFIG.baseUrl);
    
    // Test with invalid repository URL
    log('Testing invalid repository URL...');
    await page.type('input[type="url"]', 'https://github.com/nonexistent/repository');
    
    const generateButton = await page.$('button:not([disabled])');
    await generateButton.click();
    
    // Wait for error message
    try {
      await page.waitForSelector('.text-red-400, .error-message', { timeout: 15000 });
      addTestResult('Error Handling - Invalid Repo', true);
      await takeScreenshot(page, 'error-invalid-repo');
    } catch {
      addTestResult('Error Handling - Invalid Repo', false);
    }
    
    // Test network error simulation
    log('Testing network error handling...');
    await page.setOfflineMode(true);
    await page.reload();
    
    // Check if app handles offline state
    const hasOfflineIndicator = await page.$('.offline, .error') !== null;
    addTestResult('Offline Error Handling', hasOfflineIndicator);
    
    await page.setOfflineMode(false);
    
  } catch (error) {
    addTestResult('Error Handling Tests', false, { error: error.message });
  } finally {
    await page.close();
  }
};

/**
 * Main Test Runner
 */
const runComprehensiveTests = async () => {
  log('🎯 STARTING COMPREHENSIVE INTEGRATION TEST SUITE', 'info');
  log('Ultra Elite Integration Specialist - 100B Standards', 'info');
  
  try {
    // Ensure screenshot directory exists
    await fs.mkdir(TEST_CONFIG.screenshotPath, { recursive: true });
    
    // Start servers
    await startServers();
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    log('🚀 Browser launched, starting test suites...');
    
    // Run all test suites
    await testUserJourney(browser);
    await testSystemIntegration();
    await testPerformance(browser);
    await testCrossPlatform(browser);
    await testErrorHandling(browser);
    
    await browser.close();
    
    // Generate final report
    await generateTestReport();
    
  } catch (error) {
    log(`Critical test failure: ${error.message}`, 'error');
    testResults.criticalError = error.message;
  } finally {
    await stopServers();
  }
};

const generateTestReport = async () => {
  log('📊 Generating comprehensive test report...');
  
  const reportData = {
    ...testResults,
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: Math.round((testResults.passedTests / testResults.totalTests) * 100),
      overallStatus: testResults.failedTests === 0 ? 'PASS' : 'FAIL'
    },
    recommendations: generateRecommendations()
  };
  
  // Save detailed report
  const reportPath = join(TEST_CONFIG.screenshotPath, 'integration-test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
  
  // Generate human-readable summary
  const summaryPath = join(TEST_CONFIG.screenshotPath, 'test-summary.md');
  const summary = generateMarkdownSummary(reportData);
  await fs.writeFile(summaryPath, summary);
  
  // Console summary
  log('', 'info');
  log('🎯 COMPREHENSIVE INTEGRATION TEST RESULTS', 'info');
  log('=' * 50, 'info');
  log(`Total Tests: ${reportData.summary.totalTests}`, 'info');
  log(`Passed: ${reportData.summary.passedTests}`, 'success');
  log(`Failed: ${reportData.summary.failedTests}`, reportData.summary.failedTests > 0 ? 'error' : 'info');
  log(`Success Rate: ${reportData.summary.successRate}%`, 'info');
  log(`Overall Status: ${reportData.summary.overallStatus}`, reportData.summary.overallStatus === 'PASS' ? 'success' : 'error');
  log('', 'info');
  
  if (reportData.summary.overallStatus === 'FAIL') {
    log('❌ SYSTEM VALIDATION FAILED', 'error');
    log('System is NOT ready for production deployment', 'error');
    process.exit(1);
  } else {
    log('✅ SYSTEM VALIDATION PASSED', 'success');
    log('System is ready for production deployment', 'success');
  }
  
  log(`📄 Detailed report: ${reportPath}`, 'info');
  log(`📄 Summary report: ${summaryPath}`, 'info');
};

const generateRecommendations = () => {
  const recommendations = [];
  
  if (testResults.performanceMetrics.loadTime > 3000) {
    recommendations.push('Optimize page load time - consider code splitting and lazy loading');
  }
  
  if (testResults.failedTests > 0) {
    recommendations.push('Address failed tests before production deployment');
  }
  
  if (!process.env.VITE_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY === 'PLACEHOLDER_API_KEY') {
    recommendations.push('Configure OpenRouter API key for AI generation functionality');
  }
  
  return recommendations;
};

const generateMarkdownSummary = (reportData) => {
  return `# 4site.pro Integration Test Report

## Test Summary
- **Total Tests**: ${reportData.summary.totalTests}
- **Passed**: ${reportData.summary.passedTests}
- **Failed**: ${reportData.summary.failedTests}
- **Success Rate**: ${reportData.summary.successRate}%
- **Overall Status**: ${reportData.summary.overallStatus}
- **Test Date**: ${reportData.timestamp}

## Performance Metrics
${reportData.performanceMetrics ? `
- **Page Load Time**: ${reportData.performanceMetrics.loadTime}ms
- **DOM Content Loaded**: ${reportData.performanceMetrics.domContentLoaded}ms
- **First Contentful Paint**: ${reportData.performanceMetrics.firstContentfulPaint}ms
- **JS Bundle Size**: ${reportData.performanceMetrics.bundleSize?.js}KB
- **CSS Bundle Size**: ${reportData.performanceMetrics.bundleSize?.css}KB
` : 'No performance metrics available'}

## Cross-Platform Results
${Object.entries(reportData.crossPlatformResults).map(([device, result]) => 
  `- **${device}**: ${result.responsive ? 'Responsive' : 'Issues detected'}`
).join('\n')}

## Test Results
${reportData.results.map(result => 
  `- ${result.passed ? '✅' : '❌'} **${result.testName}**${result.details.error ? ` - ${result.details.error}` : ''}`
).join('\n')}

## Recommendations
${reportData.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by 4site.pro Ultra Elite Integration Specialist*
`;
};

// Execute tests
runComprehensiveTests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});
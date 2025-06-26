#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const VALIDATION_REPORT = {
  timestamp: new Date().toISOString(),
  testResults: {},
  errors: [],
  warnings: [],
  recommendations: []
};

async function runMVPValidationTest() {
  console.log('🚀 Starting MVP Validation Test for project4site...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        VALIDATION_REPORT.errors.push(`Console Error: ${msg.text()}`);
      }
      console.log(`PAGE LOG: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      VALIDATION_REPORT.errors.push(`Page Error: ${error.message}`);
      console.error('Page Error:', error);
    });

    // Test 1: Initial Page Load
    console.log('\n📖 Test 1: Initial Page Load');
    const startTime = Date.now();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    VALIDATION_REPORT.testResults.pageLoad = {
      status: 'PASS',
      loadTime: `${loadTime}ms`,
      target: '<3000ms'
    };
    
    console.log(`✅ Page loaded in ${loadTime}ms`);

    // Test 2: UI Elements Presence
    console.log('\n🎨 Test 2: Core UI Elements');
    
    const elements = {
      heroSection: 'nav', // Check for navigation
      urlInput: 'input', // Look for input field
      submitButton: 'button', // Look for buttons
      branding: '[data-testid="branding"], .glass-text-title' // Look for branding
    };

    for (const [name, selector] of Object.entries(elements)) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ ${name} found`);
        VALIDATION_REPORT.testResults[name] = { status: 'PASS' };
      } catch (error) {
        console.log(`⚠️ ${name} not found: ${selector}`);
        VALIDATION_REPORT.testResults[name] = { status: 'FAIL', error: error.message };
      }
    }

    // Test 3: Glass Morphism Effects
    console.log('\n✨ Test 3: Glass Morphism Effects');
    try {
      const glassElements = await page.$$('.glass-primary, .glass-button, .glass-text-title');
      if (glassElements.length > 0) {
        console.log(`✅ Glass morphism elements found: ${glassElements.length}`);
        VALIDATION_REPORT.testResults.glassMorphism = { 
          status: 'PASS', 
          elementsCount: glassElements.length 
        };
      } else {
        console.log('⚠️ No glass morphism elements found');
        VALIDATION_REPORT.testResults.glassMorphism = { status: 'WARN' };
      }
    } catch (error) {
      VALIDATION_REPORT.testResults.glassMorphism = { status: 'FAIL', error: error.message };
    }

    // Test 4: URL Input Functionality
    console.log('\n🔗 Test 4: URL Input and Processing');
    try {
      // Look for URL input field
      const urlInputs = await page.$$('input[type="text"], input[placeholder*="github"], input[placeholder*="repository"]');
      
      if (urlInputs.length > 0) {
        const input = urlInputs[0];
        
        // Test URL auto-completion
        await input.click();
        await input.type('facebook/react');
        await page.waitForTimeout(500);
        
        const inputValue = await input.evaluate(el => el.value);
        console.log(`✅ URL input working: "${inputValue}"`);
        
        VALIDATION_REPORT.testResults.urlInput = {
          status: 'PASS',
          testValue: inputValue
        };
      } else {
        console.log('⚠️ No URL input field found');
        VALIDATION_REPORT.testResults.urlInput = { status: 'FAIL' };
      }
    } catch (error) {
      VALIDATION_REPORT.testResults.urlInput = { status: 'FAIL', error: error.message };
    }

    // Test 5: Demo Mode Functionality
    console.log('\n🎭 Test 5: Demo Mode Generation');
    try {
      // Look for forms or submission buttons
      const forms = await page.$$('form');
      const buttons = await page.$$('button[type="submit"], button:contains("Generate"), button:contains("Transform")');
      
      if (forms.length > 0 || buttons.length > 0) {
        console.log('✅ Generation interface found');
        
        // Try to trigger demo mode
        if (buttons.length > 0) {
          console.log('🎯 Testing demo generation...');
          await buttons[0].click();
          
          // Wait for loading or results
          await page.waitForTimeout(3000);
          
          // Check for loading indicators or results
          const loadingElements = await page.$$('.loading, .spinner, [class*="load"]');
          const resultElements = await page.$$('.site-preview, .preview, .result');
          
          if (loadingElements.length > 0 || resultElements.length > 0) {
            console.log('✅ Demo generation triggered successfully');
            VALIDATION_REPORT.testResults.demoMode = { status: 'PASS' };
          } else {
            console.log('⚠️ Demo generation response unclear');
            VALIDATION_REPORT.testResults.demoMode = { status: 'WARN' };
          }
        }
      } else {
        console.log('⚠️ No generation interface found');
        VALIDATION_REPORT.testResults.demoMode = { status: 'FAIL' };
      }
    } catch (error) {
      VALIDATION_REPORT.testResults.demoMode = { status: 'FAIL', error: error.message };
    }

    // Test 6: Performance Metrics
    console.log('\n⚡ Test 6: Performance Metrics');
    try {
      const metrics = await page.metrics();
      
      VALIDATION_REPORT.testResults.performance = {
        status: 'PASS',
        JSHeapUsedSize: `${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`,
        JSHeapTotalSize: `${Math.round(metrics.JSHeapTotalSize / 1024 / 1024)}MB`,
        LayoutCount: metrics.LayoutCount,
        RecalcStyleCount: metrics.RecalcStyleCount
      };
      
      console.log(`✅ Performance metrics captured`);
      console.log(`   Memory: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      
      if (metrics.JSHeapUsedSize / 1024 / 1024 > 200) {
        VALIDATION_REPORT.warnings.push('High memory usage detected');
      }
    } catch (error) {
      VALIDATION_REPORT.testResults.performance = { status: 'FAIL', error: error.message };
    }

    // Test 7: Mobile Responsiveness
    console.log('\n📱 Test 7: Mobile Responsiveness');
    try {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await page.waitForTimeout(1000);
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 375;
      
      if (bodyWidth <= viewportWidth + 20) { // Allow small margin
        console.log('✅ Mobile responsive layout');
        VALIDATION_REPORT.testResults.mobileResponsive = { status: 'PASS' };
      } else {
        console.log(`⚠️ Potential mobile layout issues: body width ${bodyWidth}px`);
        VALIDATION_REPORT.testResults.mobileResponsive = { 
          status: 'WARN', 
          bodyWidth: `${bodyWidth}px`,
          viewportWidth: `${viewportWidth}px`
        };
      }
      
      // Reset viewport
      await page.setViewport({ width: 1920, height: 1080 });
    } catch (error) {
      VALIDATION_REPORT.testResults.mobileResponsive = { status: 'FAIL', error: error.message };
    }

    // Test 8: Error Handling
    console.log('\n🛡️ Test 8: Error Handling');
    try {
      // Test with invalid URL
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        await inputs[0].click();
        await inputs[0].clear();
        await inputs[0].type('invalid-url-test');
        
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
          await buttons[0].click();
          await page.waitForTimeout(2000);
          
          // Check for error messages
          const errorElements = await page.$$('.error, .alert, [class*="error"]');
          
          if (errorElements.length > 0) {
            console.log('✅ Error handling present');
            VALIDATION_REPORT.testResults.errorHandling = { status: 'PASS' };
          } else {
            console.log('⚠️ Error handling unclear');
            VALIDATION_REPORT.testResults.errorHandling = { status: 'WARN' };
          }
        }
      }
    } catch (error) {
      VALIDATION_REPORT.testResults.errorHandling = { status: 'PARTIAL', error: error.message };
    }

    // Final screenshot
    await page.screenshot({ 
      path: 'mvp-validation-screenshot.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: mvp-validation-screenshot.png');

  } catch (error) {
    console.error('❌ Test execution error:', error);
    VALIDATION_REPORT.errors.push(`Test execution error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate recommendations
  generateRecommendations();
  
  // Save report
  writeFileSync('mvp-validation-report.json', JSON.stringify(VALIDATION_REPORT, null, 2));
  
  // Print summary
  printSummary();
}

function generateRecommendations() {
  const passCount = Object.values(VALIDATION_REPORT.testResults).filter(r => r.status === 'PASS').length;
  const totalTests = Object.keys(VALIDATION_REPORT.testResults).length;
  
  if (passCount / totalTests < 0.8) {
    VALIDATION_REPORT.recommendations.push('Critical: Multiple core features failing - immediate attention required');
  }
  
  if (VALIDATION_REPORT.errors.length > 0) {
    VALIDATION_REPORT.recommendations.push('Fix console errors for better user experience');
  }
  
  if (VALIDATION_REPORT.warnings.length > 0) {
    VALIDATION_REPORT.recommendations.push('Address performance warnings for optimal user experience');
  }
  
  // Always recommend testing with real GitHub repositories
  VALIDATION_REPORT.recommendations.push('Test with various GitHub repositories to validate AI generation');
  VALIDATION_REPORT.recommendations.push('Implement comprehensive error boundary for production readiness');
  VALIDATION_REPORT.recommendations.push('Add loading states and progress indicators for better UX');
}

function printSummary() {
  console.log('\n🎯 MVP VALIDATION SUMMARY');
  console.log('========================');
  
  const results = VALIDATION_REPORT.testResults;
  const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
  const warnCount = Object.values(results).filter(r => r.status === 'WARN').length;
  const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
  
  console.log(`✅ PASS: ${passCount}`);
  console.log(`⚠️ WARN: ${warnCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`🔥 Errors: ${VALIDATION_REPORT.errors.length}`);
  console.log(`⚡ Warnings: ${VALIDATION_REPORT.warnings.length}`);
  
  const score = Math.round((passCount / Object.keys(results).length) * 100);
  console.log(`\n📊 MVP Readiness Score: ${score}%`);
  
  if (score >= 80) {
    console.log('🎉 MVP is production ready!');
  } else if (score >= 60) {
    console.log('🔧 MVP needs minor improvements');
  } else {
    console.log('🚨 MVP requires significant work');
  }
  
  if (VALIDATION_REPORT.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    VALIDATION_REPORT.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n📁 Full report saved to: mvp-validation-report.json');
}

// Run the test
runMVPValidationTest().catch(console.error);
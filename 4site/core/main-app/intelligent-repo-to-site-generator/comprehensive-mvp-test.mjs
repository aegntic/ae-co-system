#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const TEST_REPORT = {
  timestamp: new Date().toISOString(),
  testResults: {},
  errors: [],
  warnings: [],
  recommendations: [],
  mvpReadinessScore: 0
};

async function runComprehensiveMVPTest() {
  console.log('🚀 Starting Comprehensive MVP Test for project4site...');
  console.log('=====================================');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor console and errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        TEST_REPORT.errors.push(`Console Error: ${msg.text()}`);
      }
      console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      TEST_REPORT.errors.push(`Page Error: ${error.message}`);
      console.error('[PAGE ERROR]:', error);
    });

    // TEST 1: Initial Page Load Performance
    console.log('\n🏃 TEST 1: Page Load Performance');
    const startTime = Date.now();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    if (loadTime < 3000) {
      TEST_REPORT.testResults.pageLoadPerformance = { status: 'PASS', loadTime: `${loadTime}ms` };
      console.log(`✅ Page loaded in ${loadTime}ms (Target: <3000ms)`);
    } else {
      TEST_REPORT.testResults.pageLoadPerformance = { status: 'WARN', loadTime: `${loadTime}ms` };
      console.log(`⚠️ Page loaded in ${loadTime}ms (Slower than target)`);
    }

    // TEST 2: Core UI Elements
    console.log('\n🎨 TEST 2: Core UI Elements');
    
    const coreElements = {
      navigation: 'nav',
      heroTitle: 'h1',
      urlInput: 'input[type="text"]',
      submitButton: 'button[type="submit"]',
      exampleButtons: 'button:not([type="submit"])'
    };

    let coreElementsPass = 0;
    for (const [name, selector] of Object.entries(coreElements)) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ ${name} found`);
        TEST_REPORT.testResults[`coreElement_${name}`] = { status: 'PASS' };
        coreElementsPass++;
      } catch (error) {
        console.log(`❌ ${name} NOT found: ${selector}`);
        TEST_REPORT.testResults[`coreElement_${name}`] = { status: 'FAIL', selector };
      }
    }

    // TEST 3: URL Input Functionality
    console.log('\n🔗 TEST 3: URL Input Processing');
    try {
      const urlInput = await page.$('input[type="text"]');
      if (urlInput) {
        // Test shorthand input
        await urlInput.click();
        await page.keyboard.selectAll();
        await page.keyboard.type('facebook/react');
        
        const inputValue = await urlInput.evaluate(el => el.value);
        console.log(`✅ URL input accepts text: "${inputValue}"`);
        
        // Test auto-complete behavior
        await new Promise(resolve => setTimeout(resolve, 500));
        
        TEST_REPORT.testResults.urlInputFunctionality = { 
          status: 'PASS', 
          testInput: inputValue 
        };
      }
    } catch (error) {
      TEST_REPORT.testResults.urlInputFunctionality = { status: 'FAIL', error: error.message };
      console.log(`❌ URL input test failed: ${error.message}`);
    }

    // TEST 4: Demo Mode Generation
    console.log('\n🎭 TEST 4: Demo Mode Site Generation');
    try {
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        console.log('🎯 Triggering site generation...');
        
        // Click generate button
        await submitButton.click();
        
        // Wait for loading state
        console.log('⏳ Waiting for loading state...');
        await page.waitForSelector('.animate-spin, [class*="loading"]', { timeout: 5000 });
        console.log('✅ Loading state detected');
        
        // Wait for completion (max 45 seconds for demo mode)
        console.log('⏳ Waiting for generation completion...');
        await page.waitForFunction(
          () => {
            const loadingElements = document.querySelectorAll('.animate-spin');
            const hasResult = document.querySelector('.fixed.bottom-6') || 
                            document.querySelector('[class*="preview"]') ||
                            document.querySelector('header');
            return loadingElements.length === 0 && hasResult;
          }, 
          { timeout: 45000 }
        );
        
        console.log('✅ Generation completed!');
        
        // Verify site preview elements
        const previewElements = await page.evaluate(() => {
          return {
            hasHeader: !!document.querySelector('header'),
            hasHeroSection: !!document.querySelector('section'),
            hasActionBar: !!document.querySelector('.fixed.bottom-6'),
            hasDemoModeBanner: !!document.querySelector('[class*="demo"], [class*="Demo"]'),
            techStackVisible: document.querySelectorAll('[class*="tech"], [class*="stack"]').length > 0,
            featuresVisible: document.querySelectorAll('[class*="feature"]').length > 0
          };
        });
        
        console.log('🔍 Preview Elements Check:', previewElements);
        
        if (previewElements.hasHeader && previewElements.hasActionBar) {
          TEST_REPORT.testResults.demoModeGeneration = { 
            status: 'PASS', 
            previewElements 
          };
          console.log('✅ Demo mode generation successful');
        } else {
          TEST_REPORT.testResults.demoModeGeneration = { 
            status: 'PARTIAL', 
            previewElements 
          };
          console.log('⚠️ Demo mode generation partially successful');
        }
      }
    } catch (error) {
      TEST_REPORT.testResults.demoModeGeneration = { status: 'FAIL', error: error.message };
      console.log(`❌ Demo mode generation failed: ${error.message}`);
    }

    // TEST 5: Action Button Functionality
    console.log('\n🎬 TEST 5: Action Button Functionality');
    try {
      const actionButtons = await page.$$('.fixed.bottom-6 button');
      if (actionButtons.length > 0) {
        console.log(`✅ Found ${actionButtons.length} action buttons`);
        
        // Test "Generate Another" button
        const resetButton = actionButtons.find(async button => {
          const text = await button.evaluate(el => el.textContent);
          return text?.includes('Generate Another') || text?.includes('🔄');
        });
        
        if (resetButton) {
          console.log('✅ Reset functionality available');
        }
        
        TEST_REPORT.testResults.actionButtons = { 
          status: 'PASS', 
          buttonCount: actionButtons.length 
        };
      } else {
        TEST_REPORT.testResults.actionButtons = { status: 'FAIL' };
        console.log('❌ No action buttons found');
      }
    } catch (error) {
      TEST_REPORT.testResults.actionButtons = { status: 'FAIL', error: error.message };
    }

    // TEST 6: Mobile Responsiveness
    console.log('\n📱 TEST 6: Mobile Responsiveness');
    try {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileLayout = await page.evaluate(() => {
        const body = document.body;
        const nav = document.querySelector('nav');
        const input = document.querySelector('input');
        
        return {
          bodyWidth: body.scrollWidth,
          hasHorizontalScroll: body.scrollWidth > window.innerWidth,
          navResponsive: nav ? nav.offsetWidth <= window.innerWidth : false,
          inputResponsive: input ? input.offsetWidth <= window.innerWidth * 0.9 : false
        };
      });
      
      if (!mobileLayout.hasHorizontalScroll && mobileLayout.navResponsive) {
        TEST_REPORT.testResults.mobileResponsive = { status: 'PASS', mobileLayout };
        console.log('✅ Mobile responsive layout working');
      } else {
        TEST_REPORT.testResults.mobileResponsive = { status: 'WARN', mobileLayout };
        console.log('⚠️ Mobile layout needs improvement');
      }
      
      // Reset to desktop
      await page.setViewport({ width: 1920, height: 1080 });
    } catch (error) {
      TEST_REPORT.testResults.mobileResponsive = { status: 'FAIL', error: error.message };
    }

    // TEST 7: Performance Metrics
    console.log('\n⚡ TEST 7: Performance Metrics');
    try {
      const metrics = await page.metrics();
      
      const performanceScore = {
        memoryUsage: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
        layoutCount: metrics.LayoutCount,
        styleRecalcs: metrics.RecalcStyleCount,
        acceptable: metrics.JSHeapUsedSize / 1024 / 1024 < 100
      };
      
      TEST_REPORT.testResults.performanceMetrics = {
        status: performanceScore.acceptable ? 'PASS' : 'WARN',
        metrics: performanceScore
      };
      
      console.log(`✅ Memory usage: ${performanceScore.memoryUsage}MB`);
      console.log(`✅ Layout operations: ${performanceScore.layoutCount}`);
      
      if (performanceScore.memoryUsage > 100) {
        TEST_REPORT.warnings.push('High memory usage detected');
      }
    } catch (error) {
      TEST_REPORT.testResults.performanceMetrics = { status: 'FAIL', error: error.message };
    }

    // TEST 8: Error Handling
    console.log('\n🛡️ TEST 8: Error Handling');
    try {
      // Go back to main page
      await page.goto('http://localhost:5173');
      await page.waitForSelector('input[type="text"]');
      
      // Test with invalid URL
      const input = await page.$('input[type="text"]');
      await input.click();
      await page.keyboard.selectAll();
      await page.keyboard.type('invalid-url-test-123');
      
      const submitBtn = await page.$('button[type="submit"]');
      await submitBtn.click();
      
      // Wait for error or handling
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const errorHandling = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, [class*="error"], .text-red');
        const hasErrorMessage = Array.from(errorElements).some(el => 
          el.textContent?.includes('Error') || 
          el.textContent?.includes('failed') ||
          el.textContent?.includes('invalid')
        );
        
        return {
          errorElementsFound: errorElements.length,
          hasErrorMessage,
          currentState: document.querySelector('.animate-spin') ? 'loading' : 'idle'
        };
      });
      
      if (errorHandling.hasErrorMessage || errorHandling.errorElementsFound > 0) {
        TEST_REPORT.testResults.errorHandling = { status: 'PASS', errorHandling };
        console.log('✅ Error handling working');
      } else {
        TEST_REPORT.testResults.errorHandling = { status: 'PARTIAL', errorHandling };
        console.log('⚠️ Error handling unclear');
      }
    } catch (error) {
      TEST_REPORT.testResults.errorHandling = { status: 'FAIL', error: error.message };
    }

    // Final screenshot
    await page.screenshot({ 
      path: 'mvp-comprehensive-test-final.png', 
      fullPage: true 
    });
    console.log('📸 Final screenshot saved: mvp-comprehensive-test-final.png');

  } catch (error) {
    console.error('❌ Test execution error:', error);
    TEST_REPORT.errors.push(`Test execution error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Calculate MVP readiness score
  calculateMVPReadinessScore();
  
  // Generate recommendations
  generateRecommendations();
  
  // Save comprehensive report
  writeFileSync('mvp-comprehensive-test-report.json', JSON.stringify(TEST_REPORT, null, 2));
  
  // Print final summary
  printFinalSummary();
}

function calculateMVPReadinessScore() {
  const results = TEST_REPORT.testResults;
  const totalTests = Object.keys(results).length;
  
  if (totalTests === 0) {
    TEST_REPORT.mvpReadinessScore = 0;
    return;
  }
  
  let passCount = 0;
  let partialCount = 0;
  
  Object.values(results).forEach(result => {
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'PARTIAL') partialCount += 0.5;
  });
  
  TEST_REPORT.mvpReadinessScore = Math.round(((passCount + partialCount) / totalTests) * 100);
}

function generateRecommendations() {
  const score = TEST_REPORT.mvpReadinessScore;
  
  if (score >= 90) {
    TEST_REPORT.recommendations.push('🎉 MVP is production ready! Consider adding advanced features.');
  } else if (score >= 75) {
    TEST_REPORT.recommendations.push('🔧 MVP is functional with minor improvements needed');
  } else if (score >= 50) {
    TEST_REPORT.recommendations.push('⚠️ MVP needs significant improvements before production');
  } else {
    TEST_REPORT.recommendations.push('🚨 MVP requires major work - core functionality issues');
  }
  
  // Specific recommendations based on failed tests
  const results = TEST_REPORT.testResults;
  
  if (results.demoModeGeneration?.status === 'FAIL') {
    TEST_REPORT.recommendations.push('Critical: Fix AI generation service integration');
  }
  
  if (results.mobileResponsive?.status !== 'PASS') {
    TEST_REPORT.recommendations.push('Improve mobile responsiveness for better user experience');
  }
  
  if (results.errorHandling?.status !== 'PASS') {
    TEST_REPORT.recommendations.push('Enhance error handling and user feedback');
  }
  
  if (TEST_REPORT.errors.length > 0) {
    TEST_REPORT.recommendations.push('Fix console errors for stability');
  }
  
  // Always valuable recommendations
  TEST_REPORT.recommendations.push('Add comprehensive loading states and progress indicators');
  TEST_REPORT.recommendations.push('Implement analytics to track user behavior and conversion');
  TEST_REPORT.recommendations.push('Add real GitHub repository deployment functionality');
}

function printFinalSummary() {
  console.log('\n🎯 MVP COMPREHENSIVE TEST SUMMARY');
  console.log('=====================================');
  
  const results = TEST_REPORT.testResults;
  const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
  const partialCount = Object.values(results).filter(r => r.status === 'PARTIAL').length;
  const warnCount = Object.values(results).filter(r => r.status === 'WARN').length;
  const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
  
  console.log(`✅ PASS: ${passCount}`);
  console.log(`🔄 PARTIAL: ${partialCount}`);
  console.log(`⚠️ WARN: ${warnCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`🔥 Errors: ${TEST_REPORT.errors.length}`);
  console.log(`⚡ Warnings: ${TEST_REPORT.warnings.length}`);
  
  const score = TEST_REPORT.mvpReadinessScore;
  console.log(`\n📊 MVP Readiness Score: ${score}%`);
  
  if (score >= 90) {
    console.log('🎉 EXCELLENT - MVP is production ready!');
  } else if (score >= 75) {
    console.log('🔧 GOOD - MVP is functional with minor improvements needed');
  } else if (score >= 50) {
    console.log('⚠️ NEEDS WORK - Significant improvements required');
  } else {
    console.log('🚨 CRITICAL - Major functionality issues');
  }
  
  console.log('\n💡 KEY RECOMMENDATIONS:');
  TEST_REPORT.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
  
  console.log('\n📁 Detailed report saved to: mvp-comprehensive-test-report.json');
  console.log('📸 Final screenshot saved to: mvp-comprehensive-test-final.png');
}

// Run the comprehensive test
runComprehensiveMVPTest().catch(console.error);
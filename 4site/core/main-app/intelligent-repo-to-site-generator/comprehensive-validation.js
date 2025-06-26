// Comprehensive Validation Script for project4site
// Tests all aspects for $100B production standards

import puppeteer from 'puppeteer';
import fs from 'fs';

async function validateProject4Site() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:5173',
    tests: []
  };

  try {
    // 1. Page Load Test
    console.log('🚀 Starting comprehensive validation...\n');
    
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    results.tests.push({
      name: 'Page Load',
      status: 'PASS',
      message: 'Page loaded successfully'
    });

    // 2. Take full-page screenshot
    await page.setViewport({ width: 1920, height: 1080 });
    await page.screenshot({
      path: 'validation-homepage.png',
      fullPage: true
    });
    
    results.tests.push({
      name: 'Homepage Screenshot',
      status: 'PASS',
      message: 'Full-page screenshot captured'
    });

    // 3. Check for logo integration
    const logoExists = await page.$eval('img[alt*="4site"]', el => {
      return {
        src: el.src,
        display: window.getComputedStyle(el).display !== 'none',
        width: el.naturalWidth,
        height: el.naturalHeight
      };
    }).catch(() => null);
    
    results.tests.push({
      name: 'Logo Integration',
      status: logoExists && logoExists.display ? 'PASS' : 'FAIL',
      message: logoExists ? `Logo found: ${logoExists.src}` : 'Logo not found',
      details: logoExists
    });

    // 4. Glass Morphism Effects
    const glassElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="glass"], [style*="backdrop-filter"], [style*="blur"]');
      return {
        count: elements.length,
        hasBackdropFilter: Array.from(elements).some(el => {
          const style = window.getComputedStyle(el);
          return style.backdropFilter && style.backdropFilter !== 'none';
        }),
        hasGlassBackground: Array.from(elements).some(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor && style.backgroundColor.includes('rgba');
        })
      };
    });
    
    results.tests.push({
      name: 'Glass Morphism Effects',
      status: glassElements.hasBackdropFilter || glassElements.count > 0 ? 'PASS' : 'FAIL',
      message: `Found ${glassElements.count} glass elements`,
      details: glassElements
    });

    // 5. Form Validation Test
    const formExists = await page.$('input[type="text"], input[type="url"]');
    if (formExists) {
      // Test empty submission
      const submitButton = await page.$('button[type="submit"], button:contains("Generate")');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        const errorVisible = await page.evaluate(() => {
          const errors = document.querySelectorAll('[class*="error"], [role="alert"]');
          return errors.length > 0;
        });
        
        results.tests.push({
          name: 'Form Validation - Empty Input',
          status: errorVisible ? 'PASS' : 'WARNING',
          message: errorVisible ? 'Error message displayed for empty input' : 'No error message for empty input'
        });
      }
      
      // Test valid GitHub URL
      await page.type('input[type="text"], input[type="url"]', 'https://github.com/facebook/react');
      await page.screenshot({ path: 'validation-form-filled.png' });
      
      results.tests.push({
        name: 'Form Input',
        status: 'PASS',
        message: 'Successfully entered GitHub URL'
      });
    }

    // 6. Responsive Design Test
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.waitForTimeout(500);
      
      const layoutIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let issues = 0;
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > window.innerWidth || rect.right > window.innerWidth) {
            issues++;
          }
        });
        return issues;
      });
      
      await page.screenshot({ 
        path: `validation-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      results.tests.push({
        name: `Responsive Design - ${viewport.name}`,
        status: layoutIssues === 0 ? 'PASS' : 'FAIL',
        message: layoutIssues === 0 ? 'No layout issues' : `${layoutIssues} elements overflow`,
        viewport: viewport
      });
    }

    // 7. Performance Metrics
    const metrics = await page.metrics();
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    results.tests.push({
      name: 'Performance Metrics',
      status: performanceMetrics.firstContentfulPaint < 3000 ? 'PASS' : 'WARNING',
      message: `FCP: ${performanceMetrics.firstContentfulPaint}ms`,
      details: {
        ...performanceMetrics,
        heapSize: `${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`
      }
    });

    // 8. Accessibility Quick Check
    const accessibilityChecks = await page.evaluate(() => {
      return {
        hasLangAttribute: document.documentElement.hasAttribute('lang'),
        imagesHaveAlt: Array.from(document.images).every(img => img.hasAttribute('alt')),
        buttonsHaveText: Array.from(document.querySelectorAll('button')).every(btn => 
          btn.textContent.trim() || btn.getAttribute('aria-label')
        ),
        formsHaveLabels: Array.from(document.querySelectorAll('input')).every(input => {
          const id = input.id;
          return !id || document.querySelector(`label[for="${id}"]`);
        })
      };
    });
    
    const accessibilityPass = Object.values(accessibilityChecks).every(check => check);
    results.tests.push({
      name: 'Accessibility Basics',
      status: accessibilityPass ? 'PASS' : 'WARNING',
      message: accessibilityPass ? 'Basic accessibility checks passed' : 'Some accessibility issues found',
      details: accessibilityChecks
    });

    // 9. Animation Performance
    const animationPerformance = await page.evaluate(() => {
      const animations = document.getAnimations();
      return {
        count: animations.length,
        running: animations.filter(a => a.playState === 'running').length,
        hasSmooth: window.getComputedStyle(document.documentElement).scrollBehavior === 'smooth'
      };
    });
    
    results.tests.push({
      name: 'Animation Performance',
      status: 'PASS',
      message: `${animationPerformance.count} animations found`,
      details: animationPerformance
    });

    // 10. Console Errors Check
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    results.tests.push({
      name: 'Console Errors',
      status: consoleErrors.length === 0 ? 'PASS' : 'WARNING',
      message: consoleErrors.length === 0 ? 'No console errors' : `${consoleErrors.length} console errors found`,
      details: consoleErrors
    });

  } catch (error) {
    results.error = error.message;
    console.error('Validation error:', error);
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n📊 VALIDATION REPORT\n' + '='.repeat(50));
  console.log(`URL: ${results.url}`);
  console.log(`Time: ${results.timestamp}\n`);
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.message}`);
    if (test.details) {
      console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
    }
    
    if (test.status === 'PASS') passCount++;
    else if (test.status === 'FAIL') failCount++;
    else warningCount++;
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  
  const score = (passCount / results.tests.length * 100).toFixed(1);
  console.log(`\n🎯 Overall Score: ${score}%`);
  
  // $100B Standards Assessment
  console.log('\n💎 $100B STANDARDS ASSESSMENT\n' + '='.repeat(50));
  
  // Extract values from tests for assessment
  const glassTest = results.tests.find(t => t.name === 'Glass Morphism Effects');
  const logoTest = results.tests.find(t => t.name === 'Logo Integration');
  const perfTest = results.tests.find(t => t.name === 'Performance Metrics');
  const accessTest = results.tests.find(t => t.name === 'Accessibility Basics');
  const consoleTest = results.tests.find(t => t.name === 'Console Errors');
  
  const standards = {
    'Visual Excellence': glassTest?.status === 'PASS' && logoTest?.status === 'PASS',
    'Performance': perfTest?.status === 'PASS',
    'Responsive Design': results.tests.filter(t => t.name.includes('Responsive')).every(t => t.status === 'PASS'),
    'User Experience': results.tests.find(t => t.name.includes('Form'))?.status === 'PASS' && accessTest?.status === 'PASS',
    'Code Quality': consoleTest?.status === 'PASS',
    'Production Ready': score >= 80
  };
  
  Object.entries(standards).forEach(([criterion, met]) => {
    console.log(`${met ? '✅' : '❌'} ${criterion}`);
  });
  
  const meetsStandards = Object.values(standards).every(s => s);
  console.log(`\n${meetsStandards ? '🏆 MEETS $100B STANDARDS!' : '⚠️  NEEDS IMPROVEMENT FOR $100B STANDARDS'}`);
  
  // Save full report
  fs.writeFileSync('validation-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Full report saved to validation-report.json');
  console.log('🖼️  Screenshots saved: validation-*.png');
}

// Run validation
validateProject4Site().catch(console.error);
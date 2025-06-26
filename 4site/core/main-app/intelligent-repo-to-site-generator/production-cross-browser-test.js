import puppeteer from 'puppeteer';

async function crossBrowserTest() {
  console.log('🌐 Starting cross-browser compatibility testing...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  const browsers = [
    { name: 'Chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    { name: 'Chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'], executablePath: 'chromium-browser' }
  ];
  
  for (const browserConfig of browsers) {
    try {
      console.log(`\n🔍 Testing ${browserConfig.name}...`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: browserConfig.args,
        executablePath: browserConfig.executablePath
      }).catch(() => null);
      
      if (!browser) {
        console.log(`⚠️ ${browserConfig.name} not available, skipping...`);
        continue;
      }
      
      const page = await browser.newPage();
      
      // Set viewport for mobile testing
      await page.setViewport({ width: 375, height: 667 });
      
      const response = await page.goto('http://localhost:5173', {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      // Performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });
      
      // Check for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error.message));
      
      // Test core functionality
      await page.waitForSelector('#root', { timeout: 10000 });
      
      const title = await page.title();
      const hasForm = await page.$('form, input[type="url"]') !== null;
      
      // Mobile responsiveness test
      const isMobileResponsive = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const hasResponsiveElements = document.querySelector('[class*="responsive"], [class*="mobile"], [class*="sm:"], [class*="md:"], [class*="lg:"]');
        return viewportWidth <= 768 && hasResponsiveElements !== null;
      });
      
      await page.screenshot({ 
        path: `mobile-${browserConfig.name.toLowerCase()}-test.png`,
        fullPage: false
      });
      
      // Desktop test
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload({ waitUntil: 'networkidle0' });
      
      await page.screenshot({ 
        path: `desktop-${browserConfig.name.toLowerCase()}-test.png`,
        fullPage: false
      });
      
      const testResult = {
        browser: browserConfig.name,
        success: response.status() === 200,
        loadTime: performanceMetrics.totalTime,
        title,
        hasForm,
        isMobileResponsive,
        jsErrors: jsErrors.length,
        errorMessages: jsErrors.slice(0, 3) // First 3 errors
      };
      
      results.tests.push(testResult);
      console.log(`✅ ${browserConfig.name} test completed:`, testResult);
      
      await browser.close();
      
    } catch (error) {
      console.error(`❌ ${browserConfig.name} test failed:`, error.message);
      results.tests.push({
        browser: browserConfig.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

crossBrowserTest().then(results => {
  console.log('\n📊 CROSS-BROWSER TEST RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  
  const successfulTests = results.tests.filter(t => t.success).length;
  const totalTests = results.tests.length;
  
  console.log(`\n🎯 Success Rate: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests*100)}%)`);
  
  process.exit(successfulTests > 0 ? 0 : 1);
}).catch(error => {
  console.error('❌ Cross-browser testing failed:', error);
  process.exit(1);
});
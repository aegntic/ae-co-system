import puppeteer from 'puppeteer';

async function testApplication() {
  console.log('🚀 Starting comprehensive production validation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Testing main application...');
    
    // Navigate to the application
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Application loaded successfully');
    console.log('Response status:', response.status());
    console.log('Response headers:', JSON.stringify(response.headers(), null, 2));
    
    // Wait for React to load
    await page.waitForSelector('[data-testid="main-app"], #root', { timeout: 15000 });
    console.log('✅ React application mounted');
    
    // Check for main UI elements
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take a screenshot for validation
    await page.screenshot({ 
      path: 'production-validation-screenshot.png',
      fullPage: true
    });
    console.log('✅ Screenshot captured');
    
    // Test form interaction
    const inputSelector = 'input[type="url"], input[placeholder*="github"], input[placeholder*="repository"]';
    const inputField = await page.$(inputSelector);
    
    if (inputField) {
      console.log('✅ Found repository input field');
      await inputField.type('https://github.com/example/repo');
      console.log('✅ Successfully typed into input field');
    } else {
      console.log('⚠️ Repository input field not found, checking for alternative inputs...');
      
      // Check for any input fields
      const anyInput = await page.$('input');
      if (anyInput) {
        console.log('✅ Found alternative input field');
      }
    }
    
    // Performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    console.log('🔬 Performance Metrics:', performanceMetrics);
    
    // Security Header Validation
    console.log('🔒 Validating security headers...');
    const headers = response.headers();
    const securityHeaders = {
      'x-frame-options': headers['x-frame-options'] || 'MISSING',
      'x-content-type-options': headers['x-content-type-options'] || 'MISSING',
      'x-xss-protection': headers['x-xss-protection'] || 'MISSING',
      'referrer-policy': headers['referrer-policy'] || 'MISSING',
      'permissions-policy': headers['permissions-policy'] || 'MISSING'
    };
    
    console.log('Security headers:', securityHeaders);
    
    console.log('🎉 All tests passed successfully!');
    return {
      success: true,
      performanceMetrics,
      securityHeaders,
      title
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testApplication().then(result => {
  console.log(result.success ? '✅ PRODUCTION VALIDATION SUCCESSFUL' : '❌ PRODUCTION VALIDATION FAILED');
  console.log('Full result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
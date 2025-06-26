const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Test different pages and states
  const tests = [
    { name: 'homepage', url: 'http://localhost:5174/', wait: 3000 },
    { name: 'auth-modal', url: 'http://localhost:5174/', action: async () => {
      // Click login button if it exists
      const loginBtn = await page.$('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Get Started")');
      if (loginBtn) await loginBtn.click();
      await page.waitForTimeout(2000);
    }},
    { name: 'generator-form', url: 'http://localhost:5174/', action: async () => {
      // Try to interact with the generator form
      const input = await page.$('input[type="text"], input[type="url"]');
      if (input) {
        await input.type('https://github.com/facebook/react');
        await page.waitForTimeout(1000);
      }
    }},
    { name: 'mobile-view', url: 'http://localhost:5174/', viewport: { width: 375, height: 812 }},
    { name: 'tablet-view', url: 'http://localhost:5174/', viewport: { width: 768, height: 1024 }}
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    
    if (test.viewport) {
      await page.setViewport(test.viewport);
    }
    
    await page.goto(test.url, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(test.wait || 1000);
    
    if (test.action) {
      await test.action();
    }
    
    const screenshotPath = `/tmp/project4site-${test.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Capture any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    results.push({
      test: test.name,
      screenshot: screenshotPath,
      errors: errors
    });
  }
  
  await browser.close();
  
  // Save results
  fs.writeFileSync('/tmp/project4site-assessment.json', JSON.stringify(results, null, 2));
  console.log('Assessment complete. Results saved to /tmp/project4site-assessment.json');
}

captureScreenshots().catch(console.error);
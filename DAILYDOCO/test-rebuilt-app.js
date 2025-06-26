const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for app to load
    await page.waitForSelector('nav', { timeout: 5000 });
    
    // Test scroll to see second section
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of first section
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'rebuilt-app-section1.png' });
    
    // Take screenshot of second section
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.screenshot({ path: 'rebuilt-app-section2.png' });
    
    console.log('Screenshots saved');
    
    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test navigation button
    await page.click('button:has-text("Live Dashboard")');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\nConsole errors:', consoleErrors.length > 0 ? consoleErrors : 'None');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
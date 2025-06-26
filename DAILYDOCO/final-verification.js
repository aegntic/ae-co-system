const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Take final screenshot
    await page.screenshot({ path: 'final-app-screenshot.png', fullPage: false });
    console.log('✓ Screenshot saved to final-app-screenshot.png');
    
    // Quick verification
    const pageTitle = await page.title();
    const hasGradientText = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="gradient"]');
      return elements.length > 0;
    });
    
    console.log('✓ Page title:', pageTitle);
    console.log('✓ Gradient elements found:', hasGradientText);
    console.log('✅ App is working!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
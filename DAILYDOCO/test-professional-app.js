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
    
    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of hero section
    await page.screenshot({ path: 'professional-app-hero.png', fullPage: false });
    console.log('Hero section screenshot saved');
    
    // Scroll to second section
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: 'professional-app-section2.png', fullPage: false });
    console.log('Section 2 screenshot saved');
    
    // Scroll to third section
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.screenshot({ path: 'professional-app-section3.png', fullPage: false });
    console.log('Section 3 screenshot saved');
    
    // Test interactive elements
    const buttons = await page.$$eval('button', buttons => buttons.length);
    console.log(`\nFound ${buttons} buttons`);
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    console.log('\nConsole errors:', consoleErrors.length > 0 ? consoleErrors : 'None');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
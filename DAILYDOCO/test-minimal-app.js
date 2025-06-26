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
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check if the basic elements are present
    const title = await page.$eval('h1', el => el.textContent);
    const paragraph = await page.$eval('p', el => el.textContent);
    const button = await page.$eval('button', el => el.textContent);
    
    console.log('Title:', title);
    console.log('Paragraph:', paragraph);
    console.log('Button:', button);
    
    // Test button functionality
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 500));
    const buttonAfterClick = await page.$eval('button', el => el.textContent);
    console.log('Button after click:', buttonAfterClick);
    
    // Take screenshot
    await page.screenshot({ path: 'minimal-app-test.png' });
    console.log('Screenshot saved to minimal-app-test.png');
    
    // Check for any console errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    console.log('\nConsole messages:', consoleMessages.length > 0 ? consoleMessages : 'None');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
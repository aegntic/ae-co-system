const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to localhost:8083...');
  await page.goto('http://localhost:8083', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for Revenue Dashboard button...');
  await page.waitForSelector('button', { timeout: 5000 });
  
  // Click on the Revenue Dashboard button
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && text.includes('Revenue Dashboard')) {
      console.log('Found Revenue Dashboard button, clicking...');
      await button.click();
      break;
    }
  }
  
  // Wait for dashboard to load
  await page.waitForTimeout(2000);
  
  console.log('Taking screenshot of dashboard...');
  await page.screenshot({ path: 'dailydoco-revenue-dashboard.png', fullPage: false });
  
  const content = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    return {
      h1Text: h1 ? h1.textContent : 'No h1 found',
      h2Text: h2 ? h2.textContent : 'No h2 found',
      hasContent: document.body.innerHTML.length > 100
    };
  });
  
  console.log('Dashboard content:', content);
  
  await browser.close();
  console.log('Screenshot saved as dailydoco-revenue-dashboard.png');
})();
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to localhost:8083...');
  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await page.goto('http://localhost:8083', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Waiting for content to load...');
  await page.waitForSelector('body', { timeout: 5000 });
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'dailydoco-dashboard-final.png', fullPage: true });
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const content = await page.evaluate(() => {
    const mainHeading = document.querySelector('h1');
    const buttons = document.querySelectorAll('button');
    const gradientElement = document.querySelector('.text-gradient');
    return {
      heading: mainHeading ? mainHeading.textContent : 'No heading found',
      buttonCount: buttons.length,
      hasGradient: gradientElement !== null,
      hasContent: document.body.innerHTML.length > 100,
      bodyText: document.body.innerText.substring(0, 200)
    };
  });
  
  console.log('Page content:', JSON.stringify(content, null, 2));
  
  await browser.close();
  console.log('\nScreenshot saved as dailydoco-working.png');
})();
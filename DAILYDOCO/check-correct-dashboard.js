const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('Navigating to localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for content to render
  console.log('Waiting for content to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'dailydoco-dashboard-correct.png', fullPage: true });
  
  // Get page info
  const pageTitle = await page.title();
  const pageContent = await page.evaluate(() => {
    const heading = document.querySelector('h1')?.textContent || '';
    const buttons = document.querySelectorAll('button').length;
    const hasGradient = !!document.querySelector('[class*="gradient"]');
    const hasContent = document.body.textContent.length > 100;
    const bodyText = document.body.textContent.substring(0, 200);
    
    return {
      heading,
      buttonCount: buttons,
      hasGradient,
      hasContent,
      bodyText
    };
  });
  
  console.log('Page title:', pageTitle);
  console.log('Page content:', JSON.stringify(pageContent, null, 2));
  
  await browser.close();
  console.log('\nScreenshot saved as dailydoco-dashboard-correct.png');
})();

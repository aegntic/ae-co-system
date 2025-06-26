const puppeteer = require('puppeteer');

async function captureFrontend() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to c1v1 Modern SaaS...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for content to render
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get page title and h1
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.innerText || 'No H1',
      hasButton: !!document.querySelector('button'),
      bodyText: document.body.innerText.substring(0, 200)
    }));
    
    console.log('Page loaded:', pageInfo);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'c1v1-modern-saas-working.png',
      fullPage: true 
    });
    console.log('Screenshot saved as c1v1-modern-saas-working.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureFrontend().catch(console.error);
import puppeteer from 'puppeteer';

async function simpleTest() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);
    
    console.log('Page loaded successfully!');
    console.log('Check the browser window to see the site.');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
}

simpleTest();
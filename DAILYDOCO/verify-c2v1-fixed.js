const puppeteer = require('puppeteer');

async function verifyC2V1() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'c2v1-fixed.png' });
    console.log('✅ c2v1 Enterprise Premium screenshot captured');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
}

verifyC2V1();
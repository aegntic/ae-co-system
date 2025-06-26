const puppeteer = require('puppeteer');

async function verifyC3V1VideoGen() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  
  try {
    await page.goto('http://localhost:5175/video-generator', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'c3v1-video-generator-fixed.png', fullPage: true });
    console.log('✅ c3v1 Video Generator screenshot captured');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
}

verifyC3V1VideoGen();
import puppeteer from 'puppeteer';

async function testApp() {
  console.log('Starting test...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit for rendering
    await new Promise(r => setTimeout(r, 3000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'app-screenshot.png',
      fullPage: true 
    });
    console.log('✓ Screenshot saved as app-screenshot.png');
    
    // Check page title
    const pageTitle = await page.title();
    console.log('✓ Page title:', pageTitle);
    
    // Check for hero text
    try {
      const heroText = await page.$eval('h1', el => el.textContent);
      console.log('✓ Hero text found:', heroText);
    } catch (e) {
      console.log('✗ Hero text not found');
    }
    
    // Check for input
    const input = await page.$('input');
    console.log('✓ Input field:', input ? 'Found' : 'Not found');
    
    // Check for buttons
    const buttons = await page.$$('button');
    console.log('✓ Number of buttons:', buttons.length);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApp();
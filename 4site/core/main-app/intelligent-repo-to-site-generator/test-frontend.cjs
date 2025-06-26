const puppeteer = require('puppeteer');
const { exec } = require('child_process');

async function testApp() {
  console.log('🚀 Starting frontend testing...');
  
  // Start dev server
  const server = exec('bun run dev:vite --host 0.0.0.0 --port 5173');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 8000));

  let browser, page;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    
    console.log('🌐 Testing application...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Take screenshot
    await page.screenshot({ path: 'frontend-test.png', fullPage: true });
    
    // Check basic elements
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const heroText = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
    console.log('🎯 Hero text:', heroText);
    
    const inputField = await page.$('input[type="url"]');
    console.log('📝 URL input field:', inputField ? 'Found' : 'Not found');
    
    const generateButton = await page.$('button');
    console.log('🔘 Generate button:', generateButton ? 'Found' : 'Not found');
    
    console.log('✅ Testing completed');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

testApp();
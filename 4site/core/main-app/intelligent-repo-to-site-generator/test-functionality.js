import puppeteer from 'puppeteer';

async function testFunctionality() {
  console.log('🧪 TESTING GITHUB URL SUBMISSION\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('gemini')) {
      apiCalls.push({
        url: request.url(),
        method: request.method()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api') || response.url().includes('gemini')) {
      console.log(`API Response: ${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    console.log('📱 Loading website...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Find and fill the input
    console.log('\n📝 Filling GitHub URL...');
    const input = await page.$('input[type="url"]');
    if (!input) {
      console.error('❌ Input field not found!');
      return;
    }
    
    await input.click();
    await input.type('https://github.com/facebook/react');
    
    // Take screenshot before submit
    await page.screenshot({
      path: 'before-submit.png'
    });
    console.log('✅ Screenshot: before-submit.png');
    
    // Find and click the button
    console.log('\n🖱️ Clicking Generate button...');
    const button = await page.$('button[type="submit"]');
    if (!button) {
      console.error('❌ Submit button not found!');
      return;
    }
    
    // Click and wait for response
    await Promise.all([
      button.click(),
      new Promise(r => setTimeout(r, 5000)) // Wait 5 seconds for any response
    ]);
    
    // Take screenshot after submit
    await page.screenshot({
      path: 'after-submit.png'
    });
    console.log('✅ Screenshot: after-submit.png');
    
    // Check current state
    const currentState = await page.evaluate(() => {
      const loading = document.body.innerText.includes('Generating') || 
                     document.body.innerText.includes('Analyzing');
      const error = document.querySelector('[class*="error"]') || 
                   document.body.innerText.toLowerCase().includes('error');
      const success = document.body.innerText.includes('ready') || 
                     document.body.innerText.includes('Preview');
      
      return {
        loading,
        hasError: !!error,
        success,
        buttonText: document.querySelector('button[type="submit"]')?.innerText,
        pageText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('\n📊 CURRENT STATE:');
    console.log(`Loading: ${currentState.loading}`);
    console.log(`Error: ${currentState.hasError}`);
    console.log(`Success: ${currentState.success}`);
    console.log(`Button text: ${currentState.buttonText}`);
    
    console.log('\n📋 CONSOLE LOGS:');
    consoleLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    console.log('\n🌐 API CALLS:');
    if (apiCalls.length === 0) {
      console.log('❌ No API calls detected!');
    } else {
      apiCalls.forEach(call => {
        console.log(`${call.method} ${call.url}`);
      });
    }
    
    console.log('\n📄 PAGE CONTENT:');
    console.log(currentState.pageText);
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testFunctionality().catch(console.error);
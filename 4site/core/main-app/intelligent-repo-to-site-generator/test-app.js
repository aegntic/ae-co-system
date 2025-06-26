import puppeteer from 'puppeteer';

async function testApp() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to common desktop size
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to app...');
  await page.goto('http://localhost:5174', { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });
  
  // Wait for app to render
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'app-screenshot.png',
    fullPage: true 
  });
  console.log('Screenshot saved as app-screenshot.png');
  
  // Check for critical elements
  const heroText = await page.$eval('h1', el => el.textContent).catch(() => null);
  const inputExists = await page.$('input[placeholder*="GitHub"]') !== null;
  const buttonText = await page.$eval('button', el => el.textContent).catch(() => null);
  const featuresExists = await page.$('#features') !== null;
  const showcaseExists = await page.$('#showcase') !== null;
  
  // Report findings
  console.log('\nElement Check:');
  console.log('- Hero heading:', heroText ? `✓ Found: "${heroText}"` : '✗ Missing');
  console.log('- GitHub input:', inputExists ? '✓ Found' : '✗ Missing');
  console.log('- Generate button:', buttonText?.includes('Generate') ? '✓ Found' : '✗ Missing');
  console.log('- Features section:', featuresExists ? '✓ Found' : '✗ Missing');
  console.log('- Showcase section:', showcaseExists ? '✓ Found' : '✗ Missing');
  
  // Get page title
  const pageTitle = await page.title();
  console.log('\nPage title:', pageTitle);
  
  // Check for errors
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.waitForTimeout(1000);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors detected:');
    errors.forEach(err => console.log('-', err));
  } else {
    console.log('\n✓ No errors detected!');
  }
  
  // Test interaction
  console.log('\nTesting interaction...');
  const input = await page.$('input[placeholder*="GitHub"]');
  if (input) {
    await input.type('https://github.com/facebook/react');
    console.log('✓ Typed GitHub URL');
    
    // Take screenshot after typing
    await page.screenshot({ 
      path: 'app-with-input.png',
      fullPage: false 
    });
    console.log('✓ Screenshot with input saved');
  }
  
  // Test auth modal
  const signInButtons = await page.$$('button');
  let signInButton = null;
  for (const btn of signInButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text?.includes('Sign In')) {
      signInButton = btn;
      break;
    }
  }
  
  if (signInButton) {
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    const modal = await page.$('input[type="email"]');
    if (modal) {
      console.log('✓ Auth modal opens correctly');
      
      // Check for close button (X icon)
      const closeButton = await page.$('button svg');
      if (closeButton) {
        const svgClass = await page.evaluate(el => el.getAttribute('class'), closeButton);
        if (svgClass?.includes('lucide-x')) {
          console.log('✓ Close button visible in auth modal');
        }
      }
      
      // Take screenshot of modal
      await page.screenshot({ 
        path: 'app-auth-modal.png',
        fullPage: false 
      });
      console.log('✓ Auth modal screenshot saved');
    }
  }
  
  await browser.close();
  console.log('\n✅ Test complete!');
}

testApp().catch(console.error);
#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testInterface() {
  console.log('🔍 Testing YouTube Intelligence Engine Interface...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: '/tmp/interface-screenshot.png', 
      fullPage: true 
    });
    
    // Check for any console errors
    const consoleLogs = [];
    page.on('console', (msg) => {
      const logEntry = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(logEntry);
      // Log immediately for debugging
      console.log(`🖥️  Console: ${logEntry}`);
    });
    
    // Check for page errors
    page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if main elements are present
    console.log('🔍 Checking interface elements...');
    
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);
    
    // Check for main heading
    const heading = await page.$('h1');
    if (heading) {
      const headingText = await page.evaluate(el => el.textContent, heading);
      console.log(`✅ Main heading found: "${headingText}"`);
    } else {
      console.log('❌ No main heading found');
    }
    
    // Check for navigation
    const navigation = await page.$('nav');
    if (navigation) {
      console.log('✅ Navigation component found');
    } else {
      console.log('❌ No navigation component found');
    }
    
    // Check for any API error messages
    const errorElements = await page.$$('[data-error]');
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements`);
    }
    
    // Check if the page is responsive
    await page.setViewport({ width: 375, height: 667 }); // Mobile size
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ 
      path: '/tmp/interface-mobile-screenshot.png', 
      fullPage: true 
    });
    console.log('📱 Mobile screenshot captured');
    
    // Test the URL input if present
    const urlInput = await page.$('input[type="url"], input[placeholder*="YouTube"], input[placeholder*="URL"]');
    if (urlInput) {
      console.log('✅ YouTube URL input found');
      await urlInput.type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      console.log('✅ Test URL entered');
    } else {
      console.log('❌ No YouTube URL input found');
    }
    
    // Log console messages
    if (consoleLogs.length > 0) {
      console.log('\n📝 Console messages:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
    }
    
    console.log('\n✅ Interface testing completed successfully!');
    console.log('📸 Screenshots saved to:');
    console.log('  - /tmp/interface-screenshot.png (desktop)');
    console.log('  - /tmp/interface-mobile-screenshot.png (mobile)');
    
  } catch (error) {
    console.error('❌ Error testing interface:', error.message);
    
    // Try to take a screenshot even if there's an error
    try {
      const page = await browser.newPage();
      await page.goto('http://localhost:3000', { timeout: 5000 });
      await page.screenshot({ path: '/tmp/interface-error-screenshot.png' });
      console.log('📸 Error screenshot saved to /tmp/interface-error-screenshot.png');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testInterface().catch(console.error);
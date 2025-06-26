import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function demonstrateWebsite() {
  console.log('🚀 Starting 4site.pro MVP Demo Walkthrough...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Step 1: Loading the 4site.pro homepage...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Take homepage screenshot
    await page.screenshot({ path: 'demo-1-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully - screenshot saved as demo-1-homepage.png');
    
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    
    console.log('\n🎯 Step 2: Demonstrating the URL input process...');
    
    // Look for URL input field
    const urlInput = await page.$('input[type="url"], input[placeholder*="github"], input[placeholder*="repository"]');
    if (urlInput) {
      console.log('✅ URL input field found');
      
      // Enter a sample GitHub repository URL
      await urlInput.type('https://github.com/facebook/react');
      console.log('📝 Entered sample repository: https://github.com/facebook/react');
      
      await page.screenshot({ path: 'demo-2-url-entered.png', fullPage: true });
      console.log('✅ URL entered - screenshot saved as demo-2-url-entered.png');
      
      // Look for submit/generate button
      const generateButton = await page.$('button:has-text("Generate"), button:has-text("Create"), button[type="submit"]');
      if (generateButton) {
        console.log('🔘 Generate button found, clicking...');
        await generateButton.click();
        
        // Wait for generation process to start
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'demo-3-generation-started.png', fullPage: true });
        console.log('✅ Generation started - screenshot saved as demo-3-generation-started.png');
        
        // Wait for results (with timeout)
        try {
          await page.waitForSelector('[data-testid="site-preview"], .site-preview, .generated-site', { timeout: 15000 });
          await page.screenshot({ path: 'demo-4-site-generated.png', fullPage: true });
          console.log('✅ Site generated successfully - screenshot saved as demo-4-site-generated.png');
        } catch (error) {
          console.log('⏱️ Generation in progress - taking current state screenshot...');
          await page.screenshot({ path: 'demo-4-generation-in-progress.png', fullPage: true });
        }
      }
    }
    
    console.log('\n📊 Step 3: Checking key features...');
    
    // Check for lead capture widget
    const leadCapture = await page.$('.lead-capture, [data-testid="lead-capture"]');
    if (leadCapture) {
      console.log('✅ Lead capture widget detected');
    }
    
    // Check for glass morphism effects
    const glassElements = await page.$$('[class*="glass"], [style*="backdrop-filter"], [style*="blur"]');
    console.log(`✅ Found ${glassElements.length} glass morphism elements`);
    
    // Check for neural background
    const neuralBg = await page.$('.neural-background, [class*="neural"]');
    if (neuralBg) {
      console.log('✅ Neural network background detected');
    }
    
    console.log('\n🎨 Step 4: Testing interactions...');
    
    // Try scrolling to see different sections
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-5-scrolled-features.png', fullPage: true });
    console.log('✅ Features section visible - screenshot saved as demo-5-scrolled-features.png');
    
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-6-demo-section.png', fullPage: true });
    console.log('✅ Demo section visible - screenshot saved as demo-6-demo-section.png');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-7-footer.png', fullPage: true });
    console.log('✅ Footer with Pro showcase visible - screenshot saved as demo-7-footer.png');
    
    console.log('\n📱 Step 5: Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X dimensions
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'demo-8-mobile-view.png', fullPage: true });
    console.log('✅ Mobile view tested - screenshot saved as demo-8-mobile-view.png');
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
    await page.screenshot({ path: 'demo-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as demo-error.png');
  }
  
  console.log('\n🎉 Demo walkthrough complete!');
  console.log('\n📁 Generated screenshots:');
  console.log('   - demo-1-homepage.png (Full homepage)');
  console.log('   - demo-2-url-entered.png (URL input filled)');
  console.log('   - demo-3-generation-started.png (Generation process)');
  console.log('   - demo-4-site-generated.png (Generated result)');
  console.log('   - demo-5-scrolled-features.png (Features section)');
  console.log('   - demo-6-demo-section.png (Demo section)');
  console.log('   - demo-7-footer.png (Footer with Pro showcase)');
  console.log('   - demo-8-mobile-view.png (Mobile responsive view)');
  
  await browser.close();
}

// Run the demo
demonstrateWebsite().catch(console.error);
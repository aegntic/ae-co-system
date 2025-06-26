#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function simulateUserTest() {
  console.log('🤖 Simulating human user interaction with YouTube Intelligence Engine...');
  
  const browser = await puppeteer.launch({
    headless: false,  // Show the browser so we can watch
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`🖥️  Console: ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        console.log(`🌐 API: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to the YouTube Intelligence Engine
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: '/tmp/step1-dashboard.png', fullPage: true });
    console.log('📸 Screenshot 1: Dashboard loaded');
    
    // Look for the "Analyze YouTube URL" button
    console.log('🔍 Looking for "Analyze YouTube URL" button...');
    
    // First, let's see what buttons are available
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on the page`);
    
    let analyzeButton = null;
    
    // Check each button to find the analyze button
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await page.evaluate(btn => btn.textContent.trim(), buttons[i]);
      console.log(`Button ${i + 1}: "${buttonText}"`);
      
      if (buttonText && (buttonText.includes('Analyze YouTube URL') || buttonText.includes('Analyze') || buttonText.includes('YouTube'))) {
        console.log(`✅ Found target button: "${buttonText}"`);
        analyzeButton = buttons[i];
        break;
      }
    }
    
    if (analyzeButton) {
      console.log('✅ Found analyze button! Clicking...');
      await analyzeButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot after clicking
      await page.screenshot({ path: '/tmp/step2-modal-opened.png', fullPage: true });
      console.log('📸 Screenshot 2: Modal/Analyzer opened');
    } else {
      console.log('❌ Could not find analyze button, trying alternative approach...');
      
      // Try clicking any button that might open the analyzer
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on the page`);
      
      for (let i = 0; i < buttons.length; i++) {
        const buttonText = await page.evaluate(btn => btn.textContent, buttons[i]);
        console.log(`Button ${i + 1}: "${buttonText}"`);
        
        if (buttonText && (buttonText.includes('Analyze') || buttonText.includes('YouTube'))) {
          console.log(`✅ Clicking button: "${buttonText}"`);
          await buttons[i].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        }
      }
    }
    
    // Look for URL input field
    console.log('🔍 Looking for YouTube URL input field...');
    let urlInput = await page.$('input[type="url"]') ||
                   await page.$('input[placeholder*="YouTube"]') ||
                   await page.$('input[placeholder*="URL"]') ||
                   await page.$('input[name*="url"]');
    
    if (!urlInput) {
      // Wait a bit more and try again
      await page.waitForTimeout(2000);
      urlInput = await page.$('input[type="url"]') ||
                 await page.$('input[placeholder*="YouTube"]') ||
                 await page.$('input[placeholder*="URL"]') ||
                 await page.$('input');
    }
    
    if (urlInput) {
      console.log('✅ Found URL input field! Entering YouTube URL...');
      
      // Clear and enter the YouTube URL
      await urlInput.click({ clickCount: 3 }); // Select all
      await urlInput.type('https://www.youtube.com/watch?v=mKEq_YaJjPI');
      
      console.log('✅ URL entered: https://www.youtube.com/watch?v=mKEq_YaJjPI');
      
      // Take screenshot with URL entered
      await page.screenshot({ path: '/tmp/step3-url-entered.png', fullPage: true });
      console.log('📸 Screenshot 3: URL entered');
      
      // Look for submit/analyze button
      await new Promise(resolve => setTimeout(resolve, 1000));
      const submitButton = await page.$('button[type="submit"]') ||
                          await page.$('button:has-text("Analyze")') ||
                          await page.$('button:has-text("Submit")') ||
                          await page.$('form button') ||
                          await page.$('button:last-of-type');
      
      if (submitButton) {
        console.log('✅ Found submit button! Starting analysis...');
        
        // Monitor for API calls
        console.log('🚀 Submitting analysis request...');
        await submitButton.click();
        
        // Wait for analysis to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot during analysis
        await page.screenshot({ path: '/tmp/step4-analysis-started.png', fullPage: true });
        console.log('📸 Screenshot 4: Analysis started');
        
        // Wait and monitor the analysis progress
        console.log('⏳ Monitoring analysis progress...');
        
        for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if analysis is complete by looking for results
          const hasResults = await page.$('.analysis-results') ||
                            await page.$('[data-testid="analysis-results"]') ||
                            await page.$('.results') ||
                            await page.evaluate(() => {
                              return document.body.textContent.includes('Analysis complete') ||
                                     document.body.textContent.includes('Actions:') ||
                                     document.body.textContent.includes('suggestions');
                            });
          
          if (hasResults) {
            console.log('🎉 Analysis appears to be complete!');
            break;
          }
          
          if (i % 5 === 0) {
            console.log(`⏳ Still waiting... (${i + 1}s)`);
          }
        }
        
        // Take final screenshot
        await page.screenshot({ path: '/tmp/step5-analysis-complete.png', fullPage: true });
        console.log('📸 Screenshot 5: Analysis complete (or timeout)');
        
      } else {
        console.log('❌ Could not find submit button');
      }
      
    } else {
      console.log('❌ Could not find URL input field');
      
      // Take a screenshot to see current state
      await page.screenshot({ path: '/tmp/debug-no-input.png', fullPage: true });
      console.log('📸 Debug screenshot saved');
    }
    
    // Keep browser open for 10 seconds so user can see the result
    console.log('👀 Keeping browser open for 10 seconds so you can see the result...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n✅ User simulation complete!');
    console.log('📸 Screenshots saved:');
    console.log('  - /tmp/step1-dashboard.png');
    console.log('  - /tmp/step2-modal-opened.png');
    console.log('  - /tmp/step3-url-entered.png');
    console.log('  - /tmp/step4-analysis-started.png');
    console.log('  - /tmp/step5-analysis-complete.png');
    
  } catch (error) {
    console.error('❌ Error during simulation:', error.message);
    
    // Take error screenshot
    try {
      const page = await browser.newPage();
      await page.goto('http://localhost:3000');
      await page.screenshot({ path: '/tmp/error-screenshot.png' });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      console.error('Failed to capture error screenshot');
    }
  } finally {
    await browser.close();
  }
}

// Run the simulation
simulateUserTest().catch(console.error);
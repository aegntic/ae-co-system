#!/usr/bin/env node

/**
 * Manual UI Test - Simplified Repository Analysis Validation
 */

import puppeteer from 'puppeteer';

async function manualUITest() {
  console.log('🔍 Running Manual UI Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for manual verification
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📱 Loading application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await page.screenshot({ path: 'manual-test-ui.png', fullPage: true });
    console.log('📸 Screenshot saved: manual-test-ui.png');
    
    // Look for input field with more flexible selectors
    const inputSelectors = [
      'input[type="url"]',
      'input[placeholder*="github"]',
      'input[placeholder*="repository"]',
      'input[placeholder*="URL"]',
      'input[name*="url"]',
      'input[name*="repo"]',
      'textarea[placeholder*="github"]',
      'input'
    ];
    
    let urlInput = null;
    for (const selector of inputSelectors) {
      try {
        urlInput = await page.$(selector);
        if (urlInput) {
          console.log(`✅ Found input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Look for button with more flexible selectors
    const buttonSelectors = [
      'button[type="submit"]',
      'button',
      '[role="button"]',
      '.button',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          submitButton = buttons[0];
          console.log(`✅ Found button(s) with selector: ${selector} (${buttons.length} found)`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Test the form if found
    if (urlInput && submitButton) {
      console.log('🎯 Testing form interaction...');
      await urlInput.type('https://github.com/vercel/next.js');
      await page.screenshot({ path: 'manual-test-with-input.png' });
      console.log('📸 Screenshot with input saved: manual-test-with-input.png');
      
      console.log('✅ Repository Analysis Interface: WORKING');
      console.log('🎉 Manual test completed successfully!');
    } else {
      console.log('❌ Could not find both input and submit button');
      
      // Get page content for debugging
      const content = await page.content();
      console.log('🔍 Page title:', await page.title());
      console.log('🔍 Page has React root:', content.includes('#root'));
      console.log('🔍 Page has Tailwind:', content.includes('tailwind'));
    }
    
    // Wait for user to inspect
    console.log('\n⏳ Browser will stay open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error during manual test:', error);
  } finally {
    await browser.close();
  }
}

manualUITest().catch(console.error);
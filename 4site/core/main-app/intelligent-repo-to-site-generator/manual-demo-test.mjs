#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function manualDemoTest() {
  console.log('🧪 Manual Demo Test - Testing site generation step by step...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    
    // Monitor all activity
    page.on('console', msg => console.log(`[${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', error => console.log(`[ERROR]: ${error.message}`));

    console.log('📖 Loading page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded successfully');
    
    // Find and fill the input
    console.log('🔍 Looking for input field...');
    const input = await page.$('input[type="text"]');
    if (!input) {
      throw new Error('Input field not found');
    }
    
    console.log('✍️ Filling input with test repository...');
    await input.click();
    await input.focus();
    
    // Clear any existing content
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    
    await page.keyboard.type('facebook/react');
    
    const inputValue = await input.evaluate(el => el.value);
    console.log(`📝 Input value: "${inputValue}"`);
    
    // Find submit button
    console.log('🔍 Looking for submit button...');
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    const buttonText = await submitButton.evaluate(el => el.textContent);
    console.log(`🔘 Found button: "${buttonText}"`);
    
    // Click to start generation
    console.log('🚀 Starting generation...');
    await submitButton.click();
    
    // Wait and monitor for changes
    console.log('⏳ Monitoring page changes...');
    
    let attempts = 0;
    let maxAttempts = 30; // 30 seconds
    let generationCompleted = false;
    
    while (attempts < maxAttempts && !generationCompleted) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const pageState = await page.evaluate(() => {
        const loadingSpinners = document.querySelectorAll('.animate-spin');
        const loadingText = document.body.textContent.includes('Generating');
        const hasError = document.querySelector('.text-red-300, .border-red-500');
        const hasPreview = document.querySelector('header') && document.querySelector('section');
        const hasActionBar = document.querySelector('.fixed.bottom-6');
        const hasDemoBanner = document.body.textContent.includes('Demo Mode');
        
        return {
          loadingSpinners: loadingSpinners.length,
          loadingText,
          hasError: !!hasError,
          hasPreview: !!hasPreview,
          hasActionBar: !!hasActionBar,
          hasDemoBanner,
          bodyText: document.body.textContent.substring(0, 200)
        };
      });
      
      console.log(`[${attempts}s] State:`, {
        loading: pageState.loadingSpinners > 0 || pageState.loadingText,
        error: pageState.hasError,
        preview: pageState.hasPreview,
        actionBar: pageState.hasActionBar,
        demo: pageState.hasDemoBanner
      });
      
      if (pageState.hasPreview || pageState.hasError) {
        generationCompleted = true;
        console.log('🎉 Generation process completed!');
        
        if (pageState.hasPreview) {
          console.log('✅ Site preview generated successfully');
          
          if (pageState.hasDemoBanner) {
            console.log('🎭 Demo mode banner detected');
          }
          
          if (pageState.hasActionBar) {
            console.log('🎬 Action buttons available');
          }
        }
        
        if (pageState.hasError) {
          console.log('⚠️ Error state detected');
        }
      }
    }
    
    if (!generationCompleted) {
      console.log('⏰ Generation timed out after 30 seconds');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'manual-demo-test-result.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: manual-demo-test-result.png');
    
    // Keep browser open for manual inspection
    console.log('🔍 Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

manualDemoTest();
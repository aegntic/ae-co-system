#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function simpleCheck() {
  console.log('🔍 Simple Browser Check...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();
    
    // Capture errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });

    console.log('📖 Loading page...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'load', 
      timeout: 15000 
    });

    // Wait for potential React rendering
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔍 Checking what rendered...');
    const pageInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;
      
      return {
        title: document.title,
        hasRoot: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 500) : 'No root element',
        bodyText: body.innerText.substring(0, 300),
        errorElements: document.querySelectorAll('.error, [class*="error"]').length,
        inputElements: document.querySelectorAll('input').length,
        buttonElements: document.querySelectorAll('button').length,
        navElements: document.querySelectorAll('nav').length
      };
    });

    console.log('📊 Page Analysis:');
    console.log('  Title:', pageInfo.title);
    console.log('  Has Root:', pageInfo.hasRoot);
    console.log('  Input Elements:', pageInfo.inputElements);
    console.log('  Button Elements:', pageInfo.buttonElements);
    console.log('  Nav Elements:', pageInfo.navElements);
    console.log('  Error Elements:', pageInfo.errorElements);
    console.log('  Body Text:', pageInfo.bodyText);
    
    if (pageInfo.rootHTML.length > 10) {
      console.log('  Root Content Preview:', pageInfo.rootHTML.substring(0, 200) + '...');
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'app-current-state.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: app-current-state.png');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

simpleCheck();
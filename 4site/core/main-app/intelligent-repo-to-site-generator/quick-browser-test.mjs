#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function quickTest() {
  console.log('🔍 Quick Browser Test - Checking what actually renders...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });

    console.log('📖 Loading page...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'quick-test-screenshot.png', 
      fullPage: true 
    });

    console.log('🔍 Checking DOM structure...');
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      return {
        hasRoot: !!document.getElementById('root'),
        rootChildren: document.getElementById('root')?.children.length || 0,
        bodyClasses: body.className,
        firstElementTag: body.firstElementChild?.tagName,
        textContent: body.innerText.substring(0, 200) + '...'
      };
    });

    console.log('📊 DOM Analysis:', bodyContent);

    // Check for specific elements
    const elementCheck = await page.evaluate(() => {
      return {
        hasNav: !!document.querySelector('nav'),
        hasInput: !!document.querySelector('input'),
        hasButton: !!document.querySelector('button'),
        hasH1: !!document.querySelector('h1'),
        errorVisible: !!document.querySelector('.error, [class*="error"]'),
        glassElements: document.querySelectorAll('[class*="glass"]').length
      };
    });

    console.log('🎯 Element Check:', elementCheck);

    // Get the current URL
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);

    // Check page title
    const title = await page.title();
    console.log('📋 Page Title:', title);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickTest();
#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function detailedTest() {
  console.log('🔧 Running detailed interface diagnostics...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console and network monitoring
    const responses = [];
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', (msg) => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      console.log(`📝 Console: ${message}`);
    });
    
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
      console.log(`🌐 Network: ${response.status()} ${response.url()}`);
    });
    
    page.on('pageerror', (error) => {
      const errorMsg = error.message;
      errors.push(errorMsg);
      console.log(`❌ Page Error: ${errorMsg}`);
    });
    
    page.on('requestfailed', (request) => {
      console.log(`🚫 Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    // Navigate to the page
    console.log('🚀 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Wait for React to potentially load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check DOM structure
    console.log('\n🔍 Analyzing DOM structure...');
    
    const rootElement = await page.$('#root');
    if (rootElement) {
      console.log('✅ Root element found');
      
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          innerHTML: root ? root.innerHTML.substring(0, 500) : 'No root element',
          childCount: root ? root.children.length : 0,
          textContent: root ? root.textContent.substring(0, 200) : 'No content'
        };
      });
      
      console.log(`📊 Root element children: ${rootContent.childCount}`);
      console.log(`📄 Text content: "${rootContent.textContent}"`);
      console.log(`🏗️  HTML preview: ${rootContent.innerHTML}`);
    } else {
      console.log('❌ No root element found');
    }
    
    // Check for specific elements
    const elements = await page.evaluate(() => {
      return {
        headings: document.querySelectorAll('h1, h2, h3').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        navs: document.querySelectorAll('nav').length,
        divs: document.querySelectorAll('div').length,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('\n📈 DOM Element Count:');
    Object.entries(elements).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Check for React-specific errors
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      if (window.React) {
        errors.push('React loaded successfully');
      } else {
        errors.push('React not found in window object');
      }
      
      if (window.ReactDOM) {
        errors.push('ReactDOM loaded successfully');
      } else {
        errors.push('ReactDOM not found in window object');
      }
      
      return errors;
    });
    
    console.log('\n⚛️  React Status:');
    reactErrors.forEach(error => console.log(`  ${error}`));
    
    // Check Vite status
    const viteStatus = await page.evaluate(() => {
      return typeof window.__VITE_HMR__ !== 'undefined';
    });
    
    console.log(`⚡ Vite HMR: ${viteStatus ? 'Active' : 'Not detected'}`);
    
    // Take a more detailed screenshot
    await page.screenshot({ 
      path: '/tmp/detailed-interface-screenshot.png', 
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to /tmp/detailed-interface-screenshot.png');
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`✅ Total network responses: ${responses.length}`);
    console.log(`💬 Console messages: ${consoleMessages.length}`);
    console.log(`❌ JavaScript errors: ${errors.length}`);
    console.log(`🎯 DOM elements found: ${elements.totalElements}`);
    
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    // API status check
    const apiResponses = responses.filter(r => r.url.includes('/api/'));
    console.log(`🔗 API calls made: ${apiResponses.length}`);
    apiResponses.forEach(resp => {
      console.log(`  ${resp.status} ${resp.url}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

detailedTest().catch(console.error);
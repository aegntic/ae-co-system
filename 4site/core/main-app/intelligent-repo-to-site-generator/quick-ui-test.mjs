#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function quickUIAnalysis() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('📍 Navigating to application...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  console.log('🔍 Analyzing UI structure...');
  
  // Get all interactive elements
  const uiElements = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
      type: 'input',
      tagName: el.tagName,
      type_attr: el.type,
      placeholder: el.placeholder,
      name: el.name,
      id: el.id,
      className: el.className,
      selector: el.type ? `input[type="${el.type}"]` : `input[placeholder="${el.placeholder}"]`
    }));
    
    const buttons = Array.from(document.querySelectorAll('button')).map(el => ({
      type: 'button',
      tagName: el.tagName,
      textContent: el.textContent?.trim().substring(0, 50),
      className: el.className,
      type_attr: el.type,
      selector: el.type ? `button[type="${el.type}"]` : `button`
    }));
    
    const forms = Array.from(document.querySelectorAll('form')).map(el => ({
      type: 'form',
      tagName: el.tagName,
      action: el.action,
      method: el.method,
      className: el.className
    }));
    
    return { inputs, buttons, forms, bodyText: document.body.innerText.substring(0, 500) };
  });
  
  console.log('🎯 UI Analysis Results:');
  console.log('====================');
  console.log('INPUTS:', JSON.stringify(uiElements.inputs, null, 2));
  console.log('BUTTONS:', JSON.stringify(uiElements.buttons, null, 2));
  console.log('FORMS:', JSON.stringify(uiElements.forms, null, 2));
  console.log('BODY PREVIEW:', uiElements.bodyText);
  
  // Take a screenshot
  await page.screenshot({ 
    path: '/home/tabs/ae-co-system/4site/core/main-app/intelligent-repo-to-site-generator/ui-analysis.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved: ui-analysis.png');
  
  // Keep browser open for manual inspection
  console.log('🔍 Browser kept open for manual inspection...');
  console.log('Press Ctrl+C to close when done.');
  
  // Wait for manual inspection
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      console.log('\n🚪 Closing browser...');
      browser.close().then(resolve);
    });
  });
}

quickUIAnalysis().catch(console.error);
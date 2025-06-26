#!/usr/bin/env node

import { launch } from 'puppeteer';
import chalk from 'chalk';

const debugApp = async () => {
  console.log(chalk.blue('🔍 Starting app debug session...'));
  
  const browser = await launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log(chalk.red(`❌ Console Error: ${text}`));
    } else if (type === 'warning') {
      console.log(chalk.yellow(`⚠️  Console Warning: ${text}`));
    } else if (type === 'log') {
      console.log(chalk.green(`📝 Console Log: ${text}`));
    }
  });
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    console.log(chalk.red(`💥 Page Error: ${error.message}`));
  });
  
  // Listen for response errors
  page.on('response', (response) => {
    if (!response.ok()) {
      console.log(chalk.red(`🌐 HTTP Error: ${response.status()} - ${response.url()}`));
    }
  });
  
  try {
    console.log(chalk.blue('🌐 Navigating to http://localhost:5173...'));
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to mount
    await page.waitForTimeout(3000);
    
    // Check if the app loaded
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector('#root') !== null;
    });
    
    const hasContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return root && root.children.length > 0;
    });
    
    console.log(chalk.green(`✅ React root found: ${hasReactRoot}`));
    console.log(chalk.green(`✅ Content rendered: ${hasContent}`));
    
    if (hasContent) {
      const title = await page.title();
      console.log(chalk.green(`📄 Page title: ${title}`));
      
      // Take screenshot
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log(chalk.green('📸 Screenshot saved as debug-screenshot.png'));
    }
    
    // Keep browser open for manual inspection
    console.log(chalk.blue('🔍 Browser opened for manual inspection. Close it when done.'));
    
    // Wait for browser to be closed manually
    await new Promise(resolve => {
      const checkClosed = setInterval(async () => {
        const pages = await browser.pages();
        if (pages.length === 0) {
          clearInterval(checkClosed);
          resolve();
        }
      }, 1000);
    });
    
  } catch (error) {
    console.log(chalk.red(`💥 Navigation Error: ${error.message}`));
  } finally {
    await browser.close();
  }
};

debugApp().catch(console.error);
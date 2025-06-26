#!/usr/bin/env node

/**
 * Manual Debug Test for 4site.pro AI Generation
 * Focus on identifying the core generation issue
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m', 
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

let frontendServer = null;
let apiServer = null;

const startServers = async () => {
  log('🚀 Starting servers...');
  
  frontendServer = spawn('bun', ['run', 'dev:vite'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, PORT: '5173' }
  });
  
  apiServer = spawn('bun', ['run', 'dev:api'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, API_PORT: '3001' }
  });

  await new Promise(resolve => setTimeout(resolve, 8000));
};

const stopServers = async () => {
  if (frontendServer) frontendServer.kill();
  if (apiServer) apiServer.kill();
};

const debugGeneration = async () => {
  try {
    await startServers();
    
    const browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(logEntry);
      log(`CONSOLE: ${logEntry}`, msg.type() === 'error' ? 'error' : 'info');
    });

    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
      log(`REQUEST: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      log(`RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    log('📍 Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Create debug directory
    await fs.mkdir(join(__dirname, 'debug-results'), { recursive: true });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: join(__dirname, 'debug-results', '01-initial-load.png'),
      fullPage: true 
    });
    
    // Check page content
    const pageTitle = await page.title();
    log(`Page title: ${pageTitle}`);
    
    const bodyContent = await page.$eval('body', el => el.innerHTML.slice(0, 500));
    log(`Body content preview: ${bodyContent}...`);
    
    // Find the form elements
    const urlInput = await page.$('input[type="url"]');
    const generateButton = await page.$('button');
    
    if (!urlInput || !generateButton) {
      log('❌ Essential form elements not found', 'error');
      await browser.close();
      return false;
    }
    
    log('✅ Form elements found');
    
    // Enter URL
    log('📍 Entering test URL...');
    await urlInput.type('https://github.com/microsoft/typescript');
    
    await page.screenshot({ 
      path: join(__dirname, 'debug-results', '02-url-entered.png'),
      fullPage: true 
    });
    
    // Get current button state
    const buttonState = await page.evaluate(() => {
      const btn = document.querySelector('button');
      return {
        text: btn.textContent,
        disabled: btn.disabled,
        className: btn.className
      };
    });
    
    log(`Button state: ${JSON.stringify(buttonState)}`);
    
    // Click the button
    log('📍 Clicking generate button...');
    await generateButton.click();
    
    // Wait a moment and check for immediate changes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: join(__dirname, 'debug-results', '03-after-click.png'),
      fullPage: true 
    });
    
    // Check for loading state
    const loadingState = await page.evaluate(() => {
      const spinner = document.querySelector('.apple-spinner');
      const btn = document.querySelector('button');
      const errorElement = document.querySelector('.text-red-400, .error-message');
      
      return {
        hasSpinner: !!spinner,
        buttonText: btn ? btn.textContent : 'No button',
        buttonDisabled: btn ? btn.disabled : false,
        hasError: !!errorElement,
        errorText: errorElement ? errorElement.textContent : null
      };
    });
    
    log(`Loading state: ${JSON.stringify(loadingState)}`);
    
    // Wait longer and check for final result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalState = await page.evaluate(() => {
      const spinner = document.querySelector('.apple-spinner');
      const preview = document.querySelector('.prose, .preview-content');
      const error = document.querySelector('.text-red-400, .error-message');
      
      return {
        hasSpinner: !!spinner,
        hasPreview: !!preview,
        hasError: !!error,
        errorText: error ? error.textContent : null
      };
    });
    
    log(`Final state: ${JSON.stringify(finalState)}`);
    
    await page.screenshot({ 
      path: join(__dirname, 'debug-results', '04-final-state.png'),
      fullPage: true 
    });
    
    // Save debug data
    const debugData = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      networkRequests,
      buttonState,
      loadingState,
      finalState
    };
    
    await fs.writeFile(
      join(__dirname, 'debug-results', 'debug-data.json'),
      JSON.stringify(debugData, null, 2)
    );
    
    log('🔍 Debug completed. Check debug-results/ for detailed information.');
    log('🔍 Browser will remain open for manual inspection. Press Ctrl+C to close.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        log('Closing browser...');
        browser.close().then(resolve);
      });
    });
    
    return true;
    
  } catch (error) {
    log(`❌ Debug failed: ${error.message}`, 'error');
    return false;
  } finally {
    await stopServers();
  }
};

// Run debug
debugGeneration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`Critical error: ${error.message}`, 'error');
  process.exit(1);
});
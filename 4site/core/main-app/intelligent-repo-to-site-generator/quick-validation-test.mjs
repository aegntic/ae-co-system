#!/usr/bin/env node

/**
 * Quick Validation Test for 4site.pro
 * Ultra Elite Integration Specialist - Quick Health Check
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

const quickValidation = async () => {
  try {
    await startServers();
    
    const browser = await puppeteer.launch({ headless: false }); // Non-headless for debugging
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    log('📍 Testing: Landing page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await fs.mkdir(join(__dirname, 'quick-test-results'), { recursive: true });
    await page.screenshot({ 
      path: join(__dirname, 'quick-test-results', 'landing-page.png'),
      fullPage: true 
    });
    
    // Check essential elements
    const urlInput = await page.$('input[type="url"]');
    const generateButton = await page.$('button');
    
    if (!urlInput) {
      log('❌ URL input not found', 'error');
      return false;
    }
    
    if (!generateButton) {
      log('❌ Generate button not found', 'error');
      return false;
    }
    
    log('✅ Essential elements found');
    
    // Test form interaction
    log('📍 Testing: Form interaction...');
    await urlInput.type('https://github.com/microsoft/typescript');
    await page.screenshot({ 
      path: join(__dirname, 'quick-test-results', 'url-entered.png'),
      fullPage: true 
    });
    
    // Check button state
    const isButtonDisabled = await page.$eval('button', btn => btn.disabled);
    log(`Button disabled state: ${isButtonDisabled}`);
    
    // Get button text
    const buttonText = await page.$eval('button', btn => btn.textContent);
    log(`Button text: "${buttonText}"`);
    
    // Try clicking the button
    log('📍 Testing: Button click...');
    await generateButton.click();
    
    // Wait a moment and check for changes
    await page.waitForTimeout(2000);
    
    const newButtonText = await page.$eval('button', btn => btn.textContent);
    log(`Button text after click: "${newButtonText}"`);
    
    // Check for spinner
    const hasSpinner = await page.$('.apple-spinner');
    log(`Spinner present: ${!!hasSpinner}`);
    
    // Check for error messages
    const errorElements = await page.$$('.text-red-400, .error-message');
    if (errorElements.length > 0) {
      const errorText = await page.$eval('.text-red-400, .error-message', el => el.textContent);
      log(`Error message: ${errorText}`, 'warning');
    }
    
    await page.screenshot({ 
      path: join(__dirname, 'quick-test-results', 'after-click.png'),
      fullPage: true 
    });
    
    // Check console for errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await browser.close();
    
    log('✅ Quick validation completed');
    log(`📸 Screenshots saved to: ${join(__dirname, 'quick-test-results')}`);
    
    return true;
    
  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, 'error');
    return false;
  } finally {
    await stopServers();
  }
};

// Run validation
quickValidation().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`Critical error: ${error.message}`, 'error');
  process.exit(1);
});
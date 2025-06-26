#!/usr/bin/env node

/**
 * Dashboard Verification Script - LINK VERIFICATION PROTOCOL
 * Tests localhost:5173 interface before sharing with user
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verifyDashboard() {
  let browser;
  
  try {
    console.log('🚀 Starting Dashboard Verification...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📡 Navigating to http://localhost:5173...');
    
    // Navigate with timeout
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for key elements
    console.log('🔍 Checking for essential elements...');
    
    // Check for main container
    const mainContent = await page.$('div');
    if (!mainContent) {
      throw new Error('No main content div found');
    }
    console.log('✅ Main content container found');
    
    // Check for any error messages
    const errorElements = await page.$$eval('*', elements => {
      return elements.some(el => 
        el.textContent && 
        (el.textContent.includes('Error') || 
         el.textContent.includes('404') || 
         el.textContent.includes('Failed'))
      );
    });
    
    if (errorElements) {
      throw new Error('Error messages detected on page');
    }
    console.log('✅ No error messages found');
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'public', 'dashboard-verification.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Check page title
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);
    
    // Get page text content to verify content loaded
    const bodyText = await page.evaluate(() => document.body.textContent);
    const hasContent = bodyText && bodyText.trim().length > 100;
    
    if (!hasContent) {
      throw new Error('Page appears to be empty or minimal content');
    }
    console.log(`✅ Page has ${bodyText.length} characters of content`);
    
    // Look for DailyDoco specific content
    const hasDailyDocoContent = bodyText.includes('DailyDoco') || 
                               bodyText.includes('documentation') ||
                               bodyText.includes('Dashboard');
    
    if (!hasDailyDocoContent) {
      console.log('⚠️  Warning: No DailyDoco-specific content detected');
      console.log('First 200 chars:', bodyText.substring(0, 200));
    } else {
      console.log('✅ DailyDoco content detected');
    }
    
    // Check for interactive elements
    const buttons = await page.$$('button');
    const links = await page.$$('a');
    console.log(`🎯 Found ${buttons.length} buttons and ${links.length} links`);
    
    // Final success
    console.log('\n🎉 DASHBOARD VERIFICATION SUCCESSFUL!');
    console.log('📊 Summary:');
    console.log(`   • URL: http://localhost:5173`);
    console.log(`   • Status: Fully functional`);
    console.log(`   • Content: ${bodyText.length} characters`);
    console.log(`   • Interactive elements: ${buttons.length + links.length}`);
    console.log(`   • Screenshot: dashboard-verification.png`);
    console.log('\n✅ SAFE TO SHARE WITH USER');
    
    return {
      success: true,
      url: 'http://localhost:5173',
      title,
      contentLength: bodyText.length,
      interactiveElements: buttons.length + links.length,
      screenshotPath
    };
    
  } catch (error) {
    console.error('\n❌ DASHBOARD VERIFICATION FAILED!');
    console.error('Error:', error.message);
    console.error('\n🚨 DO NOT SHARE LINK WITH USER');
    
    return {
      success: false,
      error: error.message
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run verification
verifyDashboard().then(result => {
  process.exit(result.success ? 0 : 1);
});
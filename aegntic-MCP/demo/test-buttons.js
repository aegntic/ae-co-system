#!/usr/bin/env node

/**
 * Test button functionality in the demo
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

async function testButtons() {
  console.log(chalk.blue('🧪 Testing demo button functionality...'));
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    page = await browser.newPage();
    
    // Navigate to demo
    console.log(chalk.yellow('📱 Navigating to demo...'));
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Test individual server buttons
    console.log(chalk.cyan('🔧 Testing individual server buttons...'));
    
    const servers = [
      'aegntic-knowledge-engine',
      'claude-export-mcp', 
      'firebase-studio-mcp',
      'n8n-mcp',
      'docker-mcp'
    ];
    
    for (const server of servers) {
      try {
        console.log(chalk.green(`   Testing ${server}...`));
        
        // Click the server button
        await page.evaluate((serverName) => {
          testIndividualServer(serverName);
        }, server);
        
        // Wait for output to appear
        await page.waitForTimeout(3000);
        
        // Check if output appeared
        const outputVisible = await page.evaluate(() => {
          const output = document.getElementById('demo-output');
          return output && output.style.display !== 'none';
        });
        
        if (outputVisible) {
          console.log(chalk.green(`   ✅ ${server} button working!`));
          
          // Get the output text
          const outputText = await page.evaluate(() => {
            const output = document.getElementById('demo-output');
            return output ? output.textContent.slice(-200) : 'No output';
          });
          
          console.log(chalk.gray(`   Output: ${outputText.trim()}`));
        } else {
          console.log(chalk.red(`   ❌ ${server} button not working`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Error testing ${server}: ${error.message}`));
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Test recording button
    console.log(chalk.cyan('🎥 Testing recording button...'));
    try {
      await page.click('.record-btn');
      await page.waitForTimeout(2000);
      
      const buttonText = await page.evaluate(() => {
        return document.querySelector('.record-btn')?.textContent;
      });
      
      if (buttonText && buttonText.includes('Stop')) {
        console.log(chalk.green('   ✅ Recording button working!'));
      } else {
        console.log(chalk.red('   ❌ Recording button not working'));
      }
      
    } catch (error) {
      console.log(chalk.red(`   ❌ Error testing recording button: ${error.message}`));
    }
    
    console.log(chalk.green('\n🎉 Button testing completed!'));
    
    // Keep browser open for manual testing
    console.log(chalk.blue('Browser will stay open for manual testing...'));
    console.log(chalk.yellow('Press Ctrl+C to close.'));
    
    // Wait for user to close
    await new Promise((resolve) => {
      process.on('SIGINT', resolve);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testButtons();
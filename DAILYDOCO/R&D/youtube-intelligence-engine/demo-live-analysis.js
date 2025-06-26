#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function liveDemoAnalysis() {
  console.log('🎬 Starting live demonstration of YouTube Intelligence Engine...');
  
  const browser = await puppeteer.launch({
    headless: false,  // Keep browser visible
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable detailed logging
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`🔴 Error: ${text}`);
      } else if (type === 'warn') {
        console.log(`🟡 Warning: ${text}`);
      } else if (text.includes('API')) {
        console.log(`🌐 ${text}`);
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const url = response.url();
        if (status === 200) {
          console.log(`✅ API Success: ${url}`);
        } else if (status >= 400) {
          console.log(`❌ API Error: ${status} ${url}`);
        }
      }
    });
    
    // Navigate to the dashboard
    console.log('🚀 Loading YouTube Intelligence Engine dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 4000));
    console.log('✅ Dashboard loaded successfully!');
    
    // Take initial screenshot
    await page.screenshot({ path: '/tmp/demo-step1-dashboard.png', fullPage: true });
    console.log('📸 Screenshot: Dashboard loaded');
    
    // Find and click the "Analyze YouTube URL" button
    console.log('🔍 Looking for "Analyze YouTube URL" button...');
    
    const buttons = await page.$$('button');
    let analyzeButton = null;
    
    for (const button of buttons) {
      const text = await page.evaluate(btn => btn.textContent.trim(), button);
      if (text.includes('Analyze YouTube URL') || text.includes('Analyze')) {
        analyzeButton = button;
        console.log(`✅ Found button: "${text}"`);
        break;
      }
    }
    
    if (!analyzeButton) {
      throw new Error('Could not find Analyze YouTube URL button');
    }
    
    // Click the analyze button
    console.log('🖱️  Clicking "Analyze YouTube URL" button...');
    await analyzeButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of opened modal
    await page.screenshot({ path: '/tmp/demo-step2-modal.png', fullPage: true });
    console.log('📸 Screenshot: Analysis modal opened');
    
    // Find and fill the URL input
    console.log('🔍 Looking for YouTube URL input field...');
    const urlInput = await page.$('input[type="url"]') || 
                    await page.$('input[placeholder*="YouTube"]') ||
                    await page.$('input[placeholder*="URL"]') ||
                    await page.$('input');
    
    if (!urlInput) {
      throw new Error('Could not find URL input field');
    }
    
    // Enter the YouTube URL
    const testUrl = 'https://www.youtube.com/watch?v=mKEq_YaJjPI';
    console.log(`📝 Entering YouTube URL: ${testUrl}`);
    
    await urlInput.click({ clickCount: 3 }); // Select all existing text
    await urlInput.type(testUrl);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot with URL entered
    await page.screenshot({ path: '/tmp/demo-step3-url-entered.png', fullPage: true });
    console.log('📸 Screenshot: URL entered');
    
    // Find and click submit button
    console.log('🔍 Looking for submit/analyze button...');
    const submitButton = await page.$('button[type="submit"]') ||
                        await page.$('form button') ||
                        await page.$('button:last-of-type');
    
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    // Start analysis
    console.log('🚀 Starting YouTube analysis...');
    console.log('⏳ This may take a few moments...');
    
    await submitButton.click();
    
    // Monitor the analysis progress
    console.log('📊 Monitoring analysis progress...');
    
    let analysisComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds
    
    while (!analysisComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // Check for results, errors, or completion indicators
      const pageContent = await page.evaluate(() => document.body.textContent);
      
      if (pageContent.includes('Analysis complete') ||
          pageContent.includes('Results:') ||
          pageContent.includes('Actions:') ||
          pageContent.includes('suggestions') ||
          pageContent.includes('Error:') ||
          pageContent.includes('Failed')) {
        analysisComplete = true;
        console.log('🎉 Analysis completed!');
      }
      
      // Log progress every 5 seconds
      if (attempts % 5 === 0) {
        console.log(`⏳ Still processing... (${attempts}s elapsed)`);
        
        // Take progress screenshot
        await page.screenshot({ path: `/tmp/demo-progress-${attempts}s.png`, fullPage: true });
      }
    }
    
    if (!analysisComplete) {
      console.log('⏰ Analysis timeout reached, but continuing...');
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/tmp/demo-final-results.png', fullPage: true });
    console.log('📸 Screenshot: Final results');
    
    // Extract and display any visible results
    console.log('\n🔍 Extracting visible results...');
    
    const results = await page.evaluate(() => {
      const body = document.body;
      const text = body.textContent;
      
      // Look for specific result indicators
      const hasResults = text.includes('Analysis') || text.includes('Results') || text.includes('Actions');
      const hasErrors = text.includes('Error') || text.includes('Failed');
      
      // Get any visible result containers
      const resultElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('result') || text.includes('action') || text.includes('suggestion');
      });
      
      return {
        hasResults,
        hasErrors,
        resultCount: resultElements.length,
        pageTitle: document.title,
        visibleText: text.slice(0, 500) // First 500 chars for context
      };
    });
    
    console.log('\n📋 Analysis Results Summary:');
    console.log(`   Title: ${results.pageTitle}`);
    console.log(`   Has Results: ${results.hasResults ? '✅' : '❌'}`);
    console.log(`   Has Errors: ${results.hasErrors ? '⚠️' : '✅'}`);
    console.log(`   Result Elements: ${results.resultCount}`);
    
    if (results.visibleText) {
      console.log(`   Page Content Preview: "${results.visibleText.slice(0, 200)}..."`);
    }
    
    // Keep browser open for exploration
    console.log('\n🎯 DEMONSTRATION COMPLETE!');
    console.log('📸 Screenshots saved:');
    console.log('   - /tmp/demo-step1-dashboard.png (Initial dashboard)');
    console.log('   - /tmp/demo-step2-modal.png (Analysis modal)');
    console.log('   - /tmp/demo-step3-url-entered.png (URL entered)');
    console.log('   - /tmp/demo-final-results.png (Final results)');
    
    console.log('\n👀 Browser will stay open for 5 minutes so you can explore the results!');
    console.log('   Navigate to: http://localhost:3000');
    console.log('   Check the dashboard, knowledge graph, and any analysis results.');
    
    // Keep browser open for 5 minutes (300 seconds)
    await new Promise(resolve => setTimeout(resolve, 300000));
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: '/tmp/demo-error.png', fullPage: true });
      console.log('📸 Error screenshot saved to /tmp/demo-error.png');
    } catch (e) {
      console.error('Failed to capture error screenshot');
    }
    
    // Still keep browser open for inspection
    console.log('🔍 Browser staying open for error inspection...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
  } finally {
    console.log('🔒 Closing browser...');
    await browser.close();
  }
}

// Run the live demo
console.log('🎬 Starting YouTube Intelligence Engine Live Demo');
console.log('   Target URL: https://www.youtube.com/watch?v=mKEq_YaJjPI');
console.log('   Dashboard: http://localhost:3000');
console.log('   Backend: http://localhost:8000');
console.log('');

liveDemoAnalysis().catch(console.error);
#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testWorkingAnalysis() {
  console.log('🧪 Testing YouTube Analysis with Results Display...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to dashboard
    console.log('🚀 Loading dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Analyze YouTube URL button
    console.log('🖱️  Clicking Analyze YouTube URL...');
    const analyzeButton = await page.$('button:has-text("Analyze YouTube URL")') ||
                         await page.$('button[aria-label*="Analyze"]') ||
                         await page.$$eval('button', buttons => 
                           buttons.find(btn => btn.textContent.includes('Analyze'))
                         );
    
    if (!analyzeButton) {
      // Try finding by text content
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(btn => btn.textContent, button);
        if (text.includes('Analyze')) {
          await button.click();
          break;
        }
      }
    } else {
      await analyzeButton.click();
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enter YouTube URL
    console.log('📝 Entering YouTube URL...');
    const urlInput = await page.$('input[type="url"]') || await page.$('input');
    await urlInput.type('https://www.youtube.com/watch?v=mKEq_YaJjPI');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Submit analysis
    console.log('🚀 Submitting analysis...');
    const submitButton = await page.$('button[type="submit"]') || 
                        await page.$$eval('button', buttons => 
                          buttons.find(btn => btn.textContent.includes('Start') || btn.textContent.includes('Analyze'))
                        );
    
    await submitButton.click();
    
    // Wait for analysis to complete and results to show
    console.log('⏳ Waiting for analysis completion and results display...');
    
    let resultsShown = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds
    
    while (!resultsShown && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // Check if results are displayed
      const pageContent = await page.evaluate(() => document.body.textContent);
      
      if (pageContent.includes('Analysis Complete') || 
          pageContent.includes('Actionable Insights') ||
          pageContent.includes('Overall Rating') ||
          pageContent.includes('Technical Concepts')) {
        resultsShown = true;
        console.log('✅ Results are now displayed!');
        break;
      }
      
      // Progress logging
      if (attempts % 5 === 0) {
        console.log(`⏳ Still waiting... (${attempts}s elapsed)`);
      }
    }
    
    if (!resultsShown) {
      console.log('⚠️  Results not displayed yet, but analysis may have completed');
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/tmp/working-analysis-results.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/working-analysis-results.png');
    
    // Extract some results information
    const resultsInfo = await page.evaluate(() => {
      const content = document.body.textContent;
      return {
        hasAnalysisComplete: content.includes('Analysis Complete'),
        hasActionableInsights: content.includes('Actionable Insights'),
        hasRating: content.includes('Overall Rating'),
        hasTechnicalConcepts: content.includes('Technical Concepts'),
        hasEnhancementSuggestions: content.includes('Enhancement Suggestions')
      };
    });
    
    console.log('\n📊 Results Analysis:');
    console.log(`   Analysis Complete Section: ${resultsInfo.hasAnalysisComplete ? '✅' : '❌'}`);
    console.log(`   Actionable Insights: ${resultsInfo.hasActionableInsights ? '✅' : '❌'}`);
    console.log(`   Overall Rating: ${resultsInfo.hasRating ? '✅' : '❌'}`);
    console.log(`   Technical Concepts: ${resultsInfo.hasTechnicalConcepts ? '✅' : '❌'}`);
    console.log(`   Enhancement Suggestions: ${resultsInfo.hasEnhancementSuggestions ? '✅' : '❌'}`);
    
    console.log('\n🎯 TEST COMPLETE! Browser will stay open for 2 minutes for exploration.');
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: /tmp/test-error.png');
  } finally {
    await browser.close();
  }
}

testWorkingAnalysis();
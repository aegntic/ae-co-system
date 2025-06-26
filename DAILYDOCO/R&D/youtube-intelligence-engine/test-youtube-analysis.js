const puppeteer = require('puppeteer');

async function testYouTubeAnalysis() {
  console.log('🚀 Starting YouTube Intelligence Engine Test with Puppeteer...');
  
  // Launch browser with GUI visible
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the YouTube Intelligence Engine frontend
    console.log('📱 Navigating to YouTube Intelligence Engine dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load completely
    await page.waitForTimeout(2000);
    
    console.log('🎯 Looking for the "Analyze YouTube URL" button...');
    
    // Wait for and click the analyze button
    await page.waitForSelector('button:has-text("Analyze YouTube URL")', { timeout: 10000 });
    await page.click('button:has-text("Analyze YouTube URL")');
    
    console.log('✅ Clicked analyze button, waiting for modal...');
    
    // Wait for the modal to appear
    await page.waitForSelector('input[placeholder*="youtube.com"]', { timeout: 5000 });
    
    console.log('📝 Entering YouTube URL...');
    
    // Enter the YouTube URL
    const youtubeUrl = 'https://www.youtube.com/watch?v=mKEq_YaJjPI';
    await page.type('input[placeholder*="youtube.com"]', youtubeUrl);
    
    // Wait a moment for the URL validation
    await page.waitForTimeout(1000);
    
    console.log('🔍 Starting analysis...');
    
    // Click the Start Analysis button
    await page.click('button:has-text("Start Analysis")');
    
    console.log('⏳ Analysis started, monitoring progress...');
    
    // Monitor the analysis progress
    let analysisComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes timeout
    
    while (!analysisComplete && attempts < maxAttempts) {
      try {
        // Check if analysis is complete by looking for results
        const resultsVisible = await page.$('div:has-text("Analysis Complete")');
        
        if (resultsVisible) {
          analysisComplete = true;
          console.log('🎉 Analysis completed successfully!');
          break;
        }
        
        // Check progress percentage if visible
        try {
          const progressElement = await page.$('.font-mono');
          if (progressElement) {
            const progressText = await page.evaluate(el => el.textContent, progressElement);
            if (progressText && progressText.includes('%')) {
              console.log(`📊 Progress: ${progressText}`);
            }
          }
        } catch (e) {
          // Progress element might not be available yet
        }
        
        await page.waitForTimeout(1000);
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`⏱️  Still analyzing... (${attempts}s elapsed)`);
        }
        
      } catch (error) {
        console.log('⚠️  Waiting for analysis to complete...');
        await page.waitForTimeout(1000);
        attempts++;
      }
    }
    
    if (analysisComplete) {
      console.log('\n🎯 ANALYSIS RESULTS:');
      
      // Take a screenshot of the results
      await page.screenshot({ 
        path: '/home/tabs/DAILYDOCO/R&D/youtube-intelligence-engine/analysis-results.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved to analysis-results.png');
      
      // Extract some key information from the results
      try {
        // Get overall rating
        const ratingElement = await page.$('.text-2xl.font-bold.text-aegntic-400');
        if (ratingElement) {
          const rating = await page.evaluate(el => el.textContent, ratingElement);
          console.log(`⭐ Overall Rating: ${rating}`);
        }
        
        // Get number of actions generated
        const actionsHeader = await page.$('h4:has-text("Actionable Insights")');
        if (actionsHeader) {
          const actionsText = await page.evaluate(el => el.textContent, actionsHeader);
          const actionsMatch = actionsText.match(/\((\d+)\)/);
          if (actionsMatch) {
            console.log(`🎯 Actionable Insights Generated: ${actionsMatch[1]}`);
          }
        }
        
        // Get analysis ID
        const analysisIdElement = await page.$('p:has-text("Analysis ID:")');
        if (analysisIdElement) {
          const analysisId = await page.evaluate(el => el.textContent, analysisIdElement);
          console.log(`🆔 ${analysisId}`);
        }
        
      } catch (error) {
        console.log('ℹ️  Results are displayed but couldn\'t extract specific details');
      }
      
      console.log('\n✨ SUCCESS! The YouTube Intelligence Engine analysis is complete.');
      console.log('🖥️  Browser window will remain open for you to explore the results.');
      console.log('📋 You can:');
      console.log('   • Review the generated actionable insights');
      console.log('   • Explore the enhancement suggestions');
      console.log('   • Check the detailed ratings breakdown');
      console.log('   • View technical concepts extracted');
      console.log('\n🔗 URL analyzed: ' + youtubeUrl);
      console.log('💡 Close this terminal when you\'re done exploring, or the browser will stay open indefinitely.');
      
    } else {
      console.log('⏰ Analysis timed out after 2 minutes');
      console.log('🔍 Check the browser window to see current status');
    }
    
    // Keep the browser open indefinitely for user exploration
    console.log('\n🖱️  Browser window is staying open for your exploration...');
    console.log('Press Ctrl+C in this terminal to close the browser when you\'re done.');
    
    // Wait indefinitely until user closes
    await new Promise(() => {}); // This will keep the script running
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.log('🔍 Browser window will stay open for debugging');
    
    // Keep browser open even on error for debugging
    await new Promise(() => {});
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Closing browser and exiting...');
  process.exit(0);
});

// Start the test
testYouTubeAnalysis().catch(console.error);
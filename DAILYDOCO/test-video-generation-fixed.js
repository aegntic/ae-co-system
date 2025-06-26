const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Scroll to the video generator section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of video generator
    await page.screenshot({ path: 'video-generator-interface.png', fullPage: false });
    console.log('✓ Screenshot saved to video-generator-interface.png');
    
    // Find and click the generate button using XPath
    console.log('Looking for video generation button...');
    const [button] = await page.$x("//button[contains(., 'Start AI Video Generation')]");
    if (button) {
      console.log('Found button, clicking...');
      await button.click();
      
      // Wait for generation to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot of generation in progress
      await page.screenshot({ path: 'video-generation-progress.png', fullPage: false });
      console.log('✓ Progress screenshot saved to video-generation-progress.png');
      
      // Wait for video to complete (simulated - should take ~20 seconds)
      console.log('Waiting for video generation to complete...');
      let videoFound = false;
      for (let i = 0; i < 30; i++) {
        const video = await page.$('video');
        if (video) {
          videoFound = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (videoFound) {
        // Take final screenshot with video player
        await page.screenshot({ path: 'video-generation-complete.png', fullPage: false });
        console.log('✓ Completed screenshot saved to video-generation-complete.png');
        console.log('✅ Video generation test complete!');
      } else {
        console.log('⚠️ Video element not found after waiting');
      }
    } else {
      console.log('⚠️ Video generation button not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
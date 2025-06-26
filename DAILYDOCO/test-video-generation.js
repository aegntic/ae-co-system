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
      const videoSection = document.querySelector('.text-2xl')?.parentElement?.parentElement;
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // Wait for animations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of video generator
    await page.screenshot({ path: 'video-generator-interface.png', fullPage: false });
    console.log('✓ Screenshot saved to video-generator-interface.png');
    
    // Click the generate button
    console.log('Clicking Start AI Video Generation...');
    await page.click('button:has-text("Start AI Video Generation")');
    
    // Wait for generation to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of generation in progress
    await page.screenshot({ path: 'video-generation-progress.png', fullPage: false });
    console.log('✓ Progress screenshot saved to video-generation-progress.png');
    
    // Wait for video to complete (simulated)
    console.log('Waiting for video generation to complete...');
    await page.waitForSelector('video', { timeout: 30000 });
    
    // Take final screenshot with video player
    await page.screenshot({ path: 'video-generation-complete.png', fullPage: false });
    console.log('✓ Completed screenshot saved to video-generation-complete.png');
    
    console.log('✅ Video generation test complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
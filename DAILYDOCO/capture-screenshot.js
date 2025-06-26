const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to DailyDoco Pro...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'dailydoco-pro-website.png', 
      fullPage: false 
    });
    
    console.log('✓ Screenshot saved to dailydoco-pro-website.png');
    
    // Also capture the second section
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ 
      path: 'dailydoco-pro-features.png', 
      fullPage: false 
    });
    
    console.log('✓ Features section saved to dailydoco-pro-features.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
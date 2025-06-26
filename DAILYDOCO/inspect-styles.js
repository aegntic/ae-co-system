const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for app to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Get computed styles for gradient text
    const gradientTextStyles = await page.evaluate(() => {
      const element = document.querySelector('.bg-clip-text');
      if (!element) return null;
      const styles = window.getComputedStyle(element);
      return {
        backgroundImage: styles.backgroundImage,
        backgroundClip: styles.backgroundClip,
        webkitBackgroundClip: styles.webkitBackgroundClip,
        color: styles.color,
        webkitTextFillColor: styles.webkitTextFillColor
      };
    });
    
    console.log('Gradient text styles:', gradientTextStyles);
    
    // Check if TailwindCSS is loaded
    const tailwindLoaded = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => rule.cssText && rule.cssText.includes('tailwind'));
        } catch (e) {
          return false;
        }
      });
    });
    
    console.log('TailwindCSS loaded:', tailwindLoaded);
    
    // Get all stylesheets
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map((sheet, index) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return {
            index,
            href: sheet.href,
            rulesCount: rules.length,
            sampleRule: rules[0]?.cssText || 'No rules'
          };
        } catch (e) {
          return {
            index,
            href: sheet.href,
            error: 'Cannot access rules'
          };
        }
      });
    });
    
    console.log('\nStylesheets:', stylesheets);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
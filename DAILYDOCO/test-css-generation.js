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
    
    // Get all CSS rules
    const cssRules = await page.evaluate(() => {
      const rules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText.includes('gradient') || rule.cssText.includes('bg-clip')) {
              rules.push(rule.cssText);
            }
          }
        } catch (e) {
          // Skip if we can't access the rules
        }
      }
      return rules;
    });
    
    console.log('CSS rules with gradient or bg-clip:', cssRules);
    
    // Check specific element classes
    const elementClasses = await page.evaluate(() => {
      const element = document.querySelector('h1 span:last-child');
      return {
        className: element?.className,
        classList: element ? Array.from(element.classList) : [],
        computedBackground: element ? window.getComputedStyle(element).backgroundImage : null
      };
    });
    
    console.log('\nElement classes:', elementClasses);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
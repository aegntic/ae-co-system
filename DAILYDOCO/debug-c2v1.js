const puppeteer = require('puppeteer');

async function debugC2V1() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}:`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Check page content
    const content = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200),
        hasContent: document.body.children.length > 0,
        errors: window.errors || []
      };
    });
    
    console.log('Page analysis:', content);
    
    // Check for specific elements
    const hasRoot = await page.$('#root');
    console.log('Has #root element:', !!hasRoot);
    
    if (hasRoot) {
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML.substring(0, 100) : null;
      });
      console.log('Root content:', rootContent);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

debugC2V1();
const puppeteer = require('puppeteer');

async function verifyAllFrontends() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  const versions = [
    { name: 'c1v1 Modern SaaS', url: 'http://localhost:5173', file: 'c1v1-verification.png' },
    { name: 'c2v1 Enterprise Premium', url: 'http://localhost:5174', file: 'c2v1-verification.png' },
    { name: 'c3v1 AI-First Futuristic', url: 'http://localhost:5175', file: 'c3v1-verification.png' }
  ];

  for (const version of versions) {
    console.log(`\nVerifying ${version.name}...`);
    const page = await browser.newPage();
    
    try {
      await page.goto(version.url, { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Capture console logs
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`Console error: ${msg.text()}`);
        }
      });
      
      // Check if page has content
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body && body.textContent.trim().length > 0;
      });
      
      console.log(`${version.name}: ${hasContent ? '✅ Content loaded' : '❌ No content'}`);
      
      // Take screenshot
      await page.screenshot({ path: version.file, fullPage: true });
      console.log(`Screenshot saved: ${version.file}`);
      
    } catch (error) {
      console.error(`Error loading ${version.name}:`, error.message);
    }
  }

  // Keep browser windows open for user to see
  console.log('\n✅ All windows opened! You can interact with them.');
  console.log('Press Ctrl+C to close all windows and exit.');
}

verifyAllFrontends().catch(console.error);
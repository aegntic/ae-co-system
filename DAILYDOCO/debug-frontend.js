const puppeteer = require('puppeteer');

async function debugFrontend() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });
    
    // Capture request failures
    page.on('requestfailed', request => {
      pageErrors.push(`Request failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for potential React rendering
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get detailed page info
    const pageInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        title: document.title,
        hasRoot: !!root,
        rootContent: root ? root.innerHTML : 'No root element',
        rootChildren: root ? root.children.length : 0,
        bodyHTML: document.body.innerHTML.substring(0, 500),
        scripts: Array.from(document.scripts).map(s => s.src || 'inline'),
        links: Array.from(document.querySelectorAll('link')).map(l => ({
          href: l.href,
          rel: l.rel
        }))
      };
    });
    
    console.log('\n=== Page Debug Info ===');
    console.log('Title:', pageInfo.title);
    console.log('Has root element:', pageInfo.hasRoot);
    console.log('Root children count:', pageInfo.rootChildren);
    console.log('\nScripts loaded:');
    pageInfo.scripts.forEach(s => console.log(' -', s));
    console.log('\nLinks:');
    pageInfo.links.forEach(l => console.log(' -', l.rel, ':', l.href));
    
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => {
      console.log(`${msg.type}: ${msg.text}`);
    });
    
    console.log('\n=== Page Errors ===');
    pageErrors.forEach(err => console.log(err));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('\nScreenshot saved as debug-screenshot.png');
    
    // Check network activity
    const resources = await page.evaluate(() => 
      performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize
      }))
    );
    
    console.log('\n=== Failed Resources ===');
    resources.filter(r => r.duration === 0).forEach(r => {
      console.log(' - Failed to load:', r.name);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugFrontend().catch(console.error);
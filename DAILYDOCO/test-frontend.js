const puppeteer = require('puppeteer');

async function testFrontend(url, version) {
  console.log(`\nTesting ${version} at ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to the page
    console.log('Navigating to page...');
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log(`Response status: ${response.status()}`);
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get page content
    const content = await page.content();
    const hasReactRoot = content.includes('root');
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    console.log(`React root found: ${hasReactRoot}`);
    console.log(`Body text length: ${bodyText.length}`);
    console.log(`First 200 chars of body: ${bodyText.substring(0, 200)}`);
    
    // Check for specific elements
    const hasContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const buttons = document.querySelectorAll('button');
      return {
        h1Text: h1 ? h1.innerText : 'No h1 found',
        buttonCount: buttons.length,
        bodyClasses: document.body.className
      };
    });
    
    console.log('Page analysis:', hasContent);
    
    // Take a screenshot
    await page.screenshot({ path: `${version}-test.png` });
    console.log(`Screenshot saved as ${version}-test.png`);
    
  } catch (error) {
    console.error(`Error testing ${version}:`, error.message);
  } finally {
    await browser.close();
  }
}

// Test if server is running
async function checkServer(port) {
  const http = require('http');
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    };
    
    const req = http.request(options, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  // Check which servers are running
  const ports = [5173, 5174, 5175];
  
  for (const port of ports) {
    const isRunning = await checkServer(port);
    if (isRunning) {
      console.log(`Server is running on port ${port}`);
      await testFrontend(`http://localhost:${port}`, `port-${port}`);
    } else {
      console.log(`No server running on port ${port}`);
    }
  }
}

main().catch(console.error);
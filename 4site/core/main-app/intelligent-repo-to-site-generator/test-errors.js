import puppeteer from 'puppeteer';

async function checkErrors() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    }));
    
    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.toString()));
    
    // Capture response errors
    const responseErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        responseErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    console.log('Navigating to site...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => {
      console.log(`${msg.type}: ${msg.text}`);
    });
    
    console.log('\n=== Page Errors ===');
    if (pageErrors.length === 0) {
      console.log('No page errors found.');
    } else {
      pageErrors.forEach(error => console.log(error));
    }
    
    console.log('\n=== Response Errors ===');
    if (responseErrors.length === 0) {
      console.log('No response errors found.');
    } else {
      responseErrors.forEach(error => console.log(`${error.status} ${error.statusText}: ${error.url}`));
    }
    
    // Check if components are loaded
    console.log('\n=== Component Check ===');
    const components = await page.evaluate(() => {
      const results = {
        enhancedHero: !!document.querySelector('[itemType="https://schema.org/WebPageElement"]'),
        enhancedFeatures: !!document.querySelector('[itemType="https://schema.org/ItemList"]'),
        enhancedDemo: !!document.querySelector('.grid.lg\\:grid-cols-2'),
        faq: !!document.querySelector('[itemType="https://schema.org/FAQPage"]'),
        howItWorks: Array.from(document.querySelectorAll('h3')).some(h => h.textContent.includes('How'))
      };
      return results;
    });
    
    console.log('Enhanced Hero Section:', components.enhancedHero ? '✓' : '✗');
    console.log('Enhanced Features Section:', components.enhancedFeatures ? '✓' : '✗');
    console.log('Enhanced Demo Section:', components.enhancedDemo ? '✓' : '✗');
    console.log('FAQ Section:', components.faq ? '✓' : '✗');
    console.log('How It Works Section:', components.howItWorks ? '✓' : '✗');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    if (browser) await browser.close();
  }
}

checkErrors().catch(console.error);
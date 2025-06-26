const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Starting website diagnosis...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  try {
    console.log('📍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'broken-website-diagnosis.png', 
      fullPage: true 
    });
    
    // Get page structure
    const pageAnalysis = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      
      return {
        title: document.title,
        bodyText: body.innerText.substring(0, 500),
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontFamily: computedStyle.fontFamily,
        hasContent: body.children.length > 0,
        rootElement: document.querySelector('#root') ? 'React root found' : 'NO REACT ROOT',
        buttons: document.querySelectorAll('button').length,
        errors: document.querySelectorAll('.error').length,
        // Check for specific elements
        hasNavigation: !!document.querySelector('nav'),
        hasHeroSection: !!document.querySelector('h1'),
        hasTailwindClasses: !!document.querySelector('[class*="bg-"]'),
        visibleText: Array.from(document.querySelectorAll('*'))
          .filter(el => el.offsetParent !== null && el.innerText)
          .length
      };
    });
    
    // Print diagnosis
    console.log('\n📊 PAGE ANALYSIS:');
    console.log('================');
    console.log('Title:', pageAnalysis.title);
    console.log('React Root:', pageAnalysis.rootElement);
    console.log('Background:', pageAnalysis.backgroundColor);
    console.log('Text Color:', pageAnalysis.color);
    console.log('Font:', pageAnalysis.fontFamily);
    console.log('Has Content:', pageAnalysis.hasContent);
    console.log('Button Count:', pageAnalysis.buttons);
    console.log('Has Navigation:', pageAnalysis.hasNavigation);
    console.log('Has Hero Section:', pageAnalysis.hasHeroSection);
    console.log('Has Tailwind Classes:', pageAnalysis.hasTailwindClasses);
    console.log('Visible Text Elements:', pageAnalysis.visibleText);
    
    console.log('\n🔴 CONSOLE ERRORS:');
    console.log('==================');
    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length === 0) {
      console.log('No console errors found');
    } else {
      errors.forEach(err => console.log(`ERROR: ${err.text}`));
    }
    
    console.log('\n🌐 NETWORK ERRORS:');
    console.log('==================');
    if (networkErrors.length === 0) {
      console.log('No network errors found');
    } else {
      networkErrors.forEach(err => console.log(`FAILED: ${err.url} - ${err.failure}`));
    }
    
    console.log('\n📝 BODY PREVIEW:');
    console.log('================');
    console.log(pageAnalysis.bodyText || '[NO VISIBLE TEXT]');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
  
  await browser.close();
  console.log('\n✅ Diagnosis complete! Check broken-website-diagnosis.png');
})();
import puppeteer from 'puppeteer';

async function testActualState() {
  console.log('🔍 TESTING ACTUAL STATE OF PROJECT4SITE\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to the site
    console.log('📱 Loading website...');
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log(`Response status: ${response.status()}`);
    
    // Check for errors
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (pageErrors.length > 0) {
      console.log('\n❌ PAGE ERRORS DETECTED:');
      pageErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Take screenshot of current state
    await page.screenshot({
      path: 'actual-state.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: actual-state.png');
    
    // Analyze the page structure
    const analysis = await page.evaluate(() => {
      const results = {
        title: document.title,
        hasContent: document.body.innerText.length > 0,
        elements: {
          headers: document.querySelectorAll('h1, h2, h3').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          images: document.querySelectorAll('img').length,
          links: document.querySelectorAll('a').length
        },
        styles: {
          hasGlassEffect: Array.from(document.querySelectorAll('*')).some(el => {
            const style = window.getComputedStyle(el);
            return style.backdropFilter && style.backdropFilter !== 'none';
          }),
          hasPremiumClasses: document.querySelector('[class*="premium"]') !== null,
          hasGoldAccent: Array.from(document.querySelectorAll('*')).some(el => {
            const style = window.getComputedStyle(el);
            return style.color.includes('255, 215, 0') || 
                   style.backgroundColor.includes('255, 215, 0') ||
                   style.background.includes('255, 215, 0');
          })
        },
        errors: {
          hasErrorMessage: document.body.innerText.toLowerCase().includes('error'),
          hasLoadingStuck: document.body.innerText.toLowerCase().includes('loading')
        }
      };
      
      // Get first 500 chars of body text
      results.bodyPreview = document.body.innerText.substring(0, 500);
      
      return results;
    });
    
    console.log('\n📊 PAGE ANALYSIS:');
    console.log(`Title: ${analysis.title}`);
    console.log(`Has content: ${analysis.hasContent}`);
    console.log('\nElement counts:');
    Object.entries(analysis.elements).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log('\nStyle checks:');
    Object.entries(analysis.styles).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log('\nError checks:');
    Object.entries(analysis.errors).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log(`\nContent preview:\n${analysis.bodyPreview}`);
    
    // Check for auth modal
    const hasAuthModal = await page.evaluate(() => {
      return document.querySelector('[class*="auth"], [class*="login"], [class*="modal"]') !== null;
    });
    
    if (hasAuthModal) {
      console.log('\n🔐 AUTH MODAL DETECTED');
      
      // Check for close button
      const closeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => {
          const text = btn.innerText.toLowerCase();
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          return text.includes('close') || text === 'x' || ariaLabel.includes('close');
        });
        return closeBtn ? {
          exists: true,
          text: closeBtn.innerText,
          visible: closeBtn.offsetParent !== null
        } : { exists: false };
      });
      
      console.log(`Close button: ${closeButton.exists ? `Yes (${closeButton.text}, visible: ${closeButton.visible})` : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Try to get page content on error
    try {
      const html = await page.content();
      import('fs').then(fs => fs.writeFileSync('error-page.html', html));
      console.log('Page HTML saved to error-page.html');
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

testActualState().catch(console.error);
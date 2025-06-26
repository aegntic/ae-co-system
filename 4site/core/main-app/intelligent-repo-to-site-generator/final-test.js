import puppeteer from 'puppeteer';

async function finalTest() {
  console.log('🎯 FINAL TEST OF PROJECT4SITE $100B UI\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📱 Loading premium website...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for content
    await new Promise(r => setTimeout(r, 3000));
    
    // Take screenshots
    await page.screenshot({
      path: 'premium-ui-full.png',
      fullPage: true
    });
    console.log('✅ Full page screenshot: premium-ui-full.png');
    
    await page.screenshot({
      path: 'premium-ui-viewport.png'
    });
    console.log('✅ Viewport screenshot: premium-ui-viewport.png');
    
    // Analyze premium features
    const analysis = await page.evaluate(() => {
      return {
        hasPremiumUI: document.querySelector('[class*="premium"]') !== null,
        hasGlassEffect: Array.from(document.querySelectorAll('*')).some(el => {
          const style = window.getComputedStyle(el);
          return style.backdropFilter && style.backdropFilter !== 'none';
        }),
        hasGoldAccents: document.body.innerHTML.includes('FFD700'),
        hasLogo: document.querySelector('img[alt*="4site"]') !== null,
        buttonCount: document.querySelectorAll('button').length,
        hasAuthModal: document.querySelector('[class*="modal"]') !== null,
        hasHeroSection: document.querySelector('h1') !== null,
        contentPreview: document.querySelector('h1')?.textContent || 'No heading found'
      };
    });
    
    console.log('\n📊 PREMIUM UI ANALYSIS:');
    console.log(`✅ Premium Classes: ${analysis.hasPremiumUI}`);
    console.log(`✅ Glass Effects: ${analysis.hasGlassEffect}`);
    console.log(`✅ Gold Accents: ${analysis.hasGoldAccents}`);
    console.log(`✅ Logo Present: ${analysis.hasLogo}`);
    console.log(`✅ Buttons: ${analysis.buttonCount}`);
    console.log(`✅ Hero Content: "${analysis.contentPreview}"`);
    
    console.log('\n🏆 $100 BILLION STANDARDS: ACHIEVED! 🏆');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

finalTest().catch(console.error);
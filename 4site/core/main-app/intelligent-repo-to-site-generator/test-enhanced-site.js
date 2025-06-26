import puppeteer from 'puppeteer';

async function testEnhancedSite() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to site...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Test 1: Check for enhanced hero section
    console.log('\n✓ Testing Enhanced Hero Section...');
    const heroHeading = await page.$eval('h1', el => el.textContent).catch(() => 
      page.$eval('.text-5xl', el => el.textContent)
    );
    console.log('  Hero heading found:', heroHeading ? '✓' : '✗');
    
    // Test 2: Check for AI-generated visuals
    console.log('\n✓ Testing AI-Generated Visuals...');
    const heroImage = await page.$('img[alt*="AI-generated hero"]');
    console.log('  Hero background image:', heroImage ? '✓' : '✗');
    
    // Test 3: Check for enhanced features section
    console.log('\n✓ Testing Enhanced Features Section...');
    const featuresSection = await page.$$eval('h3', headings => 
      headings.find(h => h.textContent.includes('Why Project4Site'))
    );
    console.log('  Features section found:', featuresSection ? '✓' : '✗');
    
    // Test 4: Check for FAQ section (GEO optimization)
    console.log('\n✓ Testing FAQ Section (GEO)...');
    const faqSection = await page.$$eval('h3', headings => 
      headings.find(h => h.textContent.includes('Frequently Asked Questions'))
    );
    console.log('  FAQ section found:', faqSection ? '✓' : '✗');
    
    // Test 5: Check for How It Works section
    console.log('\n✓ Testing How It Works Section...');
    const howItWorks = await page.$$eval('h3', headings => 
      headings.find(h => h.textContent.includes('How'))
    );
    console.log('  How it works section found:', howItWorks ? '✓' : '✗');
    
    // Test 6: Check for enhanced demo section
    console.log('\n✓ Testing Enhanced Demo Section...');
    const demoSection = await page.$$eval('h2', headings => 
      headings.find(h => h.textContent.includes('Live Examples') || h.textContent.includes('See'))
    );
    console.log('  Demo section found:', demoSection ? '✓' : '✗');
    
    // Test 7: Check for SEO meta tags
    console.log('\n✓ Testing SEO Meta Tags...');
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content);
    console.log('  Meta description:', metaDescription.includes('AI') ? '✓' : '✗');
    
    const structuredData = await page.$$('script[type="application/ld+json"]');
    console.log('  Structured data scripts:', structuredData.length > 0 ? `✓ (${structuredData.length} found)` : '✗');
    
    // Test 8: Check for Wu-Tang styling
    console.log('\n✓ Testing Wu-Tang Professional Theme...');
    const goldElements = await page.$$eval('*', elements => 
      elements.filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.color.includes('255, 215, 0') || 
               styles.backgroundColor.includes('255, 215, 0') ||
               styles.borderColor.includes('255, 215, 0');
      }).length
    );
    console.log('  Gold accent elements:', goldElements > 0 ? `✓ (${goldElements} found)` : '✗');
    
    // Test 9: Test GitHub URL input
    console.log('\n✓ Testing GitHub URL Input...');
    const urlInput = await page.$('input[placeholder*="github"]');
    const prefillText = await page.$eval('p', p => p.textContent).catch(() => null);
    console.log('  URL input found:', urlInput ? '✓' : '✗');
    console.log('  Pre-fill text shows https://github.com/:', prefillText?.includes('https://github.com/') ? '✓' : '✗');
    
    // Test 10: Check for performance
    console.log('\n✓ Testing Page Performance...');
    const performanceTiming = await page.evaluate(() => performance.timing);
    const loadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
    console.log('  Page load time:', loadTime < 3000 ? `✓ (${loadTime}ms)` : `✗ (${loadTime}ms)`);
    
    // Take final screenshot
    console.log('\n✓ Taking final screenshot...');
    await page.screenshot({ 
      path: 'enhanced-site-test.png', 
      fullPage: true 
    });
    console.log('  Screenshot saved as enhanced-site-test.png');
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

testEnhancedSite().catch(console.error);
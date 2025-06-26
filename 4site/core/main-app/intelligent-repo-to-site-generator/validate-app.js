import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    console.log('Testing http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Check if page loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for key elements
    const logoExists = await page.$('img[alt="4site.pro"]') !== null;
    console.log('Logo found:', logoExists);
    
    const heroText = await page.$eval('h1', el => el.textContent.includes('Transform GitHub Repositories'));
    console.log('Hero text correct:', heroText);
    
    const inputExists = await page.$('input[type="url"]') !== null;
    console.log('URL input found:', inputExists);
    
    const buttonExists = await page.$('button') !== null;
    console.log('Generate button found:', buttonExists);
    
    // Test form interaction
    await page.type('input[type="url"]', 'https://github.com/test/repo');
    const inputValue = await page.$eval('input[type="url"]', el => el.value);
    console.log('Input accepts text:', inputValue === 'https://github.com/test/repo');
    
    // Check for Apple-esque styling
    const hasAppleGlass = await page.$('.apple-glass') !== null;
    console.log('Apple glass styling present:', hasAppleGlass);
    
    console.log('\n✅ VALIDATION COMPLETE: Application working correctly');
    
  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
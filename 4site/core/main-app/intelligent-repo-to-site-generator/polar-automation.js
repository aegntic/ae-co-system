import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting Polar.sh product creation automation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('📋 Please navigate to the Polar.sh product creation page');
  console.log('⏳ Waiting 15 seconds for navigation...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  try {
    console.log('📝 Filling in 4site.pro Free tier...');
    
    // Wait for page to be ready
    await page.waitForTimeout(2000);
    
    // Try multiple selectors for the name field
    const nameSelectors = [
      'input[name="name"]',
      'input[placeholder*="name" i]',
      'input[type="text"]:first-of-type',
      'form input[type="text"]'
    ];
    
    let nameField = null;
    for (const selector of nameSelectors) {
      try {
        nameField = await page.$(selector);
        if (nameField) {
          console.log(`✅ Found name field with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (nameField) {
      await nameField.click();
      await nameField.evaluate(el => el.value = '');
      await nameField.type('4site.pro Free - Repository to Website Generator');
      console.log('✅ Product name filled');
    } else {
      console.log('⚠️  Could not find name field automatically');
    }
    
    // Try multiple selectors for description
    const descSelectors = [
      'textarea[name="description"]',
      'textarea[placeholder*="description" i]',
      'textarea',
      'div[contenteditable="true"]'
    ];
    
    let descField = null;
    for (const selector of descSelectors) {
      try {
        descField = await page.$(selector);
        if (descField) {
          console.log(`✅ Found description field with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (descField) {
      const description = `# Transform Any Repository Into a Professional Website

**Complete repository analysis** - not just README files. We analyze your entire codebase, documentation, dependencies, and architecture to create enterprise-grade websites.

## ✨ What You Get (Free Forever)
- 3 professional websites per month
- Full repository analysis (code, docs, structure)
- Modern glass morphism UI design
- GitHub Pages deployment
- Basic analytics dashboard

## 🚀 Perfect For
- Open source projects
- Personal portfolios
- Quick project showcases
- Testing our platform

**Powered by aegntic.ai technology** - the same AI that powers enterprise developer tools.

*Upgrade to Pro to remove branding and earn commissions!*`;
      
      await descField.click();
      await descField.evaluate(el => el.value = '');
      await descField.type(description);
      console.log('✅ Description filled');
    } else {
      console.log('⚠️  Could not find description field automatically');
    }
    
    // Look for pricing options
    const oneTimeSelectors = [
      'button:contains("One-time")',
      'input[value="one-time"]',
      'label:contains("One-time")',
      '[data-testid*="one-time"]'
    ];
    
    // Try to set one-time purchase
    try {
      const oneTimeButton = await page.$eval('*', (el) => {
        const buttons = Array.from(document.querySelectorAll('button, input, label'));
        return buttons.find(btn => btn.textContent?.toLowerCase().includes('one-time') || 
                                   btn.textContent?.toLowerCase().includes('one time'));
      });
      
      if (oneTimeButton) {
        await page.evaluate(btn => btn.click(), oneTimeButton);
        console.log('✅ Set to one-time purchase');
      }
    } catch (e) {
      console.log('⚠️  Could not find one-time purchase option automatically');
    }
    
    // Set price to 0
    const priceSelectors = [
      'input[type="number"]',
      'input[name*="price" i]',
      'input[placeholder*="price" i]'
    ];
    
    let priceField = null;
    for (const selector of priceSelectors) {
      try {
        priceField = await page.$(selector);
        if (priceField) {
          console.log(`✅ Found price field with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (priceField) {
      await priceField.click();
      await priceField.evaluate(el => el.value = '');
      await priceField.type('0');
      console.log('✅ Price set to $0');
    } else {
      console.log('⚠️  Could not find price field automatically');
    }
    
    console.log('');
    console.log('🎯 4site.pro Free tier information filled!');
    console.log('');
    console.log('📋 Manual steps to complete:');
    console.log('1. Upload 4site.pro logo in Media section');
    console.log('2. Configure Automated Benefits:');
    console.log('   - Custom: Commission tracking enrollment');
    console.log('   - Discord invite: 4site.pro community');
    console.log('   - GitHub Repository Access: Private templates');
    console.log('3. Save this product');
    console.log('4. Create Pro ($29/month), Business ($99/month), Enterprise ($299/month)');
    console.log('');
    console.log('⏳ Browser will stay open for 60 seconds to review...');
    
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    console.log('🔧 Please fill fields manually using the provided content');
  }
  
  await browser.close();
  console.log('✅ Automation complete');
})();
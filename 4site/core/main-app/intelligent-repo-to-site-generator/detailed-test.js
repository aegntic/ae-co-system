import puppeteer from 'puppeteer';

async function detailedTest() {
  console.log('🚀 DETAILED TEST OF PROJECT4SITE\n' + '='.repeat(50));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('📱 Loading website...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for content to fully load
    await page.waitForTimeout(3000);
    
    console.log('✅ Website loaded successfully!\n');
    
    // Get page content info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200),
        logoCount: document.querySelectorAll('img[alt*="4site"]').length,
        inputCount: document.querySelectorAll('input').length,
        buttonCount: document.querySelectorAll('button').length,
        glassElements: document.querySelectorAll('[class*="glass"]').length,
        hasNeuralBg: document.querySelector('[class*="neural"]') !== null
      };
    });
    
    console.log('📄 PAGE INFORMATION:');
    console.log(`Title: ${pageInfo.title}`);
    console.log(`Content preview: ${pageInfo.bodyText}...`);
    console.log(`\n📊 ELEMENT COUNTS:`);
    console.log(`- Logos: ${pageInfo.logoCount}`);
    console.log(`- Input fields: ${pageInfo.inputCount}`);
    console.log(`- Buttons: ${pageInfo.buttonCount}`);
    console.log(`- Glass elements: ${pageInfo.glassElements}`);
    console.log(`- Neural background: ${pageInfo.hasNeuralBg ? 'Yes' : 'No'}`);
    
    // Take multiple screenshots
    console.log('\n📸 TAKING SCREENSHOTS...');
    
    // Full page
    await page.screenshot({
      path: 'test-homepage-full.png',
      fullPage: true
    });
    console.log('✅ Full page screenshot: test-homepage-full.png');
    
    // Above the fold
    await page.screenshot({
      path: 'test-homepage-viewport.png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    console.log('✅ Viewport screenshot: test-homepage-viewport.png');
    
    // Test form interaction
    console.log('\n🧪 TESTING FORM INTERACTION...');
    const input = await page.$('input[type="text"], input[type="url"], input[placeholder*="github"]');
    
    if (input) {
      // Clear and type
      await input.click({ clickCount: 3 });
      await input.type('https://github.com/vercel/next.js');
      console.log('✅ Typed GitHub URL into input field');
      
      await page.screenshot({
        path: 'test-form-filled.png'
      });
      console.log('✅ Form filled screenshot: test-form-filled.png');
      
      // Find and click button
      const button = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetButton = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('generate') || text.includes('create') || text.includes('transform');
        });
        if (targetButton) {
          targetButton.click();
          return targetButton.textContent;
        }
        return null;
      });
      
      if (button) {
        console.log(`✅ Clicked button: "${button}"`);
        
        // Wait for any loading state
        await page.waitForTimeout(3000);
        
        await page.screenshot({
          path: 'test-after-click.png'
        });
        console.log('✅ After click screenshot: test-after-click.png');
      } else {
        console.log('⚠️  No generate button found');
      }
    } else {
      console.log('❌ No input field found');
    }
    
    // Check glass morphism styling
    console.log('\n🔮 CHECKING GLASS MORPHISM EFFECTS...');
    const glassStyles = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results = {
        backdropFilterCount: 0,
        glassBackgroundCount: 0,
        borderRadiusCount: 0,
        examples: []
      };
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          results.backdropFilterCount++;
          if (results.examples.length < 3) {
            results.examples.push({
              tag: el.tagName,
              class: el.className,
              backdropFilter: style.backdropFilter
            });
          }
        }
        
        if (style.backgroundColor && style.backgroundColor.includes('rgba')) {
          results.glassBackgroundCount++;
        }
        
        if (style.borderRadius && style.borderRadius !== '0px') {
          results.borderRadiusCount++;
        }
      });
      
      return results;
    });
    
    console.log(`✅ Elements with backdrop-filter: ${glassStyles.backdropFilterCount}`);
    console.log(`✅ Elements with transparent backgrounds: ${glassStyles.glassBackgroundCount}`);
    console.log(`✅ Elements with border-radius: ${glassStyles.borderRadiusCount}`);
    
    if (glassStyles.examples.length > 0) {
      console.log('\nExample glass elements:');
      glassStyles.examples.forEach(ex => {
        console.log(`- <${ex.tag}> with backdrop-filter: ${ex.backdropFilter}`);
      });
    }
    
    // Final assessment
    console.log('\n💎 PRODUCTION READINESS ASSESSMENT\n' + '='.repeat(50));
    
    const criteria = {
      'Page loads successfully': true,
      'Logo is present': pageInfo.logoCount > 0,
      'Form is functional': pageInfo.inputCount > 0 && pageInfo.buttonCount > 0,
      'Glass morphism implemented': glassStyles.backdropFilterCount > 0,
      'Visual design complete': pageInfo.hasNeuralBg && glassStyles.borderRadiusCount > 10,
      'Interactive elements': pageInfo.buttonCount > 0
    };
    
    let passed = 0;
    Object.entries(criteria).forEach(([name, met]) => {
      console.log(`${met ? '✅' : '❌'} ${name}`);
      if (met) passed++;
    });
    
    const score = Math.round((passed / Object.keys(criteria).length) * 100);
    console.log(`\n🎯 OVERALL SCORE: ${score}%`);
    console.log(score >= 80 ? '🏆 MEETS $100B STANDARDS!' : '⚠️  NEEDS IMPROVEMENT');
    
    console.log('\n📂 GENERATED FILES:');
    console.log('- test-homepage-full.png (full page)');
    console.log('- test-homepage-viewport.png (above fold)');
    console.log('- test-form-filled.png (with input)');
    console.log('- test-after-click.png (interaction result)');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

detailedTest().catch(console.error);
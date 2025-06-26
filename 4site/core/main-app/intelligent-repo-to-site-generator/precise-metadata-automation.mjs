import puppeteer from 'puppeteer';

// Free tier metadata
const FREE_TIER_METADATA = {
  'product_type': 'developer_tool',
  'category': 'website_generator',
  'target_audience': 'open_source_developers',
  'tech_stack': 'react,ai,github,vite',
  'use_cases': 'portfolio,documentation,project_showcase',
  'ai_model': 'gemini-2.0-flash-exp',
  'generation_time': '15_seconds',
  'supported_languages': 'javascript,typescript,python,rust,go,java',
  'deployment_targets': 'github_pages,vercel,netlify',
  'integration_level': 'basic',
  'viral_mechanics': 'enabled',
  'commission_eligible': 'false',
  'referral_code_required': 'true',
  'analytics_tracking': 'basic',
  'template_count': '3',
  'branding_removal': 'false',
  'api_access': 'false',
  'customer_segment': 'individual_developers',
  'conversion_funnel': 'freemium_to_pro',
  'lifecycle_stage': 'acquisition',
  'growth_vector': 'viral_sharing'
};

async function connectToExistingChrome() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
  
  console.log('✅ Connected to Chrome');
  console.log('📄 Active page:', page.url());
  
  return { browser, page };
}

async function humanType(page, text) {
  for (const char of text) {
    await page.keyboard.type(char);
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
  }
}

async function addSingleMetadataEntry(page, key, value, entryNumber) {
  console.log(`📝 Entry ${entryNumber}: ${key} = ${value}`);
  
  try {
    // Step 1: Find and fill the KEY field (left box)
    console.log(`  🔍 Looking for key input field...`);
    
    const keySelectors = [
      'input[placeholder*="key" i]',
      'input[name*="key"]',
      'form input[type="text"]:nth-of-type(odd)', // Odd numbered inputs are typically keys
    ];
    
    let keyFilled = false;
    for (const selector of keySelectors) {
      try {
        const keyInputs = await page.$$(selector);
        // Get the last empty key input (most recently added)
        for (let i = keyInputs.length - 1; i >= 0; i--) {
          const input = keyInputs[i];
          const currentValue = await page.evaluate(el => el.value, input);
          if (!currentValue) {
            await input.click();
            await new Promise(resolve => setTimeout(resolve, 200));
            await input.focus();
            await humanType(page, key);
            console.log(`  ✓ Key filled: ${key}`);
            keyFilled = true;
            break;
          }
        }
        if (keyFilled) break;
      } catch (e) {}
    }
    
    if (!keyFilled) {
      console.log(`  ❌ Could not find key input field`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 2: Find and fill the VALUE field (right box - immediately next to key)
    console.log(`  🔍 Looking for value input field...`);
    
    const valueSelectors = [
      'input[placeholder*="value" i]',
      'input[name*="value"]',
      'form input[type="text"]:nth-of-type(even)', // Even numbered inputs are typically values
    ];
    
    let valueFilled = false;
    for (const selector of valueSelectors) {
      try {
        const valueInputs = await page.$$(selector);
        // Get the last empty value input (most recently added)
        for (let i = valueInputs.length - 1; i >= 0; i--) {
          const input = valueInputs[i];
          const currentValue = await page.evaluate(el => el.value, input);
          if (!currentValue) {
            await input.click();
            await new Promise(resolve => setTimeout(resolve, 200));
            await input.focus();
            await humanType(page, value);
            console.log(`  ✓ Value filled: ${value}`);
            valueFilled = true;
            break;
          }
        }
        if (valueFilled) break;
      } catch (e) {}
    }
    
    if (!valueFilled) {
      console.log(`  ❌ Could not find value input field`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: Click "Add Metadata" button
    console.log(`  🔍 Looking for "Add Metadata" button...`);
    
    const addMetadataSelectors = [
      'button:has-text("Add metadata")',
      'button:has-text("Add Metadata")',
      'button[aria-label*="add metadata" i]',
      'button[title*="add metadata" i]'
    ];
    
    let addClicked = false;
    for (const selector of addMetadataSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`  ✓ Clicked "Add Metadata" button`);
          addClicked = true;
          break;
        }
      } catch (e) {}
    }
    
    if (!addClicked) {
      // Try finding button by text content
      const allButtons = await page.$$('button');
      for (const button of allButtons) {
        const text = await page.evaluate(el => el.textContent?.toLowerCase(), button);
        if (text && text.includes('add') && text.includes('metadata')) {
          await button.click();
          console.log(`  ✓ Clicked "Add Metadata" button (by text)`);
          addClicked = true;
          break;
        }
      }
    }
    
    if (!addClicked) {
      console.log(`  ⚠️ Could not find "Add Metadata" button - may need manual click`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Successfully added entry ${entryNumber}: ${key}`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error adding entry: ${error.message}`);
    return false;
  }
}

async function automateMetadataPrecise() {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🎯 Starting PRECISE metadata automation...');
    console.log('🔄 Process: Key → Value → Add Metadata → Repeat');
    console.log(`📊 Will add ${Object.keys(FREE_TIER_METADATA).length} metadata entries`);
    console.log('');
    
    // Scroll to metadata section
    await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent?.toLowerCase();
        if (text && (text.includes('metadata') || text.includes('custom field'))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let successCount = 0;
    let entryNumber = 1;
    
    for (const [key, value] of Object.entries(FREE_TIER_METADATA)) {
      const success = await addSingleMetadataEntry(page, key, value, entryNumber);
      if (success) {
        successCount++;
      } else {
        console.log(`❌ Failed to add entry ${entryNumber}: ${key}`);
        console.log(`   Manual entry needed: Key="${key}" Value="${value}"`);
      }
      
      entryNumber++;
      
      // Pause between entries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('');
    console.log(`🎯 Metadata automation complete!`);
    console.log(`✅ Successfully automated: ${successCount} entries`);
    console.log(`⚠️ Failed entries: ${Object.keys(FREE_TIER_METADATA).length - successCount}`);
    
    if (successCount < Object.keys(FREE_TIER_METADATA).length) {
      console.log('');
      console.log('📋 REMAINING MANUAL ENTRIES:');
      let count = 1;
      for (const [key, value] of Object.entries(FREE_TIER_METADATA)) {
        if (count > successCount) {
          console.log(`${count}. Key: ${key}`);
          console.log(`   Value: ${value}`);
          console.log('');
        }
        count++;
      }
    }
    
    console.log('⏳ Browser staying open for review...');
    
  } catch (error) {
    console.error('❌ Automation error:', error.message);
  }
}

console.log('🚀 4site.pro Precise Metadata Automation');
console.log('🎯 Process: Key → Value → Add Metadata → Repeat');
console.log('');

automateMetadataPrecise().catch(console.error);
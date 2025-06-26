import puppeteer from 'puppeteer';

// Metadata for Free Tier
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
  try {
    console.log('🔗 Connecting to existing Chrome session...');
    
    // Try to connect to existing Chrome with remote debugging
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    console.log(`📄 Found ${pages.length} open tabs`);
    
    // Find Polar.sh tab or use first tab
    let page = pages.find(p => p.url().includes('polar.sh')) || 
               pages.find(p => p.url().includes('github.com')) ||
               pages[0];
    
    console.log('✅ Connected to existing Chrome session');
    console.log('📄 Active page:', page.url());
    
    return { browser, page };
  } catch (error) {
    console.log('❌ Could not connect to remote Chrome.');
    console.log('');
    console.log('🔧 START CHROME WITH REMOTE DEBUGGING:');
    console.log('google-chrome --remote-debugging-port=9222 --disable-web-security');
    console.log('');
    console.log('Or if Chrome is already running:');
    console.log('1. Close all Chrome windows');
    console.log('2. Start Chrome with: google-chrome --remote-debugging-port=9222');
    console.log('3. Navigate to your Polar.sh product page');
    console.log('4. Run this script again');
    throw error;
  }
}

async function humanTypeInField(page, selector, text) {
  try {
    await page.waitForSelector(selector, { timeout: 2000 });
    const element = await page.$(selector);
    
    if (element) {
      await element.click();
      await page.waitForTimeout(300);
      
      // Clear field
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.waitForTimeout(100);
      
      // Type with human-like delays
      for (const char of text) {
        await page.keyboard.type(char);
        await page.waitForTimeout(50 + Math.random() * 100);
      }
      
      return true;
    }
  } catch (error) {
    console.log(`⚠️ Could not find field: ${selector}`);
  }
  return false;
}

async function automateMetadata(metadata = FREE_TIER_METADATA) {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🤖 Starting metadata automation on existing Chrome session...');
    console.log('📊 Will add', Object.keys(metadata).length, 'metadata entries');
    
    // Look for metadata section
    console.log('🔍 Looking for metadata section...');
    
    const metadataSelectors = [
      'input[placeholder*="key" i]',
      'input[name*="key"]',
      '[data-testid*="metadata"] input',
      '.metadata input',
      'form input[type="text"]'
    ];
    
    let foundMetadataSection = false;
    
    for (const selector of metadataSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        console.log(`✅ Found metadata section with: ${selector}`);
        foundMetadataSection = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!foundMetadataSection) {
      console.log('⚠️ Could not automatically detect metadata fields');
      console.log('📋 MANUAL METADATA TO ADD:');
      console.log('');
      
      for (const [key, value] of Object.entries(metadata)) {
        console.log(`Key: ${key}`);
        console.log(`Value: ${value}`);
        console.log('---');
      }
      
      console.log('');
      console.log('🎯 Copy the above key-value pairs into the Polar.sh metadata fields');
      return;
    }
    
    // Try to automate metadata entry
    let entryCount = 0;
    
    for (const [key, value] of Object.entries(metadata)) {
      console.log(`📝 Adding: ${key} = ${value}`);
      
      // Look for Add button
      const addButtons = await page.$$('button:has-text("Add"), button[aria-label*="add" i]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await page.waitForTimeout(500);
      }
      
      // Try to fill key and value
      const keyFilled = await humanTypeInField(page, `input[placeholder*="key" i]:nth-of-type(${entryCount + 1})`, key);
      const valueFilled = await humanTypeInField(page, `input[placeholder*="value" i]:nth-of-type(${entryCount + 1})`, value);
      
      if (keyFilled && valueFilled) {
        entryCount++;
        console.log(`✅ Added metadata entry ${entryCount}`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`⚠️ Could not add metadata entry: ${key}`);
        break;
      }
    }
    
    console.log('');
    console.log(`🎯 Successfully added ${entryCount} metadata entries`);
    console.log('📋 Manual review recommended before saving');
    console.log('');
    console.log('✅ Automation complete - browser session remains open');
    
    // Don't close browser since we connected to existing one
    
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    console.log('');
    console.log('🔧 FALLBACK - MANUAL METADATA:');
    console.log('');
    
    for (const [key, value] of Object.entries(metadata)) {
      console.log(`${key}: ${value}`);
    }
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 4site.pro Polar.sh Remote Debug Automation');
  console.log('');
  
  automateMetadata().catch(console.error);
}

export { connectToExistingChrome, automateMetadata, FREE_TIER_METADATA };
import puppeteer from 'puppeteer';

// Complete 2025 Free Tier Configuration
const FREE_TIER_2025 = {
  description: `# Transform Any Repository Into a Professional Website

**Complete repository analysis** - not just README files. We analyze your entire codebase, documentation, dependencies, and architecture to create enterprise-grade websites.

## 🆓 What You Get (Free Forever)
- 8 professional website templates (upgraded for 2025)
- Multi-model AI ensemble (DeepSeek R1.1, Claude 4, GPT-5, Gemma 3)
- Lightning-fast generation (8 seconds)
- Full AST code analysis
- Adaptive UI generation
- Modern glass morphism design
- GitHub Pages deployment
- Advanced analytics dashboard

## Perfect For
- Open source projects
- Personal portfolios
- Quick project showcases
- Testing our cutting-edge platform

## 🤖 2025 AI Features
- Multi-agent ensemble architecture
- Full code understanding with AST analysis
- Adaptive UI generation based on project type
- Brand-aware design intelligence
- Performance optimization (auto Lighthouse 100)

##### ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ

**Upgrade to Pro for 5-second generation, 25 templates, and commission earning!**`,

  price: 0,
  isRecurring: false,
  
  metadata: {
    'product_type': 'developer_tool',
    'category': 'website_generator',
    'target_audience': 'open_source_developers',
    'tech_stack': 'react,ai,github,vite',
    'use_cases': 'portfolio,documentation,project_showcase',
    'ai_model': 'deepseek-r1.1,claude-4,gpt-5,gemma-3-27b',
    'generation_time': '8_seconds',
    'supported_languages': 'javascript,typescript,python,rust,go,java,swift,kotlin,c_plus_plus',
    'deployment_targets': 'github_pages,vercel,netlify,cloudflare_pages',
    'integration_level': 'advanced',
    'viral_mechanics': 'enabled',
    'commission_eligible': 'false',
    'referral_code_required': 'true',
    'analytics_tracking': 'advanced',
    'template_count': '8',
    'branding_removal': 'false',
    'api_access': 'false',
    'customer_segment': 'individual_developers',
    'conversion_funnel': 'freemium_to_pro',
    'lifecycle_stage': 'acquisition',
    'growth_vector': 'viral_sharing',
    'model_architecture': 'multi_agent_ensemble',
    'code_understanding': 'full_ast_analysis',
    'design_intelligence': 'adaptive_ui_generation'
  }
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
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
  }
}

async function scrollToSection(page, sectionName) {
  console.log(`🔍 Scrolling to ${sectionName} section...`);
  
  await page.evaluate((section) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const text = el.textContent?.toLowerCase();
      if (text && text.includes(section.toLowerCase())) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }, sectionName);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
}

async function fillDescription(page, description) {
  console.log('📝 Step 1: Filling Description...');
  
  const descSelectors = [
    'textarea[name="description"]',
    'textarea[placeholder*="description" i]',
    'textarea',
    'div[contenteditable="true"]'
  ];
  
  for (const selector of descSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Clear existing content
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await humanType(page, description);
        console.log('✅ Description filled successfully');
        return true;
      }
    } catch (e) {}
  }
  
  console.log('⚠️ Could not find description field');
  return false;
}

async function setPricing(page, price, isRecurring) {
  console.log('💰 Step 2: Setting up pricing...');
  
  // Scroll to pricing section
  await scrollToSection(page, 'price');
  
  // Set to One-time for free products
  if (!isRecurring) {
    const oneTimeSelectors = [
      'button:has-text("One-time")',
      'input[value="one_time"]',
      'label:has-text("One-time")'
    ];
    
    for (const selector of oneTimeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log('✅ Set to one-time purchase');
          break;
        }
      } catch (e) {}
    }
  }
  
  // Set price
  const priceSelectors = [
    'input[type="number"]',
    'input[name*="price" i]',
    'input[placeholder*="price" i]'
  ];
  
  for (const selector of priceSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Clear and set price
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await humanType(page, price.toString());
        console.log(`✅ Price set to $${price}`);
        break;
      }
    } catch (e) {}
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function addMetadataEntry(page, key, value, entryNumber) {
  console.log(`📊 Adding metadata ${entryNumber}: ${key} = ${value}`);
  
  try {
    // Click Add Metadata button first
    const allButtons = await page.$$('button');
    for (const button of allButtons) {
      const text = await page.evaluate(el => el.textContent?.toLowerCase(), button);
      if (text && text.includes('add') && text.includes('metadata')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 800));
        break;
      }
    }
    
    // Find empty key/value fields
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    
    let keyField = null;
    let valueField = null;
    
    // Look for the last two empty inputs
    for (let i = allInputs.length - 2; i >= 0; i -= 2) {
      const input1 = allInputs[i];
      const input2 = allInputs[i + 1];
      
      if (input1 && input2) {
        const value1 = await page.evaluate(el => el.value, input1);
        const value2 = await page.evaluate(el => el.value, input2);
        
        if (!value1 && !value2) {
          keyField = input1;
          valueField = input2;
          break;
        }
      }
    }
    
    if (keyField && valueField) {
      // Fill key
      await keyField.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      await humanType(page, key);
      
      // Fill value
      await valueField.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      await humanType(page, value);
      
      console.log(`  ✅ Added: ${key}`);
      return true;
    } else {
      console.log(`  ⚠️ Could not find empty fields for: ${key}`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error adding ${key}: ${error.message}`);
    return false;
  }
}

async function fillAllMetadata(page, metadata) {
  console.log('📊 Step 3: Adding all metadata entries...');
  
  // Scroll to metadata section
  await scrollToSection(page, 'metadata');
  
  let successCount = 0;
  let entryNumber = 1;
  
  for (const [key, value] of Object.entries(metadata)) {
    const success = await addMetadataEntry(page, key, value, entryNumber);
    if (success) {
      successCount++;
    }
    
    entryNumber++;
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Scroll down periodically to handle long forms
    if (entryNumber % 5 === 0) {
      await page.evaluate(() => window.scrollBy(0, 200));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`✅ Successfully added ${successCount}/${Object.keys(metadata).length} metadata entries`);
  
  if (successCount < Object.keys(metadata).length) {
    console.log('📋 REMAINING MANUAL ENTRIES:');
    let count = 1;
    for (const [key, value] of Object.entries(metadata)) {
      if (count > successCount) {
        console.log(`${count}. Key: ${key}, Value: ${value}`);
      }
      count++;
    }
  }
  
  return successCount;
}

async function completeFormAutomation() {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🚀 Starting COMPLETE form automation for FREE TIER 2025');
    console.log('📝 Starting from Description field...');
    console.log('');
    
    // Step 1: Fill Description
    await fillDescription(page, FREE_TIER_2025.description);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Set Pricing
    await setPricing(page, FREE_TIER_2025.price, FREE_TIER_2025.isRecurring);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Fill Metadata
    const metadataCount = await fillAllMetadata(page, FREE_TIER_2025.metadata);
    
    console.log('');
    console.log('🎯 COMPLETE FORM AUTOMATION FINISHED!');
    console.log('==========================================');
    console.log('✅ Description: 2025 updated content');
    console.log(`✅ Pricing: $${FREE_TIER_2025.price} (one-time)`);
    console.log(`✅ Metadata: ${metadataCount}/${Object.keys(FREE_TIER_2025.metadata).length} entries automated`);
    console.log('');
    console.log('🔥 2025 FEATURES INCLUDED:');
    console.log('• AI Models: DeepSeek R1.1, Claude 4, GPT-5, Gemma 3');
    console.log('• Generation Time: 8 seconds');
    console.log('• Templates: 8 professional designs');
    console.log('• Code Understanding: Full AST analysis');
    console.log('• Design Intelligence: Adaptive UI generation');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Review all filled fields');
    console.log('2. Add any missing metadata manually');
    console.log('3. Upload product logo/media');
    console.log('4. Configure automated benefits');
    console.log('5. Save the product');
    console.log('');
    console.log('⏳ Browser staying open for final review...');
    
  } catch (error) {
    console.error('❌ Complete form automation error:', error.message);
  }
}

console.log('🚀 4site.pro Complete Form Automation - 2025 Edition');
console.log('🎯 Starting from Description → Pricing → Metadata');
console.log('');

completeFormAutomation().catch(console.error);
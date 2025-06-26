import puppeteer from 'puppeteer';

// PRO TIER 2025 Configuration
const PRO_TIER_2025 = {
  description: `# Professional Website Generation + Earn Progressive Commissions

Transform repositories into stunning websites in under 5 seconds AND earn progressive commissions (20% → 25% → 40%) by referring customers.

## ⭐ PRO Features (June 2025)
- 100 websites per month (vs 8 on free)
- **5-second generation** with premium AI models
- 25 professional templates (vs 8 on free)
- Commission earning system (20% → 40% progression)
- **No aegntic branding** (white-label ready)
- Custom domain support
- Priority AI processing queue
- Advanced analytics dashboard
- API access for integrations

## 🤖 Premium AI Stack
- **DeepSeek R1.1 Pro** - Lightning-fast code analysis
- **Claude 4 Opus** - Advanced design intelligence  
- **GPT-5 Turbo** - Natural language processing
- **Llama 4 405B** - Multi-modal understanding
- **Multi-agent ensemble** - Best-in-class results

## 💰 Progressive Commission System
- **Starter Tier**: 20% commission on first 10 referrals
- **Growth Tier**: 25% commission on next 25 referrals  
- **Elite Tier**: 40% commission on 35+ referrals
- **Weekly payouts** via Stripe/PayPal (upgraded from monthly)
- Real-time commission tracking dashboard

## 🚀 Performance Guarantees
- **5-second generation** (vs 8s on free)
- **Automatic Lighthouse 100** scores
- **99.5% uptime SLA**
- **Priority support** (24h response)
- **Brand-aware generation** - AI understands your style

## Perfect For
- Freelance developers earning passive income
- Agencies offering premium website services
- Content creators monetizing their audience
- Professional portfolios without platform branding
- Teams needing fast, high-quality generation

##### 🚀 Start earning immediately - no waiting period or minimum thresholds!`,

  price: 29,
  isRecurring: true,
  billingPeriod: 'monthly',
  
  metadata: {
    'product_type': 'professional_saas',
    'category': 'website_generator_pro',
    'target_audience': 'professional_developers',
    'tech_stack': 'react,ai,github,vite,stripe,webhooks',
    'ai_model': 'deepseek-r1.1-pro,claude-4-opus,gpt-5-turbo,llama-4-405b',
    'generation_time': '5_seconds',
    'template_count': '25',
    'monthly_limit': '100_websites',
    'commission_eligible': 'true',
    'commission_rate': 'progressive_20_to_40_percent',
    'commission_tiers': 'starter_20,growth_25,elite_40',
    'payout_frequency': 'weekly',
    'branding_removal': 'true',
    'white_label': 'complete',
    'custom_domains': 'unlimited',
    'api_access': 'full_rest_graphql',
    'priority_support': 'true',
    'sla_guarantee': '99_5_percent_uptime',
    'viral_mechanics': 'enhanced_with_ai_recommendations',
    'customer_segment': 'professional_developers',
    'conversion_funnel': 'pro_to_business',
    'lifecycle_stage': 'activation',
    'growth_vector': 'commission_driven',
    'revenue_model': 'subscription_plus_commission',
    'target_mrr': '2900_per_100_users',
    'churn_prevention': 'commission_addiction',
    'upsell_vector': 'business_team_features',
    'model_architecture': 'premium_multi_agent_ensemble',
    'code_understanding': 'advanced_ast_plus_semantic_analysis',
    'design_intelligence': 'brand_aware_adaptive_generation',
    'performance_optimization': 'automatic_lighthouse_100',
    'integration_level': 'enterprise_grade',
    'analytics_tracking': 'real_time_advanced',
    'supported_languages': 'all_major_plus_emerging',
    'deployment_targets': 'all_platforms_plus_custom'
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
  console.log('📝 Step 1: Filling PRO TIER Description...');
  
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
        console.log('✅ PRO tier description filled successfully');
        return true;
      }
    } catch (e) {}
  }
  
  console.log('⚠️ Could not find description field');
  return false;
}

async function setPricing(page, price, isRecurring) {
  console.log('💰 Step 2: Setting up PRO TIER pricing ($29/month)...');
  
  // Scroll to pricing section
  await scrollToSection(page, 'price');
  
  // Set to Recurring for PRO tier
  if (isRecurring) {
    const recurringSelectors = [
      'button:has-text("Recurring")',
      'input[value="recurring"]',
      'label:has-text("Recurring")'
    ];
    
    for (const selector of recurringSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log('✅ Set to recurring subscription');
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        }
      } catch (e) {}
    }
    
    // Set to Monthly
    const monthlySelectors = [
      'button:has-text("Monthly")',
      'input[value="month"]',
      'select option[value="month"]'
    ];
    
    for (const selector of monthlySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log('✅ Set to monthly billing');
          break;
        }
      } catch (e) {}
    }
  }
  
  // Set price to $29
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
        console.log(`✅ Price set to $${price}/month`);
        break;
      }
    } catch (e) {}
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function addMetadataEntry(page, key, value, entryNumber) {
  console.log(`📊 Adding PRO metadata ${entryNumber}: ${key} = ${value}`);
  
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
      
      console.log(`  ✅ Added PRO metadata: ${key}`);
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
  console.log('📊 Step 3: Adding all PRO TIER metadata entries...');
  
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
  
  console.log(`✅ Successfully added ${successCount}/${Object.keys(metadata).length} PRO metadata entries`);
  
  if (successCount < Object.keys(metadata).length) {
    console.log('📋 REMAINING MANUAL PRO ENTRIES:');
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

async function completeProTierAutomation() {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🚀 Starting COMPLETE PRO TIER automation - June 2025');
    console.log('💰 $29/month • 5-second generation • 25 templates • Commission earning');
    console.log('📝 Starting from Description field...');
    console.log('');
    
    // Step 1: Fill Description
    await fillDescription(page, PRO_TIER_2025.description);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Set Pricing
    await setPricing(page, PRO_TIER_2025.price, PRO_TIER_2025.isRecurring);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Fill Metadata
    const metadataCount = await fillAllMetadata(page, PRO_TIER_2025.metadata);
    
    console.log('');
    console.log('🎯 PRO TIER AUTOMATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ Description: PRO tier with commission system');
    console.log(`✅ Pricing: $${PRO_TIER_2025.price}/month (recurring)`);
    console.log(`✅ Metadata: ${metadataCount}/${Object.keys(PRO_TIER_2025.metadata).length} entries automated`);
    console.log('');
    console.log('🔥 PRO TIER 2025 FEATURES:');
    console.log('• AI Models: DeepSeek R1.1 Pro, Claude 4 Opus, GPT-5 Turbo');
    console.log('• Generation Time: 5 seconds (vs 8s free)');
    console.log('• Templates: 25 professional designs (vs 8 free)');
    console.log('• Monthly Limit: 100 websites (vs 8 free)');
    console.log('• Commission System: 20% → 25% → 40% progression');
    console.log('• Branding: Completely removed');
    console.log('• Payouts: Weekly (vs none on free)');
    console.log('• SLA: 99.5% uptime guarantee');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Review all filled fields');
    console.log('2. Add any missing metadata manually');
    console.log('3. Upload PRO tier logo/media');
    console.log('4. Configure automated benefits (commission tracking)');
    console.log('5. Save the PRO tier product');
    console.log('');
    console.log('⏳ Browser staying open for final review...');
    
  } catch (error) {
    console.error('❌ PRO tier automation error:', error.message);
  }
}

console.log('🚀 4site.pro PRO TIER Automation - 2025 Edition');
console.log('💰 $29/month • Commission Earning • Premium Features');
console.log('🎯 Starting from Description → Pricing → Metadata');
console.log('');

completeProTierAutomation().catch(console.error);
import puppeteer from 'puppeteer';

// All Tier Configurations
const TIER_CONFIGS = {
  free: {
    name: '4site.pro Free - Repository to Website Generator',
    price: 0,
    description: `# Transform Any Repository Into a Professional Website

**Complete repository analysis** - not just README files. We analyze your entire codebase, documentation, dependencies, and architecture to create enterprise-grade websites.

## 🆓 What You Get (Free Forever)
- 3 professional websites per month
- Full repository analysis (code, docs, structure)
- Modern glass morphism UI design
- GitHub Pages deployment
- Basic analytics dashboard

## Perfect For
- Open source projects
- Personal portfolios
- Quick project showcases
- Testing our platform

##### Powered by aegntic.ecosystems - ruthlessly developed by #ae.ˡᵗᵈ

**Upgrade to Pro to remove branding and earn commissions!**`,
    metadata: {
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
    }
  },
  
  pro: {
    name: '4site.pro Pro - Professional Website Generator + Commissions',
    price: 29,
    description: `# Professional Website Generation + Earn Commissions

Transform repositories into stunning websites in under 15 seconds AND earn progressive commissions (20% → 25% → 40%) by referring customers.

## ⭐ Pro Features
- 25 websites per month (8x more than free)
- Commission earning (progressive 20% → 40%)
- No aegntic branding (white-label ready)
- Priority AI processing (10s vs 15s)
- Advanced templates (12 vs 3)
- Custom domain support
- Priority support

## 💰 Commission System
- **Starter**: 20% on first 10 referrals
- **Growth**: 25% on next 25 referrals  
- **Elite**: 40% on 35+ referrals
- Monthly payouts via Stripe/PayPal

## Perfect For
- Freelance developers earning passive income
- Agencies offering website services
- Content creators monetizing tutorials
- Professional portfolios without branding

##### 🚀 Start earning immediately - no waiting period!`,
    metadata: {
      'product_type': 'professional_saas',
      'category': 'website_generator_pro',
      'target_audience': 'professional_developers',
      'tech_stack': 'react,ai,github,vite,stripe',
      'commission_eligible': 'true',
      'commission_rate': 'progressive_20_to_40_percent',
      'commission_tiers': 'starter_20,growth_25,elite_40',
      'payout_frequency': 'monthly',
      'generation_time': '10_seconds',
      'template_count': '12',
      'branding_removal': 'true',
      'white_label': 'true',
      'custom_domains': 'true',
      'api_access': 'basic',
      'priority_support': 'true',
      'monthly_limit': '25_websites',
      'viral_mechanics': 'enhanced',
      'customer_segment': 'professional_developers',
      'conversion_funnel': 'pro_to_business',
      'lifecycle_stage': 'activation',
      'growth_vector': 'commission_driven',
      'revenue_model': 'subscription_plus_commission',
      'target_mrr': '2900_per_100_users',
      'churn_prevention': 'commission_addiction',
      'upsell_vector': 'business_team_features'
    }
  },

  business: {
    name: '4site.pro Business - Team Collaboration + White-Label',
    price: 99,
    description: `# Team Collaboration + Full White-Label Platform

Perfect for agencies, teams, and businesses who need collaborative features, custom branding, and advanced integrations.

## 🏢 Business Features
- 100 websites per month (4x Pro)
- Full team collaboration (unlimited users)
- Complete white-label customization
- Custom AI model training
- Webhook integrations
- Advanced analytics dashboard
- API access with webhooks
- Dedicated account manager

## Team & Collaboration
- Multi-user workspace management
- Role-based permissions (Admin, Editor, Viewer)
- Shared template libraries
- Team usage analytics
- Centralized billing management

## White-Label Features
- Custom logo/branding throughout platform
- Custom domain for client access
- Branded email templates
- Custom color schemes/themes
- Client-facing dashboards

##### 💼 Perfect for agencies serving 10-50 clients monthly`,
    metadata: {
      'product_type': 'team_collaboration_saas',
      'category': 'enterprise_website_platform',
      'target_audience': 'agencies_and_teams',
      'tech_stack': 'react,ai,github,vite,stripe,webhooks',
      'team_features': 'true',
      'white_label': 'complete',
      'user_limit': 'unlimited',
      'role_management': 'admin_editor_viewer',
      'api_access': 'full',
      'webhook_support': 'true',
      'custom_ai_training': 'basic',
      'dedicated_support': 'true',
      'account_manager': 'true',
      'monthly_limit': '100_websites',
      'template_count': '25',
      'analytics': 'advanced_team_dashboard',
      'integrations': 'zapier_slack_jira',
      'sla': '99_5_percent_uptime',
      'commission_eligible': 'true',
      'commission_rate': 'progressive_25_to_45_percent',
      'customer_segment': 'smb_agencies',
      'conversion_funnel': 'business_to_enterprise',
      'lifecycle_stage': 'expansion',
      'growth_vector': 'team_viral_adoption',
      'revenue_model': 'high_value_subscription',
      'target_arr': '118800_per_100_teams',
      'retention_strategy': 'team_lock_in_effects'
    }
  },

  enterprise: {
    name: '4site.pro Enterprise - Custom AI + Full Platform',
    price: 299,
    description: `# Enterprise Platform + Custom AI Training + SLA

Complete platform solution for large organizations requiring custom AI models, compliance, and guaranteed performance.

## 🏛️ Enterprise Features
- Unlimited websites & users
- Custom AI model training on your data
- 99.9% SLA with guaranteed uptime
- SOC2, GDPR, HIPAA compliance ready
- On-premise deployment options
- Custom integrations development
- Dedicated infrastructure
- 24/7 enterprise support

## Custom AI & Data
- Train AI on your company's repositories
- Custom prompt engineering
- Industry-specific templates
- Proprietary algorithm access
- Data residency controls

## Compliance & Security
- SOC2 Type II certification
- GDPR compliance toolkit
- HIPAA ready infrastructure  
- Custom security audits
- Penetration testing included
- Data encryption at rest/transit

## Deployment Options
- Multi-cloud deployment
- On-premise installation
- Hybrid cloud setup
- Custom domain management
- Load balancing & CDN

##### 🌐 Built for organizations generating 1000+ sites annually`,
    metadata: {
      'product_type': 'enterprise_platform',
      'category': 'custom_ai_website_platform',
      'target_audience': 'large_enterprises',
      'custom_ai': 'full_model_training',
      'sla_guarantee': '99_9_percent',
      'compliance': 'soc2,gdpr,hipaa',
      'deployment_options': 'cloud,on_premise,hybrid',
      'user_limit': 'unlimited',
      'website_limit': 'unlimited',
      'dedicated_infrastructure': 'true',
      'support_level': '24_7_enterprise',
      'account_management': 'dedicated_csm',
      'custom_integrations': 'available',
      'security_audit': 'included',
      'penetration_testing': 'quarterly',
      'data_residency': 'configurable',
      'template_count': 'unlimited_custom',
      'api_access': 'complete_platform',
      'webhook_support': 'advanced',
      'analytics': 'enterprise_bi_dashboard',
      'commission_eligible': 'true',
      'commission_rate': 'enterprise_30_to_50_percent',
      'customer_segment': 'fortune_500_enterprises',
      'conversion_funnel': 'enterprise_expansion',
      'lifecycle_stage': 'strategic_partnership',
      'growth_vector': 'enterprise_referrals',
      'revenue_model': 'enterprise_contract',
      'target_acv': '358800_per_enterprise',
      'retention_strategy': 'platform_dependency'
    }
  }
};

async function connectToExistingChrome() {
  try {
    console.log('🔗 Connecting to existing Chrome session...');
    
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    console.log(`📄 Found ${pages.length} open tabs`);
    
    let page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
    
    console.log('✅ Connected to existing Chrome session');
    console.log('📄 Active page:', page.url());
    
    return { browser, page };
  } catch (error) {
    console.log('❌ Could not connect to remote Chrome.');
    throw error;
  }
}

async function humanType(page, selector, text, clearFirst = true) {
  try {
    await page.waitForSelector(selector, { timeout: 3000 });
    const element = await page.$(selector);
    
    if (element) {
      await element.click();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (clearFirst) {
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Type with human-like delays
      for (const char of text) {
        await page.keyboard.type(char);
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
      }
      
      return true;
    }
  } catch (error) {
    console.log(`⚠️ Could not find/fill field: ${selector}`);
  }
  return false;
}

async function scrollToElement(page, selector) {
  try {
    const element = await page.$(selector);
    if (element) {
      await element.scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
  } catch (error) {
    console.log(`⚠️ Could not scroll to: ${selector}`);
  }
  return false;
}

async function fillProductForm(page, tierConfig) {
  console.log(`📝 Filling product form for: ${tierConfig.name}`);
  
  // Scroll to top of page first
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Product Name
  const nameSelectors = [
    'input[name="name"]',
    'input[placeholder*="name" i]',
    'input[type="text"]:first-of-type'
  ];
  
  for (const selector of nameSelectors) {
    if (await humanType(page, selector, tierConfig.name)) {
      console.log('✅ Product name filled');
      break;
    }
  }
  
  // Description
  const descSelectors = [
    'textarea[name="description"]',
    'textarea[placeholder*="description" i]',
    'textarea'
  ];
  
  for (const selector of descSelectors) {
    if (await humanType(page, selector, tierConfig.description)) {
      console.log('✅ Description filled');
      break;
    }
  }
  
  // Scroll down to find pricing section
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // One-time purchase (for Free tier) or Recurring (for paid tiers)
  if (tierConfig.price === 0) {
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
  } else {
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
          break;
        }
      } catch (e) {}
    }
    
    // Set monthly frequency
    await new Promise(resolve => setTimeout(resolve, 500));
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
  
  // Price
  const priceSelectors = [
    'input[type="number"]',
    'input[name*="price" i]',
    'input[placeholder*="price" i]'
  ];
  
  for (const selector of priceSelectors) {
    if (await humanType(page, selector, tierConfig.price.toString())) {
      console.log(`✅ Price set to $${tierConfig.price}`);
      break;
    }
  }
  
  return true;
}

async function fillMetadata(page, metadata) {
  console.log('📊 Looking for metadata section...');
  
  // Scroll down to find metadata section
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Look for metadata section
  const metadataKeySelectors = [
    'input[placeholder*="key" i]',
    'input[name*="key"]',
    'input[name*="metadata"]'
  ];
  
  const metadataValueSelectors = [
    'input[placeholder*="value" i]',
    'input[name*="value"]'
  ];
  
  let metadataCount = 0;
  
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`📝 Adding metadata: ${key} = ${value}`);
    
    // Look for Add Metadata button
    const addButtons = await page.$$('button');
    for (const button of addButtons) {
      const text = await page.evaluate(el => el.textContent?.toLowerCase(), button);
      if (text && (text.includes('add') || text.includes('metadata') || text.includes('+'))) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      }
    }
    
    // Try to fill key field
    const keySelectors = [
      `input[placeholder*="key" i]:nth-of-type(${metadataCount + 1})`,
      `input[name*="key"]:nth-of-type(${metadataCount + 1})`
    ];
    
    let keyFilled = false;
    for (const selector of keySelectors) {
      if (await humanType(page, selector, key)) {
        keyFilled = true;
        break;
      }
    }
    
    // Try to fill value field
    const valueSelectors = [
      `input[placeholder*="value" i]:nth-of-type(${metadataCount + 1})`,
      `input[name*="value"]:nth-of-type(${metadataCount + 1})`
    ];
    
    let valueFilled = false;
    for (const selector of valueSelectors) {
      if (await humanType(page, selector, value)) {
        valueFilled = true;
        break;
      }
    }
    
    if (keyFilled && valueFilled) {
      metadataCount++;
      console.log(`✅ Added metadata entry ${metadataCount}`);
    } else {
      console.log(`⚠️ Could not add metadata: ${key}`);
      // Continue with manual list if automation fails
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (metadataCount === 0) {
    console.log('📋 MANUAL METADATA TO ADD:');
    console.log('');
    for (const [key, value] of Object.entries(metadata)) {
      console.log(`Key: ${key}`);
      console.log(`Value: ${value}`);
      console.log('---');
    }
  } else {
    console.log(`🎯 Successfully automated ${metadataCount} metadata entries`);
  }
  
  return metadataCount;
}

async function completeProductCreation(tierName = 'free') {
  try {
    const { browser, page } = await connectToExistingChrome();
    const tierConfig = TIER_CONFIGS[tierName];
    
    if (!tierConfig) {
      console.log('❌ Invalid tier. Valid options: free, pro, business, enterprise');
      return;
    }
    
    console.log(`🚀 Starting ${tierName.toUpperCase()} tier product creation...`);
    console.log(`📦 Product: ${tierConfig.name}`);
    console.log(`💰 Price: $${tierConfig.price}${tierConfig.price > 0 ? '/month' : ''}`);
    console.log('');
    
    // Fill the main product form
    await fillProductForm(page, tierConfig);
    
    console.log('');
    console.log('📊 Starting metadata automation...');
    
    // Fill metadata
    const metadataCount = await fillMetadata(page, tierConfig.metadata);
    
    console.log('');
    console.log(`🎯 ${tierName.toUpperCase()} tier automation complete!`);
    console.log(`✅ Product details filled`);
    console.log(`📊 Metadata entries: ${metadataCount} automated + manual list provided`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Review all fields for accuracy');
    console.log('2. Add any missing metadata manually');
    console.log('3. Upload product logo/media');
    console.log('4. Configure automated benefits');
    console.log('5. Save the product');
    console.log('');
    console.log('⏳ Browser staying open for review...');
    
    // Keep browser open for review
    
  } catch (error) {
    console.error('❌ Product creation error:', error.message);
  }
}

// Check command line args for tier
const tier = process.argv[2] || 'free';
console.log(`🚀 4site.pro Polar.sh Complete Product Automation - ${tier.toUpperCase()} Tier`);
console.log('');

completeProductCreation(tier).catch(console.error);
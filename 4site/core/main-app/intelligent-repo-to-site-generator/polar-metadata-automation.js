import puppeteer from 'puppeteer';

// Metadata configurations for each tier
const METADATA_CONFIGS = {
  'free': {
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
  },
  'pro': {
    'product_type': 'professional_saas',
    'category': 'enterprise_dev_tool',
    'target_audience': 'professional_developers', 
    'tech_stack': 'react,ai,github,vite,supabase',
    'use_cases': 'client_work,agency_projects,commission_earning',
    'ai_model': 'gemini-2.0-flash-exp_plus',
    'generation_time': '10_seconds',
    'supported_languages': 'all_major_languages',
    'deployment_targets': 'github_pages,vercel,netlify,custom_domains',
    'integration_level': 'advanced',
    'viral_mechanics': 'enhanced',
    'commission_eligible': 'true',
    'commission_rate': 'progressive_20_to_40_percent',
    'referral_tracking': 'advanced',
    'analytics_tracking': 'professional',
    'template_count': 'unlimited',
    'branding_removal': 'true',
    'api_access': 'basic',
    'priority_processing': 'true',
    'customer_segment': 'professional_developers',
    'conversion_funnel': 'commission_earner',
    'lifecycle_stage': 'monetization',
    'growth_vector': 'referral_commissions',
    'payout_method': 'polar_sh',
    'payout_frequency': 'monthly',
    'tier_progression': 'established_legacy'
  },
  'business': {
    'product_type': 'team_collaboration_saas',
    'category': 'enterprise_platform',
    'target_audience': 'development_teams',
    'tech_stack': 'react,ai,github,vite,supabase,api',
    'use_cases': 'team_projects,client_delivery,white_label_solutions',
    'ai_model': 'custom_fine_tuned',
    'generation_time': '5_seconds',
    'supported_languages': 'all_languages_plus_frameworks',
    'deployment_targets': 'all_platforms_plus_enterprise',
    'integration_level': 'enterprise',
    'viral_mechanics': 'team_optimized',
    'commission_eligible': 'true',
    'commission_rate': 'enhanced_25_to_40_percent',
    'referral_tracking': 'team_attribution',
    'analytics_tracking': 'business_intelligence',
    'template_count': 'unlimited_plus_custom',
    'branding_removal': 'true',
    'api_access': 'full',
    'white_label': 'true',
    'team_features': 'true',
    'role_based_access': 'true',
    'bulk_processing': 'true',
    'webhook_support': 'true',
    'customer_segment': 'business_teams',
    'conversion_funnel': 'team_expansion',
    'lifecycle_stage': 'scale',
    'growth_vector': 'team_viral_mechanics'
  },
  'enterprise': {
    'product_type': 'enterprise_platform',
    'category': 'custom_ai_infrastructure',
    'target_audience': 'enterprise_organizations',
    'tech_stack': 'react,ai,github,vite,supabase,api,custom_models',
    'use_cases': 'enterprise_scale,custom_workflows,ai_orchestration',
    'ai_model': 'custom_enterprise_models',
    'generation_time': '1_second',
    'supported_languages': 'all_languages_plus_custom',
    'deployment_targets': 'enterprise_infrastructure',
    'integration_level': 'white_glove',
    'viral_mechanics': 'enterprise_ecosystem',
    'commission_eligible': 'true',
    'commission_rate': 'legacy_40_percent_plus',
    'referral_tracking': 'enterprise_attribution',
    'analytics_tracking': 'custom_bi_integration',
    'template_count': 'unlimited_plus_custom_development',
    'branding_removal': 'true',
    'api_access': 'unlimited',
    'white_label': 'complete',
    'team_features': 'unlimited',
    'custom_ai': 'full_model_training',
    'role_based_access': 'enterprise_sso',
    'sla_guarantee': '99_9_percent',
    'dedicated_support': 'customer_success_manager',
    'custom_contracts': 'true',
    'compliance': 'soc2,gdpr,hipaa',
    'deployment_options': 'cloud,on_premise,hybrid',
    'customer_segment': 'fortune_500',
    'conversion_funnel': 'enterprise_sales',
    'lifecycle_stage': 'enterprise_partnership'
  }
};

// Human-like automation patterns 
const HUMAN_PATTERNS = {
  typing: {
    min_delay: 50,
    max_delay: 150,
    thinking_pauses: [300, 600, 900]
  },
  clicks: {
    variance: 3, // pixels
    hover_delay: [100, 200, 300]
  }
};

// Human-like typing with natural patterns
async function humanType(page, text, selector = null) {
  if (selector) {
    const element = await page.$(selector);
    if (element) await element.click();
  }
  
  for (const char of text) {
    await page.keyboard.type(char);
    const delay = HUMAN_PATTERNS.typing.min_delay + 
                  Math.random() * (HUMAN_PATTERNS.typing.max_delay - HUMAN_PATTERNS.typing.min_delay);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Random thinking pauses
    if (char === '_' && Math.random() < 0.1) {
      const pause = HUMAN_PATTERNS.typing.thinking_pauses[
        Math.floor(Math.random() * HUMAN_PATTERNS.typing.thinking_pauses.length)
      ];
      await new Promise(resolve => setTimeout(resolve, pause));
    }
  }
}

// Intelligent field detection and filling
async function fillMetadataIntelligently(page, metadata) {
  console.log('🤖 Starting intelligent metadata automation...');
  
  try {
    // Wait for metadata section to be visible
    await page.waitForSelector('input[placeholder="Key"], input[name*="key"], [data-testid*="metadata"]', {
      visible: true,
      timeout: 10000
    });
    
    let metadataCount = 0;
    
    for (const [key, value] of Object.entries(metadata)) {
      console.log(`📝 Adding metadata: ${key} = ${value}`);
      
      // Look for "Add Metadata" button or similar
      const addButtons = await page.$$('button:has-text("Add Metadata"), button:has-text("Add"), button[aria-label*="add"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Find key/value input pairs
      const keyInputs = await page.$$('input[placeholder*="key" i], input[name*="key"], input[data-testid*="key"]');
      const valueInputs = await page.$$('input[placeholder*="value" i], input[name*="value"], input[data-testid*="value"]');
      
      if (keyInputs.length > metadataCount && valueInputs.length > metadataCount) {
        // Fill key field
        const keyInput = keyInputs[metadataCount];
        await keyInput.click();
        await keyInput.clear();
        await humanType(page, key);
        
        // Small pause between key and value
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fill value field  
        const valueInput = valueInputs[metadataCount];
        await valueInput.click();
        await valueInput.clear();
        await humanType(page, value);
        
        metadataCount++;
        
        // Pause between metadata entries
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        console.log('⚠️ Could not find input fields for metadata entry');
        break;
      }
    }
    
    console.log(`✅ Successfully added ${metadataCount} metadata entries`);
    
  } catch (error) {
    console.error('❌ Metadata automation error:', error.message);
    console.log('🔧 Please add metadata manually using the provided data');
  }
}

// Main automation function
async function automateMetadata(tier = 'free') {
  console.log(`🚀 Starting Polar.sh metadata automation for ${tier} tier...`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  
  // Remove automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  console.log('📋 Please navigate to the Polar.sh product metadata section');
  console.log('⏳ Waiting 15 seconds for navigation...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  const metadata = METADATA_CONFIGS[tier] || METADATA_CONFIGS.free;
  await fillMetadataIntelligently(page, metadata);
  
  console.log('');
  console.log('📋 Metadata configuration completed!');
  console.log(`🎯 Tier: ${tier.toUpperCase()}`);
  console.log('📊 Next steps:');
  console.log('1. Review the added metadata entries');
  console.log('2. Configure Automated Benefits');
  console.log('3. Save the product');
  console.log('4. Test the product flow');
  console.log('');
  console.log('⏳ Browser staying open for review...');
  
  // Keep browser open for manual review
  await new Promise(resolve => setTimeout(resolve, 60000));
  await browser.close();
}

// Export for use or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tier = process.argv[2] || 'free';
  automateMetadata(tier).catch(console.error);
}

export { automateMetadata, METADATA_CONFIGS };
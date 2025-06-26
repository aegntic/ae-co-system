import puppeteer from 'puppeteer';

// FINAL PRO TIER METADATA with Realistic Times
const PRO_TIER_FINAL_METADATA = {
  'product_type': 'professional_network_saas',
  'category': 'website_generator_pro_network',
  'target_audience': 'professional_builders_and_leaders',
  'tech_stack': 'react,ai,github,vite,stripe,webhooks,analytics',
  'ai_model': 'deepseek-r1.1-pro,claude-4-opus,gpt-5-turbo,llama-4-405b,gemma-3-27b',
  'generation_time': '30_seconds',
  'template_count': '50',
  'monthly_limit': 'unlimited',
  'network_access': 'industry_leaders_and_builders',
  'visibility_features': 'curated_gallery_showcase',
  'professional_recognition': 'industry_peer_visibility',
  'collaboration_opportunities': 'network_partnership_potential',
  'branding_removal': 'complete_white_label',
  'white_label': 'enterprise_grade',
  'custom_domains': 'unlimited_with_subdomains',
  'api_access': 'full_rest_graphql_webhooks',
  'priority_support': '2_hour_response_dedicated_channels',
  'sla_guarantee': '99_9_percent_uptime',
  'network_mechanics': 'professional_showcase_system',
  'attribution_system': 'proper_professional_crediting',
  'marketplace_access': 'template_showcase_sharing',
  'community_access': 'exclusive_professional_network',
  'early_access': 'beta_features_new_models',
  'customer_segment': 'industry_professionals',
  'conversion_funnel': 'network_value_retention',
  'lifecycle_stage': 'professional_activation',
  'growth_vector': 'network_visibility_driven',
  'revenue_model': 'professional_network_subscription',
  'target_segment': 'serious_professional_builders',
  'retention_strategy': 'network_value_dependency',
  'upsell_vector': 'business_team_enterprise',
  'model_architecture': 'professional_multi_agent_ensemble',
  'code_understanding': 'contextual_repository_intelligence',
  'design_intelligence': 'brand_ecosystem_awareness',
  'performance_optimization': 'guaranteed_lighthouse_100',
  'integration_level': 'enterprise_ecosystem',
  'analytics_tracking': 'professional_performance_insights',
  'supported_languages': 'all_languages_plus_emerging',
  'deployment_targets': 'unlimited_platforms_custom',
  'network_value': 'industry_leader_connections',
  'visibility_scope': 'curated_professional_showcase',
  'reputation_building': 'credibility_through_quality_work',
  'peer_networking': 'fellow_builder_connections'
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

async function finishProTierMetadata() {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🚀 FINISHING PRO TIER METADATA - $49/month');
    console.log('⏰ 30-second generation • Network visibility • Unlimited sites');
    console.log('📊 Adding remaining metadata entries...');
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
    
    for (const [key, value] of Object.entries(PRO_TIER_FINAL_METADATA)) {
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
    
    console.log('');
    console.log('🎯 PRO TIER METADATA COMPLETION!');
    console.log('================================');
    console.log(`✅ Successfully automated: ${successCount} entries`);
    console.log(`⚠️ Manual entries needed: ${Object.keys(PRO_TIER_FINAL_METADATA).length - successCount}`);
    console.log('');
    console.log('🔥 PRO TIER FINAL SPECS:');
    console.log('• Price: $49/month');
    console.log('• Generation: 30 seconds');
    console.log('• Sites: Unlimited');
    console.log('• Templates: 50 professional');
    console.log('• Network: Industry leaders');
    console.log('• Branding: Complete white-label');
    console.log('');
    
    if (successCount < Object.keys(PRO_TIER_FINAL_METADATA).length) {
      console.log('📋 REMAINING MANUAL ENTRIES:');
      let count = 1;
      for (const [key, value] of Object.entries(PRO_TIER_FINAL_METADATA)) {
        if (count > successCount) {
          console.log(`${count}. Key: ${key}, Value: ${value}`);
        }
        count++;
      }
    }
    
    console.log('');
    console.log('⏳ Browser staying open for final review and save...');
    
  } catch (error) {
    console.error('❌ PRO tier completion error:', error.message);
    
    console.log('');
    console.log('📋 COMPLETE MANUAL METADATA LIST:');
    let count = 1;
    for (const [key, value] of Object.entries(PRO_TIER_FINAL_METADATA)) {
      console.log(`${count}. Key: ${key}`);
      console.log(`   Value: ${value}`);
      console.log('');
      count++;
    }
  }
}

console.log('🚀 4site.pro PRO TIER METADATA COMPLETION');
console.log('💰 $49/month • 30-second generation • Network visibility');
console.log('');

finishProTierMetadata().catch(console.error);
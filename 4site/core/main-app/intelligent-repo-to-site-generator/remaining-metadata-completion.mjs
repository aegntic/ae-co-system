import puppeteer from 'puppeteer';

// REMAINING 22 METADATA ENTRIES (starting from entry 22)
const REMAINING_METADATA = {
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
    await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 25));
  }
}

async function addMetadataEntry(page, key, value, entryNumber) {
  console.log(`📊 Entry ${entryNumber}: ${key} = ${value}`);
  
  try {
    // Click Add Metadata button
    const allButtons = await page.$$('button');
    let addClicked = false;
    
    for (const button of allButtons) {
      const text = await page.evaluate(el => el.textContent?.toLowerCase(), button);
      if (text && text.includes('add') && text.includes('metadata')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 600));
        addClicked = true;
        break;
      }
    }
    
    if (!addClicked) {
      console.log(`  ⚠️ Could not find Add Metadata button`);
      return false;
    }
    
    // Find the newest empty key/value fields
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    
    if (allInputs.length < 2) {
      console.log(`  ⚠️ Not enough input fields found`);
      return false;
    }
    
    // Get the last two inputs (most recently added)
    const keyField = allInputs[allInputs.length - 2];
    const valueField = allInputs[allInputs.length - 1];
    
    // Fill key field
    await keyField.click();
    await new Promise(resolve => setTimeout(resolve, 200));
    await keyField.focus();
    
    // Clear any existing content
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await humanType(page, key);
    
    // Fill value field
    await valueField.click();
    await new Promise(resolve => setTimeout(resolve, 200));
    await valueField.focus();
    
    // Clear any existing content
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await humanType(page, value);
    
    console.log(`  ✅ Added: ${key}`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function completeRemainingMetadata() {
  try {
    const { browser, page } = await connectToExistingChrome();
    
    console.log('🚀 COMPLETING REMAINING PRO TIER METADATA');
    console.log('📊 Adding final 22 entries (22-43)...');
    console.log('');
    
    let successCount = 0;
    let entryNumber = 22; // Starting from entry 22
    
    for (const [key, value] of Object.entries(REMAINING_METADATA)) {
      const success = await addMetadataEntry(page, key, value, entryNumber);
      if (success) {
        successCount++;
      } else {
        console.log(`❌ Failed to add entry ${entryNumber}: ${key}`);
      }
      
      entryNumber++;
      
      // Pause between entries
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Scroll down every 3 entries to handle long forms
      if ((entryNumber - 22) % 3 === 0) {
        await page.evaluate(() => window.scrollBy(0, 150));
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    console.log('');
    console.log('🎯 REMAINING METADATA COMPLETION FINISHED!');
    console.log('==========================================');
    console.log(`✅ Successfully added: ${successCount} entries`);
    console.log(`❌ Failed entries: ${Object.keys(REMAINING_METADATA).length - successCount}`);
    console.log('');
    console.log('📊 TOTAL PRO TIER PROGRESS:');
    console.log('• Previous automation: 21 entries');
    console.log(`• This completion: ${successCount} entries`);
    console.log(`• TOTAL COMPLETED: ${21 + successCount} out of 43 entries`);
    console.log('');
    
    if (successCount === Object.keys(REMAINING_METADATA).length) {
      console.log('🎉 ALL PRO TIER METADATA COMPLETE!');
      console.log('✅ Ready to save the $49/month PRO tier');
    } else {
      console.log('📋 MANUALLY ADD ANY REMAINING ENTRIES:');
      let failedCount = 1;
      for (const [key, value] of Object.entries(REMAINING_METADATA)) {
        if (failedCount > successCount) {
          console.log(`${failedCount + 21}. Key: ${key}, Value: ${value}`);
        }
        failedCount++;
      }
    }
    
    console.log('');
    console.log('⏳ Browser staying open for final review...');
    
  } catch (error) {
    console.error('❌ Completion error:', error.message);
    
    console.log('');
    console.log('📋 MANUAL ENTRIES LIST:');
    let count = 22;
    for (const [key, value] of Object.entries(REMAINING_METADATA)) {
      console.log(`${count}. Key: ${key}`);
      console.log(`   Value: ${value}`);
      console.log('');
      count++;
    }
  }
}

console.log('🚀 PRO TIER METADATA COMPLETION - FINAL 22 ENTRIES');
console.log('📊 Entries 22-43 of 43 total');
console.log('');

completeRemainingMetadata().catch(console.error);
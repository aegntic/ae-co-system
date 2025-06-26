import puppeteer from 'puppeteer';

// BUSINESS TIER Metadata Only
const BUSINESS_METADATA = {
  'product_type': 'team_collaboration_platform',
  'category': 'automated_content_business_solution',
  'target_audience': 'agencies_startups_teams',
  'tech_stack': 'react,ai,github,team_tools,webhooks,apis',
  'ai_model': 'team_optimized_multi_agent_ensemble',
  'generation_speed': 'ultra_fast_2x_pro_tier',
  'team_size': '5_to_10_users',
  'collaboration_features': 'role_based_access_control',
  'brand_management': 'centralized_team_consistency',
  'integration_level': 'advanced_slack_jira_linear',
  'webhook_support': 'custom_development_triggers',
  'api_access': 'full_rest_graphql_team',
  'white_label': 'client_reseller_ready',
  'priority_support': '1_hour_response_dedicated',
  'analytics_level': 'team_performance_dashboard',
  'client_features': 'presentation_mode_reporting',
  'automation_triggers': 'development_milestones',
  'content_workflows': 'collaborative_review_approval',
  'template_management': 'shared_team_libraries',
  'brand_enforcement': 'automated_guideline_compliance',
  'multi_repo_support': 'organization_wide_monitoring',
  'roi_tracking': 'team_content_performance',
  'custom_reporting': 'export_client_presentations',
  'ab_testing': 'team_website_variations',
  'social_automation': 'development_to_social_content',
  'milestone_integration': 'project_progress_content',
  'customer_segment': 'growing_agencies_startups',
  'conversion_funnel': 'team_to_enterprise_growth',
  'lifecycle_stage': 'team_expansion',
  'growth_vector': 'agency_referral_driven',
  'revenue_model': 'high_value_team_subscription',
  'retention_strategy': 'team_workflow_dependency',
  'upsell_vector': 'enterprise_custom_ai',
  'deployment_targets': 'team_managed_infrastructure',
  'security_level': 'team_access_controls',
  'compliance_features': 'client_data_protection',
  'scalability': 'team_growth_ready',
  'onboarding': 'dedicated_team_setup',
  'training_included': 'team_workflow_optimization'
};

async function addSingleMetadata(page, key, value, entryNum) {
  console.log(`📊 Entry ${entryNum}/39: ${key} = ${value}`);
  
  try {
    // Click Add Metadata button
    const buttons = await page.$$('button');
    let addClicked = false;
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', button);
      if (text.includes('add') && text.includes('metadata')) {
        await button.click();
        await page.waitForTimeout(500);
        addClicked = true;
        break;
      }
    }
    
    if (!addClicked) {
      console.log(`  ⚠️ Could not find Add Metadata button`);
      return false;
    }
    
    // Wait for new fields to appear
    await page.waitForTimeout(300);
    
    // Find the newest input fields
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    
    if (allInputs.length < 2) {
      console.log(`  ⚠️ Not enough input fields (found ${allInputs.length})`);
      return false;
    }
    
    // Get the last two inputs (newest)
    const keyField = allInputs[allInputs.length - 2];
    const valueField = allInputs[allInputs.length - 1];
    
    // Fill key field
    await keyField.click();
    await page.waitForTimeout(100);
    await keyField.focus();
    
    // Clear and type key
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.waitForTimeout(50);
    
    await keyField.type(key, {delay: 15});
    
    // Fill value field
    await valueField.click();
    await page.waitForTimeout(100);
    await valueField.focus();
    
    // Clear and type value
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.waitForTimeout(50);
    
    await valueField.type(value, {delay: 15});
    
    console.log(`  ✅ Successfully added: ${key}`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error adding ${key}: ${error.message}`);
    return false;
  }
}

async function automateBusinessMetadata() {
  try {
    console.log('🚀 BUSINESS TIER METADATA AUTOMATION');
    console.log('📊 Adding 39 metadata entries for $494.94/month tier');
    console.log('');
    
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
    
    console.log('✅ Connected to Chrome');
    console.log('📄 Active page:', page.url());
    console.log('');
    
    // Scroll to metadata section
    await page.evaluate(() => {
      const metadataElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('metadata')
      );
      if (metadataElements.length > 0) {
        metadataElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await page.waitForTimeout(1000);
    
    let successCount = 0;
    let entryNumber = 1;
    
    // Add each metadata entry
    for (const [key, value] of Object.entries(BUSINESS_METADATA)) {
      const success = await addSingleMetadata(page, key, value, entryNumber);
      
      if (success) {
        successCount++;
      } else {
        console.log(`❌ Failed to add entry ${entryNumber}: ${key}`);
      }
      
      entryNumber++;
      
      // Pause between entries
      await page.waitForTimeout(800);
      
      // Scroll down periodically
      if (entryNumber % 5 === 0) {
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(500);
      }
    }
    
    console.log('');
    console.log('🎯 BUSINESS TIER METADATA AUTOMATION COMPLETE!');
    console.log('=================================================');
    console.log(`✅ Successfully added: ${successCount}/39 metadata entries`);
    console.log('💼 Team collaboration platform metadata ready');
    console.log('🏢 BUSINESS tier ($494.94/month) setup complete');
    
    if (successCount < 39) {
      console.log('');
      console.log('📋 REMAINING ENTRIES TO ADD MANUALLY:');
      let count = 1;
      for (const [key, value] of Object.entries(BUSINESS_METADATA)) {
        if (count > successCount) {
          console.log(`${count - successCount}. Key: ${key}`);
          console.log(`   Value: ${value}`);
        }
        count++;
      }
    }
    
    console.log('');
    console.log('⏳ Browser staying open for review...');
    
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    console.log('');
    console.log('📋 MANUAL METADATA FALLBACK:');
    let count = 1;
    for (const [key, value] of Object.entries(BUSINESS_METADATA)) {
      console.log(`${count}. ${key} → ${value}`);
      count++;
    }
  }
}

console.log('🚀 4site.pro BUSINESS TIER - Metadata Automation');
console.log('🏢 39 strategic metadata entries for team collaboration');
console.log('');

automateBusinessMetadata().catch(console.error);
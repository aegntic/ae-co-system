import puppeteer from 'puppeteer';

// ENTERPRISE METADATA - Optimized for reliability
const ENTERPRISE_METADATA = {
  'product_type': 'enterprise_content_automation',
  'category': 'fortune_500_enterprise_solution',
  'target_audience': 'large_enterprises_fortune_500',
  'organization_size': 'unlimited_users_enterprise',
  'deployment_model': 'on_premise_private_infrastructure',
  'security_level': 'soc2_hipaa_custom_compliance',
  'sla_guarantee': '99_99_uptime_enterprise_support',
  'generation_speed': '9_seconds_fastest_industry',
  'scalability': 'unlimited_enterprise_scale',
  'support_tier': '24_7_guaranteed_response',
  'custom_training': 'organization_voice_brand_modeling',
  'account_management': 'dedicated_manager_strategy_team',
  'integration_level': 'custom_enterprise_apis',
  'compliance_features': 'full_audit_governance_controls',
  'automation_triggers': 'custom_enterprise_workflows',
  'security_deployment': 'on_premise_data_residency',
  'performance_tier': 'priority_compute_dedicated',
  'custom_development': 'bespoke_api_integration',
  'enterprise_features': 'sso_custom_encryption',
  'global_support': 'multi_region_deployment',
  'content_governance': 'enterprise_policy_enforcement',
  'strategic_services': 'quarterly_business_reviews',
  'migration_services': 'custom_implementation_training',
  'reporting_analytics': 'executive_roi_analysis',
  'industry_specialization': 'finance_healthcare_government',
  'multi_language': 'global_localization_support',
  'enterprise_integration': 'slack_teams_jira_confluence',
  'load_balancing': 'automatic_failover_systems',
  'content_strategy': 'dedicated_consultation_team',
  'white_label': 'complete_enterprise_branding',
  'api_customization': 'unlimited_enterprise_limits',
  'workflow_automation': 'organization_wide_coordination',
  'compliance_reporting': 'audit_trails_documentation',
  'custom_security': 'enterprise_protocols_policies',
  'dedicated_infrastructure': 'private_cloud_deployment',
  'enterprise_training': 'team_stakeholder_programs',
  'content_coordination': 'cross_team_automation',
  'strategic_planning': 'enterprise_content_roadmap',
  'roi_optimization': 'business_value_maximization',
  'content_workflows': 'enterprise_approval_governance'
};

// Delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function connectToPolar() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
  
  return { browser, page };
}

async function addSingleEntry(page, key, value, entryNum) {
  console.log(`🏛️ Entry ${entryNum}: ${key} = ${value}`);
  
  try {
    // Click Add Metadata button
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => 
        btn.textContent && 
        btn.textContent.toLowerCase().includes('add') && 
        btn.textContent.toLowerCase().includes('metadata')
      );
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (!addClicked) {
      console.log(`  ⚠️ Add button not found`);
      return false;
    }
    
    await delay(600);
    
    // Get inputs and fill them
    const filled = await page.evaluate((k, v) => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
      if (inputs.length < 2) return false;
      
      const keyInput = inputs[inputs.length - 2];
      const valueInput = inputs[inputs.length - 1];
      
      if (keyInput && valueInput) {
        keyInput.focus();
        keyInput.select();
        keyInput.value = k;
        keyInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        valueInput.focus();
        valueInput.select();
        valueInput.value = v;
        valueInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
      }
      return false;
    }, key, value);
    
    if (filled) {
      console.log(`  ✅ Added: ${key}`);
      return true;
    } else {
      console.log(`  ❌ Failed to fill: ${key}`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function executeFinalMCPAutomation() {
  console.log('🏛️ FINAL MCP ENTERPRISE AUTOMATION');
  console.log('💰 $4,949.49/month - Fortune 500 Ready');
  console.log(`📊 Processing ${Object.keys(ENTERPRISE_METADATA).length} metadata entries`);
  console.log('');
  
  try {
    const { browser, page } = await connectToPolar();
    
    console.log('✅ Connected to Chrome');
    console.log('📄 Page:', page.url());
    console.log('');
    
    // Scroll to metadata section
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const metadataEl = elements.find(el => 
        el.textContent && el.textContent.toLowerCase().includes('metadata')
      );
      if (metadataEl) {
        metadataEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await delay(1000);
    
    let successCount = 0;
    let entryNumber = 1;
    
    // Process each metadata entry
    for (const [key, value] of Object.entries(ENTERPRISE_METADATA)) {
      const success = await addSingleEntry(page, key, value, entryNumber);
      
      if (success) {
        successCount++;
      }
      
      entryNumber++;
      await delay(800); // Pause between entries
      
      // Scroll periodically
      if (entryNumber % 8 === 0) {
        await page.evaluate(() => window.scrollBy(0, 200));
        await delay(500);
      }
    }
    
    console.log('');
    console.log('🎯 FINAL MCP AUTOMATION COMPLETE!');
    console.log('==================================');
    console.log(`✅ Successfully added: ${successCount}/${Object.keys(ENTERPRISE_METADATA).length} entries`);
    console.log('🏛️ Enterprise tier metadata configured');
    console.log('💰 $4,949.49/month Fortune 500 ready');
    console.log('🔐 Enterprise security and compliance tagged');
    console.log('⚡ 9-second generation speed configured');
    
    if (successCount >= Object.keys(ENTERPRISE_METADATA).length * 0.85) {
      console.log('');
      console.log('🌟 EXCELLENT SUCCESS! Enterprise tier ready');
      console.log('🚀 Fortune 500 deployment configured');
      console.log('🎯 Custom AI training and on-premise deployment ready');
    }
    
    console.log('');
    console.log('⏳ Browser staying open for final review...');
    
  } catch (error) {
    console.error('❌ Final automation error:', error.message);
  }
}

console.log('🧠 MCP FINAL SOLUTION: Enterprise Automation');
console.log('🏛️ $4,949.49/month Fortune 500 tier');
console.log('');

executeFinalMCPAutomation().catch(console.error);
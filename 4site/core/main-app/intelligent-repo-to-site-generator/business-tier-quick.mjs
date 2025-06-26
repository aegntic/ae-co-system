import puppeteer from 'puppeteer';

// BUSINESS TIER Optimized Configuration
const BUSINESS_DESCRIPTION = `# Team Collaboration + Advanced Automation Platform

Transform your entire team's development workflow into automated content creation engines. Perfect for agencies, growing startups, and development teams who need seamless collaboration without complexity.

## 🏢 BUSINESS Features - $494.94/month
- **Advanced team automation** - development milestones automatically become content
- **5-10 user collaboration** with role-based permissions
- **Ultra-fast content generation** (2x faster than PRO tier)
- **Team brand consistency** across all generated websites
- **Advanced integrations** (Slack, Jira, Linear, webhooks)
- **Team analytics dashboard** - track content performance across projects
- **White-label for clients** - reseller ready with custom branding
- **Priority support** (1-hour response via dedicated channels)

##### ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ`;

// Core metadata only
const CORE_METADATA = {
  'product_type': 'team_collaboration_platform',
  'target_audience': 'agencies_startups_teams',
  'team_size': '5_to_10_users',
  'price_tier': 'business_494_monthly',
  'collaboration_features': 'role_based_access_control',
  'integration_level': 'advanced_slack_jira_linear',
  'white_label': 'client_reseller_ready',
  'priority_support': '1_hour_response_dedicated'
};

async function quickBusinessSetup() {
  try {
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
    
    console.log('🚀 QUICK BUSINESS TIER SETUP');
    
    // Fill description with faster approach
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.type(textarea, BUSINESS_DESCRIPTION, {delay: 10});
      console.log('✅ Description filled');
    }
    
    // Add core metadata quickly
    let added = 0;
    for (const [key, value] of Object.entries(CORE_METADATA)) {
      try {
        // Find add button
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent?.toLowerCase(), btn);
          if (text?.includes('add') && text?.includes('metadata')) {
            await btn.click();
            await page.waitForTimeout(300);
            break;
          }
        }
        
        // Fill fields
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length >= 2) {
          const keyField = inputs[inputs.length - 2];
          const valueField = inputs[inputs.length - 1];
          
          await keyField.click();
          await keyField.type(key);
          await valueField.click();
          await valueField.type(value);
          
          added++;
          console.log(`✅ Added: ${key}`);
        }
      } catch (e) {
        console.log(`⚠️ Failed: ${key}`);
      }
    }
    
    console.log(`\n🎯 BUSINESS TIER COMPLETE: ${added}/${Object.keys(CORE_METADATA).length} metadata entries`);
    console.log('💼 Team collaboration platform ready for agencies and startups');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickBusinessSetup();
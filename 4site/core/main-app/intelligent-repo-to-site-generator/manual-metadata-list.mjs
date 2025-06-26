// Manual Metadata Lists for All Tiers

const TIER_METADATA = {
  free: {
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

  pro: {
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
  },

  business: {
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
  },

  enterprise: {
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
};

function displayMetadata(tier = 'free') {
  console.log(`🎯 ${tier.toUpperCase()} TIER METADATA`);
  console.log('================================');
  console.log('');
  console.log('📋 Copy these key-value pairs into Polar.sh metadata fields:');
  console.log('');
  
  const metadata = TIER_METADATA[tier];
  let count = 1;
  
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`${count}. Key: ${key}`);
    console.log(`   Value: ${value}`);
    console.log('');
    count++;
  }
  
  console.log(`🎯 Total: ${Object.keys(metadata).length} metadata entries for ${tier.toUpperCase()} tier`);
  console.log('');
}

const tier = process.argv[2] || 'free';

if (!TIER_METADATA[tier]) {
  console.log('❌ Invalid tier. Valid options: free, pro, business, enterprise');
  process.exit(1);
}

console.log('🚀 4site.pro Manual Metadata Generator');
console.log('');

displayMetadata(tier);
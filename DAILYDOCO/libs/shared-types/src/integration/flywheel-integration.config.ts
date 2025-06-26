import { AuthenticationConfig, IntegrationSettings } from '../auth/unified-auth.types';

/**
 * 4site.pro ↔ DailyDoco Pro Integration Configuration
 * 
 * This configuration file contains all the settings needed to enable
 * the exponential growth flywheel between the two platforms.
 */

export const FLYWHEEL_INTEGRATION_CONFIG = {
  // Platform URLs and endpoints
  platforms: {
    foursitepro: {
      base_url: process.env.NEXT_PUBLIC_FOURSITEPRO_URL || 'http://localhost:3000',
      api_endpoint: '/api/integration',
      webhook_endpoint: '/api/webhooks/dailydoco',
      auth_callback: '/auth/callback'
    },
    dailydoco: {
      base_url: process.env.NEXT_PUBLIC_DAILYDOCO_URL || 'http://localhost:5173',
      api_endpoint: '/api/integration',
      webhook_endpoint: '/api/webhooks/foursitepro',
      auth_callback: '/auth/callback'
    }
  },

  // Authentication configuration
  authentication: {
    jwt_secret: process.env.UNIFIED_AUTH_JWT_SECRET || 'development-secret-key',
    jwt_expires_in: '24h',
    refresh_token_expires_in: '7d',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    allowed_origins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://4site.pro',
      'https://dailydoco.pro'
    ],
    session_cookie_name: 'unified_auth_session',
    cross_platform_redirect_urls: {
      foursitepro: process.env.NEXT_PUBLIC_FOURSITEPRO_URL || 'http://localhost:3000',
      dailydoco: process.env.NEXT_PUBLIC_DAILYDOCO_URL || 'http://localhost:5173'
    }
  } as AuthenticationConfig,

  // Integration settings
  integration: {
    auto_tutorial_generation: true,
    cross_platform_notifications: true,
    shared_project_metadata: true,
    viral_branding_enabled: true,
    analytics_tracking: true,
    a_b_testing_enabled: true
  } as IntegrationSettings,

  // Tutorial generation settings
  tutorial_generation: {
    auto_trigger_threshold: 24, // hours after website creation
    default_preferences: {
      length: 'medium' as const,
      complexity: 'intermediate' as const,
      include_code_walkthrough: true,
      include_deployment: true,
      narration_style: 'educational' as const
    },
    supported_templates: [
      'static-website',
      'react-website',
      'fullstack-app',
      'mobile-app'
    ],
    quality_thresholds: {
      min_complexity_score: 3,
      min_viral_potential: 5,
      min_content_quality: 6
    }
  },

  // Cross-platform CTAs configuration
  cta_configuration: {
    website_to_tutorial: {
      trigger_conditions: {
        website_created: true,
        has_github_repo: false, // More likely to need tutorial
        user_tier: ['free', 'pro'],
        time_since_creation: 300 // 5 minutes
      },
      display_duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      success_metrics: ['tutorial_generated', 'dailydoco_signup']
    },
    tutorial_to_website: {
      trigger_conditions: {
        tutorial_views: 100,
        engagement_rate: 0.7,
        watch_completion: 0.8
      },
      display_duration: 14 * 24 * 60 * 60 * 1000, // 14 days
      success_metrics: ['website_created', 'foursitepro_signup']
    },
    upgrade_prompts: {
      free_tier_limits: {
        websites: 3,
        tutorials: 1,
        ai_test_audience: 0
      },
      trigger_threshold: 0.8, // 80% of limit reached
      conversion_tracking: true
    }
  },

  // Analytics and tracking
  analytics: {
    flywheel_metrics: {
      calculation_intervals: ['1h', '24h', '7d', '30d'],
      key_metrics: [
        'websites_created',
        'tutorials_generated',
        'tutorial_conversion_rate',
        'viral_coefficient',
        'cross_platform_conversions',
        'revenue_per_user',
        'lifetime_value'
      ]
    },
    conversion_tracking: {
      events: [
        'signup',
        'website_created',
        'tutorial_generated',
        'upgrade',
        'cross_platform_action'
      ],
      attribution_window: 30 * 24 * 60 * 60 * 1000, // 30 days
      cohort_analysis: true
    },
    a_b_testing: {
      enabled: true,
      test_allocation: 0.1, // 10% of users in tests
      min_sample_size: 100,
      significance_threshold: 0.95
    }
  },

  // Content pipeline settings
  content_pipeline: {
    seo_optimization: {
      enabled: true,
      auto_keyword_research: true,
      competitor_analysis: true,
      trending_topics_integration: true
    },
    viral_optimization: {
      thumbnail_generation: true,
      title_optimization: true,
      description_enhancement: true,
      hashtag_suggestions: true
    },
    cross_platform_distribution: {
      auto_blog_generation: true,
      social_media_snippets: true,
      email_newsletter_content: true,
      community_forum_posts: true
    }
  },

  // Subscription tiers and limits
  subscription_tiers: {
    free: {
      websites: 3,
      tutorials: 1,
      storage_gb: 1,
      ai_test_audience: false,
      remove_branding: false,
      custom_domains: false,
      api_access: false,
      priority_support: false
    },
    pro: {
      websites: -1, // unlimited
      tutorials: 10,
      storage_gb: 10,
      ai_test_audience: true,
      remove_branding: true,
      custom_domains: true,
      api_access: false,
      priority_support: false
    },
    business: {
      websites: -1,
      tutorials: 100,
      storage_gb: 100,
      ai_test_audience: true,
      remove_branding: true,
      custom_domains: true,
      api_access: true,
      priority_support: true,
      white_label: true,
      team_collaboration: true
    },
    enterprise: {
      websites: -1,
      tutorials: -1,
      storage_gb: -1, // unlimited
      ai_test_audience: true,
      remove_branding: true,
      custom_domains: true,
      api_access: true,
      priority_support: true,
      white_label: true,
      team_collaboration: true,
      custom_integrations: true,
      sla_guarantee: true
    }
  },

  // Webhook configurations
  webhooks: {
    foursitepro_events: [
      'website.created',
      'website.updated', 
      'website.deployed',
      'user.upgraded',
      'user.cancelled'
    ],
    dailydoco_events: [
      'tutorial.generated',
      'tutorial.published',
      'tutorial.viral',
      'capture.completed',
      'user.upgraded'
    ],
    retry_config: {
      max_retries: 3,
      backoff_strategy: 'exponential',
      initial_delay: 1000, // 1 second
      max_delay: 60000 // 1 minute
    }
  },

  // Rate limiting
  rate_limits: {
    tutorial_generation: {
      free: { requests: 1, window: '24h' },
      pro: { requests: 10, window: '24h' },
      business: { requests: 100, window: '24h' },
      enterprise: { requests: -1, window: '24h' }
    },
    website_creation: {
      free: { requests: 3, window: '30d' },
      pro: { requests: -1, window: '30d' },
      business: { requests: -1, window: '30d' },
      enterprise: { requests: -1, window: '30d' }
    },
    api_calls: {
      free: { requests: 100, window: '1h' },
      pro: { requests: 1000, window: '1h' },
      business: { requests: 10000, window: '1h' },
      enterprise: { requests: -1, window: '1h' }
    }
  },

  // Feature flags
  feature_flags: {
    tutorial_auto_generation: true,
    ai_narration: true,
    viral_optimization: true,
    cross_platform_sso: true,
    analytics_dashboard: true,
    a_b_testing: true,
    community_features: false, // Coming soon
    marketplace: false, // Coming soon
    api_marketplace: false // Coming soon
  },

  // Error handling and monitoring
  monitoring: {
    error_tracking: {
      sentry_dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    },
    performance_monitoring: {
      enabled: true,
      sample_rate: 0.1, // 10% of requests
      threshold_alerts: {
        response_time: 2000, // 2 seconds
        error_rate: 0.05, // 5%
        conversion_drop: 0.2 // 20% drop
      }
    },
    uptime_monitoring: {
      check_interval: 60000, // 1 minute
      endpoints: [
        '/health',
        '/api/health',
        '/api/integration/status'
      ]
    }
  },

  // Development and testing
  development: {
    mock_external_apis: process.env.NODE_ENV === 'development',
    bypass_rate_limits: process.env.NODE_ENV === 'development',
    enable_debug_logs: process.env.NODE_ENV === 'development',
    test_webhooks: {
      enabled: true,
      endpoint: 'http://localhost:3001/webhooks/test'
    }
  }
};

// Environment-specific overrides
export const getIntegrationConfig = (environment: 'development' | 'staging' | 'production') => {
  const config = { ...FLYWHEEL_INTEGRATION_CONFIG };

  switch (environment) {
    case 'development':
      config.authentication.jwt_secret = 'dev-secret-key';
      config.development.mock_external_apis = true;
      config.development.bypass_rate_limits = true;
      break;

    case 'staging':
      config.platforms.foursitepro.base_url = 'https://staging.4site.pro';
      config.platforms.dailydoco.base_url = 'https://staging.dailydoco.pro';
      config.analytics.a_b_testing.test_allocation = 0.5; // More aggressive testing
      break;

    case 'production':
      config.platforms.foursitepro.base_url = 'https://4site.pro';
      config.platforms.dailydoco.base_url = 'https://dailydoco.pro';
      config.development.mock_external_apis = false;
      config.development.bypass_rate_limits = false;
      config.development.enable_debug_logs = false;
      break;
  }

  return config;
};

// Utility functions for configuration
export const getAuthConfig = (environment?: string): AuthenticationConfig => {
  const env = environment || process.env.NODE_ENV || 'development';
  return getIntegrationConfig(env as any).authentication;
};

export const getIntegrationSettings = (environment?: string): IntegrationSettings => {
  const env = environment || process.env.NODE_ENV || 'development';
  return getIntegrationConfig(env as any).integration;
};

export const getPlatformLimits = (tier: string) => {
  return FLYWHEEL_INTEGRATION_CONFIG.subscription_tiers[tier as keyof typeof FLYWHEEL_INTEGRATION_CONFIG.subscription_tiers] || 
         FLYWHEEL_INTEGRATION_CONFIG.subscription_tiers.free;
};

export const getRateLimit = (tier: string, resource: string) => {
  const limits = FLYWHEEL_INTEGRATION_CONFIG.rate_limits[resource as keyof typeof FLYWHEEL_INTEGRATION_CONFIG.rate_limits];
  return limits?.[tier as keyof typeof limits] || limits?.free;
};

// Validation helpers
export const validateConfiguration = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UNIFIED_AUTH_JWT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
};

// Export the main configuration
export default FLYWHEEL_INTEGRATION_CONFIG;
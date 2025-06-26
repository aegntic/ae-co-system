// Unified Authentication Types for 4site.pro ↔ DailyDoco Pro Integration
export interface UnifiedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'business' | 'enterprise';
  platform_access: {
    foursitepro: boolean;
    dailydoco: boolean;
    aegnt27: boolean;
  };
  created_at: string;
  last_seen_at: string;
  referral_code?: string;
  referred_by?: string;
}

export interface UnifiedSession {
  access_token: string;
  refresh_token: string;
  user: UnifiedUser;
  expires_at: number;
  platform_permissions: {
    foursitepro: {
      websites_created: number;
      can_remove_branding: boolean;
      can_use_custom_domain: boolean;
      api_access: boolean;
    };
    dailydoco: {
      videos_generated: number;
      capture_sessions: number;
      ai_test_audience_access: boolean;
      advanced_editing: boolean;
    };
  };
}

export interface CrossPlatformProject {
  id: string;
  user_id: string;
  platform_origin: 'foursitepro' | 'dailydoco';
  project_type: 'website' | 'documentation' | 'tutorial';
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    github_repo?: string;
    tech_stack: string[];
    domain?: string;
    deployment_url?: string;
  };
  integration_status: {
    has_tutorial: boolean;
    has_documentation: boolean;
    cross_platform_shared: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface TutorialGenerationRequest {
  user_id: string;
  project_id: string;
  website_url: string;
  project_metadata: {
    title: string;
    description: string;
    tech_stack: string[];
    features: string[];
    github_repo?: string;
  };
  tutorial_preferences: {
    length: 'short' | 'medium' | 'long';
    complexity: 'beginner' | 'intermediate' | 'advanced';
    include_code_walkthrough: boolean;
    include_deployment: boolean;
    narration_style: 'technical' | 'casual' | 'educational';
  };
}

export interface ConversionEvent {
  user_id: string;
  event_type: 'signup' | 'upgrade' | 'cross_platform_action' | 'tutorial_generated' | 'website_created';
  source_platform: 'foursitepro' | 'dailydoco';
  target_platform?: 'foursitepro' | 'dailydoco';
  metadata: {
    subscription_tier_before?: string;
    subscription_tier_after?: string;
    project_id?: string;
    referral_source?: string;
    campaign_id?: string;
  };
  timestamp: string;
}

export interface FlyWheelMetrics {
  user_id: string;
  timeframe: '24h' | '7d' | '30d' | '90d';
  metrics: {
    // Website Creation → Tutorial Generation
    websites_created: number;
    tutorials_generated: number;
    tutorial_conversion_rate: number;
    
    // Tutorial Views → New User Acquisition
    tutorial_views: number;
    new_users_from_tutorials: number;
    viral_coefficient: number;
    
    // Cross-platform Conversion
    foursitepro_to_dailydoco_conversion: number;
    dailydoco_to_foursitepro_conversion: number;
    
    // Revenue Metrics
    lifetime_value: number;
    revenue_per_tutorial: number;
    cost_per_acquisition: number;
  };
}

export interface AuthenticationConfig {
  jwt_secret: string;
  jwt_expires_in: string;
  refresh_token_expires_in: string;
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_key: string;
  allowed_origins: string[];
  session_cookie_name: string;
  cross_platform_redirect_urls: {
    foursitepro: string;
    dailydoco: string;
  };
}

export interface IntegrationSettings {
  auto_tutorial_generation: boolean;
  cross_platform_notifications: boolean;
  shared_project_metadata: boolean;
  viral_branding_enabled: boolean;
  analytics_tracking: boolean;
  a_b_testing_enabled: boolean;
}
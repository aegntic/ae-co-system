// Database type definitions for Supabase
// Generated based on schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'business' | 'enterprise'
          subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing'
          subscription_ends_at: string | null
          referral_code: string
          referred_by: string | null
          onboarding_completed: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'past_due' | 'canceled' | 'trialing'
          subscription_ends_at?: string | null
          referral_code?: string
          referred_by?: string | null
          onboarding_completed?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'past_due' | 'canceled' | 'trialing'
          subscription_ends_at?: string | null
          referral_code?: string
          referred_by?: string | null
          onboarding_completed?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      websites: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          repo_url: string
          template: string
          data: Json
          status: 'draft' | 'published' | 'archived'
          deployment_url: string | null
          custom_domain: string | null
          subdomain: string | null
          views: number
          unique_visitors: number
          last_viewed_at: string | null
          meta_tags: Json
          analytics_enabled: boolean
          show_powered_by: boolean
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          repo_url: string
          template: string
          data: Json
          status?: 'draft' | 'published' | 'archived'
          deployment_url?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          views?: number
          unique_visitors?: number
          last_viewed_at?: string | null
          meta_tags?: Json
          analytics_enabled?: boolean
          show_powered_by?: boolean
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          repo_url?: string
          template?: string
          data?: Json
          status?: 'draft' | 'published' | 'archived'
          deployment_url?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          views?: number
          unique_visitors?: number
          last_viewed_at?: string | null
          meta_tags?: Json
          analytics_enabled?: boolean
          show_powered_by?: boolean
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string | null
          referral_code: string
          referred_email: string | null
          status: 'pending' | 'activated' | 'converted' | 'expired'
          source: string | null
          campaign: string | null
          landing_page: string | null
          created_at: string
          activated_at: string | null
          converted_at: string | null
          conversion_value: number | null
          rewards_granted: boolean
          metadata: Json
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id?: string | null
          referral_code: string
          referred_email?: string | null
          status?: 'pending' | 'activated' | 'converted' | 'expired'
          source?: string | null
          campaign?: string | null
          landing_page?: string | null
          created_at?: string
          activated_at?: string | null
          converted_at?: string | null
          conversion_value?: number | null
          rewards_granted?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string | null
          referral_code?: string
          referred_email?: string | null
          status?: 'pending' | 'activated' | 'converted' | 'expired'
          source?: string | null
          campaign?: string | null
          landing_page?: string | null
          created_at?: string
          activated_at?: string | null
          converted_at?: string | null
          conversion_value?: number | null
          rewards_granted?: boolean
          metadata?: Json
        }
      }
      referral_rewards: {
        Row: {
          id: string
          user_id: string
          referral_id: string
          reward_type: 'months_free' | 'credits' | 'cash' | 'feature_unlock'
          reward_value: Json
          status: 'pending' | 'granted' | 'used' | 'expired'
          granted_at: string | null
          expires_at: string | null
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_id: string
          reward_type: 'months_free' | 'credits' | 'cash' | 'feature_unlock'
          reward_value: Json
          status?: 'pending' | 'granted' | 'used' | 'expired'
          granted_at?: string | null
          expires_at?: string | null
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_id?: string
          reward_type?: 'months_free' | 'credits' | 'cash' | 'feature_unlock'
          reward_value?: Json
          status?: 'pending' | 'granted' | 'used' | 'expired'
          granted_at?: string | null
          expires_at?: string | null
          used_at?: string | null
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          website_id: string | null
          session_id: string | null
          properties: Json
          user_agent: string | null
          ip_address: string | null
          country_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          website_id?: string | null
          session_id?: string | null
          properties?: Json
          user_agent?: string | null
          ip_address?: string | null
          country_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          website_id?: string | null
          session_id?: string | null
          properties?: Json
          user_agent?: string | null
          ip_address?: string | null
          country_code?: string | null
          created_at?: string
        }
      }
      website_analytics: {
        Row: {
          id: string
          website_id: string
          date: string
          views: number
          unique_visitors: number
          referral_clicks: number
          powered_by_clicks: number
          avg_time_on_site: number
          bounce_rate: number | null
          top_referrers: Json
          top_pages: Json
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          date: string
          views?: number
          unique_visitors?: number
          referral_clicks?: number
          powered_by_clicks?: number
          avg_time_on_site?: number
          bounce_rate?: number | null
          top_referrers?: Json
          top_pages?: Json
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          date?: string
          views?: number
          unique_visitors?: number
          referral_clicks?: number
          powered_by_clicks?: number
          avg_time_on_site?: number
          bounce_rate?: number | null
          top_referrers?: Json
          top_pages?: Json
          created_at?: string
        }
      }
      showcase_sites: {
        Row: {
          id: string
          website_id: string
          featured: boolean
          featured_order: number | null
          category: string
          tags: string[]
          likes: number
          showcase_views: number
          created_at: string
          featured_at: string | null
        }
        Insert: {
          id?: string
          website_id: string
          featured?: boolean
          featured_order?: number | null
          category: string
          tags?: string[]
          likes?: number
          showcase_views?: number
          created_at?: string
          featured_at?: string | null
        }
        Update: {
          id?: string
          website_id?: string
          featured?: boolean
          featured_order?: number | null
          category?: string
          tags?: string[]
          likes?: number
          showcase_views?: number
          created_at?: string
          featured_at?: string | null
        }
      }
      user_likes: {
        Row: {
          user_id: string
          showcase_site_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          showcase_site_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          showcase_site_id?: string
          created_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          resource_type: string
          resource_count: number
          period_start: string
          period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_type: string
          resource_count?: number
          period_start: string
          period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_type?: string
          resource_count?: number
          period_start?: string
          period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      tier_limits: {
        Row: {
          tier: string
          max_websites: number
          max_custom_domains: number
          max_pageviews_per_month: number | null
          max_api_calls_per_month: number | null
          features: Json
        }
        Insert: {
          tier: string
          max_websites: number
          max_custom_domains: number
          max_pageviews_per_month?: number | null
          max_api_calls_per_month?: number | null
          features: Json
        }
        Update: {
          tier?: string
          max_websites?: number
          max_custom_domains?: number
          max_pageviews_per_month?: number | null
          max_api_calls_per_month?: number | null
          features?: Json
        }
      }
      experiments: {
        Row: {
          id: string
          name: string
          description: string | null
          variants: Json
          traffic_allocation: Json
          status: 'draft' | 'active' | 'paused' | 'completed'
          started_at: string | null
          ended_at: string | null
          winner: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          variants: Json
          traffic_allocation: Json
          status?: 'draft' | 'active' | 'paused' | 'completed'
          started_at?: string | null
          ended_at?: string | null
          winner?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          variants?: Json
          traffic_allocation?: Json
          status?: 'draft' | 'active' | 'paused' | 'completed'
          started_at?: string | null
          ended_at?: string | null
          winner?: string | null
          created_at?: string
        }
      }
      experiment_assignments: {
        Row: {
          user_id: string
          experiment_id: string
          variant: string
          assigned_at: string
        }
        Insert: {
          user_id: string
          experiment_id: string
          variant: string
          assigned_at?: string
        }
        Update: {
          user_id?: string
          experiment_id?: string
          variant?: string
          assigned_at?: string
        }
      }
    }
    Views: {
      top_websites: {
        Row: {
          id: string
          title: string
          description: string | null
          template: string
          deployment_url: string | null
          views: number
          unique_visitors: number
          username: string | null
          avatar_url: string | null
          subscription_tier: string
          likes: number
          showcase_views: number
        }
      }
    }
    Functions: {
      check_website_limit: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      calculate_viral_coefficient: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      increment_website_views: {
        Args: {
          website_id: string
        }
        Returns: void
      }
      increment_showcase_likes: {
        Args: {
          showcase_id: string
        }
        Returns: void
      }
      decrement_showcase_likes: {
        Args: {
          showcase_id: string
        }
        Returns: void
      }
      process_referral_reward: {
        Args: {
          referral_id: string
        }
        Returns: void
      }
      get_user_analytics_summary: {
        Args: {
          user_id: string
        }
        Returns: {
          total_views: number
          total_websites: number
          total_referrals: number
          conversion_rate: number
        }
      }
      refresh_top_websites: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'business' | 'enterprise'
      subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing'
      website_status: 'draft' | 'published' | 'archived'
      referral_status: 'pending' | 'activated' | 'converted' | 'expired'
      reward_type: 'months_free' | 'credits' | 'cash' | 'feature_unlock'
      reward_status: 'pending' | 'granted' | 'used' | 'expired'
      experiment_status: 'draft' | 'active' | 'paused' | 'completed'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience types
export type UserProfile = Tables<'user_profiles'>
export type Website = Tables<'websites'>
export type Referral = Tables<'referrals'>
export type ReferralReward = Tables<'referral_rewards'>
export type AnalyticsEvent = Tables<'analytics_events'>
export type WebsiteAnalytics = Tables<'website_analytics'>
export type ShowcaseSite = Tables<'showcase_sites'>
export type UserLike = Tables<'user_likes'>
export type UsageTracking = Tables<'usage_tracking'>
export type TierLimit = Tables<'tier_limits'>
export type Experiment = Tables<'experiments'>
export type ExperimentAssignment = Tables<'experiment_assignments'>

// Subscription tiers
export type SubscriptionTier = Enums<'subscription_tier'>
export type SubscriptionStatus = Enums<'subscription_status'>

// Extended types with relations
export interface WebsiteWithProfile extends Website {
  user_profile?: UserProfile
}

export interface ShowcaseSiteWithWebsite extends ShowcaseSite {
  website?: Website & {
    user_profile?: UserProfile
  }
}

export interface ReferralWithUsers extends Referral {
  referrer?: UserProfile
  referred_user?: UserProfile
}
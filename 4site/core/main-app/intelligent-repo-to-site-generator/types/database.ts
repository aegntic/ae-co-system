// Database types for enhanced viral mechanics

export interface ShowcaseSiteWithWebsite {
  id: string;
  website_id: string;
  user_id: string;
  featured: boolean;
  featured_order?: number;
  category: string;
  showcase_views: number;
  likes: number;
  viral_score_at_featuring: number;
  share_count_at_featuring: number;
  boost_level: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'viral';
  created_at: string;
  website?: {
    id: string;
    title: string;
    description?: string;
    deployment_url?: string;
    custom_domain?: string;
    viral_score: number;
    pageviews: number;
    likes: number;
    views?: number;
    user_profile?: {
      username?: string;
      avatar_url?: string;
      tier: 'free' | 'pro' | 'business' | 'enterprise';
    };
  };
}

export interface ViralMetrics {
  viral_score: number;
  total_shares: number;
  external_shares: number;
  viral_boost_level: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'viral';
  viral_coefficient: number;
  referrals_converted: number;
}

export interface CommissionEarning {
  id: string;
  user_id: string;
  referral_id: string;
  commission_amount: number;
  commission_rate: number;
  commission_tier: 'new' | 'established' | 'legacy';
  billing_period_start: string;
  billing_period_end: string;
  subscription_amount: number;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'disputed';
  referral_relationship_months: number;
  created_at: string;
}

export interface ShareEvent {
  id: string;
  website_id: string;
  user_id?: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'email' | 'copy_link' | 'reddit' | 'hackernews' | 'discord' | 'slack';
  share_url: string;
  viral_score_boost: number;
  conversion_tracked: boolean;
  click_through_count: number;
  created_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  repo_url: string;
  subdomain?: string;
  custom_domain?: string;
  generation_mode: 'quick' | 'deep' | 'custom';
  template: string;
  tier: string;
  site_data: any;
  status: 'draft' | 'building' | 'active' | 'featured' | 'viral' | 'suspended';
  deployment_url?: string;
  viral_score: number;
  share_count: number;
  external_share_count: number;
  viral_boost_multiplier: number;
  auto_featured: boolean;
  featured_at?: string;
  pageviews: number;
  unique_visitors: number;
  likes: number;
  comments: number;
  showcase_eligible: boolean;
  showcase_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  subscription_status: string;
  referral_code: string;
  referred_by?: string;
  viral_score: number;
  total_shares: number;
  external_shares: number;
  viral_boost_level: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'viral';
  viral_coefficient: number;
  lifetime_commission_earned: number;
  commission_tier: 'new' | 'established' | 'legacy';
  referrals_converted: number;
  free_pro_earned: boolean;
  total_websites_created: number;
  total_pageviews: number;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}
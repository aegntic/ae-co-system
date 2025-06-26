-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User tiers enum
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Website status enum
CREATE TYPE website_status AS ENUM ('active', 'building', 'error', 'suspended');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    tier user_tier DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
    referred_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Usage limits based on tier
    websites_limit INT DEFAULT 3,
    custom_domains_limit INT DEFAULT 0,
    monthly_pageviews_limit INT DEFAULT 10000,
    storage_limit_mb INT DEFAULT 100,
    
    -- Analytics
    total_websites_created INT DEFAULT 0,
    total_pageviews INT DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Websites table
CREATE TABLE public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    repo_url TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    custom_domain TEXT UNIQUE,
    
    -- Generation metadata
    generation_mode TEXT CHECK (generation_mode IN ('quick', 'deep')),
    template TEXT NOT NULL,
    tier TEXT NOT NULL,
    
    -- Site data
    site_data JSONB NOT NULL,
    visuals JSONB,
    customizations JSONB,
    mcp_config JSONB,
    
    -- Status and metrics
    status website_status DEFAULT 'building',
    build_error TEXT,
    last_build_at TIMESTAMPTZ,
    pageviews INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Indexing
    INDEX idx_user_websites (user_id),
    INDEX idx_subdomain (subdomain),
    INDEX idx_custom_domain (custom_domain),
    INDEX idx_status (status)
);

-- Referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    referred_user_id UUID REFERENCES public.users(id),
    status TEXT CHECK (status IN ('pending', 'completed', 'expired')) DEFAULT 'pending',
    reward_granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    INDEX idx_referrer (referrer_id),
    INDEX idx_referred_user (referred_user_id),
    UNIQUE(referrer_id, referred_email)
);

-- Analytics events table
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_user_events (user_id),
    INDEX idx_website_events (website_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- Usage tracking table
CREATE TABLE public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('website', 'pageview', 'storage', 'api_call')),
    amount INT NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_user_usage (user_id, created_at),
    INDEX idx_resource_type (resource_type)
);

-- Subscription history table
CREATE TABLE public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier user_tier NOT NULL,
    stripe_subscription_id TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    metadata JSONB,
    
    INDEX idx_user_subscriptions (user_id),
    INDEX idx_active_subscriptions (user_id, ended_at)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Websites policies
CREATE POLICY "Users can view own websites" ON public.websites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create websites" ON public.websites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites" ON public.websites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites" ON public.websites
    FOR DELETE USING (auth.uid() = user_id);

-- Public websites are viewable by all
CREATE POLICY "Public websites are viewable" ON public.websites
    FOR SELECT USING (status = 'active');

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Websites can track analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.websites 
            WHERE id = website_id AND status = 'active'
        )
    );

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Subscription history policies
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
    FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to update user tier and limits
CREATE OR REPLACE FUNCTION update_user_tier(
    p_user_id UUID,
    p_tier user_tier
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET 
        tier = p_tier,
        websites_limit = CASE p_tier
            WHEN 'free' THEN 3
            WHEN 'pro' THEN -1  -- unlimited
            WHEN 'business' THEN -1
            WHEN 'enterprise' THEN -1
        END,
        custom_domains_limit = CASE p_tier
            WHEN 'free' THEN 0
            WHEN 'pro' THEN -1
            WHEN 'business' THEN -1
            WHEN 'enterprise' THEN -1
        END,
        monthly_pageviews_limit = CASE p_tier
            WHEN 'free' THEN 10000
            WHEN 'pro' THEN 1000000
            WHEN 'business' THEN 10000000
            WHEN 'enterprise' THEN -1
        END,
        storage_limit_mb = CASE p_tier
            WHEN 'free' THEN 100
            WHEN 'pro' THEN 10240  -- 10GB
            WHEN 'business' THEN 102400  -- 100GB
            WHEN 'enterprise' THEN -1
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log subscription change
    INSERT INTO public.subscription_history (user_id, tier)
    VALUES (p_user_id, p_tier);
    
    -- End previous subscription
    UPDATE public.subscription_history
    SET ended_at = NOW()
    WHERE user_id = p_user_id 
        AND ended_at IS NULL 
        AND tier != p_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id UUID,
    p_resource_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user RECORD;
    v_usage INT;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    
    IF p_resource_type = 'website' THEN
        SELECT COUNT(*) INTO v_usage 
        FROM public.websites 
        WHERE user_id = p_user_id AND status != 'suspended';
        
        RETURN v_user.websites_limit = -1 OR v_usage < v_user.websites_limit;
        
    ELSIF p_resource_type = 'pageview' THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_usage
        FROM public.usage_tracking
        WHERE user_id = p_user_id 
            AND resource_type = 'pageview'
            AND created_at >= date_trunc('month', CURRENT_DATE);
            
        RETURN v_user.monthly_pageviews_limit = -1 OR v_usage < v_user.monthly_pageviews_limit;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral completion
CREATE OR REPLACE FUNCTION complete_referral(
    p_referral_code TEXT,
    p_new_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Get referrer ID
    SELECT id INTO v_referrer_id 
    FROM public.users 
    WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NOT NULL THEN
        -- Update new user's referred_by
        UPDATE public.users 
        SET referred_by = v_referrer_id 
        WHERE id = p_new_user_id;
        
        -- Update referral record
        UPDATE public.referrals
        SET 
            referred_user_id = p_new_user_id,
            status = 'completed',
            completed_at = NOW()
        WHERE referrer_id = v_referrer_id
            AND referred_user_id IS NULL
            AND status = 'pending';
            
        -- Grant rewards (3 months free = extend trial or add credits)
        -- This would integrate with your billing system
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX idx_websites_created_at ON public.websites(created_at DESC);
CREATE INDEX idx_analytics_events_composite ON public.analytics_events(website_id, created_at DESC);
CREATE INDEX idx_usage_tracking_composite ON public.usage_tracking(user_id, resource_type, created_at DESC);
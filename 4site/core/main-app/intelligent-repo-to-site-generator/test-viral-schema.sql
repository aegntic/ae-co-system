-- ================================================================================================
-- 4SITE.PRO VIRAL MECHANICS - TEST DATABASE SCHEMA
-- Simplified for PostgreSQL testing without Supabase dependencies
-- ================================================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================================================
-- ENUMS AND TYPES
-- ================================================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business', 'enterprise');
CREATE TYPE website_status AS ENUM ('draft', 'building', 'active', 'featured', 'viral', 'suspended');
CREATE TYPE commission_tier AS ENUM ('new', 'established', 'legacy');
CREATE TYPE share_platform AS ENUM ('twitter', 'linkedin', 'facebook', 'email', 'copy_link', 'reddit', 'hackernews', 'discord', 'slack');
CREATE TYPE referral_status AS ENUM ('pending', 'activated', 'converted', 'expired', 'churned');
CREATE TYPE viral_boost_level AS ENUM ('none', 'bronze', 'silver', 'gold', 'platinum', 'viral');

-- ================================================================================================
-- CORE TABLES
-- ================================================================================================

-- Create a simplified auth.users table for testing
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced users table with viral mechanics
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription and tier management
    tier subscription_tier DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    subscription_ends_at TIMESTAMPTZ,
    
    -- Enhanced referral system
    referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'base64')::TEXT,
    referred_by UUID REFERENCES public.users(id),
    
    -- Viral mechanics tracking
    viral_score DECIMAL(10,2) DEFAULT 0.0,
    total_shares INTEGER DEFAULT 0,
    external_shares INTEGER DEFAULT 0,
    viral_boost_level viral_boost_level DEFAULT 'none',
    viral_coefficient DECIMAL(5,3) DEFAULT 1.0,
    
    -- Commission tracking
    lifetime_commission_earned DECIMAL(10,2) DEFAULT 0.0,
    commission_tier commission_tier DEFAULT 'new',
    commission_tier_started_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Free Pro milestone tracking
    referrals_converted INTEGER DEFAULT 0,
    free_pro_earned BOOLEAN DEFAULT FALSE,
    
    -- Usage limits based on tier
    websites_limit INTEGER DEFAULT 3,
    total_websites_created INTEGER DEFAULT 0,
    total_pageviews BIGINT DEFAULT 0,
    engagement_score DECIMAL(10,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced websites table with viral mechanics
CREATE TABLE public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Basic website info
    title TEXT NOT NULL,
    description TEXT,
    repo_url TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    
    -- Generation and template info
    generation_mode TEXT DEFAULT 'quick',
    template TEXT NOT NULL,
    tier TEXT NOT NULL,
    
    -- Site data and customization
    site_data JSONB NOT NULL,
    
    -- Status and deployment
    status website_status DEFAULT 'draft',
    deployment_url TEXT,
    
    -- Enhanced viral mechanics
    viral_score DECIMAL(10,2) DEFAULT 0.0,
    share_count INTEGER DEFAULT 0,
    external_share_count INTEGER DEFAULT 0,
    viral_boost_multiplier DECIMAL(5,3) DEFAULT 1.0,
    auto_featured BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMPTZ,
    
    -- Analytics
    pageviews BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    
    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    
    -- Pro showcase eligibility
    showcase_eligible BOOLEAN DEFAULT FALSE,
    showcase_featured BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    referred_user_id UUID REFERENCES public.users(id),
    
    -- Referral tracking
    referral_code TEXT NOT NULL,
    status referral_status DEFAULT 'pending',
    source TEXT,
    
    -- Viral mechanics
    share_platform share_platform,
    conversion_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Commission tracking
    commission_rate DECIMAL(5,3),
    commission_tier commission_tier,
    conversion_value DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    
    UNIQUE(referrer_id, referred_email)
);

-- Commission earnings table
CREATE TABLE public.commission_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    
    -- Commission details
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,3) NOT NULL,
    commission_tier commission_tier NOT NULL,
    
    -- Billing information
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    subscription_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment tracking
    payment_status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    
    -- Relationship duration tracking
    referral_relationship_months INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share tracking table for viral mechanics
CREATE TABLE public.share_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Share details
    platform share_platform NOT NULL,
    share_url TEXT NOT NULL,
    
    -- Viral mechanics
    viral_score_boost DECIMAL(5,2) DEFAULT 1.0,
    conversion_tracked BOOLEAN DEFAULT FALSE,
    click_through_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro showcase entries
CREATE TABLE public.pro_showcase_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Showcase details
    featured BOOLEAN DEFAULT TRUE,
    featured_order INTEGER,
    category TEXT DEFAULT 'general',
    
    -- Metrics
    showcase_views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    -- Viral mechanics
    viral_score_at_featuring DECIMAL(10,2),
    share_count_at_featuring INTEGER,
    boost_level viral_boost_level DEFAULT 'bronze',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================================
-- VIRAL MECHANICS FUNCTIONS
-- ================================================================================================

-- Enhanced viral score calculation function
CREATE OR REPLACE FUNCTION calculate_viral_score(
    p_website_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_base_score DECIMAL(10,2) := 0.0;
    v_share_score DECIMAL(10,2) := 0.0;
    v_time_decay DECIMAL(5,3) := 1.0;
    v_tier_bonus DECIMAL(5,3) := 1.0;
    v_website RECORD;
    v_days_old INTEGER;
BEGIN
    -- Get website data
    SELECT w.*, u.tier
    INTO v_website
    FROM public.websites w
    JOIN public.users u ON w.user_id = u.id
    WHERE w.id = p_website_id;
    
    IF NOT FOUND THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate days since creation
    v_days_old := EXTRACT(DAYS FROM NOW() - v_website.created_at);
    
    -- Base score from pageviews and engagement
    v_base_score := (v_website.pageviews * 0.1) + (v_website.likes * 2.0) + (v_website.comments * 3.0);
    
    -- Share score with platform weights
    SELECT COALESCE(SUM(
        CASE st.platform
            WHEN 'twitter' THEN 5.0
            WHEN 'linkedin' THEN 4.0
            WHEN 'reddit' THEN 6.0
            WHEN 'hackernews' THEN 8.0
            WHEN 'facebook' THEN 3.0
            WHEN 'email' THEN 4.0
            ELSE 2.0
        END * st.viral_score_boost
    ), 0.0)
    INTO v_share_score
    FROM public.share_tracking st
    WHERE st.website_id = p_website_id;
    
    -- Time decay factor (newer content gets boost)
    IF v_days_old <= 7 THEN
        v_time_decay := 1.2;
    ELSIF v_days_old <= 30 THEN
        v_time_decay := 1.0;
    ELSIF v_days_old <= 90 THEN
        v_time_decay := 0.8;
    ELSE
        v_time_decay := 0.6;
    END IF;
    
    -- Tier bonus
    v_tier_bonus := CASE v_website.tier
        WHEN 'pro' THEN 1.3
        WHEN 'business' THEN 1.5
        WHEN 'enterprise' THEN 1.8
        ELSE 1.0
    END;
    
    -- Calculate final viral score
    RETURN ROUND(
        (v_base_score + v_share_score) * v_time_decay * v_tier_bonus,
        2
    );
END;
$$ LANGUAGE plpgsql;

-- Commission calculation function with tier progression
CREATE OR REPLACE FUNCTION calculate_commission_rate(
    p_relationship_months INTEGER
)
RETURNS DECIMAL(5,3) AS $$
BEGIN
    -- Determine tier and rate based on relationship duration
    IF p_relationship_months <= 12 THEN
        RETURN 0.200; -- 20%
    ELSIF p_relationship_months <= 48 THEN
        RETURN 0.250; -- 25%
    ELSE
        RETURN 0.400; -- 40%
    END IF;
END;
$$ LANGUAGE plpgsql;

-- External share tracking function
CREATE OR REPLACE FUNCTION track_external_share(
    p_website_id UUID,
    p_platform TEXT,
    p_share_url TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_viral_boost DECIMAL(5,2);
BEGIN
    -- Calculate viral boost based on platform
    v_viral_boost := CASE p_platform
        WHEN 'twitter' THEN 1.5
        WHEN 'linkedin' THEN 1.3
        WHEN 'reddit' THEN 2.0
        WHEN 'hackernews' THEN 2.5
        WHEN 'facebook' THEN 1.2
        WHEN 'email' THEN 1.4
        ELSE 1.0
    END;
    
    -- Insert share tracking record
    INSERT INTO public.share_tracking (
        website_id,
        user_id,
        platform,
        share_url,
        viral_score_boost
    )
    VALUES (
        p_website_id,
        p_user_id,
        p_platform::share_platform,
        p_share_url,
        v_viral_boost
    );
    
    -- Update website share counts
    UPDATE public.websites
    SET 
        external_share_count = external_share_count + 1,
        viral_score = calculate_viral_score(p_website_id),
        updated_at = NOW()
    WHERE id = p_website_id;
    
    -- Update user viral metrics if user provided
    IF p_user_id IS NOT NULL THEN
        UPDATE public.users
        SET 
            external_shares = external_shares + 1,
            viral_score = viral_score + v_viral_boost,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
    
    -- Check for auto-featuring trigger (5 shares)
    UPDATE public.websites
    SET 
        auto_featured = TRUE,
        featured_at = NOW(),
        status = CASE 
            WHEN status = 'active' THEN 'featured'
            ELSE status
        END
    WHERE id = p_website_id 
    AND external_share_count >= 5 
    AND auto_featured = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- PERFORMANCE INDEXES
-- ================================================================================================

-- Core indexes for viral mechanics
CREATE INDEX idx_users_viral_score ON public.users(viral_score DESC);
CREATE INDEX idx_websites_viral_score ON public.websites(viral_score DESC);
CREATE INDEX idx_websites_external_shares ON public.websites(external_share_count DESC);
CREATE INDEX idx_share_tracking_website_platform ON public.share_tracking(website_id, platform);
CREATE INDEX idx_pro_showcase_viral_score ON public.pro_showcase_entries(viral_score_at_featuring DESC);

-- ================================================================================================
-- TEST DATA INSERTION
-- ================================================================================================

-- Insert test auth user
INSERT INTO auth.users (id, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'test@4site.pro');

-- Insert test user with viral metrics
INSERT INTO public.users (
    id, email, username, tier, viral_score, external_shares, viral_boost_level
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test@4site.pro',
    'viral_test_user',
    'pro',
    150.0,
    25,
    'gold'
);

-- Insert test website
INSERT INTO public.websites (
    id, user_id, title, description, repo_url, template, tier, site_data, 
    status, viral_score, external_share_count, pageviews, likes
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Viral Test Project',
    'A test project for viral mechanics validation',
    'https://github.com/test/viral-project',
    'tech',
    'pro',
    '{"framework": "React"}',
    'featured',
    125.5,
    8,
    1000,
    25
);

-- Insert test shares
INSERT INTO public.share_tracking (website_id, platform, share_url, viral_score_boost) VALUES
('22222222-2222-2222-2222-222222222222', 'twitter', 'https://twitter.com/share', 1.5),
('22222222-2222-2222-2222-222222222222', 'linkedin', 'https://linkedin.com/share', 1.3),
('22222222-2222-2222-2222-222222222222', 'reddit', 'https://reddit.com/share', 2.0),
('22222222-2222-2222-2222-222222222222', 'hackernews', 'https://news.ycombinator.com/share', 2.5);

-- Insert pro showcase entry
INSERT INTO public.pro_showcase_entries (
    website_id, user_id, viral_score_at_featuring, share_count_at_featuring
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    125.5,
    8
);

-- ================================================================================================
-- VALIDATION SUMMARY
-- ================================================================================================

SELECT 'Enhanced Viral Mechanics Schema Deployed Successfully!' as status;
SELECT 'Tables created: ' || COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Functions created: ' || COUNT(*) as function_count FROM information_schema.routines WHERE routine_schema = 'public';
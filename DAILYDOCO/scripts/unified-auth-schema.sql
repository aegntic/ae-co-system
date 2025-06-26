-- Unified Authentication System for 4site.pro ↔ DailyDoco Pro Integration
-- This schema supports seamless user experience across both platforms

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Unified Users Table (extends Supabase auth.users)
CREATE TABLE unified_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business', 'enterprise')),
    
    -- Platform Access Control
    platform_access JSONB DEFAULT '{
        "foursitepro": false,
        "dailydoco": false,
        "aegnt27": false
    }'::jsonb NOT NULL,
    
    -- Referral System
    referral_code VARCHAR(10) UNIQUE,
    referred_by UUID REFERENCES unified_users(id),
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_foursitepro TIMESTAMP WITH TIME ZONE,
    last_seen_dailydoco TIMESTAMP WITH TIME ZONE,
    
    -- Platform-specific metadata
    foursitepro_data JSONB DEFAULT '{}'::jsonb,
    dailydoco_data JSONB DEFAULT '{}'::jsonb,
    
    -- Subscription and billing
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
    subscription_period_start TIMESTAMP WITH TIME ZONE,
    subscription_period_end TIMESTAMP WITH TIME ZONE
);

-- Cross-Platform Projects Table
CREATE TABLE cross_platform_projects (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    platform_origin VARCHAR(20) NOT NULL CHECK (platform_origin IN ('foursitepro', 'dailydoco')),
    project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('website', 'documentation', 'tutorial')),
    
    -- Project Metadata
    metadata JSONB NOT NULL DEFAULT '{
        "title": "",
        "description": "",
        "tags": [],
        "tech_stack": [],
        "github_repo": null,
        "domain": null,
        "deployment_url": null
    }'::jsonb,
    
    -- Integration Status
    integration_status JSONB DEFAULT '{
        "has_tutorial": false,
        "has_documentation": false,
        "cross_platform_shared": true
    }'::jsonb,
    
    -- URLs and Resources
    foursitepro_url TEXT,
    dailydoco_tutorial_id VARCHAR(255),
    youtube_video_id VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial Generation Requests Table
CREATE TABLE tutorial_generation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    project_id VARCHAR(50) REFERENCES cross_platform_projects(id),
    website_url TEXT NOT NULL,
    
    -- Project metadata for tutorial generation
    project_metadata JSONB NOT NULL DEFAULT '{
        "title": "",
        "description": "",
        "tech_stack": [],
        "features": [],
        "github_repo": null
    }'::jsonb,
    
    -- Tutorial preferences
    tutorial_preferences JSONB NOT NULL DEFAULT '{
        "length": "medium",
        "complexity": "intermediate",
        "include_code_walkthrough": true,
        "include_deployment": true,
        "narration_style": "technical"
    }'::jsonb,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Generated content
    tutorial_video_url TEXT,
    tutorial_youtube_id VARCHAR(50),
    tutorial_metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion Events Table (for flywheel analytics)
CREATE TABLE conversion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('signup', 'upgrade', 'cross_platform_action', 'tutorial_generated', 'website_created')),
    source_platform VARCHAR(20) NOT NULL CHECK (source_platform IN ('foursitepro', 'dailydoco')),
    target_platform VARCHAR(20) CHECK (target_platform IN ('foursitepro', 'dailydoco')),
    
    -- Event metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Attribution
    referral_source VARCHAR(255),
    campaign_id VARCHAR(255),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Analytics dimensions
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT
);

-- Cross-Platform Sessions Table (for seamless SSO)
CREATE TABLE cross_platform_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    
    -- Session metadata
    platform_origin VARCHAR(20) NOT NULL CHECK (platform_origin IN ('foursitepro', 'dailydoco')),
    allowed_platforms TEXT[] DEFAULT ARRAY['foursitepro', 'dailydoco'],
    
    -- Security
    ip_address INET,
    user_agent TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active session per user per platform
    UNIQUE(user_id, platform_origin)
);

-- Viral Sharing Tracking Table
CREATE TABLE viral_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    project_id VARCHAR(50) REFERENCES cross_platform_projects(id),
    tutorial_request_id UUID REFERENCES tutorial_generation_requests(id),
    
    -- Share details
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('direct_link', 'social_media', 'embed', 'email')),
    platform VARCHAR(30) NOT NULL, -- 'twitter', 'linkedin', 'reddit', etc.
    share_url TEXT NOT NULL,
    
    -- Tracking
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_clicked_at TIMESTAMP WITH TIME ZONE
);

-- A/B Testing Framework
CREATE TABLE ab_test_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    variant_config JSONB NOT NULL,
    
    -- Test parameters
    traffic_percentage DECIMAL(5,2) DEFAULT 50.0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(test_name, variant_name)
);

CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    test_name VARCHAR(100) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    
    -- Tracking
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_interaction_at TIMESTAMP WITH TIME ZONE,
    conversion_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, test_name)
);

-- Platform Usage Analytics
CREATE TABLE platform_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES unified_users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('foursitepro', 'dailydoco')),
    
    -- Usage metrics
    session_duration INTEGER, -- seconds
    pages_visited INTEGER DEFAULT 1,
    actions_taken INTEGER DEFAULT 0,
    
    -- Feature usage
    features_used TEXT[],
    conversion_events INTEGER DEFAULT 0,
    
    -- Session info
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    
    date DATE DEFAULT CURRENT_DATE
);

-- Indexes for performance
CREATE INDEX idx_unified_users_email ON unified_users(email);
CREATE INDEX idx_unified_users_referral_code ON unified_users(referral_code);
CREATE INDEX idx_unified_users_subscription_tier ON unified_users(subscription_tier);

CREATE INDEX idx_cross_platform_projects_user_id ON cross_platform_projects(user_id);
CREATE INDEX idx_cross_platform_projects_platform_origin ON cross_platform_projects(platform_origin);
CREATE INDEX idx_cross_platform_projects_created_at ON cross_platform_projects(created_at);

CREATE INDEX idx_tutorial_requests_user_id ON tutorial_generation_requests(user_id);
CREATE INDEX idx_tutorial_requests_status ON tutorial_generation_requests(status);
CREATE INDEX idx_tutorial_requests_created_at ON tutorial_generation_requests(created_at);

CREATE INDEX idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX idx_conversion_events_type ON conversion_events(event_type);
CREATE INDEX idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX idx_conversion_events_platform ON conversion_events(source_platform, target_platform);

CREATE INDEX idx_sessions_user_id ON cross_platform_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON cross_platform_sessions(expires_at);
CREATE INDEX idx_sessions_access_token ON cross_platform_sessions(access_token_hash);

CREATE INDEX idx_viral_shares_user_id ON viral_shares(user_id);
CREATE INDEX idx_viral_shares_project_id ON viral_shares(project_id);
CREATE INDEX idx_viral_shares_created_at ON viral_shares(created_at);

CREATE INDEX idx_platform_analytics_user_id ON platform_usage_analytics(user_id);
CREATE INDEX idx_platform_analytics_platform ON platform_usage_analytics(platform);
CREATE INDEX idx_platform_analytics_date ON platform_usage_analytics(date);

-- Row Level Security (RLS) Policies
ALTER TABLE unified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_select_own ON unified_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON unified_users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY projects_user_access ON cross_platform_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY tutorial_requests_user_access ON tutorial_generation_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversion_events_user_access ON conversion_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sessions_user_access ON cross_platform_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY viral_shares_user_access ON viral_shares FOR ALL USING (auth.uid() = user_id);
CREATE POLICY analytics_user_access ON platform_usage_analytics FOR ALL USING (auth.uid() = user_id);

-- Functions for analytics and metrics calculation
CREATE OR REPLACE FUNCTION calculate_flywheel_metrics(
    input_user_id UUID,
    timeframe_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    metrics JSONB;
    websites_created INTEGER;
    tutorials_generated INTEGER;
    tutorial_views INTEGER;
    viral_coefficient DECIMAL;
BEGIN
    -- Calculate basic metrics
    SELECT COUNT(*) INTO websites_created
    FROM conversion_events
    WHERE user_id = input_user_id
    AND event_type = 'website_created'
    AND timestamp >= NOW() - INTERVAL '1 day' * timeframe_days;
    
    SELECT COUNT(*) INTO tutorials_generated
    FROM conversion_events
    WHERE user_id = input_user_id
    AND event_type = 'tutorial_generated'
    AND timestamp >= NOW() - INTERVAL '1 day' * timeframe_days;
    
    -- Calculate viral coefficient (simplified)
    SELECT COALESCE(AVG(clicks::DECIMAL / NULLIF(conversions, 0)), 0) INTO viral_coefficient
    FROM viral_shares
    WHERE user_id = input_user_id
    AND created_at >= NOW() - INTERVAL '1 day' * timeframe_days;
    
    -- Build metrics JSON
    metrics = jsonb_build_object(
        'websites_created', websites_created,
        'tutorials_generated', tutorials_generated,
        'tutorial_conversion_rate', CASE WHEN websites_created > 0 THEN tutorials_generated::DECIMAL / websites_created ELSE 0 END,
        'viral_coefficient', COALESCE(viral_coefficient, 0),
        'timeframe_days', timeframe_days,
        'calculated_at', NOW()
    );
    
    RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code = UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
    BEFORE INSERT ON unified_users
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON cross_platform_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tutorial_requests_updated_at
    BEFORE UPDATE ON tutorial_generation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Initial data for A/B testing
INSERT INTO ab_test_variants (test_name, variant_name, variant_config) VALUES
('tutorial_cta', 'control', '{"button_text": "Create Tutorial", "button_color": "#6366f1"}'),
('tutorial_cta', 'variant_a', '{"button_text": "Generate Video Tutorial", "button_color": "#f59e0b"}'),
('tutorial_cta', 'variant_b', '{"button_text": "Turn into Tutorial", "button_color": "#10b981"}');

-- Views for analytics dashboards
CREATE VIEW user_flywheel_summary AS
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    u.created_at,
    COALESCE(p.project_count, 0) as total_projects,
    COALESCE(t.tutorial_count, 0) as total_tutorials,
    COALESCE(s.total_shares, 0) as total_shares,
    calculate_flywheel_metrics(u.id, 30) as metrics_30d
FROM unified_users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as project_count
    FROM cross_platform_projects
    GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as tutorial_count
    FROM tutorial_generation_requests
    WHERE status = 'completed'
    GROUP BY user_id
) t ON u.id = t.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_shares
    FROM viral_shares
    GROUP BY user_id
) s ON u.id = s.user_id;

COMMENT ON TABLE unified_users IS 'Central user table supporting cross-platform authentication and user management';
COMMENT ON TABLE cross_platform_projects IS 'Projects shared between 4site.pro and DailyDoco Pro platforms';
COMMENT ON TABLE tutorial_generation_requests IS 'Automated tutorial generation pipeline requests';
COMMENT ON TABLE conversion_events IS 'Flywheel analytics and conversion tracking';
COMMENT ON TABLE cross_platform_sessions IS 'SSO session management across platforms';
COMMENT ON TABLE viral_shares IS 'Viral sharing and growth tracking';
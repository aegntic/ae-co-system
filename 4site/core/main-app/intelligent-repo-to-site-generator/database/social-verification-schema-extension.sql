-- Social Verification Schema Extension for 4site.pro
-- Extends the existing lead capture schema with aegntic-first social platform verification
-- This enables users to verify their social platforms through aegntic as the primary hub

-- Create social verification sessions table
CREATE TABLE IF NOT EXISTS social_verification_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    platforms TEXT[] NOT NULL, -- Array of platform names to verify
    return_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, expired, failed
    verification_urls JSONB, -- Platform-specific verification URLs
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create user social connections table (extends existing schema)
CREATE TABLE IF NOT EXISTS user_social_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- github, linkedin, twitter, discord, telegram
    platform_user_id VARCHAR(255), -- Platform-specific user ID
    platform_username VARCHAR(255), -- Platform username/handle
    platform_profile_url TEXT, -- URL to user's profile on the platform
    verification_data JSONB DEFAULT '{}', -- Platform-specific verification data
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_source VARCHAR(50) DEFAULT 'aegntic', -- aegntic, direct, oauth
    verification_score INTEGER DEFAULT 0, -- Quality score of verification
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one verification per user per platform
    UNIQUE(user_email, platform)
);

-- Create platform verification analytics table
CREATE TABLE IF NOT EXISTS platform_verification_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    verification_attempt_id UUID,
    event_type VARCHAR(50) NOT NULL, -- started, completed, failed, expired
    event_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    session_duration INTEGER, -- Duration in seconds
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create aegntic integration logs table
CREATE TABLE IF NOT EXISTS aegntic_integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL, -- verification_start, verification_complete, api_call, webhook, error
    user_email VARCHAR(255),
    platform VARCHAR(50),
    session_id VARCHAR(255),
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    status_code INTEGER,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification benefits table (what users get for verifying platforms)
CREATE TABLE IF NOT EXISTS verification_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    benefit_type VARCHAR(100) NOT NULL, -- profile_boost, showcase_priority, analytics_access, etc.
    benefit_description TEXT NOT NULL,
    points_value INTEGER DEFAULT 0, -- Points awarded for this benefit
    tier_required VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default verification benefits
INSERT INTO verification_benefits (platform, benefit_type, benefit_description, points_value, tier_required) VALUES
-- GitHub benefits
('github', 'developer_credibility', 'Enhanced developer credibility score', 25, 'free'),
('github', 'repository_showcase', 'Automatic repository integration and showcasing', 15, 'free'),
('github', 'code_analysis', 'AI-powered code quality analysis', 10, 'pro'),
('github', 'commit_insights', 'Advanced commit and contribution insights', 5, 'pro'),

-- LinkedIn benefits
('linkedin', 'professional_network', 'Professional network verification and trust', 20, 'free'),
('linkedin', 'career_opportunities', 'Access to career opportunity notifications', 15, 'free'),
('linkedin', 'business_connections', 'Enhanced business networking features', 10, 'pro'),
('linkedin', 'industry_insights', 'Industry-specific analytics and insights', 5, 'pro'),

-- Twitter/X benefits
('twitter', 'thought_leadership', 'Thought leadership score and tracking', 15, 'free'),
('twitter', 'community_engagement', 'Tech community engagement metrics', 10, 'free'),
('twitter', 'viral_potential', 'AI-powered viral content recommendations', 15, 'pro'),
('twitter', 'influence_tracking', 'Influence and reach analytics', 5, 'pro'),

-- Discord benefits
('discord', 'community_presence', 'Developer community presence verification', 10, 'free'),
('discord', 'project_collaboration', 'Enhanced project collaboration features', 10, 'free'),
('discord', 'server_integration', 'Custom Discord server integrations', 15, 'pro'),
('discord', 'community_analytics', 'Community engagement analytics', 5, 'pro'),

-- Telegram benefits
('telegram', 'secure_notifications', 'Secure project update notifications', 10, 'free'),
('telegram', 'bot_integration', 'Custom Telegram bot integrations', 15, 'pro'),
('telegram', 'channel_management', 'Automated channel content management', 10, 'pro'),
('telegram', 'crypto_community', 'Crypto and Web3 community verification', 5, 'enterprise');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_verification_sessions_email 
    ON social_verification_sessions(user_email);

CREATE INDEX IF NOT EXISTS idx_social_verification_sessions_status 
    ON social_verification_sessions(status);

CREATE INDEX IF NOT EXISTS idx_social_verification_sessions_expires 
    ON social_verification_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_social_connections_email 
    ON user_social_connections(user_email);

CREATE INDEX IF NOT EXISTS idx_user_social_connections_platform 
    ON user_social_connections(platform);

CREATE INDEX IF NOT EXISTS idx_user_social_connections_verified 
    ON user_social_connections(verified);

CREATE INDEX IF NOT EXISTS idx_platform_verification_analytics_email 
    ON platform_verification_analytics(user_email);

CREATE INDEX IF NOT EXISTS idx_platform_verification_analytics_platform 
    ON platform_verification_analytics(platform);

CREATE INDEX IF NOT EXISTS idx_platform_verification_analytics_event 
    ON platform_verification_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_aegntic_integration_logs_type 
    ON aegntic_integration_logs(log_type);

CREATE INDEX IF NOT EXISTS idx_aegntic_integration_logs_email 
    ON aegntic_integration_logs(user_email);

-- Create function to calculate user verification score
CREATE OR REPLACE FUNCTION calculate_user_verification_score(user_email_param VARCHAR)
RETURNS TABLE (
    total_score INTEGER,
    platform_count INTEGER,
    verified_platforms TEXT[],
    score_breakdown JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    platform_weights JSONB := '{
        "github": 25,
        "linkedin": 20,
        "twitter": 15,
        "discord": 10,
        "telegram": 10
    }';
    bonus_score INTEGER := 0;
    platform_scores JSONB := '{}';
    platforms_array TEXT[];
    score INTEGER := 0;
    platform_count_val INTEGER;
BEGIN
    -- Get verified platforms and calculate base score
    SELECT 
        COALESCE(SUM((platform_weights->platform)::INTEGER), 0),
        COUNT(*),
        ARRAY_AGG(platform)
    INTO score, platform_count_val, platforms_array
    FROM user_social_connections 
    WHERE user_email = user_email_param AND verified = true;
    
    -- Calculate platform-specific scores for breakdown
    SELECT jsonb_object_agg(
        platform, 
        (platform_weights->platform)::INTEGER
    ) INTO platform_scores
    FROM user_social_connections 
    WHERE user_email = user_email_param AND verified = true;
    
    -- Apply bonuses
    IF platform_count_val >= 3 THEN
        bonus_score := bonus_score + 10;
    END IF;
    
    IF platform_count_val >= 5 THEN
        bonus_score := bonus_score + 5;
    END IF;
    
    -- Add bonus to total score
    score := LEAST(score + bonus_score, 100); -- Cap at 100
    
    -- Return results
    RETURN QUERY SELECT 
        score,
        platform_count_val,
        COALESCE(platforms_array, ARRAY[]::TEXT[]),
        jsonb_build_object(
            'platform_scores', COALESCE(platform_scores, '{}'::JSONB),
            'bonus_score', bonus_score,
            'total_before_cap', score + bonus_score,
            'capped_at_100', (score + bonus_score) > 100
        );
END;
$$;

-- Create function to get platform verification benefits for a user
CREATE OR REPLACE FUNCTION get_user_verification_benefits(user_email_param VARCHAR)
RETURNS TABLE (
    platform VARCHAR,
    benefits JSONB,
    total_points INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usc.platform,
        jsonb_agg(
            jsonb_build_object(
                'benefit_type', vb.benefit_type,
                'description', vb.benefit_description,
                'points', vb.points_value,
                'tier_required', vb.tier_required
            )
        ) as benefits,
        SUM(vb.points_value)::INTEGER as total_points
    FROM user_social_connections usc
    JOIN verification_benefits vb ON usc.platform = vb.platform
    WHERE usc.user_email = user_email_param 
        AND usc.verified = true 
        AND vb.active = true
    GROUP BY usc.platform;
END;
$$;

-- Create function to clean up expired verification sessions
CREATE OR REPLACE FUNCTION cleanup_expired_verification_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM social_verification_sessions 
    WHERE expires_at < NOW() AND status = 'pending';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO aegntic_integration_logs (
        log_type, 
        request_data, 
        status_code
    ) VALUES (
        'cleanup_expired_sessions',
        jsonb_build_object('deleted_sessions', deleted_count),
        200
    );
    
    RETURN deleted_count;
END;
$$;

-- Create function to update verification session status
CREATE OR REPLACE FUNCTION update_verification_session_status(
    session_id_param VARCHAR,
    new_status VARCHAR,
    verification_data_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    session_exists BOOLEAN;
BEGIN
    -- Check if session exists
    SELECT EXISTS(
        SELECT 1 FROM social_verification_sessions 
        WHERE session_id = session_id_param
    ) INTO session_exists;
    
    IF NOT session_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update session
    UPDATE social_verification_sessions 
    SET 
        status = new_status,
        updated_at = NOW(),
        metadata = CASE 
            WHEN verification_data_param IS NOT NULL 
            THEN metadata || verification_data_param
            ELSE metadata 
        END
    WHERE session_id = session_id_param;
    
    RETURN TRUE;
END;
$$;

-- Create RLS (Row Level Security) policies
ALTER TABLE social_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_verification_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own verification sessions
CREATE POLICY user_verification_sessions_policy ON social_verification_sessions
    FOR ALL USING (auth.email() = user_email);

-- Policy: Users can only access their own social connections
CREATE POLICY user_social_connections_policy ON user_social_connections
    FOR ALL USING (auth.email() = user_email);

-- Policy: Users can only access their own analytics
CREATE POLICY user_verification_analytics_policy ON platform_verification_analytics
    FOR ALL USING (auth.email() = user_email);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_verification_sessions_updated_at 
    BEFORE UPDATE ON social_verification_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_social_connections_updated_at 
    BEFORE UPDATE ON user_social_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE social_verification_sessions IS 'Tracks social platform verification sessions initiated through aegntic';
COMMENT ON TABLE user_social_connections IS 'Stores verified social platform connections for users';
COMMENT ON TABLE platform_verification_analytics IS 'Analytics data for social platform verification attempts';
COMMENT ON TABLE aegntic_integration_logs IS 'Logs all interactions with aegntic API for debugging and monitoring';
COMMENT ON TABLE verification_benefits IS 'Defines benefits users receive for verifying each platform';

COMMENT ON FUNCTION calculate_user_verification_score IS 'Calculates weighted verification score based on verified platforms';
COMMENT ON FUNCTION get_user_verification_benefits IS 'Returns all verification benefits for a user based on their verified platforms';
COMMENT ON FUNCTION cleanup_expired_verification_sessions IS 'Removes expired verification sessions to keep database clean';
COMMENT ON FUNCTION update_verification_session_status IS 'Updates verification session status with optional metadata';

-- Grant necessary permissions (adjust based on your authentication setup)
-- GRANT ALL ON social_verification_sessions TO authenticated;
-- GRANT ALL ON user_social_connections TO authenticated;
-- GRANT ALL ON platform_verification_analytics TO authenticated;
-- GRANT SELECT ON verification_benefits TO authenticated;

-- Example queries for testing:
/*
-- Check user's verification score
SELECT * FROM calculate_user_verification_score('user@example.com');

-- Get user's verification benefits
SELECT * FROM get_user_verification_benefits('user@example.com');

-- Clean up expired sessions
SELECT cleanup_expired_verification_sessions();

-- Update session status
SELECT update_verification_session_status('session_123', 'completed', '{"platform": "github", "verified": true}');
*/
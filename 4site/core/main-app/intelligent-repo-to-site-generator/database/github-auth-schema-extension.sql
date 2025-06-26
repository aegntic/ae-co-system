-- GitHub Authentication and Site Generation Schema Extension for 4site.pro
-- Supports GitHub-only authentication with repository forking and automatic deployment

-- Create GitHub users table
CREATE TABLE IF NOT EXISTS github_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name TEXT,
    avatar_url TEXT,
    html_url TEXT,
    public_repos INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    github_created_at TIMESTAMP WITH TIME ZONE,
    access_token TEXT, -- Store encrypted in production
    token_scope TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES github_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated sites table
CREATE TABLE IF NOT EXISTS generated_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES github_users(id) ON DELETE CASCADE,
    site_name VARCHAR(255) NOT NULL,
    repository_url TEXT,
    repository_id BIGINT,
    source_readme_url TEXT,
    template_used VARCHAR(100),
    deployment_url TEXT,
    deployment_status VARCHAR(50) DEFAULT 'pending', -- pending, deploying, active, failed, paused
    auto_update BOOLEAN DEFAULT true,
    analytics_enabled BOOLEAN DEFAULT true,
    lead_capture_enabled BOOLEAN DEFAULT true,
    site_config JSONB DEFAULT '{}',
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_deployed TIMESTAMP WITH TIME ZONE
);

-- Create repository deployments table
CREATE TABLE IF NOT EXISTS repository_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id BIGINT NOT NULL,
    repository_name VARCHAR(255) NOT NULL,
    owner_github_id BIGINT NOT NULL,
    owner_username VARCHAR(255) NOT NULL,
    deployment_status VARCHAR(50) DEFAULT 'active', -- active, paused, error
    auto_deploy BOOLEAN DEFAULT true,
    deployment_url TEXT,
    last_deployment TIMESTAMP WITH TIME ZONE,
    webhook_id BIGINT, -- GitHub webhook ID
    deployment_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(repository_id, owner_github_id)
);

-- Create site regeneration logs table
CREATE TABLE IF NOT EXISTS site_regeneration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES generated_sites(id) ON DELETE CASCADE,
    repository_id BIGINT,
    repository_name VARCHAR(255),
    trigger_type VARCHAR(50) NOT NULL, -- push, manual, scheduled, webhook
    trigger_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    processing_time_ms INTEGER,
    artifacts JSONB DEFAULT '{}', -- Generated files, deployment info, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create pull request previews table
CREATE TABLE IF NOT EXISTS pull_request_previews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id BIGINT NOT NULL,
    pull_request_number INTEGER NOT NULL,
    head_sha VARCHAR(255) NOT NULL,
    base_sha VARCHAR(255),
    preview_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, generating, ready, failed, expired
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    preview_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(repository_id, pull_request_number)
);

-- Create GitHub webhook events table
CREATE TABLE IF NOT EXISTS github_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- push, pull_request, repository, etc.
    repository_id BIGINT,
    repository_name VARCHAR(255),
    sender_id BIGINT,
    sender_username VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_result JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create site analytics summaries table (optimized for dashboard queries)
CREATE TABLE IF NOT EXISTS site_analytics_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES generated_sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    total_visitors INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    total_leads INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    average_time_on_site INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    top_referrers JSONB DEFAULT '{}',
    device_breakdown JSONB DEFAULT '{}',
    geo_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(site_id, date, period_type)
);

-- Create repository fork tracking table
CREATE TABLE IF NOT EXISTS repository_forks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_repository_id BIGINT NOT NULL,
    original_repository_name VARCHAR(255) NOT NULL,
    forked_repository_id BIGINT NOT NULL,
    forked_repository_name VARCHAR(255) NOT NULL,
    fork_owner_id BIGINT NOT NULL,
    fork_owner_username VARCHAR(255) NOT NULL,
    site_id UUID REFERENCES generated_sites(id) ON DELETE CASCADE,
    fork_purpose VARCHAR(100) DEFAULT '4site_generation', -- 4site_generation, manual_fork
    setup_completed BOOLEAN DEFAULT false,
    config_files_added BOOLEAN DEFAULT false,
    github_pages_enabled BOOLEAN DEFAULT false,
    webhook_configured BOOLEAN DEFAULT false,
    first_deployment TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_github_users_github_id ON github_users(github_id);
CREATE INDEX IF NOT EXISTS idx_github_users_username ON github_users(username);
CREATE INDEX IF NOT EXISTS idx_github_users_email ON github_users(email);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_generated_sites_user_id ON generated_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_sites_site_id ON generated_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_generated_sites_status ON generated_sites(deployment_status);

CREATE INDEX IF NOT EXISTS idx_repository_deployments_repo_id ON repository_deployments(repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_deployments_owner_id ON repository_deployments(owner_github_id);

CREATE INDEX IF NOT EXISTS idx_site_regeneration_logs_site_id ON site_regeneration_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_site_regeneration_logs_repo_id ON site_regeneration_logs(repository_id);
CREATE INDEX IF NOT EXISTS idx_site_regeneration_logs_status ON site_regeneration_logs(status);

CREATE INDEX IF NOT EXISTS idx_pull_request_previews_repo_id ON pull_request_previews(repository_id);
CREATE INDEX IF NOT EXISTS idx_pull_request_previews_status ON pull_request_previews(status);

CREATE INDEX IF NOT EXISTS idx_github_webhook_events_repo_id ON github_webhook_events(repository_id);
CREATE INDEX IF NOT EXISTS idx_github_webhook_events_processed ON github_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_github_webhook_events_type ON github_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_site_analytics_summaries_site_date ON site_analytics_summaries(site_id, date);
CREATE INDEX IF NOT EXISTS idx_site_analytics_summaries_period ON site_analytics_summaries(period_type, date);

CREATE INDEX IF NOT EXISTS idx_repository_forks_original_repo ON repository_forks(original_repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_forks_forked_repo ON repository_forks(forked_repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_forks_owner ON repository_forks(fork_owner_id);

-- Create function to generate site ID
CREATE OR REPLACE FUNCTION generate_site_id(user_login VARCHAR, repo_name VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN LOWER(user_login || '-' || REPLACE(repo_name, ' ', '-') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT);
END;
$$;

-- Create function to update analytics summaries
CREATE OR REPLACE FUNCTION update_site_analytics_summary(
    site_uuid UUID,
    summary_date DATE,
    summary_period VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
    visitor_count INTEGER;
    unique_visitor_count INTEGER;
    lead_count INTEGER;
    avg_time INTEGER;
    bounce_rate_calc DECIMAL(5,2);
    conversion_rate_calc DECIMAL(5,2);
BEGIN
    -- Calculate date range based on period type
    CASE summary_period
        WHEN 'daily' THEN
            start_date := summary_date::TIMESTAMP WITH TIME ZONE;
            end_date := start_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            start_date := date_trunc('week', summary_date::TIMESTAMP WITH TIME ZONE);
            end_date := start_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            start_date := date_trunc('month', summary_date::TIMESTAMP WITH TIME ZONE);
            end_date := start_date + INTERVAL '1 month';
        ELSE
            RAISE EXCEPTION 'Invalid period type: %', summary_period;
    END CASE;

    -- Get visitor metrics
    SELECT 
        COUNT(*),
        COUNT(DISTINCT session_id),
        COALESCE(AVG(visit_duration), 0)
    INTO visitor_count, unique_visitor_count, avg_time
    FROM visitor_tracking 
    WHERE site_id = (SELECT site_id FROM generated_sites WHERE id = site_uuid)
        AND created_at >= start_date 
        AND created_at < end_date;

    -- Get lead count
    SELECT COUNT(*)
    INTO lead_count
    FROM waitlist_submissions 
    WHERE source_site_id = (SELECT site_id FROM generated_sites WHERE id = site_uuid)
        AND created_at >= start_date 
        AND created_at < end_date;

    -- Calculate conversion rate
    conversion_rate_calc := CASE 
        WHEN visitor_count > 0 THEN (lead_count::DECIMAL / visitor_count::DECIMAL) * 100
        ELSE 0
    END;

    -- Calculate bounce rate (simplified)
    bounce_rate_calc := CASE 
        WHEN unique_visitor_count > 0 THEN 
            (SELECT COUNT(*) FROM (
                SELECT session_id 
                FROM visitor_tracking 
                WHERE site_id = (SELECT site_id FROM generated_sites WHERE id = site_uuid)
                    AND created_at >= start_date 
                    AND created_at < end_date
                GROUP BY session_id 
                HAVING COUNT(*) = 1
            ) single_page_sessions)::DECIMAL / unique_visitor_count::DECIMAL * 100
        ELSE 0
    END;

    -- Insert or update summary
    INSERT INTO site_analytics_summaries (
        site_id,
        date,
        period_type,
        total_visitors,
        unique_visitors,
        total_leads,
        conversion_rate,
        average_time_on_site,
        bounce_rate
    ) VALUES (
        site_uuid,
        summary_date,
        summary_period,
        visitor_count,
        unique_visitor_count,
        lead_count,
        conversion_rate_calc,
        avg_time,
        bounce_rate_calc
    )
    ON CONFLICT (site_id, date, period_type) 
    DO UPDATE SET
        total_visitors = EXCLUDED.total_visitors,
        unique_visitors = EXCLUDED.unique_visitors,
        total_leads = EXCLUDED.total_leads,
        conversion_rate = EXCLUDED.conversion_rate,
        average_time_on_site = EXCLUDED.average_time_on_site,
        bounce_rate = EXCLUDED.bounce_rate,
        created_at = NOW();
END;
$$;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create function to get user's sites with analytics
CREATE OR REPLACE FUNCTION get_user_sites_with_analytics(user_uuid UUID)
RETURNS TABLE (
    site_id UUID,
    site_name VARCHAR,
    deployment_url TEXT,
    deployment_status VARCHAR,
    total_leads BIGINT,
    total_visitors BIGINT,
    conversion_rate DECIMAL,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id,
        gs.site_name,
        gs.deployment_url,
        gs.deployment_status,
        COALESCE(lead_stats.total_leads, 0),
        COALESCE(visitor_stats.total_visitors, 0),
        CASE 
            WHEN COALESCE(visitor_stats.total_visitors, 0) > 0 
            THEN (COALESCE(lead_stats.total_leads, 0)::DECIMAL / visitor_stats.total_visitors::DECIMAL) * 100
            ELSE 0
        END,
        gs.updated_at
    FROM generated_sites gs
    LEFT JOIN (
        SELECT 
            source_site_id,
            COUNT(*) as total_leads
        FROM waitlist_submissions 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY source_site_id
    ) lead_stats ON gs.site_id = lead_stats.source_site_id
    LEFT JOIN (
        SELECT 
            site_id,
            COUNT(*) as total_visitors
        FROM visitor_tracking 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY site_id
    ) visitor_stats ON gs.site_id = visitor_stats.site_id
    WHERE gs.user_id = user_uuid
    ORDER BY gs.updated_at DESC;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_github_users_updated_at 
    BEFORE UPDATE ON github_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_sites_updated_at 
    BEFORE UPDATE ON generated_sites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repository_deployments_updated_at 
    BEFORE UPDATE ON repository_deployments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pull_request_previews_updated_at 
    BEFORE UPDATE ON pull_request_previews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repository_forks_updated_at 
    BEFORE UPDATE ON repository_forks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE github_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY user_github_data_policy ON github_users
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY user_sessions_policy ON user_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY user_sites_policy ON generated_sites
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY user_analytics_policy ON site_analytics_summaries
    FOR ALL USING (
        auth.uid()::text = (
            SELECT user_id::text 
            FROM generated_sites 
            WHERE id = site_analytics_summaries.site_id
        )
    );

-- Add comments for documentation
COMMENT ON TABLE github_users IS 'GitHub user accounts with OAuth integration';
COMMENT ON TABLE user_sessions IS 'Active user sessions for authentication';
COMMENT ON TABLE generated_sites IS 'Sites generated from GitHub repositories';
COMMENT ON TABLE repository_deployments IS 'GitHub repository deployment configurations';
COMMENT ON TABLE site_regeneration_logs IS 'Logs of site regeneration events triggered by GitHub webhooks';
COMMENT ON TABLE pull_request_previews IS 'Preview sites generated for pull requests';
COMMENT ON TABLE github_webhook_events IS 'GitHub webhook events for processing';
COMMENT ON TABLE site_analytics_summaries IS 'Pre-calculated analytics summaries for dashboard performance';
COMMENT ON TABLE repository_forks IS 'Tracking of repository forks created through 4site.pro';

COMMENT ON FUNCTION generate_site_id IS 'Generates unique site identifier from username and repository name';
COMMENT ON FUNCTION update_site_analytics_summary IS 'Updates analytics summary for a site and time period';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired user sessions';
COMMENT ON FUNCTION get_user_sites_with_analytics IS 'Returns user sites with basic analytics data';

-- Create scheduled job to clean up expired sessions (example for pg_cron extension)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Create scheduled job to update daily analytics summaries
-- SELECT cron.schedule('daily-analytics', '0 1 * * *', 
--   'SELECT update_site_analytics_summary(id, CURRENT_DATE - 1, ''daily'') FROM generated_sites WHERE deployment_status = ''active'';');

-- Example queries for testing:
/*
-- Get user's sites with analytics
SELECT * FROM get_user_sites_with_analytics('user-uuid-here');

-- Update analytics summary for a site
SELECT update_site_analytics_summary('site-uuid-here', CURRENT_DATE, 'daily');

-- Clean up expired sessions
SELECT cleanup_expired_sessions();

-- Generate site ID
SELECT generate_site_id('username', 'repository-name');
*/
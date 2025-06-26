-- Database Functions for 4site.pro Production
-- Run this after security-policies.sql

-- Function to track page views
CREATE OR REPLACE FUNCTION track_page_view(
  p_site_id UUID,
  p_page_url TEXT,
  p_visitor_id TEXT,
  p_session_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.analytics (
    site_id,
    event_type,
    page_url,
    visitor_id,
    session_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_site_id,
    'page_view',
    p_page_url,
    p_visitor_id,
    p_session_id,
    p_metadata,
    inet(current_setting('request.headers')::json->>'x-forwarded-for'),
    current_setting('request.headers')::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_site_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  total_leads BIGINT,
  conversion_rate NUMERIC,
  top_referrers JSONB,
  daily_views JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      NOW() - (p_days || ' days')::interval AS start_date,
      NOW() AS end_date
  ),
  analytics_data AS (
    SELECT * FROM public.analytics
    WHERE site_id = p_site_id
    AND created_at >= (SELECT start_date FROM date_range)
  ),
  leads_data AS (
    SELECT COUNT(*) AS lead_count
    FROM public.leads
    WHERE site_id = p_site_id
    AND created_at >= (SELECT start_date FROM date_range)
  )
  SELECT
    COUNT(*)::BIGINT AS total_views,
    COUNT(DISTINCT visitor_id)::BIGINT AS unique_visitors,
    (SELECT lead_count FROM leads_data)::BIGINT AS total_leads,
    CASE 
      WHEN COUNT(DISTINCT visitor_id) > 0 
      THEN ROUND((SELECT lead_count FROM leads_data)::NUMERIC / COUNT(DISTINCT visitor_id) * 100, 2)
      ELSE 0
    END AS conversion_rate,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'referrer', referrer,
        'count', count
      ))
      FROM (
        SELECT referrer, COUNT(*) as count
        FROM analytics_data
        WHERE referrer IS NOT NULL
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 5
      ) top_refs
    ) AS top_referrers,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'date', date,
        'views', views
      ) ORDER BY date)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as views
        FROM analytics_data
        GROUP BY DATE(created_at)
      ) daily
    ) AS daily_views
  FROM analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  scopes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN ak.revoked_at IS NOT NULL THEN FALSE
      WHEN ak.expires_at < NOW() THEN FALSE
      ELSE TRUE
    END AS is_valid,
    ak.user_id,
    ak.scopes
  FROM public.api_keys ak
  WHERE ak.key_hash = p_key_hash
  LIMIT 1;
  
  -- Update last used timestamp
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create site from GitHub repo
CREATE OR REPLACE FUNCTION create_site_from_repo(
  p_user_id UUID,
  p_repo_url TEXT,
  p_title TEXT,
  p_description TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  site_id UUID;
  repo_owner TEXT;
  repo_name TEXT;
BEGIN
  -- Extract owner and repo from URL
  SELECT 
    split_part(split_part(p_repo_url, '/', 4), '/', 1),
    split_part(split_part(p_repo_url, '/', 5), '/', 1)
  INTO repo_owner, repo_name;
  
  -- Insert new site
  INSERT INTO public.sites (
    user_id,
    title,
    description,
    content,
    repo_url,
    owner,
    repo,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_description,
    p_content,
    p_repo_url,
    repo_owner,
    repo_name,
    p_metadata
  ) RETURNING id INTO site_id;
  
  -- Decrement user credits
  UPDATE public.users 
  SET credits = credits - 1 
  WHERE id = p_user_id AND credits > 0;
  
  RETURN site_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to capture lead
CREATE OR REPLACE FUNCTION capture_lead(
  p_site_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  lead_id UUID;
BEGIN
  -- Insert lead (ON CONFLICT DO NOTHING for duplicate emails)
  INSERT INTO public.leads (
    site_id,
    email,
    name,
    company,
    message,
    source_url,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_site_id,
    p_email,
    p_name,
    p_company,
    p_message,
    p_source_url,
    p_metadata,
    inet(current_setting('request.headers')::json->>'x-forwarded-for'),
    current_setting('request.headers')::json->>'user-agent'
  ) 
  ON CONFLICT (site_id, email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, leads.name),
    company = COALESCE(EXCLUDED.company, leads.company),
    message = COALESCE(EXCLUDED.message, leads.message),
    metadata = leads.metadata || EXCLUDED.metadata
  RETURNING id INTO lead_id;
  
  RETURN lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  total_sites BIGINT,
  published_sites BIGINT,
  total_views BIGINT,
  total_leads BIGINT,
  credits_remaining INTEGER,
  recent_activity JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_sites AS (
    SELECT id FROM public.sites WHERE user_id = p_user_id
  ),
  site_analytics AS (
    SELECT COUNT(*) as view_count
    FROM public.analytics a
    WHERE a.site_id IN (SELECT id FROM user_sites)
    AND a.created_at >= NOW() - INTERVAL '30 days'
  ),
  site_leads AS (
    SELECT COUNT(*) as lead_count
    FROM public.leads l
    WHERE l.site_id IN (SELECT id FROM user_sites)
    AND l.created_at >= NOW() - INTERVAL '30 days'
  ),
  recent_sites AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'status', s.status,
      'created_at', s.created_at
    ) ORDER BY s.created_at DESC) as sites
    FROM public.sites s
    WHERE s.user_id = p_user_id
    LIMIT 5
  )
  SELECT
    (SELECT COUNT(*) FROM public.sites WHERE user_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM public.sites WHERE user_id = p_user_id AND status = 'published')::BIGINT,
    (SELECT view_count FROM site_analytics)::BIGINT,
    (SELECT lead_count FROM site_leads)::BIGINT,
    (SELECT credits FROM public.users WHERE id = p_user_id),
    (SELECT sites FROM recent_sites);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to publish site
CREATE OR REPLACE FUNCTION publish_site(
  p_site_id UUID,
  p_deployment_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sites 
  SET 
    status = 'published',
    published_at = NOW(),
    deployment_url = COALESCE(p_deployment_url, deployment_url)
  WHERE id = p_site_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
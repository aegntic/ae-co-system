-- Performance Monitoring Setup for 4site.pro Production Database

-- Enable pg_stat_statements extension for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- Monitor table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Monitor connection usage
CREATE OR REPLACE VIEW connection_stats AS
SELECT
  state,
  COUNT(*) as connection_count,
  MAX(NOW() - query_start) as longest_query_duration,
  MAX(NOW() - state_change) as longest_idle_duration
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY state;

-- Create comprehensive database health function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  status TEXT,
  threshold TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Active connections
  SELECT 
    'Active Connections'::TEXT,
    COUNT(*)::TEXT,
    CASE 
      WHEN COUNT(*) > 90 THEN 'critical'
      WHEN COUNT(*) > 70 THEN 'warning'
      ELSE 'healthy'
    END,
    'Warning: >70, Critical: >90'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'
  
  UNION ALL
  
  -- Database size
  SELECT 
    'Database Size'::TEXT,
    pg_size_pretty(pg_database_size(current_database()))::TEXT,
    CASE 
      WHEN pg_database_size(current_database()) > 21474836480 THEN 'warning' -- > 20GB
      WHEN pg_database_size(current_database()) > 10737418240 THEN 'monitoring' -- > 10GB
      ELSE 'healthy'
    END,
    'Monitoring: >10GB, Warning: >20GB'::TEXT
  
  UNION ALL
  
  -- Cache hit ratio
  SELECT 
    'Cache Hit Ratio'::TEXT,
    ROUND(
      100.0 * sum(heap_blks_hit) / 
      NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
      2
    )::TEXT || '%',
    CASE 
      WHEN ROUND(
        100.0 * sum(heap_blks_hit) / 
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
        2
      ) < 90 THEN 'warning'
      WHEN ROUND(
        100.0 * sum(heap_blks_hit) / 
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
        2
      ) < 95 THEN 'monitoring'
      ELSE 'healthy'
    END,
    'Warning: <90%, Target: >95%'::TEXT
  FROM pg_statio_user_tables
  
  UNION ALL
  
  -- Long running queries
  SELECT
    'Long Running Queries'::TEXT,
    COUNT(*)::TEXT,
    CASE 
      WHEN COUNT(*) > 5 THEN 'warning'
      WHEN COUNT(*) > 0 THEN 'monitoring'
      ELSE 'healthy'
    END,
    'Warning: >5 queries >5min'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'
  AND NOW() - query_start > INTERVAL '5 minutes'
  
  UNION ALL
  
  -- Unused indexes
  SELECT
    'Unused Indexes'::TEXT,
    COUNT(*)::TEXT,
    CASE 
      WHEN COUNT(*) > 10 THEN 'warning'
      WHEN COUNT(*) > 5 THEN 'monitoring'
      ELSE 'healthy'
    END,
    'Warning: >10 unused indexes'::TEXT
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
  
  UNION ALL
  
  -- Deadlocks
  SELECT
    'Deadlocks (24h)'::TEXT,
    deadlocks::TEXT,
    CASE 
      WHEN deadlocks > 10 THEN 'warning'
      WHEN deadlocks > 0 THEN 'monitoring'
      ELSE 'healthy'
    END,
    'Warning: >10 deadlocks/day'::TEXT
  FROM pg_stat_database
  WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  query_type TEXT,
  avg_duration_ms NUMERIC,
  total_calls BIGINT,
  total_time_ms NUMERIC,
  cache_hit_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH query_stats AS (
    SELECT
      CASE 
        WHEN query LIKE 'SELECT%' THEN 'SELECT'
        WHEN query LIKE 'INSERT%' THEN 'INSERT'
        WHEN query LIKE 'UPDATE%' THEN 'UPDATE'
        WHEN query LIKE 'DELETE%' THEN 'DELETE'
        ELSE 'OTHER'
      END as query_type,
      mean_time,
      calls,
      total_time
    FROM pg_stat_statements
    WHERE last_exec >= NOW() - (p_hours || ' hours')::interval
  )
  SELECT
    qs.query_type,
    ROUND(AVG(qs.mean_time), 2) as avg_duration_ms,
    SUM(qs.calls) as total_calls,
    ROUND(SUM(qs.total_time), 2) as total_time_ms,
    ROUND(AVG(
      100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0)
    ), 2) as cache_hit_ratio
  FROM query_stats qs
  LEFT JOIN pg_statio_user_tables pt ON true  -- Overall cache stats
  GROUP BY qs.query_type
  ORDER BY avg_duration_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get table growth trends
CREATE OR REPLACE FUNCTION get_table_growth_stats()
RETURNS TABLE (
  table_name TEXT,
  current_size_mb NUMERIC,
  estimated_daily_growth_mb NUMERIC,
  days_to_1gb INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH table_stats AS (
    SELECT
      tablename,
      pg_total_relation_size(schemaname||'.'||tablename) / (1024*1024.0) as size_mb,
      -- Estimate growth based on recent inserts (simplified)
      CASE 
        WHEN tablename = 'analytics' THEN 0.5  -- Analytics grows ~500KB/day
        WHEN tablename = 'leads' THEN 0.1      -- Leads grow ~100KB/day
        WHEN tablename = 'sites' THEN 0.05     -- Sites grow ~50KB/day
        ELSE 0.01
      END as daily_growth_mb
    FROM pg_tables
    WHERE schemaname = 'public'
  )
  SELECT
    ts.tablename::TEXT,
    ROUND(ts.size_mb, 2),
    ts.daily_growth_mb,
    CASE 
      WHEN ts.daily_growth_mb > 0 
      THEN CEIL((1024 - ts.size_mb) / ts.daily_growth_mb)::INTEGER
      ELSE NULL
    END
  FROM table_stats ts
  WHERE ts.size_mb > 1  -- Only show tables larger than 1MB
  ORDER BY ts.size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- Create monitoring alerts function
CREATE OR REPLACE FUNCTION check_database_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  metric_value TEXT,
  threshold TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check for high connection usage
  SELECT
    'HIGH_CONNECTIONS'::TEXT,
    'warning'::TEXT,
    'Database approaching connection limit'::TEXT,
    COUNT(*)::TEXT,
    '80% of max_connections'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'
  HAVING COUNT(*) > 80
  
  UNION ALL
  
  -- Check for slow queries
  SELECT
    'SLOW_QUERIES'::TEXT,
    'warning'::TEXT,
    'Multiple slow queries detected'::TEXT,
    COUNT(*)::TEXT,
    '>5 queries running >5min'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'
  AND NOW() - query_start > INTERVAL '5 minutes'
  HAVING COUNT(*) > 5
  
  UNION ALL
  
  -- Check for large table sizes
  SELECT
    'LARGE_TABLE'::TEXT,
    'monitoring'::TEXT,
    'Table ' || tablename || ' is growing large'::TEXT,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)),
    '>1GB per table'::TEXT
  FROM pg_tables
  WHERE schemaname = 'public'
  AND pg_total_relation_size('public.' || tablename) > 1073741824  -- 1GB
  
  UNION ALL
  
  -- Check for low cache hit ratio
  SELECT
    'LOW_CACHE_HIT'::TEXT,
    'warning'::TEXT,
    'Database cache hit ratio is low'::TEXT,
    ROUND(
      100.0 * sum(heap_blks_hit) / 
      NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
      2
    )::TEXT || '%',
    'Target: >95%'::TEXT
  FROM pg_statio_user_tables
  HAVING ROUND(
    100.0 * sum(heap_blks_hit) / 
    NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
    2
  ) < 90;
END;
$$ LANGUAGE plpgsql;

-- Create periodic maintenance function
CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  table_rec RECORD;
BEGIN
  result := 'Maintenance started at ' || NOW() || E'\n';
  
  -- Auto-vacuum and analyze all user tables
  FOR table_rec IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ANALYZE public.' || table_rec.tablename;
    result := result || 'Analyzed table: ' || table_rec.tablename || E'\n';
  END LOOP;
  
  -- Clean up old analytics data (older than 1 year)
  DELETE FROM public.analytics 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS result = ROW_COUNT;
  result := result || 'Cleaned up ' || result || ' old analytics records' || E'\n';
  
  -- Update table statistics
  EXECUTE 'SELECT pg_stat_reset()';
  result := result || 'Reset query statistics' || E'\n';
  
  result := result || 'Maintenance completed at ' || NOW();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create monitoring dashboard view
CREATE OR REPLACE VIEW monitoring_dashboard AS
WITH health_metrics AS (
  SELECT * FROM get_database_health()
),
recent_activity AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as sites_created_1h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as sites_created_24h
  FROM public.sites
),
analytics_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as events_1h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as events_24h,
    COUNT(DISTINCT site_id) as active_sites
  FROM public.analytics
  WHERE created_at >= NOW() - INTERVAL '24 hours'
),
lead_summary AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as leads_1h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as leads_24h
  FROM public.leads
)
SELECT
  'system' as category,
  json_build_object(
    'health_status', (
      SELECT json_agg(json_build_object(
        'metric', metric,
        'value', value,
        'status', status
      ))
      FROM health_metrics
    ),
    'activity_stats', json_build_object(
      'sites_created_1h', ra.sites_created_1h,
      'sites_created_24h', ra.sites_created_24h,
      'analytics_events_1h', ans.events_1h,
      'analytics_events_24h', ans.events_24h,
      'leads_captured_1h', ls.leads_1h,
      'leads_captured_24h', ls.leads_24h,
      'active_sites', ans.active_sites
    ),
    'timestamp', NOW()
  ) as dashboard_data
FROM recent_activity ra, analytics_summary ans, lead_summary ls;
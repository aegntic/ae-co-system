# Prompt 03: Production Database Setup

## Objective
Configure Supabase production database with proper schema, security, and performance optimizations.

## Target Components
- Database schema and migrations
- Row Level Security (RLS) policies
- Indexes and performance optimization
- Backup and recovery setup

## Implementation

### 1. Create Production Migration Files

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE site_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  github_username TEXT UNIQUE,
  github_id TEXT UNIQUE,
  role user_role DEFAULT 'free',
  credits INTEGER DEFAULT 10,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  owner TEXT,
  repo TEXT,
  template TEXT DEFAULT 'simple',
  status site_status DEFAULT 'draft',
  custom_domain TEXT UNIQUE,
  deployment_url TEXT,
  widget_enabled BOOLEAN DEFAULT true,
  widget_config JSONB DEFAULT '{
    "position": "bottom-right",
    "theme": "dark",
    "fields": ["name", "email", "company"]
  }'::jsonb,
  features TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  primary_color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Indexes
  CONSTRAINT unique_user_repo UNIQUE(user_id, owner, repo)
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  message TEXT,
  source_url TEXT,
  ip_address INET,
  user_agent TEXT,
  status lead_status DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  
  -- Prevent duplicate leads per site
  CONSTRAINT unique_site_email UNIQUE(site_id, email)
);

-- Analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployments table
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deployment_url TEXT,
  build_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- API Keys table (for widget authentication)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{widget:write, analytics:read}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_sites_user_id ON public.sites(user_id);
CREATE INDEX idx_sites_status ON public.sites(status);
CREATE INDEX idx_sites_created_at ON public.sites(created_at DESC);
CREATE INDEX idx_leads_site_id ON public.leads(site_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_analytics_site_id ON public.analytics(site_id);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at DESC);
CREATE INDEX idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX idx_deployments_site_id ON public.deployments(site_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create Row Level Security Policies

Create `supabase/migrations/002_security_policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Sites policies
CREATE POLICY "Users can view own sites" ON public.sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sites" ON public.sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites" ON public.sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites" ON public.sites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view published sites" ON public.sites
  FOR SELECT USING (status = 'published');

-- Leads policies
CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = leads.site_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Widget can insert leads" ON public.leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = leads.site_id 
      AND sites.widget_enabled = true
    )
  );

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = analytics.site_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert analytics" ON public.analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = analytics.site_id 
      AND sites.status = 'published'
    )
  );

-- Deployments policies
CREATE POLICY "Users can view own deployments" ON public.deployments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = deployments.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- API Keys policies
CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Create Database Functions

Create `supabase/migrations/003_functions.sql`:

```sql
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
```

### 4. Create Backup and Monitoring Setup

Create `scripts/database-backup.sh`:

```bash
#!/bin/bash

# Production Database Backup Script
# Run via cron: 0 2 * * * /path/to/database-backup.sh

SUPABASE_PROJECT_ID="your-project-id"
BACKUP_DIR="/backups/4site-pro"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Starting database backup..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" \
  "s3://4sitepro-backups/db/backup_$TIMESTAMP.sql.gz" \
  --storage-class GLACIER

# Clean up old local backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Send notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"Database backup completed: backup_$TIMESTAMP.sql.gz\"}"

echo "Backup completed successfully"
```

### 5. Performance Monitoring Queries

Create `supabase/monitoring/performance_queries.sql`:

```sql
-- Monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
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
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Create monitoring function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  status TEXT
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
    END
  FROM pg_stat_activity
  WHERE state = 'active'
  
  UNION ALL
  
  -- Database size
  SELECT 
    'Database Size'::TEXT,
    pg_size_pretty(pg_database_size(current_database()))::TEXT,
    CASE 
      WHEN pg_database_size(current_database()) > 10737418240 THEN 'warning' -- > 10GB
      ELSE 'healthy'
    END
  
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
      ELSE 'healthy'
    END
  FROM pg_statio_user_tables;
END;
$$ LANGUAGE plpgsql;
```

## Expected Output Files
- `production-schema.sql` - Complete database schema
- `security-policies.sql` - All RLS policies
- `database-functions.sql` - Utility functions
- `backup-script.sh` - Automated backup script
- `monitoring-setup.sql` - Performance monitoring

## Dependencies
- Requires: 01-production-env.md (DATABASE_URL)
- Requires: 02-api-keys-setup.md (Supabase project)

## Validation
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Run migrations
supabase db push --db-url $DATABASE_URL

# Test RLS policies
supabase test db

# Verify indexes
psql $DATABASE_URL -c "\di"
```

## Performance Considerations
1. Index on frequently queried columns
2. Partition analytics table by month
3. Use connection pooling (PgBouncer)
4. Enable query performance insights
5. Set up automated vacuum schedule

## Security Checklist
- [ ] RLS enabled on all tables
- [ ] Policies restrict access appropriately
- [ ] API keys are hashed (never plain text)
- [ ] Sensitive data is encrypted
- [ ] Backup encryption enabled
- [ ] Audit logging configured

## Next Steps
- Deploy frontend (Prompt 04)
- Deploy backend API (Prompt 05)
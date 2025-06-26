# Production Supabase Setup for 4site.pro Enhanced Viral Mechanics

## Overview
This guide sets up a production-grade Supabase database for 4site.pro with enhanced viral mechanics designed for $100B platform standards.

## Features Implemented
- **Viral Score Algorithm**: Real-time calculation based on engagement, shares, time decay, and tier bonuses
- **Lifetime Commission System**: Progressive 20% → 25% → 40% commission rates over years
- **Free Pro Milestone**: Automatic Pro upgrade after 10 successful referrals (12 months free)
- **Pro Showcase Grid**: Automatic featuring ordered by viral score
- **Share Tracking**: External platform integration with platform-specific viral boosts
- **Auto-Featuring**: Triggered every 5 external shares with tier-based duration

## Production Setup Steps

### 1. Create Supabase Project
```bash
# Visit https://supabase.com/dashboard
# Click "New Project"
# Organization: 4site-pro (create if needed)
# Project Name: 4site-pro-production
# Database Password: [Generate secure password]
# Region: us-east-1 (or closest to your users)
# Pricing Plan: Pro ($25/month minimum for production)
```

### 2. Configure Database
```sql
-- Connect to SQL Editor in Supabase Dashboard
-- Paste the complete enhanced-viral-schema.sql content
-- Execute the schema (812+ lines)
-- Verify all tables, functions, and triggers are created
```

### 3. Environment Configuration
```bash
# Add to .env.local (for development)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Production environment variables
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 4. Row Level Security Verification
```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Should return 12 tables with RLS enabled
```

### 5. Performance Optimization
```sql
-- Verify all indexes are created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Should show 30+ indexes for optimal performance
```

### 6. Function Testing
```sql
-- Test viral score calculation
SELECT calculate_viral_score('test-website-uuid');

-- Test commission rate calculation
SELECT calculate_commission_rate('test-user-uuid', 6);

-- Test share tracking
SELECT track_external_share('test-website-uuid', 'twitter', 'https://example.com');
```

## Production Configuration Checklist

### Database Configuration
- [ ] Enhanced viral schema deployed (812+ lines)
- [ ] All 12 tables created with proper constraints
- [ ] 30+ performance indexes created
- [ ] RLS policies enabled on all tables
- [ ] All functions and triggers working
- [ ] Views created for optimized queries

### Performance Settings
- [ ] Connection pooling enabled (recommended: PgBouncer)
- [ ] Query timeout set to 30 seconds
- [ ] Statement timeout set to 60 seconds
- [ ] Max connections: 100+ for production
- [ ] Backup retention: 7 days minimum

### Security Configuration
- [ ] Service role key secured (never expose client-side)
- [ ] Anonymous access limited to public data only
- [ ] JWT secret rotated from default
- [ ] API rate limiting configured
- [ ] CORS origins restricted to production domains

### Monitoring Setup
- [ ] Query performance monitoring enabled
- [ ] Slow query alerts configured (>1000ms)
- [ ] Database size monitoring
- [ ] Connection count monitoring
- [ ] Error rate monitoring

## Viral Mechanics Validation

### Core Functions Testing
```sql
-- 1. Test viral score calculation for a sample website
INSERT INTO users (id, email, tier) VALUES 
('test-user-1', 'test@example.com', 'pro');

INSERT INTO websites (id, user_id, title, repo_url, template, tier, site_data) VALUES 
('test-website-1', 'test-user-1', 'Test Site', 'https://github.com/test/repo', 'tech', 'pro', '{}');

-- 2. Test share tracking
SELECT track_external_share('test-website-1', 'twitter', 'https://twitter.com/share');

-- 3. Verify viral score updates
SELECT viral_score FROM websites WHERE id = 'test-website-1';

-- 4. Test auto-featuring trigger
-- Should trigger after 5 shares
SELECT auto_featured, featured_at FROM websites WHERE id = 'test-website-1';
```

### Commission System Testing
```sql
-- 1. Create referral relationship
INSERT INTO referrals (referrer_id, referred_email, referral_code, status) VALUES
('test-user-1', 'referred@example.com', 'TESTREF', 'converted');

-- 2. Test commission calculation
SELECT calculate_commission_rate('test-user-1', 6); -- Should return 0.200 (20%)
SELECT calculate_commission_rate('test-user-1', 24); -- Should return 0.250 (25%)
SELECT calculate_commission_rate('test-user-1', 60); -- Should return 0.400 (40%)

-- 3. Test milestone processing
SELECT process_referral_milestone('test-user-1');
```

### Pro Showcase Testing
```sql
-- 1. Refresh showcase grid
SELECT refresh_pro_showcase();

-- 2. Verify Pro users are featured
SELECT COUNT(*) FROM pro_showcase_entries 
JOIN users ON pro_showcase_entries.user_id = users.id 
WHERE users.tier IN ('pro', 'business', 'enterprise');

-- 3. Verify ordering by viral score
SELECT viral_score_at_featuring, featured_order 
FROM pro_showcase_entries 
ORDER BY featured_order LIMIT 10;
```

## Production Monitoring

### Key Metrics to Track
1. **Viral Score Distribution**: Monitor score ranges and growth
2. **Commission Calculations**: Ensure accuracy and proper tier progression
3. **Auto-Featuring Events**: Track threshold triggers and duration
4. **Share Tracking**: Monitor platform distribution and viral boosts
5. **Database Performance**: Query times, connection counts, resource usage

### Alert Thresholds
- Database CPU > 80% for 5 minutes
- Query time > 1000ms for viral score calculations
- Failed commission calculations > 1% error rate
- Auto-featuring delays > 30 seconds
- RLS policy violations detected

## Backup and Recovery

### Automated Backups
```bash
# Supabase Pro includes automatic daily backups
# Retention: 7 days (configurable up to 30 days)
# Point-in-time recovery available
```

### Manual Backup for Critical Data
```sql
-- Export commission data
COPY (SELECT * FROM commission_earnings) TO '/tmp/commission_backup.csv' CSV HEADER;

-- Export viral scores
COPY (SELECT * FROM websites) TO '/tmp/websites_backup.csv' CSV HEADER;

-- Export user data
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
```

## Scaling Considerations

### Database Optimization
- **Read Replicas**: For analytics and reporting queries
- **Connection Pooling**: PgBouncer for high-concurrency scenarios
- **Query Optimization**: Regular EXPLAIN ANALYZE on viral score calculations
- **Index Maintenance**: Monthly REINDEX for heavily updated tables

### Application-Level Optimization
- **Viral Score Caching**: Cache calculations for 1 hour
- **Commission Calculations**: Batch process monthly
- **Share Tracking**: Use queue for high-volume tracking
- **Pro Showcase**: Update every 6 hours instead of real-time

## Cost Optimization

### Supabase Pro Plan Features
- $25/month base cost
- 8GB database included
- 100GB bandwidth included
- Additional storage: $0.125/GB/month
- Additional bandwidth: $0.09/GB

### Expected Costs for 10K Users
- Database: ~2GB (included)
- Bandwidth: ~50GB/month (included)
- Functions: ~1M executions/month (included)
- **Total: ~$25/month**

### Expected Costs for 100K Users
- Database: ~15GB (+$0.875/month)
- Bandwidth: ~300GB/month (+$18/month)
- Functions: ~10M executions/month (+$2/month)
- **Total: ~$46/month**

## Security Best Practices

### API Key Management
- Never commit keys to version control
- Use environment variables for all keys
- Rotate service role keys quarterly
- Implement key rotation in CI/CD

### Data Protection
- All PII encrypted at rest (Supabase default)
- Commission data requires service role access
- User data accessible only by owner (RLS enforced)
- Anonymous access limited to public showcase only

### Compliance
- GDPR: Right to erasure implemented via CASCADE deletes
- SOC2: Supabase provides compliance certification
- Data residency: Choose appropriate region for users
- Audit logging: All commission changes tracked with timestamps

## Troubleshooting Common Issues

### Viral Score Calculation Errors
```sql
-- Check for missing website data
SELECT id, title FROM websites WHERE viral_score IS NULL;

-- Manually recalculate scores
UPDATE websites SET viral_score = calculate_viral_score(id) WHERE viral_score = 0;
```

### Commission Calculation Issues
```sql
-- Verify referral relationships
SELECT r.*, u1.email as referrer, u2.email as referred
FROM referrals r
JOIN users u1 ON r.referrer_id = u1.id
LEFT JOIN users u2 ON r.referred_user_id = u2.id
WHERE r.status = 'converted';
```

### Auto-Featuring Not Triggering
```sql
-- Check share counts vs auto-featuring status
SELECT w.id, w.external_share_count, w.auto_featured
FROM websites w
WHERE w.external_share_count >= 5 AND w.auto_featured = FALSE;

-- Manually trigger featuring
UPDATE websites SET auto_featured = TRUE, featured_at = NOW()
WHERE external_share_count >= 5 AND auto_featured = FALSE;
```

### Performance Issues
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Check index usage
SELECT relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan;
```

## Deployment Checklist

### Pre-Deployment
- [ ] Schema validation complete
- [ ] All functions tested
- [ ] RLS policies verified
- [ ] Performance indexes created
- [ ] Environment variables configured

### Deployment
- [ ] Production Supabase project created
- [ ] Enhanced viral schema deployed
- [ ] All tables, functions, triggers working
- [ ] Initial data seeded (if any)
- [ ] Monitoring configured

### Post-Deployment
- [ ] Viral score calculations working
- [ ] Commission system tested
- [ ] Auto-featuring triggers verified
- [ ] Pro showcase grid functional
- [ ] Share tracking operational
- [ ] Performance monitoring active

## Success Metrics

### Performance Targets
- Viral score calculation: <200ms
- Commission calculation: <100ms
- Share tracking: <50ms
- Database queries: <500ms average
- Auto-featuring trigger: <30 seconds

### Business Metrics
- Viral coefficient improvement: >1.2x for active users
- Commission accuracy: 99.9%+
- Auto-featuring accuracy: 100%
- Pro upgrade rate: >5% from referral milestone
- Share amplification: >3x organic reach

This production setup ensures your 4site.pro platform can scale to millions of users while maintaining sub-200ms response times and $100B platform reliability standards.
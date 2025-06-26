-- DailyDoco Pro $100 BILLION Database Schema
-- Designed for 10M+ concurrent users, viral mechanics, and enterprise scale

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
CREATE EXTENSION IF NOT EXISTS "pg_partman";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For advanced text search
CREATE EXTENSION IF NOT EXISTS "cube"; -- For vector similarity
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- For geo queries

-- Set optimal configuration for scale
ALTER SYSTEM SET max_connections = 10000;
ALTER SYSTEM SET shared_buffers = '64GB';
ALTER SYSTEM SET effective_cache_size = '192GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET random_page_cost = 1.1; -- SSD optimized
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET max_parallel_workers_per_gather = 8;
ALTER SYSTEM SET max_parallel_maintenance_workers = 8;

-- =====================================================
-- SHARDED USER TABLES WITH VIRAL MECHANICS
-- =====================================================

-- User sharding function
CREATE OR REPLACE FUNCTION get_shard_for_user(user_id UUID) 
RETURNS INTEGER AS $$
BEGIN
    RETURN abs(hashtext(user_id::text)) % 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Master user table (metadata only)
CREATE TABLE users_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shard_id INTEGER GENERATED ALWAYS AS (get_shard_for_user(id)) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Quick lookup indexes
    INDEX idx_users_master_shard (shard_id),
    INDEX idx_users_master_email (email),
    INDEX idx_users_master_username (username)
) PARTITION BY HASH (shard_id);

-- Create 1000 shards for users
DO $$
BEGIN
    FOR i IN 0..999 LOOP
        EXECUTE format('CREATE TABLE users_shard_%s PARTITION OF users_master FOR VALUES WITH (modulus 1000, remainder %s)', i, i);
    END LOOP;
END $$;

-- Detailed user data (sharded)
CREATE TABLE users_data (
    id UUID PRIMARY KEY,
    shard_id INTEGER NOT NULL,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(255),
    
    -- Profile
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    
    -- Subscription & Monetization
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    monthly_revenue DECIMAL(12,2) DEFAULT 0,
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    
    -- Viral Mechanics
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users_master(id),
    viral_score DECIMAL(10,4) DEFAULT 0,
    network_value DECIMAL(12,2) DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    
    -- Gamification
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements JSONB DEFAULT '[]',
    streak_days INTEGER DEFAULT 0,
    
    -- Personalization
    ai_embeddings vector(512), -- For recommendation engine
    behavior_profile JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',
    
    -- Platform Integration
    youtube_channel_id VARCHAR(255),
    youtube_analytics JSONB DEFAULT '{}',
    integrated_platforms JSONB DEFAULT '[]',
    
    -- Compliance & Security
    kyc_status VARCHAR(20) DEFAULT 'pending',
    risk_score DECIMAL(5,4) DEFAULT 0,
    fraud_flags JSONB DEFAULT '[]',
    last_security_audit TIMESTAMPTZ,
    
    -- Blockchain
    wallet_address VARCHAR(255),
    ens_domain VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (id, shard_id) REFERENCES users_master(id, shard_id) ON DELETE CASCADE
) PARTITION BY LIST (shard_id);

-- Create partitions for user data
DO $$
BEGIN
    FOR i IN 0..999 LOOP
        EXECUTE format('CREATE TABLE users_data_shard_%s PARTITION OF users_data FOR VALUES IN (%s)', i, i);
    END LOOP;
END $$;

-- =====================================================
-- VIRAL NETWORK TRACKING (GRAPH STRUCTURE)
-- =====================================================

-- Viral network relationships (optimized for graph queries)
CREATE TABLE viral_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Network metrics
    network_depth INTEGER DEFAULT 0,
    total_descendants INTEGER DEFAULT 0,
    active_descendants INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(15,2) DEFAULT 0,
    monthly_revenue_generated DECIMAL(12,2) DEFAULT 0,
    
    -- Commission tracking
    total_commissions_earned DECIMAL(15,2) DEFAULT 0,
    monthly_commissions_earned DECIMAL(12,2) DEFAULT 0,
    pending_commissions DECIMAL(12,2) DEFAULT 0,
    
    -- Viral metrics
    viral_coefficient DECIMAL(5,3) DEFAULT 0,
    avg_referral_value DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Network visualization data
    network_graph JSONB DEFAULT '{}', -- D3.js compatible format
    key_influencers UUID[] DEFAULT '{}',
    growth_trajectory JSONB DEFAULT '[]',
    
    -- Time-based metrics
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_viral_user FOREIGN KEY (user_id) REFERENCES users_master(id) ON DELETE CASCADE
) PARTITION BY HASH (user_id);

-- Create network partitions
CREATE TABLE viral_networks_0 PARTITION OF viral_networks
    FOR VALUES WITH (modulus 100, remainder 0);
-- ... create 100 partitions

-- Referral relationships (for fast graph traversal)
CREATE TABLE referral_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    
    -- Relationship quality
    relationship_strength DECIMAL(5,4) DEFAULT 1.0,
    activity_correlation DECIMAL(5,4) DEFAULT 0,
    revenue_contribution DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_transaction_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    
    UNIQUE(referrer_id, referred_id),
    INDEX idx_referral_edges_referrer (referrer_id),
    INDEX idx_referral_edges_referred (referred_id),
    INDEX idx_referral_edges_level (level)
);

-- =====================================================
-- MULTI-LEVEL COMMISSION SYSTEM
-- =====================================================

-- Commission configuration by tier and level
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_tier VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 7),
    commission_rate DECIMAL(5,4) NOT NULL,
    
    -- Advanced rules
    minimum_qualifying_revenue DECIMAL(10,2) DEFAULT 0,
    maximum_commission_cap DECIMAL(10,2),
    time_decay_factor DECIMAL(5,4) DEFAULT 1.0, -- Reduces over time
    performance_multiplier DECIMAL(5,4) DEFAULT 1.0,
    
    -- Conditions
    requires_active_subscription BOOLEAN DEFAULT true,
    requires_kyc_complete BOOLEAN DEFAULT false,
    minimum_network_size INTEGER DEFAULT 0,
    
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    
    UNIQUE(subscription_tier, level, effective_date)
);

-- Insert default commission structure
INSERT INTO commission_rules (subscription_tier, level, commission_rate) VALUES
('free', 1, 0.10),      -- 10% for free tier direct referrals
('free', 2, 0.05),      -- 5% for second level
('free', 3, 0.02),      -- 2% for third level
('hobby', 1, 0.15),     -- 15% for hobby tier
('hobby', 2, 0.08),     -- 8% for second level
('hobby', 3, 0.04),     -- 4% for third level
('hobby', 4, 0.02),     -- 2% for fourth level
('creator', 1, 0.20),   -- 20% for creator tier
('creator', 2, 0.10),   -- 10% for second level
('creator', 3, 0.05),   -- 5% for third level
('creator', 4, 0.03),   -- 3% for fourth level
('creator', 5, 0.02),   -- 2% for fifth level
('studio', 1, 0.25),    -- 25% for studio tier
('studio', 2, 0.12),    -- 12% for second level
('studio', 3, 0.06),    -- 6% for third level
('studio', 4, 0.04),    -- 4% for fourth level
('studio', 5, 0.03),    -- 3% for fifth level
('studio', 6, 0.02),    -- 2% for sixth level
('enterprise', 1, 0.30), -- 30% for enterprise
('enterprise', 2, 0.15), -- 15% for second level
('enterprise', 3, 0.08), -- 8% for third level
('enterprise', 4, 0.05), -- 5% for fourth level
('enterprise', 5, 0.04), -- 4% for fifth level
('enterprise', 6, 0.03), -- 3% for sixth level
('enterprise', 7, 0.02); -- 2% for seventh level

-- Commission ledger (immutable, append-only)
CREATE TABLE commission_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    source_user_id UUID NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 7),
    
    -- Financial details
    base_amount DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(12,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'expired')),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Blockchain integration
    blockchain_network VARCHAR(20),
    smart_contract_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    gas_fee DECIMAL(10,6),
    
    -- Compliance
    tax_withheld DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    kyc_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_commission_beneficiary (beneficiary_id, status, created_at),
    INDEX idx_commission_source (source_user_id, created_at),
    INDEX idx_commission_status (status, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions for commission ledger
SELECT create_monthly_partitions('commission_ledger', 
    '2024-01-01'::date, 
    '2030-01-01'::date);

-- =====================================================
-- GAMIFICATION & ACHIEVEMENTS
-- =====================================================

-- Achievement definitions
CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    -- Requirements
    criteria JSONB NOT NULL, -- Complex criteria in JSON
    points INTEGER DEFAULT 0,
    
    -- Rewards
    reward_type VARCHAR(50),
    reward_value JSONB,
    
    -- Visual
    icon_url TEXT,
    badge_color VARCHAR(7),
    
    -- Rarity
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    global_unlock_count INTEGER DEFAULT 0,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (with progress tracking)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id),
    
    -- Progress
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ,
    
    -- Metadata
    progress_data JSONB DEFAULT '{}',
    claimed_rewards BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id),
    INDEX idx_user_achievements_user (user_id, unlocked)
);

-- Leaderboards (for competitive features)
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_type VARCHAR(50) NOT NULL,
    time_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, all-time
    
    -- Scores
    entries JSONB NOT NULL, -- Array of {user_id, score, rank}
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    UNIQUE(leaderboard_type, time_period, start_date)
) PARTITION BY LIST (time_period);

CREATE TABLE leaderboards_daily PARTITION OF leaderboards FOR VALUES IN ('daily');
CREATE TABLE leaderboards_weekly PARTITION OF leaderboards FOR VALUES IN ('weekly');
CREATE TABLE leaderboards_monthly PARTITION OF leaderboards FOR VALUES IN ('monthly');
CREATE TABLE leaderboards_alltime PARTITION OF leaderboards FOR VALUES IN ('all-time');

-- =====================================================
-- ENTERPRISE FEATURES & MULTI-TENANCY
-- =====================================================

-- Organizations (for enterprise accounts)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Billing
    billing_email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'enterprise',
    contract_value DECIMAL(12,2),
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    
    -- Limits
    seat_limit INTEGER DEFAULT 100,
    storage_limit_gb INTEGER DEFAULT 10000,
    api_rate_limit INTEGER DEFAULT 100000,
    
    -- Compliance
    compliance_certifications JSONB DEFAULT '[]',
    data_residency_region VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    
    -- Permissions
    permissions JSONB DEFAULT '[]',
    
    -- Activity
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id),
    INDEX idx_org_members_org (organization_id),
    INDEX idx_org_members_user (user_id)
);

-- =====================================================
-- HIGH-PERFORMANCE ANALYTICS (TIMESCALEDB)
-- =====================================================

-- Real-time analytics events
CREATE TABLE analytics_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id UUID,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_value DECIMAL(12,4),
    
    -- Context
    properties JSONB DEFAULT '{}',
    
    -- Attribution
    referrer_url TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    
    -- Device/Browser
    user_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2),
    device_type VARCHAR(20),
    
    -- Performance
    page_load_time_ms INTEGER,
    api_response_time_ms INTEGER,
    
    PRIMARY KEY (time, event_id)
);

-- Convert to hypertable
SELECT create_hypertable('analytics_events', 'time', 
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- Add compression policy
ALTER TABLE analytics_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'event_type, user_id'
);

SELECT add_compression_policy('analytics_events', INTERVAL '7 days');

-- Revenue analytics
CREATE TABLE revenue_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Transaction details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    type VARCHAR(50) NOT NULL, -- subscription, one-time, commission, etc
    
    -- Attribution
    source VARCHAR(50),
    campaign VARCHAR(255),
    referral_user_id UUID,
    
    -- Subscription details
    subscription_tier VARCHAR(50),
    billing_period VARCHAR(20),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('revenue_events', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE);

-- =====================================================
-- AI/ML FEATURE STORE
-- =====================================================

-- User embeddings for personalization
CREATE TABLE user_embeddings (
    user_id UUID PRIMARY KEY,
    
    -- Different embedding types
    content_preference_embedding vector(512),
    behavior_embedding vector(512),
    social_graph_embedding vector(256),
    
    -- Model metadata
    model_version VARCHAR(50),
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_user_embeddings_computed (computed_at)
);

-- Content embeddings for recommendations
CREATE TABLE content_embeddings (
    content_id UUID PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    
    -- Embeddings
    semantic_embedding vector(768),
    visual_embedding vector(512),
    audio_embedding vector(256),
    
    -- Metadata
    quality_score DECIMAL(5,4),
    engagement_score DECIMAL(5,4),
    
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECURITY & AUDIT LOGS
-- =====================================================

-- Immutable audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Actor
    user_id UUID,
    organization_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Security
    risk_score DECIMAL(5,4),
    flagged BOOLEAN DEFAULT false,
    
    -- Blockchain proof
    blockchain_hash VARCHAR(255),
    
    CHECK (timestamp <= NOW()) -- Prevent future-dated entries
) PARTITION BY RANGE (timestamp);

-- Monthly partitions for audit log
SELECT create_monthly_partitions('audit_log', 
    '2024-01-01'::date, 
    '2030-01-01'::date);

-- Make audit log append-only
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- User lookup indexes
CREATE INDEX idx_users_data_email_gin ON users_data USING gin(email gin_trgm_ops);
CREATE INDEX idx_users_data_username_gin ON users_data USING gin(username gin_trgm_ops);
CREATE INDEX idx_users_data_referral_code ON users_data(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_users_data_referred_by ON users_data(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX idx_users_data_subscription ON users_data(subscription_tier, subscription_status);
CREATE INDEX idx_users_data_viral_score ON users_data(viral_score DESC) WHERE viral_score > 0;

-- Commission indexes
CREATE INDEX idx_commission_pending ON commission_ledger(beneficiary_id, created_at) 
    WHERE status = 'pending';
CREATE INDEX idx_commission_payout ON commission_ledger(status, created_at) 
    WHERE status IN ('approved', 'pending');

-- Analytics indexes
CREATE INDEX idx_analytics_user_time ON analytics_events(user_id, time DESC);
CREATE INDEX idx_analytics_type_time ON analytics_events(event_type, time DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, time);

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- User metrics summary (refreshed hourly)
CREATE MATERIALIZED VIEW user_metrics_summary AS
SELECT 
    u.id,
    u.subscription_tier,
    u.viral_score,
    COUNT(DISTINCT r.referred_id) as direct_referrals,
    COUNT(DISTINCT r2.referred_id) as second_level_referrals,
    COALESCE(SUM(c.commission_amount), 0) as total_commissions,
    COALESCE(SUM(CASE WHEN c.created_at > NOW() - INTERVAL '30 days' 
        THEN c.commission_amount ELSE 0 END), 0) as monthly_commissions,
    COUNT(DISTINCT a.achievement_id) as achievements_unlocked,
    MAX(ae.time) as last_active
FROM users_data u
LEFT JOIN referral_edges r ON r.referrer_id = u.id AND r.level = 1
LEFT JOIN referral_edges r2 ON r2.referrer_id = u.id AND r2.level = 2
LEFT JOIN commission_ledger c ON c.beneficiary_id = u.id AND c.status = 'paid'
LEFT JOIN user_achievements a ON a.user_id = u.id AND a.unlocked = true
LEFT JOIN analytics_events ae ON ae.user_id = u.id
GROUP BY u.id, u.subscription_tier, u.viral_score;

CREATE UNIQUE INDEX idx_user_metrics_summary_id ON user_metrics_summary(id);

-- Revenue summary by day (refreshed daily)
CREATE MATERIALIZED VIEW daily_revenue_summary AS
SELECT 
    DATE(time) as date,
    COUNT(DISTINCT user_id) as unique_payers,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as average_transaction,
    SUM(CASE WHEN type = 'subscription' THEN amount ELSE 0 END) as subscription_revenue,
    SUM(CASE WHEN type = 'commission' THEN amount ELSE 0 END) as commission_revenue,
    SUM(CASE WHEN referral_user_id IS NOT NULL THEN amount ELSE 0 END) as referred_revenue
FROM revenue_events
WHERE time >= NOW() - INTERVAL '90 days'
GROUP BY DATE(time);

CREATE UNIQUE INDEX idx_daily_revenue_date ON daily_revenue_summary(date);

-- =====================================================
-- STORED PROCEDURES FOR COMPLEX OPERATIONS
-- =====================================================

-- Calculate and distribute commissions
CREATE OR REPLACE FUNCTION calculate_commissions(
    p_transaction_id UUID,
    p_user_id UUID,
    p_amount DECIMAL(12,2),
    p_transaction_type VARCHAR(50)
) RETURNS TABLE (
    beneficiary_id UUID,
    level INTEGER,
    commission_amount DECIMAL(12,4)
) AS $$
DECLARE
    v_current_user_id UUID := p_user_id;
    v_level INTEGER := 1;
    v_referrer_id UUID;
    v_commission_rate DECIMAL(5,4);
    v_user_tier VARCHAR(50);
BEGIN
    -- Loop through referral chain
    WHILE v_level <= 7 AND v_current_user_id IS NOT NULL LOOP
        -- Get referrer
        SELECT u.referred_by, u.subscription_tier 
        INTO v_referrer_id, v_user_tier
        FROM users_data u
        WHERE u.id = v_current_user_id;
        
        IF v_referrer_id IS NULL THEN
            EXIT; -- No more referrers
        END IF;
        
        -- Get commission rate
        SELECT cr.commission_rate INTO v_commission_rate
        FROM commission_rules cr
        WHERE cr.subscription_tier = v_user_tier
        AND cr.level = v_level
        AND CURRENT_DATE BETWEEN cr.effective_date AND COALESCE(cr.expiry_date, '9999-12-31'::date)
        LIMIT 1;
        
        IF v_commission_rate > 0 THEN
            -- Return commission record
            beneficiary_id := v_referrer_id;
            level := v_level;
            commission_amount := p_amount * v_commission_rate;
            RETURN NEXT;
            
            -- Insert into ledger
            INSERT INTO commission_ledger (
                transaction_id, beneficiary_id, source_user_id, 
                level, base_amount, commission_rate, commission_amount
            ) VALUES (
                p_transaction_id, v_referrer_id, p_user_id,
                v_level, p_amount, v_commission_rate, p_amount * v_commission_rate
            );
        END IF;
        
        -- Move up the chain
        v_current_user_id := v_referrer_id;
        v_level := v_level + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update viral network metrics
CREATE OR REPLACE FUNCTION update_viral_metrics(p_user_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_total_descendants INTEGER;
    v_active_descendants INTEGER;
    v_total_revenue DECIMAL(15,2);
    v_network_depth INTEGER;
BEGIN
    -- Calculate network metrics using recursive CTE
    WITH RECURSIVE network AS (
        -- Base case: direct referrals
        SELECT 
            referred_id as user_id,
            1 as level,
            revenue_contribution
        FROM referral_edges
        WHERE referrer_id = p_user_id
        
        UNION ALL
        
        -- Recursive case: descendants
        SELECT 
            re.referred_id,
            n.level + 1,
            re.revenue_contribution
        FROM network n
        JOIN referral_edges re ON re.referrer_id = n.user_id
        WHERE n.level < 7 -- Limit depth
    )
    SELECT 
        COUNT(DISTINCT user_id),
        COUNT(DISTINCT CASE WHEN level <= 3 THEN user_id END),
        COALESCE(SUM(revenue_contribution), 0),
        COALESCE(MAX(level), 0)
    INTO 
        v_total_descendants,
        v_active_descendants,
        v_total_revenue,
        v_network_depth
    FROM network;
    
    -- Update or insert viral network record
    INSERT INTO viral_networks (
        user_id, network_depth, total_descendants, 
        active_descendants, total_revenue_generated
    ) VALUES (
        p_user_id, v_network_depth, v_total_descendants,
        v_active_descendants, v_total_revenue
    )
    ON CONFLICT (user_id) DO UPDATE SET
        network_depth = EXCLUDED.network_depth,
        total_descendants = EXCLUDED.total_descendants,
        active_descendants = EXCLUDED.active_descendants,
        total_revenue_generated = EXCLUDED.total_revenue_generated,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Auto-generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code = UPPER(
            SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 6) || 
            SUBSTRING(MD5(random()::TEXT) FROM 1 FOR 4)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code 
    BEFORE INSERT ON users_data
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Track referral relationships
CREATE OR REPLACE FUNCTION track_referral() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referred_by IS NOT NULL THEN
        INSERT INTO referral_edges (referrer_id, referred_id, level)
        VALUES (NEW.referred_by, NEW.id, 1);
        
        -- Update referrer's metrics
        UPDATE users_data 
        SET total_referrals = total_referrals + 1
        WHERE id = NEW.referred_by;
        
        -- Trigger viral metrics update
        PERFORM update_viral_metrics(NEW.referred_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_new_referral 
    AFTER INSERT ON users_data
    FOR EACH ROW EXECUTE FUNCTION track_referral();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample achievement definitions
INSERT INTO achievement_definitions (code, name, description, category, criteria, points, rarity) VALUES
('first_blood', 'First Blood', 'Create your first video', 'creation', '{"videos_created": 1}', 10, 'common'),
('viral_sensation', 'Viral Sensation', 'Get 10,000 views on a single video', 'performance', '{"max_views": 10000}', 100, 'rare'),
('network_effect', 'Network Effect', 'Refer 10 active users', 'referral', '{"active_referrals": 10}', 50, 'uncommon'),
('money_maker', 'Money Maker', 'Earn $1,000 in commissions', 'revenue', '{"commission_earned": 1000}', 200, 'epic'),
('empire_builder', 'Empire Builder', 'Build a network of 1,000+ users', 'referral', '{"network_size": 1000}', 500, 'legendary');

-- =====================================================
-- MONITORING & MAINTENANCE
-- =====================================================

-- Table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query performance view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- Connection monitoring
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    datname,
    usename,
    state,
    COUNT(*) as connection_count,
    MAX(state_change) as last_activity
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname, usename, state
ORDER BY connection_count DESC;

-- =====================================================
-- PERMISSIONS & SECURITY
-- =====================================================

-- Create roles
CREATE ROLE dailydoco_app WITH LOGIN PASSWORD 'secure_password_here';
CREATE ROLE dailydoco_analytics WITH LOGIN PASSWORD 'analytics_password_here';
CREATE ROLE dailydoco_admin WITH LOGIN PASSWORD 'admin_password_here';

-- Grant permissions
GRANT CONNECT ON DATABASE dailydoco TO dailydoco_app, dailydoco_analytics;
GRANT USAGE ON SCHEMA public TO dailydoco_app, dailydoco_analytics;

-- App permissions (read/write main tables)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO dailydoco_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO dailydoco_app;

-- Analytics permissions (read-only)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dailydoco_analytics;

-- Admin permissions (everything)
GRANT ALL PRIVILEGES ON DATABASE dailydoco TO dailydoco_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dailydoco_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dailydoco_admin;

-- Row Level Security for multi-tenancy
ALTER TABLE users_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_isolation ON users_data
    FOR ALL USING (
        id = current_setting('app.current_user_id')::UUID OR
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = current_setting('app.current_user_id')::UUID
            AND om.organization_id = (
                SELECT organization_id FROM organization_members
                WHERE user_id = users_data.id
            )
        )
    );

-- =====================================================
-- FINAL OPTIMIZATION
-- =====================================================

-- Analyze all tables for query planner
ANALYZE;

-- Create statistics for multi-column indexes
CREATE STATISTICS user_subscription_stats ON subscription_tier, subscription_status FROM users_data;
CREATE STATISTICS commission_status_stats ON status, created_at FROM commission_ledger;
CREATE STATISTICS analytics_event_stats ON event_type, user_id, time FROM analytics_events;

-- Set table parameters for performance
ALTER TABLE analytics_events SET (fillfactor = 90); -- Leave room for updates
ALTER TABLE commission_ledger SET (fillfactor = 100); -- Append-only
ALTER TABLE users_data SET (fillfactor = 85); -- Frequent updates

-- Enable parallel queries
ALTER TABLE users_data SET (parallel_workers = 8);
ALTER TABLE analytics_events SET (parallel_workers = 16);
ALTER TABLE commission_ledger SET (parallel_workers = 8);

COMMENT ON SCHEMA public IS 'DailyDoco Pro $100 BILLION Database Schema - Designed for 10M+ users with viral mechanics';
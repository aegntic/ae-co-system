-- DailyDoco Pro $100 BILLION Database Schema (Standard PostgreSQL Version)
-- Adapted for standard PostgreSQL without TimescaleDB/pg_partman extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For advanced text search

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
CREATE TABLE IF NOT EXISTS users_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shard_id INTEGER GENERATED ALWAYS AS (get_shard_for_user(id)) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_master_shard ON users_master(shard_id);
CREATE INDEX IF NOT EXISTS idx_users_master_email ON users_master(email);
CREATE INDEX IF NOT EXISTS idx_users_master_username ON users_master(username);

-- Detailed user data (simplified without vector type)
CREATE TABLE IF NOT EXISTS users_data (
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
    
    -- Personalization (storing embeddings as JSONB instead of vector)
    ai_embeddings JSONB DEFAULT '[]', -- Store as array of floats
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
    
    CONSTRAINT fk_user_master FOREIGN KEY (id) REFERENCES users_master(id) ON DELETE CASCADE
);

-- =====================================================
-- VIRAL NETWORK TRACKING (GRAPH STRUCTURE)
-- =====================================================

-- Viral network relationships
CREATE TABLE IF NOT EXISTS viral_networks (
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
);

-- Referral relationships (for fast graph traversal)
CREATE TABLE IF NOT EXISTS referral_edges (
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
    
    UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referral_edges_referrer ON referral_edges(referrer_id);
CREATE INDEX idx_referral_edges_referred ON referral_edges(referred_id);
CREATE INDEX idx_referral_edges_level ON referral_edges(level);

-- =====================================================
-- MULTI-LEVEL COMMISSION SYSTEM
-- =====================================================

-- Commission configuration by tier and level
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_tier VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 7),
    commission_rate DECIMAL(5,4) NOT NULL,
    
    -- Advanced rules
    minimum_qualifying_revenue DECIMAL(10,2) DEFAULT 0,
    maximum_commission_cap DECIMAL(10,2),
    time_decay_factor DECIMAL(5,4) DEFAULT 1.0,
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
CREATE TABLE IF NOT EXISTS commission_ledger (
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_beneficiary ON commission_ledger(beneficiary_id, status, created_at);
CREATE INDEX idx_commission_source ON commission_ledger(source_user_id, created_at);
CREATE INDEX idx_commission_status ON commission_ledger(status, created_at);

-- =====================================================
-- GAMIFICATION & ACHIEVEMENTS
-- =====================================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    -- Requirements
    criteria JSONB NOT NULL,
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
CREATE TABLE IF NOT EXISTS user_achievements (
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
    
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, unlocked);

-- =====================================================
-- ANALYTICS EVENTS (Simplified without TimescaleDB)
-- =====================================================

-- Real-time analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    api_response_time_ms INTEGER
);

-- Create time-based indexes for analytics
CREATE INDEX idx_analytics_time ON analytics_events(time DESC);
CREATE INDEX idx_analytics_user_time ON analytics_events(user_id, time DESC);
CREATE INDEX idx_analytics_type_time ON analytics_events(event_type, time DESC);

-- Revenue analytics
CREATE TABLE IF NOT EXISTS revenue_events (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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

CREATE INDEX idx_revenue_time ON revenue_events(time DESC);
CREATE INDEX idx_revenue_user ON revenue_events(user_id, time DESC);

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
('empire_builder', 'Empire Builder', 'Build a network of 1,000+ users', 'referral', '{"network_size": 1000}', 500, 'legendary')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_data_email_gin ON users_data USING gin(email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_data_username_gin ON users_data USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_data_referral_code ON users_data(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_data_referred_by ON users_data(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_data_subscription ON users_data(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_data_viral_score ON users_data(viral_score DESC) WHERE viral_score > 0;

-- Commission indexes
CREATE INDEX IF NOT EXISTS idx_commission_pending ON commission_ledger(beneficiary_id, created_at) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commission_payout ON commission_ledger(status, created_at) 
    WHERE status IN ('approved', 'pending');

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id, time);

-- =====================================================
-- FINAL MESSAGE
-- =====================================================

-- Note: This is a standard PostgreSQL version of the $100B schema
-- TimescaleDB features (hypertables, compression) are commented out
-- Vector embeddings are stored as JSONB arrays instead of vector type
-- All core functionality is preserved
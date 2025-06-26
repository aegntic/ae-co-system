-- ================================================================================================
-- COMMISSION TIER ENHANCEMENT: ADD MISSING 30% TIER
-- Critical Fix: Implements 4-tier progression as defined in founding documents
-- ================================================================================================

-- Add 'growing' tier to commission_tier enum
ALTER TYPE commission_tier ADD VALUE 'growing' AFTER 'new';

-- Enhanced commission calculation function with 4-tier progression
CREATE OR REPLACE FUNCTION calculate_commission_rate(
    p_user_id UUID,
    p_relationship_months INTEGER
)
RETURNS DECIMAL(5,3) AS $$
DECLARE
    v_base_rate DECIMAL(5,3);
    v_tier commission_tier;
    v_performance_bonus DECIMAL(5,3) := 0.000;
    v_quality_multiplier DECIMAL(5,3) := 1.000;
BEGIN
    -- Enhanced 4-tier progression as per founding documents
    IF p_relationship_months <= 9 THEN
        v_tier := 'new';
        v_base_rate := 0.200; -- 20% (Months 1-9: Activation & Momentum)
    ELSIF p_relationship_months <= 24 THEN
        v_tier := 'growing';
        v_base_rate := 0.250; -- 25% (Months 10-24: Commitment & Growth)
    ELSIF p_relationship_months <= 48 THEN
        v_tier := 'established';
        v_base_rate := 0.300; -- 30% (Months 25-48: Mastery & Leadership) ⚡ ENHANCED
    ELSE
        v_tier := 'legacy';
        v_base_rate := 0.400; -- 40% (Months 49+: Legacy & Partnership)
    END IF;
    
    -- Performance-based bonus calculation (up to +5%)
    SELECT LEAST(
        (COUNT(DISTINCT r.referred_user_id) * 0.005), 0.050
    ) INTO v_performance_bonus
    FROM referrals r 
    WHERE r.referrer_id = p_user_id 
    AND r.status = 'converted'
    AND r.created_at > NOW() - INTERVAL '12 months';
    
    -- Quality multiplier based on referral retention
    SELECT GREATEST(
        AVG(CASE 
            WHEN u.subscription_status = 'active' AND u.created_at < NOW() - INTERVAL '6 months' 
            THEN 1.1 
            ELSE 1.0 
        END), 1.0
    ) INTO v_quality_multiplier
    FROM referrals r
    JOIN users u ON r.referred_user_id = u.id
    WHERE r.referrer_id = p_user_id
    AND r.status = 'converted';
    
    -- Update user's commission tier
    UPDATE users 
    SET 
        commission_tier = v_tier,
        commission_tier_started_at = CASE 
            WHEN commission_tier != v_tier THEN NOW() 
            ELSE commission_tier_started_at 
        END
    WHERE id = p_user_id;
    
    -- Return final commission rate (capped at 45%)
    RETURN LEAST(
        (v_base_rate + v_performance_bonus) * v_quality_multiplier, 
        0.450
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced commission tracking function
CREATE OR REPLACE FUNCTION track_commission_earning(
    p_referrer_id UUID,
    p_referred_user_id UUID,
    p_subscription_amount DECIMAL(10,2),
    p_subscription_tier subscription_tier
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_commission_rate DECIMAL(5,3);
    v_commission_amount DECIMAL(10,2);
    v_relationship_months INTEGER;
BEGIN
    -- Calculate relationship duration
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600)
    INTO v_relationship_months
    FROM referrals 
    WHERE referrer_id = p_referrer_id 
    AND referred_user_id = p_referred_user_id;
    
    -- Get current commission rate
    v_commission_rate := calculate_commission_rate(p_referrer_id, v_relationship_months);
    
    -- Calculate commission amount
    v_commission_amount := p_subscription_amount * v_commission_rate;
    
    -- Record commission earning
    INSERT INTO commission_earnings (
        id,
        referrer_id,
        referred_user_id,
        commission_amount,
        commission_rate,
        subscription_amount,
        subscription_tier,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_referrer_id,
        p_referred_user_id,
        v_commission_amount,
        v_commission_rate,
        p_subscription_amount,
        p_subscription_tier,
        NOW()
    );
    
    -- Update lifetime commission for referrer
    UPDATE users 
    SET lifetime_commission_earned = lifetime_commission_earned + v_commission_amount
    WHERE id = p_referrer_id;
    
    RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commission dashboard view for enhanced UX
CREATE OR REPLACE VIEW user_commission_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.tier as subscription_tier,
    u.commission_tier,
    u.commission_tier_started_at,
    u.lifetime_commission_earned,
    u.lifetime_commission_paid,
    
    -- Current commission rate
    calculate_commission_rate(u.id, 
        EXTRACT(EPOCH FROM (NOW() - u.commission_tier_started_at)) / (30 * 24 * 3600)
    ) as current_commission_rate,
    
    -- Monthly commission stats
    COALESCE(monthly.commission_this_month, 0) as commission_this_month,
    COALESCE(monthly.referrals_this_month, 0) as referrals_this_month,
    
    -- Performance metrics
    COALESCE(performance.total_referrals, 0) as total_referrals,
    COALESCE(performance.active_referrals, 0) as active_referrals,
    COALESCE(performance.conversion_rate, 0) as conversion_rate,
    
    -- Next tier progression
    CASE u.commission_tier
        WHEN 'new' THEN 9 - EXTRACT(EPOCH FROM (NOW() - u.commission_tier_started_at)) / (30 * 24 * 3600)
        WHEN 'growing' THEN 24 - EXTRACT(EPOCH FROM (NOW() - u.created_at)) / (30 * 24 * 3600)
        WHEN 'established' THEN 48 - EXTRACT(EPOCH FROM (NOW() - u.created_at)) / (30 * 24 * 3600)
        ELSE 0
    END as months_to_next_tier,
    
    CASE u.commission_tier
        WHEN 'new' THEN 'growing'
        WHEN 'growing' THEN 'established'
        WHEN 'established' THEN 'legacy'
        ELSE 'legacy'
    END as next_tier
    
FROM users u

LEFT JOIN (
    SELECT 
        referrer_id,
        SUM(commission_amount) as commission_this_month,
        COUNT(*) as referrals_this_month
    FROM commission_earnings 
    WHERE created_at >= date_trunc('month', NOW())
    GROUP BY referrer_id
) monthly ON u.id = monthly.referrer_id

LEFT JOIN (
    SELECT 
        r.referrer_id,
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE r.status = 'converted') as active_referrals,
        (COUNT(*) FILTER (WHERE r.status = 'converted')::DECIMAL / COUNT(*)) as conversion_rate
    FROM referrals r
    GROUP BY r.referrer_id
) performance ON u.id = performance.referrer_id

WHERE u.tier IN ('pro', 'business', 'enterprise');

-- Index for dashboard performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commission_dashboard_lookup 
ON users(id, commission_tier, created_at) 
WHERE tier IN ('pro', 'business', 'enterprise');

-- Commission tier migration for existing users
UPDATE users 
SET commission_tier = CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600) <= 9 THEN 'new'
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600) <= 24 THEN 'growing'
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600) <= 48 THEN 'established'
    ELSE 'legacy'
END
WHERE commission_tier != 'legacy'; -- Don't downgrade legacy users

-- ================================================================================================
-- COMMISSION PSYCHOLOGY TRACKING
-- ================================================================================================

-- Track commission claims for monthly engagement psychology
CREATE TABLE IF NOT EXISTS commission_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    claim_amount DECIMAL(10,2) NOT NULL,
    claim_date TIMESTAMPTZ DEFAULT NOW(),
    claim_method TEXT DEFAULT 'dashboard', -- 'dashboard', 'auto', 'email'
    commission_period_start TIMESTAMPTZ NOT NULL,
    commission_period_end TIMESTAMPTZ NOT NULL,
    
    UNIQUE(user_id, commission_period_start, commission_period_end)
);

-- Index for claim tracking
CREATE INDEX IF NOT EXISTS idx_commission_claims_user_date 
ON commission_claims(user_id, claim_date DESC);

-- Function to process monthly commission claims
CREATE OR REPLACE FUNCTION process_monthly_commission_claim(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_claimable_amount DECIMAL(10,2);
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Calculate current month period
    v_period_start := date_trunc('month', NOW() - INTERVAL '1 month');
    v_period_end := date_trunc('month', NOW());
    
    -- Check if already claimed
    IF EXISTS(
        SELECT 1 FROM commission_claims 
        WHERE user_id = p_user_id 
        AND commission_period_start = v_period_start
    ) THEN
        RETURN 0;
    END IF;
    
    -- Calculate claimable amount
    SELECT COALESCE(SUM(commission_amount), 0)
    INTO v_claimable_amount
    FROM commission_earnings
    WHERE referrer_id = p_user_id
    AND created_at >= v_period_start
    AND created_at < v_period_end;
    
    -- Create claim record if amount > 0
    IF v_claimable_amount > 0 THEN
        INSERT INTO commission_claims (
            user_id,
            claim_amount,
            commission_period_start,
            commission_period_end
        ) VALUES (
            p_user_id,
            v_claimable_amount,
            v_period_start,
            v_period_end
        );
        
        -- Update paid amount
        UPDATE users 
        SET lifetime_commission_paid = lifetime_commission_paid + v_claimable_amount
        WHERE id = p_user_id;
    END IF;
    
    RETURN v_claimable_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================================
-- ENHANCED VIRAL METRICS WITH COMMISSION CORRELATION
-- ================================================================================================

-- Track viral performance by commission tier
CREATE OR REPLACE VIEW viral_performance_by_commission_tier AS
SELECT 
    u.commission_tier,
    COUNT(DISTINCT u.id) as user_count,
    AVG(u.viral_score) as avg_viral_score,
    AVG(u.lifetime_commission_earned) as avg_lifetime_commission,
    COUNT(DISTINCT w.id) as total_websites,
    AVG(w.viral_score) as avg_website_viral_score,
    COUNT(DISTINCT r.id) as total_referrals,
    
    -- Conversion metrics
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'converted') as converted_referrals,
    (COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'converted')::DECIMAL / 
     NULLIF(COUNT(DISTINCT r.id), 0)) * 100 as conversion_rate,
     
    -- Growth metrics
    COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '30 days') as recent_referrals,
    COUNT(DISTINCT ce.id) FILTER (WHERE ce.created_at > NOW() - INTERVAL '30 days') as recent_commissions
    
FROM users u
LEFT JOIN websites w ON u.id = w.user_id
LEFT JOIN referrals r ON u.id = r.referrer_id
LEFT JOIN commission_earnings ce ON u.id = ce.referrer_id
WHERE u.tier IN ('pro', 'business', 'enterprise')
GROUP BY u.commission_tier
ORDER BY 
    CASE u.commission_tier
        WHEN 'new' THEN 1
        WHEN 'growing' THEN 2
        WHEN 'established' THEN 3
        WHEN 'legacy' THEN 4
    END;

-- ================================================================================================
-- VALIDATION AND TESTING
-- ================================================================================================

-- Test commission rate calculation for all tiers
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_rate DECIMAL(5,3);
BEGIN
    -- Test new tier (month 6)
    test_rate := calculate_commission_rate(test_user_id, 6);
    ASSERT test_rate = 0.200, 'New tier should be 20%';
    
    -- Test growing tier (month 18)
    test_rate := calculate_commission_rate(test_user_id, 18);
    ASSERT test_rate = 0.250, 'Growing tier should be 25%';
    
    -- Test established tier (month 36)
    test_rate := calculate_commission_rate(test_user_id, 36);
    ASSERT test_rate = 0.300, 'Established tier should be 30%';
    
    -- Test legacy tier (month 60)
    test_rate := calculate_commission_rate(test_user_id, 60);
    ASSERT test_rate = 0.400, 'Legacy tier should be 40%';
    
    RAISE NOTICE 'All commission tier tests passed! ✅';
END $$;

-- ================================================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================================================

COMMENT ON TYPE commission_tier IS 'Enhanced 4-tier commission progression: new(20%) -> growing(25%) -> established(30%) -> legacy(40%)';
COMMENT ON FUNCTION calculate_commission_rate IS 'Enhanced commission calculation with 4-tier progression and performance bonuses';
COMMENT ON VIEW user_commission_dashboard IS 'Complete commission dashboard with tier progression and engagement psychology';

-- Schema enhancement completed successfully
SELECT 'Commission tier enhancement deployed successfully! 🚀' as status;
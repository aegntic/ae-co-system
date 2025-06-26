-- ================================================================================================
-- LEAD CAPTURE SCHEMA EXTENSION
-- Extends the existing viral mechanics schema with lead generation capabilities
-- Created: June 17, 2024
-- Purpose: Universal lead capture on every generated site
-- ================================================================================================

-- ================================================================================================
-- ADDITIONAL ENUMS FOR LEAD CAPTURE
-- ================================================================================================

-- Lead conversion status tracking
CREATE TYPE lead_conversion_status AS ENUM ('pending', 'contacted', 'qualified', 'converted', 'churned', 'unsubscribed');

-- Device types for analytics
CREATE TYPE device_type AS ENUM ('mobile', 'tablet', 'desktop', 'unknown');

-- Lead quality scoring
CREATE TYPE lead_quality AS ENUM ('low', 'medium', 'high', 'premium');

-- Social platform verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');

-- ================================================================================================
-- LEAD CAPTURE TABLES
-- ================================================================================================

-- Universal lead capture from all generated sites
CREATE TABLE public.waitlist_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core lead information
    email TEXT NOT NULL,
    source_site_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
    project_type TEXT, -- 'tech', 'creative', 'business', etc.
    template_used TEXT, -- Which template was used for the source site
    
    -- Lead interests and preferences
    project_interests TEXT[], -- Array of selected interests
    social_platforms_connected TEXT[], -- Platforms user indicated they use
    newsletter_opt_in BOOLEAN DEFAULT TRUE,
    
    -- Rich visitor metadata
    visitor_metadata JSONB NOT NULL, -- Contains session data, behavior, insights
    
    -- Lead scoring and qualification
    lead_score DECIMAL(5,2) DEFAULT 0.0, -- 0-100 scoring system
    lead_quality lead_quality DEFAULT 'low',
    conversion_status lead_conversion_status DEFAULT 'pending',
    
    -- Attribution and tracking
    referrer_url TEXT,
    utm_parameters JSONB,
    capture_source TEXT DEFAULT 'widget', -- 'widget', 'footer', 'inline', etc.
    
    -- Follow-up tracking
    contacted_at TIMESTAMPTZ,
    last_contacted_at TIMESTAMPTZ,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Conversion tracking
    converted_at TIMESTAMPTZ,
    conversion_value DECIMAL(10,2),
    user_id UUID REFERENCES public.users(id), -- Set when they sign up
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(email, source_site_id) -- Prevent duplicate submissions per site
);

-- Detailed visitor behavior tracking for analytics
CREATE TABLE public.visitor_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session identification
    session_id TEXT NOT NULL,
    site_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
    
    -- Visitor information
    visitor_ip INET,
    user_agent TEXT,
    referrer_url TEXT,
    
    -- Behavior data
    behavior_data JSONB NOT NULL, -- Rich behavioral analytics
    visit_duration INTEGER, -- seconds
    pages_viewed INTEGER DEFAULT 1,
    scroll_depth INTEGER, -- percentage
    interaction_count INTEGER DEFAULT 0,
    
    -- Device and environment
    device_type device_type DEFAULT 'unknown',
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    
    -- Conversion events
    conversion_event TEXT, -- 'waitlist_signup', 'email_capture', 'social_connect', etc.
    conversion_value DECIMAL(10,2),
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX (session_id),
    INDEX (site_id),
    INDEX (timestamp),
    INDEX (conversion_event)
);

-- Social platform connections and verifications
CREATE TABLE public.user_social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User association
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    waitlist_submission_id UUID REFERENCES public.waitlist_submissions(id) ON DELETE CASCADE,
    
    -- Platform information
    platform TEXT NOT NULL, -- 'github', 'linkedin', 'twitter', 'discord', 'telegram', etc.
    platform_user_id TEXT, -- Their user ID on that platform
    platform_username TEXT,
    platform_display_name TEXT,
    
    -- Verification details
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verification_metadata JSONB, -- OAuth tokens, verification proofs, etc.
    
    -- Social metrics
    follower_count INTEGER,
    following_count INTEGER,
    engagement_score DECIMAL(5,2), -- Platform-specific engagement metrics
    influence_score DECIMAL(5,2), -- Cross-platform influence calculation
    
    -- Connection details
    connected_via TEXT, -- 'aegntic', 'direct_oauth', 'manual_verification'
    requires_aegntic_verification BOOLEAN DEFAULT TRUE,
    aegntic_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(platform, platform_user_id),
    UNIQUE(user_id, platform) -- One connection per platform per user
);

-- Lead nurturing campaigns and sequences
CREATE TABLE public.lead_nurturing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign details
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT, -- 'welcome_series', 'interest_based', 'reengagement', etc.
    
    -- Targeting criteria
    target_lead_quality lead_quality[],
    target_project_interests TEXT[],
    target_lead_score_min DECIMAL(5,2),
    target_lead_score_max DECIMAL(5,2),
    
    -- Campaign configuration
    sequence_steps JSONB NOT NULL, -- Array of email/contact steps
    delay_between_steps INTEGER, -- hours
    max_steps INTEGER DEFAULT 5,
    
    -- Performance tracking
    leads_enrolled INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    
    -- Campaign status
    active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead campaign enrollments and progress tracking
CREATE TABLE public.lead_campaign_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    waitlist_submission_id UUID NOT NULL REFERENCES public.waitlist_submissions(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.lead_nurturing_campaigns(id) ON DELETE CASCADE,
    
    -- Enrollment details
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    current_step INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    
    -- Progress tracking
    last_contact_at TIMESTAMPTZ,
    next_contact_at TIMESTAMPTZ,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'unsubscribed'
    completion_reason TEXT, -- 'converted', 'unsubscribed', 'bounced', 'completed'
    
    -- Performance data
    engagement_score DECIMAL(5,2) DEFAULT 0.0,
    conversion_probability DECIMAL(5,3), -- ML-predicted conversion likelihood
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(waitlist_submission_id, campaign_id)
);

-- ================================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Waitlist submissions indexes
CREATE INDEX idx_waitlist_submissions_email ON public.waitlist_submissions(email);
CREATE INDEX idx_waitlist_submissions_source_site ON public.waitlist_submissions(source_site_id);
CREATE INDEX idx_waitlist_submissions_lead_score ON public.waitlist_submissions(lead_score DESC);
CREATE INDEX idx_waitlist_submissions_conversion_status ON public.waitlist_submissions(conversion_status);
CREATE INDEX idx_waitlist_submissions_created_at ON public.waitlist_submissions(created_at DESC);
CREATE INDEX idx_waitlist_submissions_project_interests ON public.waitlist_submissions USING GIN (project_interests);

-- Visitor tracking indexes
CREATE INDEX idx_visitor_tracking_session ON public.visitor_tracking(session_id);
CREATE INDEX idx_visitor_tracking_site ON public.visitor_tracking(site_id);
CREATE INDEX idx_visitor_tracking_timestamp ON public.visitor_tracking(timestamp DESC);
CREATE INDEX idx_visitor_tracking_conversion ON public.visitor_tracking(conversion_event) WHERE conversion_event IS NOT NULL;

-- Social connections indexes
CREATE INDEX idx_social_connections_user ON public.user_social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON public.user_social_connections(platform);
CREATE INDEX idx_social_connections_verification ON public.user_social_connections(verification_status);
CREATE INDEX idx_social_connections_aegntic ON public.user_social_connections(aegntic_verified) WHERE aegntic_verified = TRUE;

-- Campaign enrollment indexes
CREATE INDEX idx_campaign_enrollments_submission ON public.lead_campaign_enrollments(waitlist_submission_id);
CREATE INDEX idx_campaign_enrollments_campaign ON public.lead_campaign_enrollments(campaign_id);
CREATE INDEX idx_campaign_enrollments_next_contact ON public.lead_campaign_enrollments(next_contact_at) WHERE status = 'active';

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================================

-- Enable RLS on all tables
ALTER TABLE public.waitlist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_nurturing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- Waitlist submissions policies
CREATE POLICY "Public can insert waitlist submissions" ON public.waitlist_submissions
    FOR INSERT WITH CHECK (true); -- Allow anonymous submissions

CREATE POLICY "Users can view own submissions" ON public.waitlist_submissions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.websites WHERE id = source_site_id
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "Site owners can view submissions for their sites" ON public.waitlist_submissions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.websites WHERE id = source_site_id
        )
    );

-- Visitor tracking policies (read-only for site owners)
CREATE POLICY "Public can insert visitor tracking" ON public.visitor_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Site owners can view visitor tracking" ON public.visitor_tracking
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.websites WHERE id = site_id
        )
    );

-- Social connections policies
CREATE POLICY "Users can manage own social connections" ON public.user_social_connections
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public can insert social connections" ON public.user_social_connections
    FOR INSERT WITH CHECK (true); -- For waitlist submissions

-- Campaign policies (admin only for now)
CREATE POLICY "Admin can manage campaigns" ON public.lead_nurturing_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND tier = 'enterprise'
        )
    );

CREATE POLICY "Users can view campaign enrollments" ON public.lead_campaign_enrollments
    FOR SELECT USING (
        waitlist_submission_id IN (
            SELECT id FROM public.waitlist_submissions WHERE user_id = auth.uid()
        )
    );

-- ================================================================================================
-- TRIGGERS AND FUNCTIONS
-- ================================================================================================

-- Function to update lead score based on social connections
CREATE OR REPLACE FUNCTION update_lead_score_on_social_connection()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lead score when social connections are verified
    IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
        UPDATE public.waitlist_submissions 
        SET 
            lead_score = LEAST(lead_score + 
                CASE NEW.platform
                    WHEN 'github' THEN 15
                    WHEN 'linkedin' THEN 10
                    WHEN 'twitter' THEN 8
                    WHEN 'discord' THEN 5
                    WHEN 'telegram' THEN 5
                    ELSE 3
                END, 100),
            lead_quality = CASE 
                WHEN lead_score + 15 >= 80 THEN 'premium'
                WHEN lead_score + 15 >= 60 THEN 'high'
                WHEN lead_score + 15 >= 40 THEN 'medium'
                ELSE 'low'
            END,
            updated_at = NOW()
        WHERE waitlist_submission_id = NEW.waitlist_submission_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for social connection verification
CREATE TRIGGER trigger_update_lead_score_on_social_connection
    AFTER UPDATE ON public.user_social_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_on_social_connection();

-- Function to automatically enroll high-quality leads in nurturing campaigns
CREATE OR REPLACE FUNCTION auto_enroll_leads_in_campaigns()
RETURNS TRIGGER AS $$
DECLARE
    campaign_record RECORD;
BEGIN
    -- Auto-enroll leads in appropriate campaigns based on quality and interests
    FOR campaign_record IN 
        SELECT * FROM public.lead_nurturing_campaigns 
        WHERE active = TRUE 
        AND (
            NEW.lead_quality = ANY(target_lead_quality) OR 
            target_lead_quality IS NULL
        )
        AND (
            NEW.lead_score >= target_lead_score_min OR 
            target_lead_score_min IS NULL
        )
        AND (
            NEW.lead_score <= target_lead_score_max OR 
            target_lead_score_max IS NULL
        )
    LOOP
        -- Check if lead interests match campaign targeting
        IF campaign_record.target_project_interests IS NULL OR 
           NEW.project_interests && campaign_record.target_project_interests THEN
            
            INSERT INTO public.lead_campaign_enrollments (
                waitlist_submission_id,
                campaign_id,
                next_contact_at
            ) VALUES (
                NEW.id,
                campaign_record.id,
                NOW() + INTERVAL '1 hour' -- Start nurturing after 1 hour
            ) ON CONFLICT (waitlist_submission_id, campaign_id) DO NOTHING;
            
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-enrollment in campaigns
CREATE TRIGGER trigger_auto_enroll_leads
    AFTER INSERT OR UPDATE OF lead_score, lead_quality ON public.waitlist_submissions
    FOR EACH ROW
    EXECUTE FUNCTION auto_enroll_leads_in_campaigns();

-- Function to update website viral score when leads convert
CREATE OR REPLACE FUNCTION update_website_viral_on_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- Boost viral score of source website when lead converts
    IF NEW.conversion_status = 'converted' AND OLD.conversion_status != 'converted' THEN
        UPDATE public.websites 
        SET 
            viral_score = viral_score + (NEW.lead_score * 0.1), -- 10% of lead score added to viral score
            external_share_count = external_share_count + 1, -- Count conversion as share
            updated_at = NOW()
        WHERE id = NEW.source_site_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for viral score updates
CREATE TRIGGER trigger_update_website_viral_on_conversion
    AFTER UPDATE OF conversion_status ON public.waitlist_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_website_viral_on_lead_conversion();

-- ================================================================================================
-- UTILITY FUNCTIONS
-- ================================================================================================

-- Function to get lead analytics for a specific site
CREATE OR REPLACE FUNCTION get_site_lead_analytics(site_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_leads', COUNT(*),
        'conversion_rate', ROUND(
            (COUNT(*) FILTER (WHERE conversion_status = 'converted')::DECIMAL / 
             NULLIF(COUNT(*), 0)) * 100, 2
        ),
        'average_lead_score', ROUND(AVG(lead_score), 2),
        'quality_distribution', json_build_object(
            'premium', COUNT(*) FILTER (WHERE lead_quality = 'premium'),
            'high', COUNT(*) FILTER (WHERE lead_quality = 'high'),
            'medium', COUNT(*) FILTER (WHERE lead_quality = 'medium'),
            'low', COUNT(*) FILTER (WHERE lead_quality = 'low')
        ),
        'top_interests', (
            SELECT json_agg(interest ORDER BY cnt DESC) 
            FROM (
                SELECT unnest(project_interests) AS interest, COUNT(*) AS cnt
                FROM public.waitlist_submissions 
                WHERE source_site_id = site_uuid
                GROUP BY interest 
                ORDER BY cnt DESC 
                LIMIT 5
            ) interests
        ),
        'platform_connections', (
            SELECT json_object_agg(platform, cnt)
            FROM (
                SELECT unnest(social_platforms_connected) AS platform, COUNT(*) AS cnt
                FROM public.waitlist_submissions 
                WHERE source_site_id = site_uuid
                GROUP BY platform
            ) platforms
        )
    ) INTO result
    FROM public.waitlist_submissions 
    WHERE source_site_id = site_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate viral coefficient including lead generation impact
CREATE OR REPLACE FUNCTION calculate_viral_coefficient_with_leads(site_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    base_coefficient DECIMAL;
    lead_boost DECIMAL;
    total_coefficient DECIMAL;
BEGIN
    -- Get base viral coefficient
    SELECT viral_boost_multiplier INTO base_coefficient
    FROM public.websites 
    WHERE id = site_uuid;
    
    -- Calculate lead generation boost
    SELECT 
        COALESCE(
            1.0 + (
                (COUNT(*) FILTER (WHERE lead_quality IN ('high', 'premium')) * 0.1) +
                (COUNT(*) FILTER (WHERE conversion_status = 'converted') * 0.2)
            ), 1.0
        ) INTO lead_boost
    FROM public.waitlist_submissions 
    WHERE source_site_id = site_uuid;
    
    total_coefficient := LEAST(base_coefficient * lead_boost, 5.0); -- Cap at 5x
    
    -- Update the website record
    UPDATE public.websites 
    SET 
        viral_coefficient = total_coefficient,
        updated_at = NOW()
    WHERE id = site_uuid;
    
    RETURN total_coefficient;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- INITIAL DATA AND CONFIGURATION
-- ================================================================================================

-- Create default lead nurturing campaigns
INSERT INTO public.lead_nurturing_campaigns (name, description, campaign_type, target_lead_quality, sequence_steps) VALUES
(
    'Welcome Series - High Quality Leads',
    'Onboarding sequence for high-quality leads with multiple social connections',
    'welcome_series',
    ARRAY['high', 'premium']::lead_quality[],
    '[
        {
            "step": 1,
            "delay_hours": 1,
            "type": "email",
            "subject": "Welcome to 4site.pro - Your GitHub projects deserve better",
            "template": "welcome_high_quality"
        },
        {
            "step": 2, 
            "delay_hours": 48,
            "type": "email",
            "subject": "See what others are building with 4site.pro",
            "template": "social_proof"
        },
        {
            "step": 3,
            "delay_hours": 120,
            "type": "email", 
            "subject": "Ready to transform your GitHub presence?",
            "template": "conversion_focused"
        }
    ]'::jsonb
),
(
    'Re-engagement Campaign',
    'Re-activate leads who showed interest but haven''t converted',
    'reengagement', 
    ARRAY['medium', 'high']::lead_quality[],
    '[
        {
            "step": 1,
            "delay_hours": 168,
            "type": "email",
            "subject": "Don''t let your projects go unnoticed",
            "template": "reengagement_value"
        },
        {
            "step": 2,
            "delay_hours": 336,
            "type": "email",
            "subject": "Last chance: Transform your GitHub repos",
            "template": "final_offer"
        }
    ]'::jsonb
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.waitlist_submissions TO anon, authenticated;
GRANT SELECT, INSERT ON public.visitor_tracking TO anon, authenticated;
GRANT ALL ON public.user_social_connections TO authenticated;
GRANT SELECT ON public.lead_nurturing_campaigns TO authenticated;
GRANT SELECT ON public.lead_campaign_enrollments TO authenticated;
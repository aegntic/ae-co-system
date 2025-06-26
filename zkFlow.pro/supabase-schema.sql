-- zkFlow.pro Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'trialing',
    subscription_tier TEXT DEFAULT 'free',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    credits_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License keys table
CREATE TABLE public.license_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    tier TEXT NOT NULL CHECK (tier IN ('free', 'professional', 'team', 'enterprise')),
    max_devices INTEGER DEFAULT 1,
    devices_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installations tracking
CREATE TABLE public.installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key_id UUID REFERENCES public.license_keys(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    browser_info JSONB,
    ip_address INET,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_key_id, device_id)
);

-- Form fills analytics
CREATE TABLE public.form_fills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES public.installations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    form_type TEXT,
    fields_count INTEGER,
    fill_duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    seats_limit INTEGER DEFAULT 5,
    seats_used INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Stored procedures

-- Generate license key for user
CREATE OR REPLACE FUNCTION generate_license_key(
    p_user_id UUID,
    p_tier TEXT,
    p_max_devices INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
    v_license_id UUID;
BEGIN
    INSERT INTO public.license_keys (user_id, tier, max_devices)
    VALUES (p_user_id, p_tier, p_max_devices)
    RETURNING id INTO v_license_id;
    
    RETURN v_license_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate license key
CREATE OR REPLACE FUNCTION validate_license(
    p_license_key TEXT,
    p_device_id TEXT
)
RETURNS TABLE (
    is_valid BOOLEAN,
    tier TEXT,
    user_id UUID,
    message TEXT
) AS $$
DECLARE
    v_license RECORD;
    v_installation RECORD;
BEGIN
    -- Find license
    SELECT * INTO v_license
    FROM public.license_keys
    WHERE key = p_license_key
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, 'Invalid license key'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_license.valid_until IS NOT NULL AND v_license.valid_until < NOW() THEN
        UPDATE public.license_keys
        SET status = 'expired'
        WHERE id = v_license.id;
        
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, 'License expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check existing installation
    SELECT * INTO v_installation
    FROM public.installations
    WHERE license_key_id = v_license.id
    AND device_id = p_device_id;
    
    IF FOUND THEN
        -- Update last active
        UPDATE public.installations
        SET last_active = NOW()
        WHERE id = v_installation.id;
        
        RETURN QUERY SELECT true, v_license.tier, v_license.user_id, 'Valid'::TEXT;
        RETURN;
    END IF;
    
    -- Check device limit
    IF v_license.devices_count >= v_license.max_devices THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, 'Device limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Create new installation
    INSERT INTO public.installations (license_key_id, device_id)
    VALUES (v_license.id, p_device_id);
    
    -- Update device count
    UPDATE public.license_keys
    SET devices_count = devices_count + 1
    WHERE id = v_license.id;
    
    RETURN QUERY SELECT true, v_license.tier, v_license.user_id, 'Valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track form fill
CREATE OR REPLACE FUNCTION track_form_fill(
    p_installation_id UUID,
    p_domain TEXT,
    p_form_type TEXT DEFAULT NULL,
    p_fields_count INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_success BOOLEAN DEFAULT true,
    p_error TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_form_fill_id UUID;
BEGIN
    INSERT INTO public.form_fills (
        installation_id,
        domain,
        form_type,
        fields_count,
        fill_duration_ms,
        success,
        error_message
    )
    VALUES (
        p_installation_id,
        p_domain,
        p_form_type,
        p_fields_count,
        p_duration_ms,
        p_success,
        p_error
    )
    RETURNING id INTO v_form_fill_id;
    
    -- Update installation last active
    UPDATE public.installations
    SET last_active = NOW()
    WHERE id = p_installation_id;
    
    RETURN v_form_fill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- License keys policies
CREATE POLICY "Users can view own licenses"
    ON public.license_keys FOR SELECT
    USING (auth.uid() = user_id);

-- Installations policies
CREATE POLICY "Users can view own installations"
    ON public.installations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.license_keys
            WHERE license_keys.id = installations.license_key_id
            AND license_keys.user_id = auth.uid()
        )
    );

-- Form fills policies
CREATE POLICY "Users can view own form fills"
    ON public.form_fills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.installations
            JOIN public.license_keys ON license_keys.id = installations.license_key_id
            WHERE installations.id = form_fills.installation_id
            AND license_keys.user_id = auth.uid()
        )
    );

-- Teams policies
CREATE POLICY "Team members can view team"
    ON public.teams FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_license_keys_updated_at
    BEFORE UPDATE ON public.license_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX idx_license_keys_user_id ON public.license_keys(user_id);
CREATE INDEX idx_license_keys_key ON public.license_keys(key);
CREATE INDEX idx_installations_license_key_id ON public.installations(license_key_id);
CREATE INDEX idx_installations_device_id ON public.installations(device_id);
CREATE INDEX idx_form_fills_installation_id ON public.form_fills(installation_id);
CREATE INDEX idx_form_fills_created_at ON public.form_fills(created_at);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
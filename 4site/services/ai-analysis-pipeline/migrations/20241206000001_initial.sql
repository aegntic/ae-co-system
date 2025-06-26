-- Initial migration for analysis metrics table
-- This assumes the main schema is already created

-- Create analytics schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS analytics;

-- Analysis metrics table for performance tracking
CREATE TABLE IF NOT EXISTS analytics.analysis_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    ai_model_used VARCHAR(100),
    analysis_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Add foreign key if repositories table exists
    CONSTRAINT fk_analysis_metrics_repository 
        FOREIGN KEY (repository_id) 
        REFERENCES repositories(id) 
        ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_analysis_metrics_repository_id 
    ON analytics.analysis_metrics(repository_id);
CREATE INDEX IF NOT EXISTS idx_analysis_metrics_created_at 
    ON analytics.analysis_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_metrics_success 
    ON analytics.analysis_metrics(success);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Audit function for sensitive operations
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple audit logging - in production, this would be more comprehensive
    RAISE NOTICE 'Audit: % on table % at %', TG_OP, TG_TABLE_NAME, NOW();
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';
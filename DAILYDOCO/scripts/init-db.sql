-- DailyDoco Pro Database Initialization
-- Sets up database schema for the complete application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects and capture sessions
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_path VARCHAR(500),
    fingerprint JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video capture sessions
CREATE TABLE capture_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_size BIGINT,
    duration_seconds INTEGER
);

-- AI test audience results
CREATE TABLE test_audience_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_session_id UUID NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    overall_score INTEGER,
    engagement_prediction JSONB,
    ctr_prediction JSONB,
    retention_curve JSONB,
    suggestions TEXT[],
    audience_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- aegnt-27 authenticity results
CREATE TABLE aegnt27_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_session_id UUID NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    authenticity_score INTEGER,
    humanization_applied JSONB,
    detection_resistance JSONB,
    naturalness_metrics JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time system metrics (TimescaleDB hypertable)
CREATE TABLE system_metrics (
    time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metric_type VARCHAR(50) NOT NULL,
    service VARCHAR(50) NOT NULL,
    value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (time, metric_type, service)
);

-- Convert to hypertable for time-series data
SELECT create_hypertable('system_metrics', 'time');

-- Performance monitoring
CREATE TABLE performance_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_type VARCHAR(100) NOT NULL,
    target_metric VARCHAR(100) NOT NULL,
    measured_value NUMERIC NOT NULL,
    target_value NUMERIC NOT NULL,
    passed BOOLEAN NOT NULL,
    metadata JSONB DEFAULT '{}',
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User brand profiles for personal learning
CREATE TABLE user_brand_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_name VARCHAR(255),
    voice_characteristics JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',
    performance_history JSONB DEFAULT '{}',
    learned_patterns JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video processing queue
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_session_id UUID NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    queue_position INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    processor_node VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    progress_percentage INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_capture_sessions_project_id ON capture_sessions(project_id);
CREATE INDEX idx_capture_sessions_status ON capture_sessions(status);
CREATE INDEX idx_system_metrics_time ON system_metrics(time DESC);
CREATE INDEX idx_system_metrics_service ON system_metrics(service, time DESC);
CREATE INDEX idx_processing_queue_status ON processing_queue(status, queue_position);
CREATE INDEX idx_user_brand_profiles_user_id ON user_brand_profiles(user_id);

-- Insert default admin user (password: 'admin123' - change in production!)
INSERT INTO users (email, username, password_hash, subscription_tier) VALUES
('admin@dailydoco.pro', 'admin', '$2b$10$rQ7ZQ9ZQ9ZQ9ZQ9ZQ9ZQ9eKgVgVgVgVgVgVgVgVgVgVgVgVgVgVgVg', 'enterprise');

-- Insert sample performance targets
INSERT INTO performance_benchmarks (benchmark_type, target_metric, measured_value, target_value, passed) VALUES
('capture_performance', 'cpu_usage_percent', 4.5, 5.0, true),
('capture_performance', 'fps_4k', 35, 30, true),
('capture_performance', 'memory_usage_mb', 180, 200, true),
('ai_authenticity', 'aegnt27_score', 95, 95, true),
('processing_speed', 'realtime_multiplier', 1.7, 2.0, true);

-- Grant permissions (adjust for your security requirements)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dailydoco;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dailydoco;
-- Initialize YouTube Intelligence Engine Database
-- Create UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial database tables (these will be further managed by the application)
-- The application will handle all schema creation through its migration system

-- Grant permissions to intelligence_user
GRANT ALL PRIVILEGES ON DATABASE youtube_intelligence TO intelligence_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO intelligence_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO intelligence_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO intelligence_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO intelligence_user;

-- Enable UUID generation
SELECT uuid_generate_v4();
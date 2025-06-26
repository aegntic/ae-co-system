# Environment Setup Guide - 4site.pro MVP with Lead Generation & Social Verification

This guide helps you set up the complete development environment for 4site.pro MVP, including the aegntic-first social verification system and universal lead capture functionality.

## Quick Start

```bash
# 1. Navigate to the project directory
cd 4site-pro/project4site_-github-readme-to-site-generator/

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 4. Start development servers
npm run dev
# This starts both Vite (port 5173) and Express API (port 3001)
```

## Required Environment Variables

### Core AI Integration (.env.local)
```bash
# Google Gemini API for site generation (REQUIRED)
VITE_GEMINI_API_KEY=your_actual_gemini_api_key

# GitHub API for repository access (OPTIONAL - enhances rate limits)
VITE_GITHUB_TOKEN=your_github_pat_token

# Supabase for database and authentication (REQUIRED for lead capture)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Server Configuration
API_PORT=3001
BASE_URL=http://localhost:5173
```

### Social Verification Platform APIs (.env.local)
```bash
# Aegntic Integration (REQUIRED for social verification)
AEGNTIC_API_URL=https://api.aegntic.com
AEGNTIC_API_KEY=your_aegntic_api_key

# OAuth Applications for Social Platforms
# GitHub OAuth App
GITHUB_CLIENT_ID=your_github_oauth_app_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret

# LinkedIn OAuth App  
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Twitter/X OAuth App
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Discord OAuth App
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Telegram Bot (for bot-based verification)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/social/telegram-webhook
```

## API Key Setup Instructions

### 1. Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing
3. Enable the Gemini API
4. Generate an API key
5. Add to `.env.local` as `VITE_GEMINI_API_KEY`

### 2. Supabase Setup
1. Create account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings > API
4. Copy Project URL and anon public key
5. Run the database schema setup:
   ```bash
   # Run lead capture schema
   psql -h your-db-host -U your-user -d your-db -f database/lead-capture-schema-extension.sql
   
   # Run social verification schema
   psql -h your-db-host -U your-user -d your-db -f database/social-verification-schema-extension.sql
   ```

### 3. GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3001/api/social/callback/github`
4. Copy Client ID and Client Secret

### 4. LinkedIn OAuth App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Set redirect URL: `http://localhost:3001/api/social/callback/linkedin`
5. Copy Client ID and Client Secret

### 5. Twitter/X OAuth App
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Set up OAuth 2.0 settings
4. Set callback URL: `http://localhost:3001/api/social/callback/twitter`
5. Copy Client ID and Client Secret

### 6. Discord OAuth App
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create "New Application"
3. Go to OAuth2 settings
4. Set redirect URL: `http://localhost:3001/api/social/callback/discord`
5. Copy Client ID and Client Secret

### 7. Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command
3. Follow instructions to create bot
4. Copy the bot token
5. Set webhook URL: `http://localhost:3001/api/social/telegram-webhook`

### 8. Aegntic Integration
1. Contact aegntic team for API access
2. Get API key and base URL
3. Configure webhook endpoints for verification callbacks

## Development Workflow

### Starting Development
```bash
# Start both frontend and API server
npm run dev

# Or start individually
npm run dev:vite    # Frontend only (port 5173)
npm run dev:api     # API server only (port 3001)
```

### Testing Lead Capture System
1. Visit `http://localhost:5173`
2. Generate a test site
3. Interact with the lead capture widget (bottom-right)
4. Verify data appears in Supabase `waitlist_submissions` table

### Testing Social Verification
1. Complete lead capture flow
2. Click "Verify with aegntic" in the social platforms step
3. Test OAuth flows for each platform
4. Verify connections appear in `user_social_connections` table

### Database Management
```bash
# Connect to your Supabase database
psql postgresql://user:pass@host:port/database

# Check lead capture data
SELECT COUNT(*) FROM waitlist_submissions;

# Check social verification data  
SELECT platform, COUNT(*) FROM user_social_connections GROUP BY platform;

# Calculate user verification scores
SELECT * FROM calculate_user_verification_score('test@example.com');
```

## Available NPM Scripts

```bash
# Development
npm run dev                 # Start both Vite + API server
npm run dev:vite           # Frontend only
npm run dev:api            # API server only
npm run dev:force          # Force restart with cache clearing

# Production
npm run build              # Build for production
npm run preview            # Preview production build

# Utilities
npm run ports:check        # Check which ports are in use
npm run ports:kill         # Kill processes on project ports
npm run api:start          # Start API server in production mode
npm run setup:supabase     # Run Supabase setup script
npm run validate:viral     # Validate viral mechanics functionality
```

## Environment Configuration Files

### .env.local.example
Create this file as a template for new developers:
```bash
# Copy this file to .env.local and fill in your actual values

# REQUIRED: AI Integration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# REQUIRED: Database  
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OPTIONAL: Enhanced GitHub access
VITE_GITHUB_TOKEN=ghp_your_github_token_here

# REQUIRED: Aegntic integration
AEGNTIC_API_URL=https://api.aegntic.com
AEGNTIC_API_KEY=your_aegntic_api_key_here

# REQUIRED: Social platform OAuth credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# Server configuration
API_PORT=3001
BASE_URL=http://localhost:5173
```

## Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Errors
- Verify API keys are correctly set in `.env.local`
- Ensure no extra spaces or quotes around keys
- Restart development server after changing environment variables

#### 2. Database Connection Issues
- Check Supabase URL and key are correct
- Verify database schema has been applied
- Check Supabase project is active and not paused

#### 3. OAuth Callback Errors
- Verify callback URLs match in OAuth app settings
- Check that the Express server is running on port 3001
- Ensure OAuth app is configured correctly for development

#### 4. Social Verification Not Working
- Check aegntic API is accessible
- Verify webhook URLs are reachable
- Check platform OAuth apps are approved and active

#### 5. Port Conflicts
```bash
# Check what's using your ports
npm run ports:check

# Kill conflicting processes
npm run ports:kill

# Or manually kill specific ports
lsof -ti :5173 | xargs kill -9
lsof -ti :3001 | xargs kill -9
```

### Debugging Tips

#### Enable Debug Logging
```bash
# In .env.local, add:
DEBUG=*
NODE_ENV=development
VITE_DEBUG=true
```

#### Check API Endpoints
```bash
# Test health check
curl http://localhost:3001/api/health

# Test lead capture
curl -X POST http://localhost:3001/api/leads/capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","siteId":"test123","metadata":{}}'

# Test social verification endpoints
curl http://localhost:3001/api/social/verified-platforms/test@example.com
```

#### Monitor Database Activity
```sql
-- In Supabase SQL editor, monitor real-time activity:
SELECT * FROM waitlist_submissions ORDER BY created_at DESC LIMIT 10;
SELECT * FROM user_social_connections ORDER BY verified_at DESC LIMIT 10;
SELECT * FROM aegntic_integration_logs ORDER BY created_at DESC LIMIT 10;
```

## Production Deployment

### Environment Variables for Production
```bash
# Production API URLs
BASE_URL=https://your-production-domain.com
AEGNTIC_API_URL=https://api.aegntic.com

# Update OAuth callback URLs to production domain
# GitHub: https://your-domain.com/api/social/callback/github
# LinkedIn: https://your-domain.com/api/social/callback/linkedin
# etc.

# Production Supabase (if different from development)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
```

### Deployment Checklist
- [ ] Update OAuth app callback URLs to production domain
- [ ] Configure production Supabase instance
- [ ] Set up production database schema
- [ ] Configure aegntic webhooks for production
- [ ] Set up Telegram bot webhook for production domain
- [ ] Test all social verification flows in production
- [ ] Set up monitoring and error tracking
- [ ] Configure backup and disaster recovery

## Support & Documentation

### Key Files to Understand
- `components/universal/LeadCaptureWidget.tsx` - Main lead capture interface
- `components/auth/SocialVerificationModal.tsx` - Social verification interface  
- `server/api-server.js` - Main API server with lead capture endpoints
- `server/routes/socialVerification.js` - Social verification API endpoints
- `database/lead-capture-schema-extension.sql` - Database schema for leads
- `database/social-verification-schema-extension.sql` - Database schema for social verification

### External Documentation
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [LinkedIn OAuth 2.0](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Twitter OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Discord OAuth2](https://discord.com/developers/docs/topics/oauth2)
- [Telegram Bot API](https://core.telegram.org/bots/api)

This comprehensive setup ensures the full 4site.pro MVP with universal lead capture and aegntic-first social verification is ready for development and deployment.
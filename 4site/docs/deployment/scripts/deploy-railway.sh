#!/bin/bash

echo "🚀 Deploying API to Railway..."

# Install Railway CLI if needed
if ! command -v railway &> /dev/null; then
    curl -fsSL https://railway.app/install.sh | sh
fi

# Login to Railway
railway login

# Link to project
railway link

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=$SUPABASE_URL
railway variables set SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
railway variables set REDIS_URL=$REDIS_URL
railway variables set GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
railway variables set SENDGRID_API_KEY=$SENDGRID_API_KEY
railway variables set SENTRY_DSN=$SENTRY_DSN

# Deploy
echo "📦 Deploying to Railway..."
railway up

# Get deployment URL
DEPLOYMENT_URL=$(railway status --json | jq -r '.url')
echo "✅ API deployed to: $DEPLOYMENT_URL"

# Update DNS
echo "🌐 Updating DNS records..."
# Add CNAME record: api.4site.pro -> your-api.railway.app
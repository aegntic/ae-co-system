#!/bin/bash

echo "🚀 Deploying 4site.pro to Vercel..."

# Load environment
source .env.production.local

# Build application
echo "📦 Building production bundle..."
NODE_ENV=production npm run build

# Run tests
echo "🧪 Running tests..."
npm test -- --run

# Check build size
echo "📊 Checking build size..."
du -sh dist

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel --prod --token=$VERCEL_TOKEN

# Set environment variables
echo "🔧 Setting production environment variables..."
vercel env pull
vercel env add VITE_SUPABASE_URL production < .env.production.local
vercel env add VITE_SUPABASE_ANON_KEY production < .env.production.local
vercel env add VITE_GEMINI_API_KEY production < .env.production.local
vercel env add VITE_GITHUB_CLIENT_ID production < .env.production.local

# Alias to custom domain
echo "🌐 Setting up custom domain..."
vercel alias set 4site.pro

echo "✅ Deployment complete!"
echo "🔗 Live at: https://4site.pro"
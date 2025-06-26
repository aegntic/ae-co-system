#!/bin/bash

# Production Services Automation
echo "🚀 Setting up production services..."

# Vercel Environment Variables (Production Ready)
echo "☁️  Configuring Vercel production environment..."

# Create production environment script
cat > setup-production-env.sh << 'PRODEOF'
#!/bin/bash

# Production Environment Setup
echo "Setting production environment variables..."

# Replace with actual production values:
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-production-anon-key"
export SUPABASE_SERVICE_KEY="your-production-service-key"
export STRIPE_PUBLISHABLE_KEY="pk_live_your-production-key"
export STRIPE_SECRET_KEY="sk_live_your-production-key"
export STRIPE_WEBHOOK_SECRET="whsec_your-production-secret"

# Vercel deployment with production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production "$SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_KEY production "$SUPABASE_SERVICE_KEY"
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production "$STRIPE_PUBLISHABLE_KEY"
vercel env add STRIPE_SECRET_KEY production "$STRIPE_SECRET_KEY"
vercel env add STRIPE_WEBHOOK_SECRET production "$STRIPE_WEBHOOK_SECRET"
vercel env add NEXT_PUBLIC_APP_URL production "https://zkflow.pro"
vercel env add NEXT_PUBLIC_FREE_TRIAL_DAYS production "7"

echo "✅ Production environment configured"
echo "🚀 Deploying: vercel --prod"

# Trigger production deployment
vercel --prod

echo "🎉 Production deployment complete!"
echo "🌐 Live at: https://zkflow.pro"
PRODEOF

chmod +x setup-production-env.sh

echo "✅ Production scripts created"
echo "📋 Next: Add real API keys to setup-production-env.sh"

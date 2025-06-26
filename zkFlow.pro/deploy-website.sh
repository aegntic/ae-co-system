#\!/bin/bash

# zkFlow.pro Website Deployment Script

echo "🚀 zkFlow.pro Website Deployment"
echo "================================"
echo ""

# Check if we're in the right directory
if [ \! -d "website" ]; then
    echo "❌ Error: website directory not found"
    echo "   Please run this from the zkFlow.pro root directory"
    exit 1
fi

cd website

# Check if node_modules exists
if [ \! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the website
echo ""
echo "🔨 Building website for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix any errors and try again."
    exit 1
fi

echo ""
echo "✅ Build successful\!"
echo ""

# Check if Vercel CLI is installed
if \! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 DNS Configuration for zkflow.pro"
echo "==================================="
echo ""
echo "Please ensure these DNS records are set in Porkbun:"
echo ""
echo "1. A Record:"
echo "   Type: A"
echo "   Name: @ (or blank)"
echo "   Value: 76.76.21.21"
echo "   TTL: 600"
echo ""
echo "2. CNAME Record:"
echo "   Type: CNAME"
echo "   Name: www"
echo "   Value: cname.vercel-dns.com"
echo "   TTL: 600"
echo ""

read -p "Have you configured the DNS records? (y/n) " -n 1 -r
echo ""

if [[ \! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please configure DNS first at: https://porkbun.com"
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "When prompted:"
echo "1. Log in with your Vercel account"
echo "2. Link to existing project or create new"
echo "3. Project name: zkflow-pro"
echo "4. Add domain: zkflow.pro"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "📋 Post-Deployment Steps:"
echo "========================"
echo ""
echo "1. Add Environment Variables in Vercel Dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "2. Configure Supabase:"
echo "   - Run the schema: supabase-schema.sql"
echo "   - Enable Row Level Security"
echo "   - Set up authentication"
echo ""
echo "3. Configure Stripe:"
echo "   - Add webhook endpoint: https://zkflow.pro/api/webhooks/stripe"
echo "   - Create products and prices"
echo "   - Test payment flow"
echo ""
echo "4. Update Chrome Extension:"
echo "   - Set homepage_url to https://zkflow.pro"
echo "   - Update API endpoints to production URL"
echo ""
echo "✅ Deployment complete\!"
echo "🌐 Your website will be live at https://zkflow.pro once DNS propagates (5-30 minutes)"
EOF < /dev/null

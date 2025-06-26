#!/bin/bash

# zkFlow.pro Services Setup - Supabase + Stripe via API
echo "🚀 zkFlow.pro Services Setup"
echo "============================"

# Check if we're in the right directory
if [ ! -f "supabase-schema.sql" ]; then
    echo "❌ Please run from zkFlow.pro root directory"
    exit 1
fi

echo ""
echo "🔐 API Keys Required:"
echo "1. Supabase Access Token: https://supabase.com/dashboard/account/tokens"
echo "2. Stripe Secret Key: https://dashboard.stripe.com/apikeys"
echo ""

# Check for Supabase token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
    echo "   Get from: https://supabase.com/dashboard/account/tokens"
    echo "   Set with: export SUPABASE_ACCESS_TOKEN=your_token"
    echo ""
else
    echo "✅ Supabase token found"
fi

# Check for Stripe key
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set"
    echo "   Get from: https://dashboard.stripe.com/apikeys"
    echo "   Set with: export STRIPE_SECRET_KEY=sk_test_your_key"
    echo ""
else
    echo "✅ Stripe key found"
fi

echo ""
echo "🎯 Setup Options:"
echo "1. Setup both Supabase + Stripe (recommended)"
echo "2. Setup Supabase only"
echo "3. Setup Stripe only"
echo "4. Manual setup guide"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo "🔄 Setting up both services..."
        echo ""
        echo "📊 Setting up Supabase..."
        node setup-supabase-api.js
        echo ""
        echo "💳 Setting up Stripe..."
        node setup-stripe-api.js
        ;;
    2)
        echo "📊 Setting up Supabase..."
        node setup-supabase-api.js
        ;;
    3)
        echo "💳 Setting up Stripe..."
        node setup-stripe-api.js
        ;;
    4)
        echo "📖 Opening manual setup guide..."
        cat QUICK_SETUP_GUIDE.md
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📋 Next Steps:"
echo "1. Copy environment variables to Vercel dashboard"
echo "2. Redeploy website: git push (triggers auto-deploy)"
echo "3. Test payment flow with Stripe test cards"
echo "4. Submit Chrome extension to store"
echo ""
echo "🌐 Your site: https://zkflow.pro"
echo "⚙️  Vercel dashboard: https://vercel.com/dashboard"
echo ""
echo "✅ Setup complete!"
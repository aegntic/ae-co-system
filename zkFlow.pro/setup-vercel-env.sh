#!/bin/bash
# Vercel Environment Variables Setup
echo "Setting up Vercel environment variables..."

# Note: These are development values
# Replace with actual production values before launch

vercel env add NEXT_PUBLIC_SUPABASE_URL production "https://demo-zkflow.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key"  
vercel env add SUPABASE_SERVICE_KEY production "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-service-key"
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production "pk_test_51Demo1234567890"
vercel env add STRIPE_SECRET_KEY production "sk_test_51Demo1234567890"
vercel env add STRIPE_WEBHOOK_SECRET production "whsec_demo1234567890"
vercel env add NEXT_PUBLIC_APP_URL production "https://zkflow.pro"
vercel env add NEXT_PUBLIC_FREE_TRIAL_DAYS production "7"

echo "✅ Vercel environment configured"
echo "🌐 Redeploy: vercel --prod"

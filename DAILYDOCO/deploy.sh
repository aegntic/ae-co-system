#!/bin/bash

# DailyDoco Pro Production Deployment Script
# Deploys the web dashboard to Vercel

echo "🚀 Deploying DailyDoco Pro to production..."

# Navigate to web dashboard
cd apps/web-dashboard

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build for production
echo "🔨 Building for production..."
bun run build

# Deploy to Vercel
echo "☁️  Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your production URL will be displayed above"
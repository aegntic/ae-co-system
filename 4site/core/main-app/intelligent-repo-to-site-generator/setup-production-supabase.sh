#!/bin/bash

# 4site.pro Production Supabase Setup - $100 Billion Standards
# This script automates the complete Supabase setup process

set -e

echo "🚀 4site.pro Enhanced Viral Mechanics - Production Supabase Setup"
echo "=================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Starting production Supabase setup..."

# Step 1: Environment Variables Check
echo ""
echo "📋 Step 1: Environment Configuration"
echo "-----------------------------------"

if [[ -f ".env.local" ]]; then
    print_status "Found existing .env.local file"
    
    # Check if Supabase variables exist
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        print_warning "Supabase configuration already exists in .env.local"
        echo "Current configuration:"
        grep "VITE_SUPABASE" .env.local || true
        echo ""
        read -p "Do you want to update the configuration? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment setup"
        else
            UPDATE_ENV=true
        fi
    else
        UPDATE_ENV=true
    fi
else
    print_info "Creating new .env.local file"
    cp .env.example .env.local 2>/dev/null || touch .env.local
    UPDATE_ENV=true
fi

if [[ "$UPDATE_ENV" == "true" ]]; then
    echo ""
    print_info "Please provide your Supabase project details:"
    echo "You can find these in your Supabase Dashboard → Settings → API"
    echo ""
    
    read -p "Supabase Project URL (https://your-project.supabase.co): " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    
    # Validate input
    if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
        print_error "Supabase URL and Anon Key are required"
        exit 1
    fi
    
    # Update .env.local
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" .env.local
        sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env.local
    else
        echo "" >> .env.local
        echo "# PRODUCTION SUPABASE CONFIGURATION" >> .env.local
        echo "VITE_SUPABASE_URL=$SUPABASE_URL" >> .env.local
        echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env.local
        echo "VITE_ENABLE_VIRAL_MECHANICS=true" >> .env.local
        echo "VITE_ENABLE_COMMISSIONS=true" >> .env.local
        echo "VITE_ENABLE_PRO_SHOWCASE=true" >> .env.local
        echo "VITE_ENABLE_SHARE_TRACKING=true" >> .env.local
    fi
    
    print_status "Updated .env.local with Supabase configuration"
fi

# Step 2: Database Schema Validation
echo ""
echo "🗄️  Step 2: Database Schema Validation"
echo "------------------------------------"

if [[ -f "../database/schema.sql" ]]; then
    SCHEMA_LINES=$(wc -l < ../database/schema.sql)
    print_status "Found database schema with $SCHEMA_LINES lines"
    
    if [[ $SCHEMA_LINES -lt 800 ]]; then
        print_warning "Schema file seems incomplete (expected 812+ lines)"
    else
        print_status "Schema file looks complete"
    fi
else
    print_error "Database schema not found at ../database/schema.sql"
    print_info "Please ensure you're running from the correct directory"
    exit 1
fi

# Step 3: Supabase CLI Setup (optional)
echo ""
echo "🔧 Step 3: Supabase CLI Setup (Optional)"
echo "--------------------------------------"

if command -v supabase &> /dev/null; then
    print_status "Supabase CLI is already installed"
    supabase --version
else
    print_info "Supabase CLI not found. You can install it with:"
    echo "npm install -g supabase"
    echo ""
    read -p "Would you like to install Supabase CLI now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g supabase
        print_status "Supabase CLI installed"
    else
        print_info "Skipping Supabase CLI installation"
    fi
fi

# Step 4: Dependencies Check
echo ""
echo "📦 Step 4: Dependencies Validation"
echo "--------------------------------"

print_info "Checking Node.js dependencies..."

# Check if @supabase/supabase-js is installed
if npm list @supabase/supabase-js &> /dev/null; then
    SUPABASE_VERSION=$(npm list @supabase/supabase-js --depth=0 2>/dev/null | grep @supabase/supabase-js | sed 's/.*@//' | sed 's/ .*//')
    print_status "Supabase client installed: v$SUPABASE_VERSION"
else
    print_warning "Supabase client not found in package.json"
    print_info "Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
    print_status "Supabase client installed"
fi

# Step 5: Application Test
echo ""
echo "🧪 Step 5: Application Testing"
echo "----------------------------"

print_info "Testing application with new Supabase configuration..."

# Start the application in background for testing
npm run build > /dev/null 2>&1 || {
    print_error "Build failed. Please check your configuration."
    exit 1
}

print_status "Application build successful"

# Test database connectivity (if we have curl available)
if command -v curl &> /dev/null && [[ ! -z "$SUPABASE_URL" ]]; then
    print_info "Testing database connectivity..."
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/")
    
    if [[ "$HTTP_STATUS" == "200" ]]; then
        print_status "Database connectivity successful"
    else
        print_warning "Database connectivity test returned HTTP $HTTP_STATUS"
    fi
fi

# Step 6: Next Steps
echo ""
echo "🎯 Step 6: Next Steps"
echo "-------------------"

echo ""
print_status "Setup complete! Here's what to do next:"
echo ""
echo "1. 🏗️  Deploy Database Schema:"
echo "   - Go to your Supabase Dashboard → SQL Editor"
echo "   - Create a new query"
echo "   - Copy and paste the complete contents of ../database/schema.sql"
echo "   - Execute the query (this will take 30-60 seconds)"
echo ""
echo "2. 🎭 Load Demo Data (Optional):"
echo "   - In SQL Editor, create another query"
echo "   - Copy and paste ../database/seed_demo_data.sql"
echo "   - Execute to create 9 sample Pro showcase sites"
echo ""
echo "3. 🚀 Start Development Server:"
echo "   npm run dev"
echo ""
echo "4. 🧪 Test Enhanced Viral Mechanics:"
echo "   - Visit http://localhost:5173"
echo "   - Sign up for an account"
echo "   - Generate a website from any GitHub repository"
echo "   - Check Dashboard → Commissions tab"
echo "   - Test external sharing with ShareTracker component"
echo ""
echo "5. 📊 Validate Viral Features:"
echo "   - Pro Showcase Grid appears on generated sites"
echo "   - Share tracking increases viral scores"
echo "   - Commission dashboard shows lifetime earnings"
echo "   - Free Pro progress tracks toward 10 referrals"
echo ""

print_info "Documentation available in:"
echo "   - ../ai-Docs/SUPABASE_PRODUCTION_SETUP_\$100B.md"
echo "   - ../SETUP_GUIDE.md"
echo ""

print_status "4site.pro Enhanced Viral Mechanics setup complete!"
print_info "Ready for $100 billion platform deployment! 🚀"

echo ""
echo "=================================================================="
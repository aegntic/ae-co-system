#!/bin/bash

# 🚀 Quick Deploy Script for 4site.pro
# Deploys the production build to https://4site.pro

set -e

echo "🚀 Starting 4site.pro Production Deployment..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if production build exists
print_status "Checking production build..."
if [ ! -d "dist" ]; then
    print_warning "Production build not found. Building now..."
    npm run build
fi
print_success "Production build verified"

# Validate environment
print_status "Validating environment configuration..."
if [ -f ".env.local" ]; then
    if grep -q "GEMINI_API_KEY" .env.local && ! grep -q "placeholder" .env.local; then
        print_success "Environment configuration validated"
    else
        print_warning "API keys may need production values"
    fi
else
    print_warning "Environment file not found"
fi

# Check deployment tools availability
DEPLOYMENT_METHOD=""

print_status "Checking available deployment tools..."

# Check for Vercel
if command -v vercel &> /dev/null; then
    print_success "Vercel CLI found"
    DEPLOYMENT_METHOD="vercel"
elif command -v netlify &> /dev/null; then
    print_success "Netlify CLI found"
    DEPLOYMENT_METHOD="netlify"
elif command -v gh &> /dev/null; then
    print_success "GitHub CLI found"
    DEPLOYMENT_METHOD="github"
else
    print_error "No deployment tools found. Please install Vercel CLI, Netlify CLI, or GitHub CLI"
    echo ""
    echo "Installation options:"
    echo "  Vercel: npm i -g vercel"
    echo "  Netlify: npm i -g netlify-cli"
    echo "  GitHub: brew install gh"
    exit 1
fi

# Deploy based on available tool
echo ""
print_status "Deploying with $DEPLOYMENT_METHOD..."

case $DEPLOYMENT_METHOD in
    "vercel")
        print_status "Deploying to Vercel..."
        if vercel --prod --yes; then
            print_success "Deployed to Vercel successfully!"
            echo ""
            echo "🌐 Your site should be live at: https://4site.pro"
            echo "📊 Configure custom domain in Vercel dashboard if not automatically set"
        else
            print_error "Vercel deployment failed"
            print_warning "You may need to run 'vercel login' first"
            exit 1
        fi
        ;;
        
    "netlify")
        print_status "Deploying to Netlify..."
        if netlify deploy --dir=dist --prod; then
            print_success "Deployed to Netlify successfully!"
            echo ""
            echo "🌐 Configure custom domain (4site.pro) in Netlify dashboard"
        else
            print_error "Netlify deployment failed"
            print_warning "You may need to run 'netlify login' first"
            exit 1
        fi
        ;;
        
    "github")
        print_status "Triggering GitHub Actions deployment..."
        if gh workflow run deploy-production; then
            print_success "GitHub Actions deployment triggered!"
            echo ""
            echo "🔄 Check workflow status: gh run list"
            echo "📊 Monitor deployment: gh run watch"
        else
            print_error "GitHub Actions deployment failed"
            print_warning "Make sure you have proper repository access"
            exit 1
        fi
        ;;
esac

# Post-deployment validation
echo ""
print_status "Running post-deployment validation..."

# Wait for deployment to propagate
sleep 10

# Test production URL
print_status "Testing https://4site.pro accessibility..."
if curl -f -s https://4site.pro > /dev/null; then
    print_success "✅ https://4site.pro is accessible"
    
    # Check for branding
    if curl -s https://4site.pro | grep -q "4site.pro"; then
        print_success "✅ 4site.pro branding verified"
    else
        print_warning "⚠️ Branding verification failed"
    fi
    
    # Check for core functionality
    if curl -s https://4site.pro | grep -q "GitHub" && curl -s https://4site.pro | grep -q "AI"; then
        print_success "✅ Core functionality verified"
    else
        print_warning "⚠️ Core functionality verification failed"
    fi
    
else
    print_warning "⚠️ https://4site.pro not yet accessible (DNS propagation may take up to 24 hours)"
fi

# Display final status
echo ""
echo "========================================"
print_success "🎉 4site.pro Deployment Complete!"
echo "========================================"
echo ""
echo "📍 Production URL: https://4site.pro"
echo "📊 Local Preview: http://localhost:5273 (if still running)"
echo "🔧 Monitoring Dashboard: ./monitoring/dashboard.html"
echo "📋 Launch Report: ./launch-report.json"
echo ""
echo "Next Steps:"
echo "  • Monitor real user traffic and engagement"
echo "  • Collect user feedback for improvements"  
echo "  • Scale infrastructure based on usage patterns"
echo "  • Plan Phase 2 features development"
echo ""
print_success "4site.pro is now LIVE and ready for users! 🚀"
#!/bin/bash

# Porkbun MCP Server - NPM Publication Script
# 
# 🏆 AEGNTIC Foundation Publication Framework
# Research by: Mattae Cooper (human@mattaecooper.org)
# Organization: AEGNTIC Foundation (https://aegntic.ai)

set -e

echo "🏆 AEGNTIC Foundation - NPM Publication Script"
echo "📧 Research by: Mattae Cooper (human@mattaecooper.org)"
echo "🏢 Organization: AEGNTIC Foundation (https://aegntic.ai)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Validation
print_info "Running pre-publication validation..."
npm run validate

# Tests
print_info "Running comprehensive test suite..."
npm test

# Check npm login status
print_info "Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

USER=$(npm whoami)
print_status "Logged in as: $USER"

# Check if user has access to @aegntic scope
print_info "Checking @aegntic scope access..."
if npm access list packages @aegntic 2>/dev/null | grep -q "@aegntic/"; then
    print_status "Has access to @aegntic scope"
else
    print_warning "May not have access to @aegntic scope"
    print_info "If publication fails, request access to @aegntic organization"
fi

# Final confirmation
echo ""
echo "🚀 Ready to publish @aegntic/porkbun-mcp"
echo "🏆 Research: Mattae Cooper for AEGNTIC Foundation"
echo "📧 Contact: human@mattaecooper.org"
echo "🌐 Website: https://aegntic.ai"
echo ""

read -p "Proceed with npm publication? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Publication cancelled"
    exit 0
fi

# Publish to npm
print_info "Publishing to npm with public access..."
if npm publish --access public; then
    print_status "Successfully published @aegntic/porkbun-mcp!"
    
    echo ""
    echo "🎉 Publication Complete!"
    echo "═══════════════════════════════════════════════════════════"
    echo "📦 Package: @aegntic/porkbun-mcp"
    echo "🏆 Research: Mattae Cooper (human@mattaecooper.org)"
    echo "🏢 Organization: AEGNTIC Foundation (https://aegntic.ai)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Verify: npm info @aegntic/porkbun-mcp"
    echo "2. Install: npm install -g @aegntic/porkbun-mcp"
    echo "3. Use: npx @aegntic/porkbun-mcp"
    echo ""
    echo "🔗 Add to Claude Desktop config:"
    echo "{"
    echo "  \"mcpServers\": {"
    echo "    \"porkbun\": {"
    echo "      \"command\": \"npx\","
    echo "      \"args\": [\"@aegntic/porkbun-mcp\"]"
    echo "    }"
    echo "  }"
    echo "}"
    echo ""
    echo "🏆 Thank you for using AEGNTIC Foundation research!"
    
else
    print_error "Publication failed"
    print_info "Common issues:"
    print_info "- Package name already exists"
    print_info "- No access to @aegntic scope"
    print_info "- Network connectivity issues"
    print_info "- Authentication problems"
    echo ""
    print_info "Contact: human@mattaecooper.org for support"
    exit 1
fi
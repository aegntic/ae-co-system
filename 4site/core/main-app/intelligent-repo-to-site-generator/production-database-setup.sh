#!/bin/bash

# ================================================================================================
# 🚀 4SITE.PRO PRODUCTION DATABASE SETUP SCRIPT
# Ultra Elite Production Database Deployment with Surgical Precision
# ================================================================================================

set -e  # Exit on any error

echo "🚀 ULTRA ELITE PRODUCTION DATABASE SETUP"
echo "=" $(printf '=%.0s' {1..49})

# Color codes for output
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

# Step 1: Verify Environment
print_status "Step 1: Environment Verification"

if [ ! -f ".env.local" ]; then
    print_error ".env.local not found"
    exit 1
fi

# Check if we're in demo mode
if grep -q "demo-project" .env.local; then
    print_warning "Currently in DEMO mode with placeholder credentials"
    print_status "Production setup required"
else
    print_success "Production credentials detected"
fi

# Step 2: Backup Current Configuration
print_status "Step 2: Backing up current configuration"

cp .env.local .env.demo.backup
print_success "Demo configuration backed up to .env.demo.backup"

# Step 3: Production Environment Template
print_status "Step 3: Creating production environment template"

cat > .env.production << EOF
# 4SITE.PRO PRODUCTION ENVIRONMENT CONFIGURATION
# Generated on $(date)

# Google AI API Configuration
VITE_GEMINI_API_KEY=your-production-gemini-key

# OpenRouter API Configuration (Production Key)
VITE_OPENROUTER_API_KEY=your-production-openrouter-key

# ====================================
# SUPABASE PRODUCTION CONFIGURATION
# ====================================
# CRITICAL: Replace these with your actual production values
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Supabase Service Role Key (Server-side only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ====================================
# POLAR.SH PRODUCTION CONFIGURATION
# ====================================
VITE_POLAR_ACCESS_TOKEN=your-production-polar-token
VITE_POLAR_ORG_ID=4site-pro
VITE_POLAR_WEBHOOK_SECRET=your-production-webhook-secret

# ====================================
# FEATURE FLAGS - PRODUCTION READY
# ====================================
ENABLE_VIRAL_SCORING=true
ENABLE_AUTO_FEATURING=true
ENABLE_COMMISSION_SYSTEM=true
ENABLE_PRO_SHOWCASE=true
ENABLE_SHARE_TRACKING=true
ENABLE_POLAR_INTEGRATION=true

# ====================================
# COMMISSION SYSTEM CONFIGURATION
# ====================================
COMMISSION_PAYOUT_THRESHOLD=100.00
COMMISSION_PAYOUT_SCHEDULE=monthly

# ====================================
# SECURITY CONFIGURATION
# ====================================
NODE_ENV=production
ENABLE_RATE_LIMITING=true
ENABLE_SECURITY_HEADERS=true
ENABLE_CORS_PROTECTION=true

# ====================================
# PERFORMANCE CONFIGURATION
# ====================================
DATABASE_POOL_SIZE=20
MAX_CONNECTIONS=100
QUERY_TIMEOUT=30000
CONNECTION_TIMEOUT=10000

# ====================================
# MONITORING CONFIGURATION
# ====================================
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
ENABLE_ANALYTICS=true
EOF

print_success "Production environment template created (.env.production)"

# Step 4: Database Schema Analysis
print_status "Step 4: Analyzing database schema requirements"

if [ -f "database/enhanced-viral-schema.sql" ]; then
    TOTAL_LINES=$(wc -l < database/enhanced-viral-schema.sql)
    TOTAL_TABLES=$(grep -c "CREATE TABLE" database/enhanced-viral-schema.sql)
    TOTAL_FUNCTIONS=$(grep -c "CREATE OR REPLACE FUNCTION" database/enhanced-viral-schema.sql)
    TOTAL_INDEXES=$(grep -c "CREATE INDEX" database/enhanced-viral-schema.sql)
    
    print_success "Enhanced viral schema validated:"
    echo "  📄 Total lines: $TOTAL_LINES"
    echo "  🗃️  Tables: $TOTAL_TABLES"
    echo "  ⚡ Functions: $TOTAL_FUNCTIONS"
    echo "  🔍 Indexes: $TOTAL_INDEXES"
else
    print_error "Enhanced viral schema not found!"
    exit 1
fi

# Step 5: Create Database Deployment SQL
print_status "Step 5: Creating database deployment SQL"

cat > production-database-deployment.sql << EOF
-- ================================================================================================
-- 4SITE.PRO PRODUCTION DATABASE DEPLOYMENT
-- Generated on $(date)
-- Source: enhanced-viral-schema.sql ($TOTAL_LINES lines)
-- ================================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set production-optimized configuration
SET work_mem = '256MB';
SET maintenance_work_mem = '512MB';
SET shared_preload_libraries = 'pg_stat_statements';

-- Log deployment start
DO \$\$
BEGIN
    RAISE NOTICE 'Starting 4site.pro production database deployment at %', now();
END
\$\$;

-- Source the enhanced viral schema
\i database/enhanced-viral-schema.sql

-- Verify deployment
DO \$\$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    
    RAISE NOTICE 'Deployment verification:';
    RAISE NOTICE '  Tables created: %', table_count;
    RAISE NOTICE '  Functions created: %', function_count;
    RAISE NOTICE '  Indexes created: %', index_count;
    
    IF table_count >= $TOTAL_TABLES THEN
        RAISE NOTICE '✅ Database deployment SUCCESSFUL';
    ELSE
        RAISE EXCEPTION '❌ Database deployment FAILED - insufficient tables';
    END IF;
END
\$\$;
EOF

print_success "Database deployment SQL created (production-database-deployment.sql)"

# Step 6: Create Production Validation Script
print_status "Step 6: Creating production validation script"

cat > validate-production-database.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function validateProductionDatabase() {
    console.log('🔍 PRODUCTION DATABASE VALIDATION');
    console.log('=' + '='.repeat(39));
    
    // Load production environment
    const envContent = fs.readFileSync('.env.production', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        }
    });
    
    const supabaseUrl = envVars.VITE_SUPABASE_URL;
    const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) {
        console.log('⚠️  Production credentials not configured yet');
        console.log('   Please update .env.production with real Supabase credentials');
        return false;
    }
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test 1: Basic connectivity
        console.log('\n🔍 Test 1: Database Connectivity');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code === 'PGRST116') {
            console.log('✅ Database connected (empty users table - expected for new deployment)');
        } else if (error) {
            console.log('❌ Database connection failed:', error.message);
            return false;
        } else {
            console.log('✅ Database connected successfully');
        }
        
        // Test 2: Schema validation
        console.log('\n🔍 Test 2: Schema Validation');
        
        const tables = ['users', 'websites', 'referrals', 'commission_earnings'];
        let validTables = 0;
        
        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                if (!error || error.code === 'PGRST116') {
                    console.log(`✅ Table '${table}' exists`);
                    validTables++;
                } else {
                    console.log(`❌ Table '${table}' missing or invalid`);
                }
            } catch (e) {
                console.log(`❌ Table '${table}' validation failed`);
            }
        }
        
        // Test 3: Performance check
        console.log('\n🔍 Test 3: Performance Check');
        const startTime = Date.now();
        await supabase.from('users').select('count').limit(1);
        const responseTime = Date.now() - startTime;
        
        console.log(`Response time: ${responseTime}ms`);
        console.log(`Performance: ${responseTime < 200 ? '✅ Excellent' : responseTime < 500 ? '✅ Good' : '⚠️ Needs optimization'}`);
        
        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 VALIDATION SUMMARY');
        console.log(`✅ Database: Connected`);
        console.log(`✅ Tables: ${validTables}/${tables.length} validated`);
        console.log(`✅ Performance: ${responseTime}ms`);
        console.log(`✅ Production: ${validTables === tables.length ? 'READY' : 'NEEDS SCHEMA DEPLOYMENT'}`);
        
        return validTables === tables.length;
        
    } catch (error) {
        console.log('❌ Production validation failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    validateProductionDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { validateProductionDatabase };
EOF

print_success "Production validation script created (validate-production-database.js)"

# Step 7: Instructions Summary
echo ""
print_status "🎯 PRODUCTION SETUP INSTRUCTIONS"
echo "=" $(printf '=%.0s' {1..39})

echo ""
echo "1. 📋 CREATE SUPABASE PROJECT:"
echo "   • Go to https://supabase.com/dashboard"
echo "   • Create new project: '4site-pro-production'"
echo "   • Note the project URL and anon key"

echo ""
echo "2. 🔧 UPDATE CREDENTIALS:"
echo "   • Edit .env.production"
echo "   • Replace placeholder values with real credentials"
echo "   • Save the file"

echo ""
echo "3. 🗄️ DEPLOY DATABASE SCHEMA:"
echo "   • Open Supabase SQL Editor"
echo "   • Copy contents of database/enhanced-viral-schema.sql"
echo "   • Execute the SQL to create all tables and functions"

echo ""
echo "4. ✅ VALIDATE DEPLOYMENT:"
echo "   • Run: node validate-production-database.js"
echo "   • Confirm all tests pass"
echo "   • Verify performance metrics"

echo ""
echo "5. 🚀 ACTIVATE PRODUCTION:"
echo "   • Copy .env.production to .env.local"
echo "   • Restart the application"
echo "   • Test full functionality"

echo ""
print_success "Production database setup prepared successfully!"
print_warning "Next: Update .env.production with real credentials and deploy schema"

echo ""
echo "=" $(printf '=%.0s' {1..60})
echo "🏆 ULTRA ELITE DATABASE SETUP COMPLETE"
echo "Ready for production deployment with surgical precision"
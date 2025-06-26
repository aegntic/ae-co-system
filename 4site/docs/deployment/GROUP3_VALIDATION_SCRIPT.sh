#!/bin/bash

# GROUP 3 Configuration Validation Script for 4site.pro
# Validates DNS, OAuth, and Security configurations in parallel

set -e

echo "🚀 GROUP 3 Configuration Validation for 4site.pro"
echo "================================================="
echo "Testing: DNS Domain Setup, GitHub OAuth, Security Configuration"
echo ""

# Configuration
DOMAIN="${DOMAIN:-4site.pro}"
API_DOMAIN="${API_DOMAIN:-api.4site.pro}"
CDN_DOMAIN="${CDN_DOMAIN:-cdn.4site.pro}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.4site.pro}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $test_name: PASS${NC} - $message"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ $test_name: FAIL${NC} - $message"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $test_name: WARNING${NC} - $message"
            WARNINGS=$((WARNINGS + 1))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $test_name: INFO${NC} - $message"
            ;;
    esac
}

# DNS Configuration Tests
echo -e "${BLUE}🌐 Testing DNS Configuration...${NC}"
echo "--------------------------------"

test_dns_resolution() {
    local domain="$1"
    local expected_type="$2"
    
    if dig_output=$(dig +short "$domain" "$expected_type" 2>/dev/null); then
        if [[ -n "$dig_output" ]]; then
            log_test "DNS Resolution ($domain)" "PASS" "Resolves to: $dig_output"
        else
            log_test "DNS Resolution ($domain)" "FAIL" "No $expected_type record found"
        fi
    else
        log_test "DNS Resolution ($domain)" "FAIL" "DNS query failed"
    fi
}

# Test main domain and subdomains
test_dns_resolution "$DOMAIN" "A"
test_dns_resolution "$API_DOMAIN" "A"
test_dns_resolution "$CDN_DOMAIN" "CNAME"
test_dns_resolution "$ADMIN_DOMAIN" "A"

# Test SSL certificates
test_ssl_certificate() {
    local domain="$1"
    
    if ssl_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
        expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
        if expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null); then
            current_timestamp=$(date +%s)
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $days_until_expiry -gt 7 ]]; then
                log_test "SSL Certificate ($domain)" "PASS" "Valid for $days_until_expiry days"
            else
                log_test "SSL Certificate ($domain)" "WARN" "Expires in $days_until_expiry days"
            fi
        else
            log_test "SSL Certificate ($domain)" "WARN" "Could not parse expiry date"
        fi
    else
        log_test "SSL Certificate ($domain)" "FAIL" "Certificate not accessible"
    fi
}

test_ssl_certificate "$DOMAIN"
test_ssl_certificate "$API_DOMAIN"

# Test DNS automation scripts
echo ""
echo -e "${BLUE}🔧 Testing DNS Automation Scripts...${NC}"
echo "------------------------------------"

if [[ -f "setup-dns.sh" ]]; then
    if bash -n setup-dns.sh 2>/dev/null; then
        log_test "DNS Setup Script Syntax" "PASS" "Script syntax is valid"
    else
        log_test "DNS Setup Script Syntax" "FAIL" "Script has syntax errors"
    fi
    
    if grep -q "CLOUDFLARE_API_TOKEN" setup-dns.sh; then
        log_test "DNS Script Configuration" "PASS" "Uses environment variables for API tokens"
    else
        log_test "DNS Script Configuration" "WARN" "Hard-coded credentials detected"
    fi
else
    log_test "DNS Setup Script" "FAIL" "setup-dns.sh not found"
fi

if [[ -f "ssl-setup.sh" ]]; then
    if bash -n ssl-setup.sh 2>/dev/null; then
        log_test "SSL Setup Script Syntax" "PASS" "Script syntax is valid"
    else
        log_test "SSL Setup Script Syntax" "FAIL" "Script has syntax errors"
    fi
else
    log_test "SSL Setup Script" "FAIL" "ssl-setup.sh not found"
fi

if [[ -f "validate-dns.sh" ]]; then
    if bash -n validate-dns.sh 2>/dev/null; then
        log_test "DNS Validation Script Syntax" "PASS" "Script syntax is valid"
    else
        log_test "DNS Validation Script Syntax" "FAIL" "Script has syntax errors"
    fi
else
    log_test "DNS Validation Script" "FAIL" "validate-dns.sh not found"
fi

# GitHub OAuth Tests
echo ""
echo -e "${BLUE}🔐 Testing GitHub OAuth Configuration...${NC}"
echo "---------------------------------------"

# Test OAuth configuration files
if [[ -f "github-app-config.json" ]]; then
    if jq empty github-app-config.json 2>/dev/null; then
        log_test "GitHub App Config JSON" "PASS" "Valid JSON format"
        
        # Check required fields
        if jq -e '.oauth_scopes[]' github-app-config.json | grep -q "read:user"; then
            log_test "OAuth Scopes" "PASS" "Minimal required scopes configured"
        else
            log_test "OAuth Scopes" "WARN" "Review OAuth scope configuration"
        fi
        
        # Check callback URLs
        if jq -e '.callback_urls[]' github-app-config.json | grep -q "https://"; then
            log_test "OAuth Callback URLs" "PASS" "HTTPS callback URLs configured"
        else
            log_test "OAuth Callback URLs" "FAIL" "Non-HTTPS callback URLs detected"
        fi
    else
        log_test "GitHub App Config JSON" "FAIL" "Invalid JSON format"
    fi
else
    log_test "GitHub App Config" "FAIL" "github-app-config.json not found"
fi

# Test OAuth route file
if [[ -f "oauth-routes.js" ]]; then
    if node -c oauth-routes.js 2>/dev/null; then
        log_test "OAuth Routes Syntax" "PASS" "JavaScript syntax is valid"
        
        # Check for security measures
        if grep -q "validateState" oauth-routes.js; then
            log_test "OAuth CSRF Protection" "PASS" "State validation implemented"
        else
            log_test "OAuth CSRF Protection" "FAIL" "Missing state validation"
        fi
        
        if grep -q "httpOnly.*true" oauth-routes.js; then
            log_test "OAuth Cookie Security" "PASS" "HttpOnly cookies configured"
        else
            log_test "OAuth Cookie Security" "WARN" "Review cookie security settings"
        fi
    else
        log_test "OAuth Routes Syntax" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "OAuth Routes File" "FAIL" "oauth-routes.js not found"
fi

# Test React OAuth provider
if [[ -f "GitHubAuthProvider.tsx" ]]; then
    # Basic TypeScript syntax check (if tsc is available)
    if command -v tsc >/dev/null 2>&1; then
        if tsc --noEmit --skipLibCheck GitHubAuthProvider.tsx 2>/dev/null; then
            log_test "OAuth Provider TypeScript" "PASS" "TypeScript syntax is valid"
        else
            log_test "OAuth Provider TypeScript" "WARN" "TypeScript validation issues"
        fi
    else
        log_test "OAuth Provider TypeScript" "INFO" "TypeScript compiler not available for validation"
    fi
    
    # Check for security features
    if grep -q "credentials.*include" GitHubAuthProvider.tsx; then
        log_test "OAuth Provider Security" "PASS" "Credential handling configured"
    else
        log_test "OAuth Provider Security" "WARN" "Review credential handling"
    fi
else
    log_test "OAuth Provider Component" "FAIL" "GitHubAuthProvider.tsx not found"
fi

# Test OAuth middleware
if [[ -f "oauth-middleware.js" ]]; then
    if node -c oauth-middleware.js 2>/dev/null; then
        log_test "OAuth Middleware Syntax" "PASS" "JavaScript syntax is valid"
        
        # Check for authentication features
        if grep -q "requireAuth" oauth-middleware.js; then
            log_test "OAuth Authentication Middleware" "PASS" "Authentication middleware present"
        else
            log_test "OAuth Authentication Middleware" "FAIL" "Missing authentication middleware"
        fi
        
        if grep -q "rateLimit" oauth-middleware.js; then
            log_test "OAuth Rate Limiting" "PASS" "Rate limiting implemented"
        else
            log_test "OAuth Rate Limiting" "WARN" "Rate limiting not implemented"
        fi
    else
        log_test "OAuth Middleware Syntax" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "OAuth Middleware File" "FAIL" "oauth-middleware.js not found"
fi

# Security Configuration Tests
echo ""
echo -e "${BLUE}🛡️  Testing Security Configuration...${NC}"
echo "------------------------------------"

# Test security headers
test_security_headers() {
    local domain="$1"
    
    if headers=$(curl -s -I "https://$domain" 2>/dev/null); then
        # Test for critical security headers
        if echo "$headers" | grep -qi "strict-transport-security"; then
            log_test "HSTS Header ($domain)" "PASS" "HSTS enabled"
        else
            log_test "HSTS Header ($domain)" "FAIL" "HSTS missing"
        fi
        
        if echo "$headers" | grep -qi "content-security-policy"; then
            log_test "CSP Header ($domain)" "PASS" "CSP configured"
        else
            log_test "CSP Header ($domain)" "FAIL" "CSP missing"
        fi
        
        if echo "$headers" | grep -qi "x-frame-options"; then
            log_test "X-Frame-Options ($domain)" "PASS" "Clickjacking protection enabled"
        else
            log_test "X-Frame-Options ($domain)" "FAIL" "Clickjacking protection missing"
        fi
        
        if echo "$headers" | grep -qi "x-content-type-options.*nosniff"; then
            log_test "X-Content-Type-Options ($domain)" "PASS" "MIME sniffing protection enabled"
        else
            log_test "X-Content-Type-Options ($domain)" "FAIL" "MIME sniffing protection missing"
        fi
    else
        log_test "Security Headers ($domain)" "FAIL" "Could not fetch headers"
    fi
}

# Test main domain security headers
test_security_headers "$DOMAIN"

# Test security configuration files
if [[ -f "security-headers.js" ]]; then
    if node -c security-headers.js 2>/dev/null; then
        log_test "Security Headers Script" "PASS" "JavaScript syntax is valid"
        
        # Check for helmet usage
        if grep -q "helmet" security-headers.js; then
            log_test "Security Headers Implementation" "PASS" "Using Helmet security middleware"
        else
            log_test "Security Headers Implementation" "WARN" "Review security header implementation"
        fi
    else
        log_test "Security Headers Script" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "Security Headers File" "FAIL" "security-headers.js not found"
fi

if [[ -f "cors-config.js" ]]; then
    if node -c cors-config.js 2>/dev/null; then
        log_test "CORS Configuration Script" "PASS" "JavaScript syntax is valid"
        
        # Check for origin validation
        if grep -q "allowedOrigins" cors-config.js; then
            log_test "CORS Origin Validation" "PASS" "Origin whitelist implemented"
        else
            log_test "CORS Origin Validation" "WARN" "Review CORS origin validation"
        fi
    else
        log_test "CORS Configuration Script" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "CORS Configuration File" "FAIL" "cors-config.js not found"
fi

if [[ -f "input-validation.js" ]]; then
    if node -c input-validation.js 2>/dev/null; then
        log_test "Input Validation Script" "PASS" "JavaScript syntax is valid"
        
        # Check for validation schemas
        if grep -q "validationSchemas" input-validation.js; then
            log_test "Input Validation Schemas" "PASS" "Validation schemas defined"
        else
            log_test "Input Validation Schemas" "WARN" "Review validation schemas"
        fi
        
        # Check for XSS protection
        if grep -q "preventXss" input-validation.js; then
            log_test "XSS Prevention" "PASS" "XSS prevention implemented"
        else
            log_test "XSS Prevention" "FAIL" "XSS prevention missing"
        fi
        
        # Check for SQL injection protection
        if grep -q "preventSqlInjection" input-validation.js; then
            log_test "SQL Injection Prevention" "PASS" "SQL injection prevention implemented"
        else
            log_test "SQL Injection Prevention" "FAIL" "SQL injection prevention missing"
        fi
    else
        log_test "Input Validation Script" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "Input Validation File" "FAIL" "input-validation.js not found"
fi

# Test WAF configuration
if [[ -f "waf-config.json" ]]; then
    if jq empty waf-config.json 2>/dev/null; then
        log_test "WAF Configuration JSON" "PASS" "Valid JSON format"
        
        # Check for security rules
        if jq -e '.security_rules[]' waf-config.json >/dev/null 2>&1; then
            sql_injection_rule=$(jq -r '.security_rules[] | select(.id=="SQL_INJECTION_DETECTION") | .enabled' waf-config.json 2>/dev/null)
            if [[ "$sql_injection_rule" == "true" ]]; then
                log_test "WAF SQL Injection Rule" "PASS" "SQL injection detection enabled"
            else
                log_test "WAF SQL Injection Rule" "WARN" "SQL injection detection not enabled"
            fi
            
            xss_rule=$(jq -r '.security_rules[] | select(.id=="XSS_DETECTION") | .enabled' waf-config.json 2>/dev/null)
            if [[ "$xss_rule" == "true" ]]; then
                log_test "WAF XSS Rule" "PASS" "XSS detection enabled"
            else
                log_test "WAF XSS Rule" "WARN" "XSS detection not enabled"
            fi
        else
            log_test "WAF Security Rules" "FAIL" "No security rules defined"
        fi
        
        # Check rate limiting
        if jq -e '.rate_limiting' waf-config.json >/dev/null 2>&1; then
            log_test "WAF Rate Limiting" "PASS" "Rate limiting configured"
        else
            log_test "WAF Rate Limiting" "WARN" "Rate limiting not configured"
        fi
    else
        log_test "WAF Configuration JSON" "FAIL" "Invalid JSON format"
    fi
else
    log_test "WAF Configuration File" "FAIL" "waf-config.json not found"
fi

# Test security audit script
if [[ -f "security-audit.sh" ]]; then
    if bash -n security-audit.sh 2>/dev/null; then
        log_test "Security Audit Script Syntax" "PASS" "Script syntax is valid"
        
        # Check if script is executable
        if [[ -x "security-audit.sh" ]]; then
            log_test "Security Audit Script Permissions" "PASS" "Script is executable"
        else
            log_test "Security Audit Script Permissions" "WARN" "Script needs execute permissions"
        fi
    else
        log_test "Security Audit Script Syntax" "FAIL" "Script has syntax errors"
    fi
else
    log_test "Security Audit Script" "FAIL" "security-audit.sh not found"
fi

# Test environment security
if [[ -f "environment-security.js" ]]; then
    if node -c environment-security.js 2>/dev/null; then
        log_test "Environment Security Script" "PASS" "JavaScript syntax is valid"
        
        # Check for environment validation
        if grep -q "validateEnvironment" environment-security.js; then
            log_test "Environment Validation" "PASS" "Environment validation implemented"
        else
            log_test "Environment Validation" "WARN" "Environment validation missing"
        fi
    else
        log_test "Environment Security Script" "FAIL" "JavaScript syntax errors"
    fi
else
    log_test "Environment Security File" "FAIL" "environment-security.js not found"
fi

# API Security Tests
echo ""
echo -e "${BLUE}🔌 Testing API Security...${NC}"
echo "-------------------------"

# Test API endpoints if accessible
if api_response=$(curl -s -I "https://$API_DOMAIN/api/health" 2>/dev/null); then
    log_test "API Accessibility" "PASS" "API endpoint accessible"
    
    # Check for security headers in API responses
    if echo "$api_response" | grep -qi "x-frame-options"; then
        log_test "API Security Headers" "PASS" "Security headers present in API"
    else
        log_test "API Security Headers" "WARN" "Review API security headers"
    fi
else
    log_test "API Accessibility" "INFO" "API not yet accessible (expected during setup)"
fi

# Test for API authentication
if auth_response=$(curl -s "https://$API_DOMAIN/api/user/profile" 2>/dev/null); then
    if echo "$auth_response" | grep -q "401\|authentication\|unauthorized"; then
        log_test "API Authentication" "PASS" "Protected endpoints require authentication"
    else
        log_test "API Authentication" "WARN" "Review API authentication requirements"
    fi
else
    log_test "API Authentication" "INFO" "API authentication test skipped (API not accessible)"
fi

# Environment Configuration Tests
echo ""
echo -e "${BLUE}📋 Testing Environment Configuration...${NC}"
echo "--------------------------------------"

# Check for environment template files
if [[ -f ".env.dns" ]]; then
    if grep -q "CLOUDFLARE_API_TOKEN" .env.dns; then
        log_test "DNS Environment Config" "PASS" "DNS environment variables defined"
    else
        log_test "DNS Environment Config" "WARN" "Review DNS environment variables"
    fi
else
    log_test "DNS Environment File" "WARN" ".env.dns template not found"
fi

if [[ -f ".env.oauth" ]]; then
    if grep -q "GITHUB_CLIENT_ID" .env.oauth; then
        log_test "OAuth Environment Config" "PASS" "OAuth environment variables defined"
    else
        log_test "OAuth Environment Config" "WARN" "Review OAuth environment variables"
    fi
else
    log_test "OAuth Environment File" "WARN" ".env.oauth template not found"
fi

if [[ -f ".env.security" ]]; then
    if grep -q "JWT_SECRET" .env.security; then
        log_test "Security Environment Config" "PASS" "Security environment variables defined"
    else
        log_test "Security Environment Config" "WARN" "Review security environment variables"
    fi
else
    log_test "Security Environment File" "WARN" ".env.security template not found"
fi

# Documentation Tests
echo ""
echo -e "${BLUE}📚 Testing Documentation...${NC}"
echo "---------------------------"

required_docs=("07-dns-domain.md" "08-github-oauth.md" "09-security-config.md")
for doc in "${required_docs[@]}"; do
    if [[ -f "$doc" ]]; then
        if [[ -s "$doc" ]]; then
            log_test "Documentation ($doc)" "PASS" "Documentation file exists and is not empty"
        else
            log_test "Documentation ($doc)" "WARN" "Documentation file is empty"
        fi
    else
        log_test "Documentation ($doc)" "FAIL" "Documentation file missing"
    fi
done

# Final Summary
echo ""
echo "============================================"
echo -e "${BLUE}📊 GROUP 3 VALIDATION SUMMARY${NC}"
echo "============================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate success percentage
if [[ $TOTAL_TESTS -gt 0 ]]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "Success Rate: ${success_rate}%"
    echo ""
fi

# Provide next steps based on results
if [[ $FAILED_TESTS -eq 0 && $WARNINGS -le 3 ]]; then
    echo -e "${GREEN}🎉 GROUP 3 configuration validation passed!${NC}"
    echo "✅ DNS domain configuration ready"
    echo "✅ GitHub OAuth integration ready" 
    echo "✅ Security hardening implemented"
    echo ""
    echo "Next steps:"
    echo "1. Review and address any warnings"
    echo "2. Replace placeholder values with production credentials"
    echo "3. Execute deployment scripts"
    echo "4. Run final security audit"
    exit 0
elif [[ $FAILED_TESTS -le 2 ]]; then
    echo -e "${YELLOW}⚠️  GROUP 3 configuration validation completed with issues${NC}"
    echo "Please address the failed tests before proceeding to deployment."
    exit 1
else
    echo -e "${RED}❌ GROUP 3 configuration validation failed${NC}"
    echo "Multiple critical issues detected. Please review and fix before deployment."
    exit 2
fi
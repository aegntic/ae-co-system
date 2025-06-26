#!/bin/bash
#
# Comprehensive Health Check Script for 4site.pro
# Validates all critical systems and services during deployment
#
# Usage: ./scripts/health-check.sh [environment] [--timeout=300] [--verbose]
#

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-production}
TIMEOUT=300
VERBOSE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --timeout=*)
            TIMEOUT="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"
    ((CHECKS_WARNING++))
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"
    ((CHECKS_FAILED++))
}

verbose_log() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Get service URL based on environment
get_service_url() {
    case $ENVIRONMENT in
        "blue")
            echo "http://4site-pro-blue-service.production.svc.cluster.local"
            ;;
        "green")
            echo "http://4site-pro-green-service.production.svc.cluster.local"
            ;;
        "production")
            echo "https://4site.pro"
            ;;
        "staging")
            echo "https://staging.4site.pro"
            ;;
        *)
            echo "http://localhost:5173"
            ;;
    esac
}

# Make HTTP request with timeout and retry
http_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local max_retries="${3:-3}"
    local retry_delay="${4:-5}"
    
    local retries=0
    
    while [[ $retries -lt $max_retries ]]; do
        verbose_log "Making HTTP request to: $url (attempt $((retries + 1))/$max_retries)"
        
        local response
        response=$(curl -s -o /tmp/health_response.txt -w "%{http_code}:%{time_total}:%{time_connect}" \
                   --connect-timeout 10 \
                   --max-time 30 \
                   --retry 0 \
                   "$url" 2>/dev/null || echo "000:0:0")
        
        local status_code="${response%%:*}"
        local total_time="${response#*:}"
        total_time="${total_time%:*}"
        local connect_time="${response##*:}"
        
        verbose_log "Response: Status=$status_code, Time=${total_time}s, Connect=${connect_time}s"
        
        if [[ "$status_code" == "$expected_status" ]]; then
            echo "$response"
            return 0
        fi
        
        retries=$((retries + 1))
        if [[ $retries -lt $max_retries ]]; then
            verbose_log "Request failed, retrying in ${retry_delay}s..."
            sleep "$retry_delay"
        fi
    done
    
    echo "$response"
    return 1
}

# Check basic connectivity
check_basic_connectivity() {
    log "Checking basic connectivity..."
    
    local base_url
    base_url=$(get_service_url)
    
    local response
    if response=$(http_request "$base_url/health" 200 3 5); then
        local status_code="${response%%:*}"
        local total_time="${response#*:}"
        total_time="${total_time%:*}"
        
        log_success "Basic connectivity - Status: $status_code, Time: ${total_time}s"
        
        # Check response time threshold
        if (( $(echo "$total_time > 3.0" | bc -l) )); then
            log_warning "Response time above threshold: ${total_time}s (>3.0s)"
        fi
    else
        log_error "Basic connectivity failed"
        return 1
    fi
}

# Check health endpoint
check_health_endpoint() {
    log "Checking health endpoint..."
    
    local base_url
    base_url=$(get_service_url)
    
    if http_request "$base_url/health" 200 >/dev/null; then
        # Parse health response
        local health_data
        health_data=$(cat /tmp/health_response.txt 2>/dev/null || echo '{}')
        
        verbose_log "Health response: $health_data"
        
        # Check if response is valid JSON
        if echo "$health_data" | jq . >/dev/null 2>&1; then
            local status
            status=$(echo "$health_data" | jq -r '.status // "unknown"')
            
            if [[ "$status" == "healthy" ]]; then
                log_success "Health endpoint - Status: $status"
            else
                log_error "Health endpoint - Status: $status"
                return 1
            fi
        else
            log_warning "Health endpoint returned non-JSON response"
        fi
    else
        log_error "Health endpoint not responding"
        return 1
    fi
}

# Check database connectivity
check_database_connectivity() {
    log "Checking database connectivity..."
    
    local base_url
    base_url=$(get_service_url)
    
    if http_request "$base_url/api/health/database" 200 >/dev/null; then
        local db_response
        db_response=$(cat /tmp/health_response.txt 2>/dev/null || echo '{}')
        
        verbose_log "Database response: $db_response"
        
        if echo "$db_response" | jq . >/dev/null 2>&1; then
            local db_status
            db_status=$(echo "$db_response" | jq -r '.database // "unknown"')
            
            if [[ "$db_status" == "healthy" || "$db_status" == "connected" ]]; then
                log_success "Database connectivity - Status: $db_status"
            else
                log_error "Database connectivity - Status: $db_status"
                return 1
            fi
        else
            log_warning "Database health check returned non-JSON response"
        fi
    else
        log_error "Database health check failed"
        return 1
    fi
}

# Check AI services
check_ai_services() {
    log "Checking AI services..."
    
    local base_url
    base_url=$(get_service_url)
    
    # Test AI health endpoint
    if http_request "$base_url/api/health/ai" 200 10 >/dev/null; then
        local ai_response
        ai_response=$(cat /tmp/health_response.txt 2>/dev/null || echo '{}')
        
        verbose_log "AI services response: $ai_response"
        
        if echo "$ai_response" | jq . >/dev/null 2>&1; then
            local ai_status
            ai_status=$(echo "$ai_response" | jq -r '.ai // "unknown"')
            
            if [[ "$ai_status" == "healthy" || "$ai_status" == "operational" ]]; then
                log_success "AI services - Status: $ai_status"
            else
                log_error "AI services - Status: $ai_status"
                return 1
            fi
        else
            log_warning "AI services returned non-JSON response"
        fi
    else
        log_error "AI services health check failed"
        return 1
    fi
}

# Check critical API endpoints
check_api_endpoints() {
    log "Checking critical API endpoints..."
    
    local base_url
    base_url=$(get_service_url)
    
    # List of critical endpoints to test
    local endpoints=(
        "/api/health:200"
        "/api/analyze:200"
        "/:200"
    )
    
    local endpoint_failures=0
    
    for endpoint_spec in "${endpoints[@]}"; do
        local endpoint="${endpoint_spec%:*}"
        local expected_status="${endpoint_spec#*:}"
        
        verbose_log "Testing endpoint: $endpoint (expecting $expected_status)"
        
        if http_request "$base_url$endpoint" "$expected_status" 2 3 >/dev/null; then
            log_success "API endpoint: $endpoint"
        else
            log_error "API endpoint failed: $endpoint"
            ((endpoint_failures++))
        fi
    done
    
    if [[ $endpoint_failures -gt 0 ]]; then
        log_error "$endpoint_failures API endpoint(s) failed"
        return 1
    fi
}

# Check security headers
check_security_headers() {
    log "Checking security headers..."
    
    local base_url
    base_url=$(get_service_url)
    
    # Get headers
    local headers
    headers=$(curl -s -I "$base_url/" --connect-timeout 10 --max-time 30 2>/dev/null || echo "")
    
    verbose_log "Security headers response: $headers"
    
    local security_issues=0
    
    # Check for HSTS
    if echo "$headers" | grep -i "strict-transport-security" >/dev/null; then
        log_success "HSTS header present"
    else
        log_warning "HSTS header missing"
        ((security_issues++))
    fi
    
    # Check for X-Content-Type-Options
    if echo "$headers" | grep -i "x-content-type-options" >/dev/null; then
        log_success "X-Content-Type-Options header present"
    else
        log_warning "X-Content-Type-Options header missing"
        ((security_issues++))
    fi
    
    # Check for X-Frame-Options or CSP frame-ancestors
    if echo "$headers" | grep -i -E "(x-frame-options|content-security-policy.*frame-ancestors)" >/dev/null; then
        log_success "Frame protection headers present"
    else
        log_warning "Frame protection headers missing"
        ((security_issues++))
    fi
    
    if [[ $security_issues -gt 2 ]]; then
        log_error "Too many security headers missing ($security_issues)"
        return 1
    fi
}

# Check performance metrics
check_performance_metrics() {
    log "Checking performance metrics..."
    
    local base_url
    base_url=$(get_service_url)
    
    # Test multiple requests to get average response time
    local total_time=0
    local requests=5
    local failed_requests=0
    
    for ((i=1; i<=requests; i++)); do
        verbose_log "Performance test request $i/$requests"
        
        local response
        if response=$(http_request "$base_url/" 200 1 0); then
            local request_time="${response#*:}"
            request_time="${request_time%:*}"
            total_time=$(echo "$total_time + $request_time" | bc -l)
        else
            ((failed_requests++))
        fi
    done
    
    if [[ $failed_requests -gt 0 ]]; then
        log_warning "$failed_requests/$requests performance test requests failed"
    fi
    
    local successful_requests=$((requests - failed_requests))
    
    if [[ $successful_requests -gt 0 ]]; then
        local avg_time
        avg_time=$(echo "scale=3; $total_time / $successful_requests" | bc -l)
        
        if (( $(echo "$avg_time < 1.0" | bc -l) )); then
            log_success "Performance metrics - Average response time: ${avg_time}s"
        elif (( $(echo "$avg_time < 3.0" | bc -l) )); then
            log_warning "Performance metrics - Average response time: ${avg_time}s (>1.0s)"
        else
            log_error "Performance metrics - Average response time: ${avg_time}s (>3.0s)"
            return 1
        fi
    else
        log_error "Performance metrics - All requests failed"
        return 1
    fi
}

# Check resource usage (if running in Kubernetes)
check_resource_usage() {
    log "Checking resource usage..."
    
    # Only check if kubectl is available and we're in a cluster
    if command -v kubectl >/dev/null 2>&1; then
        local deployment_name="4site-pro-$ENVIRONMENT"
        
        # Check if deployment exists
        if kubectl get deployment "$deployment_name" -n production >/dev/null 2>&1; then
            # Get pod resource usage
            local pod_metrics
            pod_metrics=$(kubectl top pods -l app=4site-pro,environment="$ENVIRONMENT" -n production --no-headers 2>/dev/null || echo "")
            
            if [[ -n "$pod_metrics" ]]; then
                verbose_log "Pod metrics: $pod_metrics"
                
                # Parse CPU and memory usage
                local high_cpu_pods=0
                local high_memory_pods=0
                
                while IFS= read -r line; do
                    local cpu_usage
                    cpu_usage=$(echo "$line" | awk '{print $2}' | sed 's/m//')
                    local memory_usage
                    memory_usage=$(echo "$line" | awk '{print $3}' | sed 's/Mi//')
                    
                    # Check CPU usage (threshold: 400m = 80% of 500m limit)
                    if [[ -n "$cpu_usage" ]] && [[ "$cpu_usage" -gt 400 ]]; then
                        ((high_cpu_pods++))
                    fi
                    
                    # Check memory usage (threshold: 400Mi = 80% of 512Mi limit)
                    if [[ -n "$memory_usage" ]] && [[ "$memory_usage" -gt 400 ]]; then
                        ((high_memory_pods++))
                    fi
                done <<< "$pod_metrics"
                
                if [[ $high_cpu_pods -eq 0 && $high_memory_pods -eq 0 ]]; then
                    log_success "Resource usage within limits"
                elif [[ $high_cpu_pods -gt 0 || $high_memory_pods -gt 0 ]]; then
                    log_warning "High resource usage detected (CPU: $high_cpu_pods pods, Memory: $high_memory_pods pods)"
                fi
            else
                log_warning "Could not retrieve pod metrics"
            fi
        else
            verbose_log "Deployment $deployment_name not found, skipping resource usage check"
            log_success "Resource usage check skipped (not in cluster)"
        fi
    else
        verbose_log "kubectl not available, skipping resource usage check"
        log_success "Resource usage check skipped (kubectl not available)"
    fi
}

# Check readiness probe
check_readiness() {
    log "Checking readiness endpoint..."
    
    local base_url
    base_url=$(get_service_url)
    
    if http_request "$base_url/ready" 200 >/dev/null; then
        log_success "Readiness check passed"
    else
        # Try alternative readiness endpoints
        if http_request "$base_url/health" 200 >/dev/null; then
            log_warning "Readiness endpoint failed, but health endpoint is accessible"
        else
            log_error "Readiness check failed"
            return 1
        fi
    fi
}

# Main health check function
main() {
    echo "🏥 4site.pro Health Check System"
    echo "================================"
    echo "Environment: $ENVIRONMENT"
    echo "Timeout: ${TIMEOUT}s"
    echo "Timestamp: $(date)"
    echo

    local start_time
    start_time=$(date +%s)
    
    # Set overall timeout
    timeout "$TIMEOUT" bash -c "
        # Run all health checks
        check_basic_connectivity
        check_health_endpoint
        check_database_connectivity
        check_ai_services
        check_api_endpoints
        check_security_headers
        check_performance_metrics
        check_resource_usage
        check_readiness
    " || {
        log_error "Health check timeout after ${TIMEOUT}s"
        exit 1
    }
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Summary
    echo
    echo "Health Check Summary"
    echo "==================="
    echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}⚠️ Warnings: $CHECKS_WARNING${NC}"
    echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
    echo "Duration: ${duration}s"
    echo
    
    # Determine overall result
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        if [[ $CHECKS_WARNING -eq 0 ]]; then
            echo -e "${GREEN}🎉 All health checks passed!${NC}"
            exit 0
        else
            echo -e "${YELLOW}⚠️ Health checks passed with warnings${NC}"
            exit 0
        fi
    else
        echo -e "${RED}❌ Health checks failed!${NC}"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    rm -f /tmp/health_response.txt
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
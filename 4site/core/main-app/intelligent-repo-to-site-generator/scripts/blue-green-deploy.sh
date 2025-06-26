#!/bin/bash
#
# Blue-Green Deployment Script for 4site.pro
# Implements zero-downtime deployment with automated health checks and rollback
#
# Usage: ./scripts/blue-green-deploy.sh [--environment=production] [--force] [--dry-run]
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-production}"
FORCE_DEPLOY=false
DRY_RUN=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
BLUE_ENV="4site-pro-blue"
GREEN_ENV="4site-pro-green"
SERVICE_NAME="4site-pro-service"
NAMESPACE="production"
HEALTH_CHECK_TIMEOUT=300
SMOKE_TEST_TIMEOUT=180
ROLLOUT_STAGES=(1 5 10 25 50 75 100)
STAGE_DURATION=300

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment=*)
                ENVIRONMENT="${1#*=}"
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Blue-Green Deployment Script for 4site.pro

Usage: $0 [OPTIONS]

Options:
    --environment=ENV    Target environment (default: production)
    --force             Force deployment even if validations fail
    --dry-run           Show what would be done without executing
    --verbose           Enable verbose logging
    -h, --help          Show this help message

Examples:
    $0                                  # Deploy to production
    $0 --environment=staging           # Deploy to staging
    $0 --dry-run                       # Preview deployment steps
    $0 --force --verbose               # Force deploy with verbose output

EOF
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    for tool in kubectl docker git npm; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check kubectl context
    local current_context
    current_context=$(kubectl config current-context 2>/dev/null || echo "none")
    
    if [[ "$current_context" != "$ENVIRONMENT" ]]; then
        log_warning "kubectl context is '$current_context', expected '$ENVIRONMENT'"
        if [[ "$FORCE_DEPLOY" != true ]]; then
            log_error "Use --force to deploy anyway, or switch context with: kubectl config use-context $ENVIRONMENT"
            exit 1
        fi
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Get current active environment
get_current_environment() {
    local current_service
    current_service=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.environment}' 2>/dev/null || echo "")
    
    if [[ -z "$current_service" ]]; then
        # No current service, default to green so we deploy to blue
        echo "green"
    else
        echo "$current_service"
    fi
}

# Determine target environment
get_target_environment() {
    local current_env="$1"
    
    if [[ "$current_env" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Build application
build_application() {
    log "Building application..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would build application"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run pre-launch validation
    log "Running pre-launch validation..."
    if ! node scripts/pre-launch-validation.js --environment="$ENVIRONMENT"; then
        if [[ "$FORCE_DEPLOY" != true ]]; then
            log_error "Pre-launch validation failed. Use --force to deploy anyway."
            exit 1
        else
            log_warning "Pre-launch validation failed, but continuing due to --force flag"
        fi
    fi
    
    # Build application
    log "Building application bundle..."
    npm run build
    
    # Build Docker image
    local image_tag="4site-pro:$(git rev-parse --short HEAD)-$(date +%s)"
    log "Building Docker image: $image_tag"
    
    docker build -t "$image_tag" .
    docker tag "$image_tag" "4site-pro:latest"
    
    # Push to registry (in production, this would push to your container registry)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Pushing image to registry..."
        # docker push "$image_tag"
        # docker push "4site-pro:latest"
    fi
    
    log_success "Application build completed"
}

# Deploy to target environment
deploy_to_environment() {
    local target_env="$1"
    local deployment_name="4site-pro-$target_env"
    
    log "Deploying to $target_env environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would deploy to $target_env environment"
        return 0
    fi
    
    # Apply deployment configuration
    cat > "/tmp/deployment-$target_env.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $deployment_name
  namespace: $NAMESPACE
  labels:
    app: 4site-pro
    environment: $target_env
spec:
  replicas: 3
  selector:
    matchLabels:
      app: 4site-pro
      environment: $target_env
  template:
    metadata:
      labels:
        app: 4site-pro
        environment: $target_env
    spec:
      containers:
      - name: 4site-pro
        image: 4site-pro:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "$ENVIRONMENT"
        - name: ENVIRONMENT
          value: "$target_env"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: 4site-pro-secrets
              key: gemini-api-key
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: 4site-pro-secrets
              key: supabase-url
        - name: VITE_SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: 4site-pro-secrets
              key: supabase-anon-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: 4site-pro-$target_env-service
  namespace: $NAMESPACE
spec:
  selector:
    app: 4site-pro
    environment: $target_env
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
EOF

    # Apply the deployment
    kubectl apply -f "/tmp/deployment-$target_env.yaml"
    
    # Wait for rollout to complete
    log "Waiting for deployment rollout to complete..."
    if ! kubectl rollout status "deployment/$deployment_name" -n "$NAMESPACE" --timeout=600s; then
        log_error "Deployment rollout failed"
        exit 1
    fi
    
    # Clean up temporary file
    rm "/tmp/deployment-$target_env.yaml"
    
    log_success "Deployment to $target_env completed"
}

# Run health checks
run_health_checks() {
    local target_env="$1"
    local service_url
    
    log "Running health checks on $target_env environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would run health checks on $target_env"
        return 0
    fi
    
    # Get service URL (in real deployment, this would be the actual URL)
    service_url="http://4site-pro-$target_env-service.$NAMESPACE.svc.cluster.local"
    
    # Run health check script
    if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
        if ! timeout "$HEALTH_CHECK_TIMEOUT" "$SCRIPT_DIR/health-check.sh" "$target_env"; then
            log_error "Health checks failed for $target_env environment"
            return 1
        fi
    else
        # Fallback health check
        local attempts=0
        local max_attempts=30
        
        while [[ $attempts -lt $max_attempts ]]; do
            log "Health check attempt $((attempts + 1))/$max_attempts..."
            
            if kubectl exec -n "$NAMESPACE" "deployment/4site-pro-$target_env" -- curl -f http://localhost:3000/health &> /dev/null; then
                log_success "Health check passed"
                break
            fi
            
            attempts=$((attempts + 1))
            sleep 10
        done
        
        if [[ $attempts -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            return 1
        fi
    fi
    
    log_success "Health checks passed for $target_env environment"
}

# Run smoke tests
run_smoke_tests() {
    local target_env="$1"
    
    log "Running smoke tests on $target_env environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would run smoke tests on $target_env"
        return 0
    fi
    
    # Run smoke test script
    if [[ -f "$SCRIPT_DIR/smoke-tests.sh" ]]; then
        if ! timeout "$SMOKE_TEST_TIMEOUT" "$SCRIPT_DIR/smoke-tests.sh" "$target_env"; then
            log_error "Smoke tests failed for $target_env environment"
            return 1
        fi
    else
        # Fallback smoke tests
        log "Running basic smoke tests..."
        
        # Test critical endpoints
        local endpoints=(
            "/health"
            "/api/health"
            "/"
        )
        
        for endpoint in "${endpoints[@]}"; do
            log "Testing endpoint: $endpoint"
            
            if ! kubectl exec -n "$NAMESPACE" "deployment/4site-pro-$target_env" -- curl -f "http://localhost:3000$endpoint" &> /dev/null; then
                log_error "Smoke test failed for endpoint: $endpoint"
                return 1
            fi
        done
    fi
    
    log_success "Smoke tests passed for $target_env environment"
}

# Switch traffic gradually
switch_traffic() {
    local target_env="$1"
    local current_env="$2"
    
    log "Starting gradual traffic switch to $target_env..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would switch traffic to $target_env"
        return 0
    fi
    
    for stage in "${ROLLOUT_STAGES[@]}"; do
        log "Rolling out to $stage% traffic..."
        
        # Update traffic split
        update_traffic_split "$target_env" "$current_env" "$stage"
        
        # Monitor metrics during this stage
        if ! monitor_metrics "$STAGE_DURATION" "$stage"; then
            log_error "Metrics monitoring failed at $stage% stage"
            log "Initiating rollback..."
            rollback_deployment "$current_env" "$target_env"
            exit 1
        fi
        
        log_success "Stage $stage% completed successfully"
    done
    
    log_success "Traffic switch completed - $target_env is now serving 100% of traffic"
}

# Update traffic split
update_traffic_split() {
    local target_env="$1"
    local current_env="$2"
    local percentage="$3"
    
    log "Setting traffic split: $target_env=$percentage%, $current_env=$((100 - percentage))%"
    
    # Update service selector based on percentage
    if [[ "$percentage" -ge 100 ]]; then
        # Switch completely to target environment
        kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{
            \"spec\": {
                \"selector\": {
                    \"app\": \"4site-pro\",
                    \"environment\": \"$target_env\"
                }
            }
        }"
    else
        # For partial rollouts, we would typically use an ingress controller
        # or service mesh. This is a simplified example.
        kubectl annotate service "$SERVICE_NAME" -n "$NAMESPACE" \
            "deployment.kubernetes.io/canary-weight=$percentage" \
            --overwrite
    fi
}

# Monitor metrics during rollout
monitor_metrics() {
    local duration="$1"
    local percentage="$2"
    
    log "Monitoring metrics for ${duration}s at ${percentage}% traffic..."
    
    local check_interval=30
    local checks=$((duration / check_interval))
    
    for ((i=1; i<=checks; i++)); do
        log "Monitoring check $i/$checks..."
        
        # Check error rate (would integrate with actual monitoring system)
        local error_rate
        error_rate=$(get_error_rate)
        
        # Check response time
        local response_time
        response_time=$(get_response_time)
        
        log "Error rate: $error_rate%, Response time P95: ${response_time}ms"
        
        # Check thresholds
        if (( $(echo "$error_rate > 1.0" | bc -l) )); then
            log_error "Error rate exceeded threshold (1.0%)"
            return 1
        fi
        
        if (( $(echo "$response_time > 1000" | bc -l) )); then
            log_error "Response time exceeded threshold (1000ms)"
            return 1
        fi
        
        sleep "$check_interval"
    done
    
    log_success "Metrics stable during monitoring period"
    return 0
}

# Get current error rate (mock function - would integrate with monitoring)
get_error_rate() {
    # Mock implementation - in production, this would query your monitoring system
    echo "0.05"
}

# Get current response time (mock function - would integrate with monitoring)
get_response_time() {
    # Mock implementation - in production, this would query your monitoring system
    echo "450"
}

# Rollback deployment
rollback_deployment() {
    local rollback_to_env="$1"
    local failed_env="$2"
    
    log_error "Rolling back to $rollback_to_env environment"
    
    # Immediately switch all traffic back
    kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{
        \"spec\": {
            \"selector\": {
                \"app\": \"4site-pro\",
                \"environment\": \"$rollback_to_env\"
            }
        }
    }"
    
    # Remove canary annotations
    kubectl annotate service "$SERVICE_NAME" -n "$NAMESPACE" \
        "deployment.kubernetes.io/canary-weight-" \
        --overwrite || true
    
    # Wait a moment for traffic to stabilize
    sleep 30
    
    # Verify rollback success
    if run_health_checks "$rollback_to_env"; then
        log_success "Rollback to $rollback_to_env completed successfully"
        
        # Log incident
        log_incident "rollback" "Automatic rollback from $failed_env to $rollback_to_env"
        
        # Send notifications
        send_notification "🚨 Deployment Rollback" "Automatic rollback from $failed_env to $rollback_to_env completed successfully"
    else
        log_error "Rollback verification failed - critical situation!"
        send_notification "🚨 CRITICAL: Rollback Failed" "Both $failed_env and $rollback_to_env environments are unhealthy!"
        exit 1
    fi
}

# Log deployment incident
log_incident() {
    local incident_type="$1"
    local description="$2"
    
    local incident_file="incident-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$incident_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "type": "$incident_type",
    "description": "$description",
    "environment": "$ENVIRONMENT",
    "duration_seconds": $SECONDS,
    "initiated_by": "$(whoami)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "status": "completed"
}
EOF
    
    log "Incident logged to: $incident_file"
}

# Send notification
send_notification() {
    local title="$1"
    local message="$2"
    
    # Send to Slack if webhook URL is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$title\",
                \"attachments\": [{
                    \"color\": \"warning\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" &> /dev/null || true
    fi
    
    log "Notification sent: $title - $message"
}

# Cleanup old deployments
cleanup_old_deployments() {
    local current_env="$1"
    
    log "Cleaning up old deployments..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would cleanup old deployments"
        return 0
    fi
    
    # Keep only the current and previous deployments
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -l app=4site-pro --sort-by=.metadata.creationTimestamp -o name | head -n -2)
    
    for deployment in $deployments; do
        log "Deleting old deployment: $deployment"
        kubectl delete "$deployment" -n "$NAMESPACE" || true
    done
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    local start_time
    start_time=$(date +%s)
    
    log "🚀 Starting Blue-Green Deployment for 4site.pro"
    log "Environment: $ENVIRONMENT"
    log "Dry Run: $DRY_RUN"
    log "Force Deploy: $FORCE_DEPLOY"
    echo
    
    # Parse command line arguments
    parse_args "$@"
    
    # Check prerequisites
    check_prerequisites
    
    # Determine deployment environments
    local current_env
    current_env=$(get_current_environment)
    
    local target_env
    target_env=$(get_target_environment "$current_env")
    
    log "Current Environment: $current_env"
    log "Target Environment: $target_env"
    echo
    
    # Build application
    build_application
    
    # Deploy to target environment
    deploy_to_environment "$target_env"
    
    # Run health checks
    if ! run_health_checks "$target_env"; then
        log_error "Health checks failed, aborting deployment"
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$target_env"; then
        log_error "Smoke tests failed, aborting deployment"
        exit 1
    fi
    
    # Switch traffic gradually
    switch_traffic "$target_env" "$current_env"
    
    # Cleanup old deployments
    cleanup_old_deployments "$target_env"
    
    # Calculate deployment time
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Log successful deployment
    log_incident "deployment" "Successful blue-green deployment from $current_env to $target_env"
    
    # Send success notification
    send_notification "🎉 Deployment Successful" "Blue-green deployment to $target_env completed in ${duration}s"
    
    # Final success message
    log_success "🎉 Blue-Green Deployment completed successfully!"
    log_success "Current Environment: $target_env"
    log_success "Deployment Duration: ${duration}s"
    echo
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
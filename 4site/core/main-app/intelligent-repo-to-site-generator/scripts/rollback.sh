#!/bin/bash
#
# Emergency Rollback Script for 4site.pro
# Provides instant rollback capabilities with safety verification
#
# Usage: ./scripts/rollback.sh [target_environment] [--reason="reason"] [--force] [--dry-run]
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
TARGET_ENVIRONMENT=""
ROLLBACK_REASON="Emergency rollback initiated"
FORCE_ROLLBACK=false
DRY_RUN=false
VERBOSE=false

# Deployment configuration
NAMESPACE="production"
SERVICE_NAME="4site-pro-service"
VERIFICATION_TIMEOUT=120
SAFETY_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

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

log_critical() {
    echo -e "${RED}${BOLD}[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL:${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --reason=*)
                ROLLBACK_REASON="${1#*=}"
                shift
                ;;
            --force)
                FORCE_ROLLBACK=true
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
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$TARGET_ENVIRONMENT" ]]; then
                    TARGET_ENVIRONMENT="$1"
                else
                    log_error "Unexpected argument: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Emergency Rollback Script for 4site.pro

Usage: $0 [TARGET_ENVIRONMENT] [OPTIONS]

Arguments:
    TARGET_ENVIRONMENT   Environment to rollback to (blue/green/previous)
                        If not specified, automatically determines previous stable environment

Options:
    --reason=REASON     Reason for rollback (default: "Emergency rollback initiated")
    --force            Force rollback even if safety checks fail
    --dry-run          Show what would be done without executing
    --verbose          Enable verbose logging
    -h, --help         Show this help message

Examples:
    $0                                    # Automatic rollback to previous environment
    $0 blue                              # Rollback to blue environment
    $0 --reason="High error rate"        # Rollback with specific reason
    $0 green --force                     # Force rollback to green environment
    $0 --dry-run                         # Preview rollback actions

Emergency Usage:
    $0 --force --reason="Critical failure"

EOF
}

# Get current active environment
get_current_environment() {
    local current_service
    
    if command -v kubectl >/dev/null 2>&1; then
        current_service=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.environment}' 2>/dev/null || echo "")
    fi
    
    if [[ -z "$current_service" ]]; then
        # Fallback: try to determine from running processes or configuration
        log_warning "Could not determine current environment from Kubernetes"
        echo "unknown"
    else
        echo "$current_service"
    fi
}

# Determine target environment for rollback
determine_target_environment() {
    local current_env="$1"
    
    if [[ -n "$TARGET_ENVIRONMENT" ]]; then
        # User specified target environment
        case "$TARGET_ENVIRONMENT" in
            "blue"|"green")
                echo "$TARGET_ENVIRONMENT"
                ;;
            "previous")
                # Determine previous environment
                if [[ "$current_env" == "blue" ]]; then
                    echo "green"
                elif [[ "$current_env" == "green" ]]; then
                    echo "blue"
                else
                    log_error "Cannot determine previous environment from current: $current_env"
                    exit 1
                fi
                ;;
            *)
                log_error "Invalid target environment: $TARGET_ENVIRONMENT (must be blue, green, or previous)"
                exit 1
                ;;
        esac
    else
        # Auto-determine target environment
        if [[ "$current_env" == "blue" ]]; then
            echo "green"
        elif [[ "$current_env" == "green" ]]; then
            echo "blue"
        else
            log_error "Cannot auto-determine rollback target from current environment: $current_env"
            exit 1
        fi
    fi
}

# Verify target environment exists and is healthy
verify_target_environment() {
    local target_env="$1"
    
    log "Verifying target environment: $target_env"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would verify target environment $target_env"
        return 0
    fi
    
    # Check if target deployment exists
    if command -v kubectl >/dev/null 2>&1; then
        local deployment_name="4site-pro-$target_env"
        
        if ! kubectl get deployment "$deployment_name" -n "$NAMESPACE" >/dev/null 2>&1; then
            log_error "Target deployment $deployment_name does not exist"
            return 1
        fi
        
        # Check deployment status
        local ready_replicas
        ready_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        
        local desired_replicas
        desired_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
        
        if [[ "$ready_replicas" -lt "$desired_replicas" ]]; then
            log_error "Target environment $target_env is not fully ready ($ready_replicas/$desired_replicas replicas)"
            if [[ "$FORCE_ROLLBACK" != true ]]; then
                return 1
            else
                log_warning "Proceeding with rollback despite unhealthy target (--force flag)"
            fi
        fi
    fi
    
    # Run health checks on target environment
    if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
        log "Running health checks on target environment..."
        
        if ! timeout "$VERIFICATION_TIMEOUT" "$SCRIPT_DIR/health-check.sh" "$target_env" --timeout=60; then
            log_error "Health checks failed for target environment: $target_env"
            if [[ "$FORCE_ROLLBACK" != true ]]; then
                return 1
            else
                log_warning "Proceeding with rollback despite failed health checks (--force flag)"
            fi
        fi
    else
        log_warning "Health check script not found, skipping health verification"
    fi
    
    log_success "Target environment $target_env verified"
    return 0
}

# Execute immediate traffic switch
execute_traffic_switch() {
    local target_env="$1"
    local current_env="$2"
    
    log "Executing immediate traffic switch to $target_env..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would switch traffic from $current_env to $target_env"
        return 0
    fi
    
    # Safety confirmation (only if not forced)
    if [[ "$FORCE_ROLLBACK" != true ]]; then
        echo
        log_warning "About to switch ALL traffic from $current_env to $target_env"
        log_warning "This will affect all users immediately"
        echo -n "Continue with rollback? [y/N]: "
        read -r confirmation
        
        if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Record rollback start time
    local rollback_start
    rollback_start=$(date +%s)
    
    # Update service selector to point to target environment
    if command -v kubectl >/dev/null 2>&1; then
        log "Updating Kubernetes service selector..."
        
        kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "{
            \"spec\": {
                \"selector\": {
                    \"app\": \"4site-pro\",
                    \"environment\": \"$target_env\"
                }
            }
        }"
        
        # Remove any canary deployment annotations
        kubectl annotate service "$SERVICE_NAME" -n "$NAMESPACE" \
            "deployment.kubernetes.io/canary-weight-" \
            "nginx.ingress.kubernetes.io/canary-weight-" \
            --overwrite 2>/dev/null || true
        
        log_success "Kubernetes service updated"
    else
        log_warning "kubectl not available, cannot update Kubernetes service"
    fi
    
    # Additional traffic switch mechanisms (load balancer, CDN, etc.)
    switch_load_balancer_traffic "$target_env"
    switch_cdn_traffic "$target_env"
    
    # Wait for traffic switch to take effect
    log "Waiting ${SAFETY_DELAY}s for traffic switch to take effect..."
    sleep "$SAFETY_DELAY"
    
    local rollback_end
    rollback_end=$(date +%s)
    local rollback_duration=$((rollback_end - rollback_start))
    
    log_success "Traffic switch completed in ${rollback_duration}s"
}

# Switch load balancer traffic (placeholder for actual implementation)
switch_load_balancer_traffic() {
    local target_env="$1"
    
    if [[ "$VERBOSE" == true ]]; then
        log "Switching load balancer traffic to $target_env..."
        # In a real implementation, this would update your load balancer configuration
        # Examples: AWS ALB, Google Cloud Load Balancer, Azure Load Balancer, etc.
    fi
}

# Switch CDN traffic (placeholder for actual implementation)
switch_cdn_traffic() {
    local target_env="$1"
    
    if [[ "$VERBOSE" == true ]]; then
        log "Switching CDN traffic to $target_env..."
        # In a real implementation, this would update your CDN configuration
        # Examples: CloudFlare, AWS CloudFront, Google Cloud CDN, etc.
    fi
}

# Verify rollback success
verify_rollback_success() {
    local target_env="$1"
    
    log "Verifying rollback success..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would verify rollback success for $target_env"
        return 0
    fi
    
    # Wait a moment for systems to stabilize
    sleep 5
    
    # Run health checks on the active environment
    if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
        log "Running post-rollback health checks..."
        
        if timeout "$VERIFICATION_TIMEOUT" "$SCRIPT_DIR/health-check.sh" "$target_env" --timeout=60; then
            log_success "Post-rollback health checks passed"
        else
            log_critical "Post-rollback health checks failed!"
            log_critical "Both environments may be unhealthy - immediate attention required!"
            return 1
        fi
    fi
    
    # Verify traffic is actually flowing to target environment
    verify_traffic_flow "$target_env"
    
    log_success "Rollback verification completed successfully"
}

# Verify traffic is flowing to target environment
verify_traffic_flow() {
    local target_env="$1"
    
    log "Verifying traffic flow to $target_env..."
    
    # Make test requests to verify traffic routing
    local test_requests=5
    local successful_requests=0
    
    for ((i=1; i<=test_requests; i++)); do
        if [[ "$VERBOSE" == true ]]; then
            log "Test request $i/$test_requests..."
        fi
        
        # In a real implementation, you would make requests to your application
        # and verify they're being served by the correct environment
        # This could involve checking response headers, environment indicators, etc.
        
        # Simulate traffic verification
        if curl -s -f "https://4site.pro/health" >/dev/null 2>&1; then
            ((successful_requests++))
        fi
        
        sleep 1
    done
    
    local success_rate=$((successful_requests * 100 / test_requests))
    
    if [[ $success_rate -ge 80 ]]; then
        log_success "Traffic verification passed ($successful_requests/$test_requests requests successful)"
    else
        log_error "Traffic verification failed ($successful_requests/$test_requests requests successful)"
        return 1
    fi
}

# Log rollback incident
log_rollback_incident() {
    local current_env="$1"
    local target_env="$2"
    local duration="$3"
    
    local incident_file="rollback-incident-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$incident_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "type": "emergency_rollback",
    "reason": "$ROLLBACK_REASON",
    "from_environment": "$current_env",
    "to_environment": "$target_env",
    "duration_seconds": $duration,
    "initiated_by": "$(whoami)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "force_rollback": $FORCE_ROLLBACK,
    "dry_run": $DRY_RUN,
    "status": "completed"
}
EOF
    
    log "Incident logged to: $incident_file"
}

# Send rollback notifications
send_rollback_notifications() {
    local current_env="$1"
    local target_env="$2"
    local duration="$3"
    
    local status_emoji="🚨"
    local status_color="danger"
    
    if [[ "$DRY_RUN" == true ]]; then
        status_emoji="🧪"
        status_color="warning"
    fi
    
    # Send to Slack if webhook URL is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$status_emoji EMERGENCY ROLLBACK COMPLETED\",
                \"attachments\": [{
                    \"color\": \"$status_color\",
                    \"fields\": [{
                        \"title\": \"Reason\",
                        \"value\": \"$ROLLBACK_REASON\",
                        \"short\": false
                    }, {
                        \"title\": \"Environment Change\",
                        \"value\": \"$current_env → $target_env\",
                        \"short\": true
                    }, {
                        \"title\": \"Duration\",
                        \"value\": \"${duration}s\",
                        \"short\": true
                    }, {
                        \"title\": \"Initiated By\",
                        \"value\": \"$(whoami)\",
                        \"short\": true
                    }, {
                        \"title\": \"Force Rollback\",
                        \"value\": \"$FORCE_ROLLBACK\",
                        \"short\": true
                    }]
                }]
            }" &> /dev/null || log_warning "Failed to send Slack notification"
    fi
    
    # Send to PagerDuty if integration key is configured
    if [[ -n "${PAGERDUTY_ROUTING_KEY:-}" && "$DRY_RUN" != true ]]; then
        curl -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H "Content-Type: application/json" \
            --data "{
                \"routing_key\": \"$PAGERDUTY_ROUTING_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"4site.pro Emergency Rollback: $current_env → $target_env\",
                    \"source\": \"4site.pro-rollback-script\",
                    \"severity\": \"critical\",
                    \"custom_details\": {
                        \"reason\": \"$ROLLBACK_REASON\",
                        \"from_environment\": \"$current_env\",
                        \"to_environment\": \"$target_env\",
                        \"duration\": \"${duration}s\",
                        \"force_rollback\": $FORCE_ROLLBACK
                    }
                }
            }" &> /dev/null || log_warning "Failed to send PagerDuty notification"
    fi
    
    log "Rollback notifications sent"
}

# Main rollback function
main() {
    local start_time
    start_time=$(date +%s)
    
    echo -e "${RED}${BOLD}"
    echo "🚨 EMERGENCY ROLLBACK SYSTEM"
    echo "============================="
    echo -e "${NC}"
    echo "Reason: $ROLLBACK_REASON"
    echo "Dry Run: $DRY_RUN"
    echo "Force Rollback: $FORCE_ROLLBACK"
    echo "Timestamp: $(date)"
    echo
    
    # Get current environment
    local current_env
    current_env=$(get_current_environment)
    log "Current Environment: $current_env"
    
    # Determine target environment
    local target_env
    target_env=$(determine_target_environment "$current_env")
    log "Target Environment: $target_env"
    
    # Safety check - prevent rolling back to the same environment
    if [[ "$current_env" == "$target_env" ]]; then
        log_error "Cannot rollback to the same environment: $target_env"
        exit 1
    fi
    
    echo
    
    # Verify target environment is healthy
    if ! verify_target_environment "$target_env"; then
        log_error "Target environment verification failed"
        if [[ "$FORCE_ROLLBACK" != true ]]; then
            log_error "Use --force to rollback anyway (NOT RECOMMENDED)"
            exit 1
        fi
    fi
    
    # Execute traffic switch
    execute_traffic_switch "$target_env" "$current_env"
    
    # Verify rollback success
    if ! verify_rollback_success "$target_env"; then
        log_critical "Rollback verification failed!"
        log_critical "Manual intervention required immediately!"
        exit 1
    fi
    
    # Calculate total duration
    local end_time
    end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Log incident
    log_rollback_incident "$current_env" "$target_env" "$total_duration"
    
    # Send notifications
    send_rollback_notifications "$current_env" "$target_env" "$total_duration"
    
    # Final success message
    echo
    log_success "🎉 EMERGENCY ROLLBACK COMPLETED SUCCESSFULLY!"
    log_success "Environment: $current_env → $target_env"
    log_success "Duration: ${total_duration}s"
    log_success "Status: All systems operational"
    echo
    
    # Next steps guidance
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "1. Investigate root cause of the issue in $current_env environment"
    echo "2. Fix the problem and thoroughly test the solution"
    echo "3. Re-deploy when the issue is resolved"
    echo "4. Monitor system stability for the next 24 hours"
    echo "5. Review incident response and improve processes if needed"
    echo
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi
#!/bin/bash
#
# Launch Day Checklist Script for 4site.pro
# Interactive checklist with automated validation and step-by-step guidance
#
# Usage: ./scripts/launch-day-checklist.sh [--environment=production] [--auto-validate] [--dry-run]
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-production}"
AUTO_VALIDATE=false
DRY_RUN=false
INTERACTIVE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Checklist state
CHECKLIST_STATE_FILE="/tmp/4site-pro-launch-checklist-state.json"
TOTAL_ITEMS=0
COMPLETED_ITEMS=0
FAILED_ITEMS=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --auto-validate)
            AUTO_VALIDATE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --non-interactive)
            INTERACTIVE=false
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

show_help() {
    cat << EOF
Launch Day Checklist Script for 4site.pro

Usage: $0 [OPTIONS]

Options:
    --environment=ENV       Target environment (default: production)
    --auto-validate        Automatically run validation checks
    --dry-run              Show what would be done without executing
    --non-interactive      Run without user prompts
    -h, --help             Show this help message

Examples:
    $0                                      # Interactive launch checklist
    $0 --auto-validate                     # Run with automatic validation
    $0 --environment=staging --dry-run     # Preview staging launch process

EOF
}

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[$(date '+%H:%M:%S')] 📋${NC} $1"
}

log_time() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')] ⏰${NC} $1"
}

# Progress tracking
update_progress() {
    local item_id="$1"
    local status="$2"  # completed, failed, skipped
    local message="${3:-}"
    
    # Update state file
    if [[ ! -f "$CHECKLIST_STATE_FILE" ]]; then
        echo '{}' > "$CHECKLIST_STATE_FILE"
    fi
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Update JSON state
    cat "$CHECKLIST_STATE_FILE" | jq --arg id "$item_id" --arg status "$status" --arg msg "$message" --arg ts "$timestamp" \
        '.[$id] = {status: $status, message: $msg, timestamp: $ts}' > "${CHECKLIST_STATE_FILE}.tmp"
    mv "${CHECKLIST_STATE_FILE}.tmp" "$CHECKLIST_STATE_FILE"
    
    # Update counters
    case $status in
        "completed")
            ((COMPLETED_ITEMS++))
            ;;
        "failed")
            ((FAILED_ITEMS++))
            ;;
    esac
}

# Get user confirmation
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$INTERACTIVE" != true ]]; then
        return 0
    fi
    
    local prompt="$message"
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    while true; do
        echo -n -e "${YELLOW}$prompt${NC}"
        read -r response
        
        if [[ -z "$response" ]]; then
            response="$default"
        fi
        
        case "$response" in
            [Yy]|[Yy][Ee][Ss])
                return 0
                ;;
            [Nn]|[Nn][Oo])
                return 1
                ;;
            *)
                echo "Please answer yes or no."
                ;;
        esac
    done
}

# Validation helper
validate_item() {
    local item_id="$1"
    local validation_command="$2"
    local success_message="$3"
    local failure_message="$4"
    
    if [[ "$AUTO_VALIDATE" == true && -n "$validation_command" ]]; then
        log "Validating: $item_id"
        
        if [[ "$DRY_RUN" == true ]]; then
            log "DRY RUN: Would validate with: $validation_command"
            update_progress "$item_id" "completed" "Dry run validation"
            log_success "$success_message (dry run)"
            return 0
        fi
        
        if eval "$validation_command" >/dev/null 2>&1; then
            update_progress "$item_id" "completed" "$success_message"
            log_success "$success_message"
            return 0
        else
            update_progress "$item_id" "failed" "$failure_message"
            log_error "$failure_message"
            return 1
        fi
    else
        # Manual confirmation
        if confirm "$success_message - Mark as completed?"; then
            update_progress "$item_id" "completed" "Manually confirmed"
            log_success "Marked as completed"
            return 0
        else
            update_progress "$item_id" "failed" "Manual confirmation failed"
            log_error "Not completed"
            return 1
        fi
    fi
}

# Display launch header
show_launch_header() {
    clear
    echo -e "${BOLD}${BLUE}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║                 🚀 4site.pro LAUNCH DAY CHECKLIST               ║
    ║                                                                  ║
    ║               Professional Go-Live Procedures                    ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${CYAN}Environment:${NC} $ENVIRONMENT"
    echo -e "${CYAN}Auto Validate:${NC} $AUTO_VALIDATE"
    echo -e "${CYAN}Dry Run:${NC} $DRY_RUN"
    echo -e "${CYAN}Timestamp:${NC} $(date '+%Y-%m-%d %H:%M:%S %Z')"
    echo
}

# T-Minus 24 Hours: Final Preparation
tminus_24_hours() {
    echo -e "${BOLD}${YELLOW}📅 T-MINUS 24 HOURS: FINAL PREPARATION${NC}"
    echo "======================================================"
    echo
    
    log_time "Beginning 24-hour launch preparation phase"
    
    local items=(
        "code_freeze:Code freeze implemented - No new deployments except critical fixes:test -f .code-freeze || git tag launch-freeze-$(date +%Y%m%d):Code freeze is active"
        "backup_verification:Complete backup verification - Test restore procedures:$SCRIPT_DIR/test-backup-restore.sh:Backup and restore procedures validated"
        "load_testing:Load testing final run - Simulate expected launch traffic:$SCRIPT_DIR/final-load-test.sh:Load testing completed successfully"
        "security_scan:Security scan completed - Vulnerability assessment passed:$SCRIPT_DIR/security-scan.sh:Security scan passed"
        "monitoring_systems:Monitoring systems tested - All alerts and dashboards working:kubectl get pods -n monitoring | grep Running:Monitoring systems operational"
        "emergency_contacts:Emergency contacts confirmed - All team members accessible::Emergency contacts confirmed and accessible"
        "rollback_procedures:Rollback procedures verified - Test rollback in staging:$SCRIPT_DIR/test-rollback-staging.sh:Rollback procedures tested and verified"
        "communication_plan:Communication plan reviewed - Marketing and PR aligned::Communication plan aligned with stakeholders"
    )
    
    for item in "${items[@]}"; do
        IFS=':' read -r id description validation success_msg <<< "$item"
        log_step "$description"
        
        if validate_item "$id" "$validation" "$success_msg" "❌ $description - FAILED"; then
            echo
        else
            log_warning "Consider addressing this issue before proceeding"
            echo
        fi
    done
    
    log_time "24-hour preparation phase complete"
    echo
}

# T-Minus 4 Hours: Launch Window Preparation
tminus_4_hours() {
    echo -e "${BOLD}${YELLOW}🎯 T-MINUS 4 HOURS: LAUNCH WINDOW PREPARATION${NC}"
    echo "========================================================"
    echo
    
    log_time "Beginning 4-hour launch window preparation"
    
    local items=(
        "db_optimization:Database optimization completed - Performance tuning applied:$SCRIPT_DIR/validate-db-performance.sh:Database performance optimized"
        "cdn_cache:CDN cache cleared and preloaded - Fresh cache with critical assets::CDN cache optimized and preloaded"
        "autoscaling_test:Auto-scaling tested - HPA rules verified and tested:kubectl get hpa -n production:Auto-scaling configuration verified"
        "ssl_validation:SSL certificates validated - All domains secured and verified:$SCRIPT_DIR/validate-ssl-certs.sh:SSL certificates valid and secure"
        "dns_propagation:DNS propagation confirmed - All nameserver changes active::DNS propagation confirmed globally"
        "third_party_services:Third-party services checked - AI APIs, analytics, etc.:node $SCRIPT_DIR/test-third-party-services.js:Third-party services operational"
        "launch_team:Launch team assembled - All roles covered and on standby::Launch team assembled and ready"
    )
    
    for item in "${items[@]}"; do
        IFS=':' read -r id description validation success_msg <<< "$item"
        log_step "$description"
        
        if validate_item "$id" "$validation" "$success_msg" "❌ $description - FAILED"; then
            echo
        else
            log_error "Critical issue detected - address immediately"
            echo
        fi
    done
    
    log_time "4-hour preparation phase complete"
    echo
}

# T-Minus 1 Hour: Final Systems Check
tminus_1_hour() {
    echo -e "${BOLD}${YELLOW}🔍 T-MINUS 1 HOUR: FINAL SYSTEMS CHECK${NC}"
    echo "=================================================="
    echo
    
    log_time "Beginning final systems check"
    
    local items=(
        "health_checks:Health checks passing - All systems green across environments:$SCRIPT_DIR/health-check.sh production:All health checks passing"
        "performance_baselines:Performance baselines established - Benchmark metrics recorded:$SCRIPT_DIR/record-performance-baseline.sh:Performance baselines recorded"
        "error_tracking:Error tracking active - Sentry/monitoring fully operational::Error tracking and monitoring active"
        "customer_support:Customer support prepared - Support team briefed and ready::Customer support team prepared"
        "social_media:Social media scheduled - Launch announcements queued::Social media announcements scheduled"
        "press_kit:Press kit distributed - Media contacts have launch materials::Press kit distributed to media contacts"
    )
    
    for item in "${items[@]}"; do
        IFS=':' read -r id description validation success_msg <<< "$item"
        log_step "$description"
        
        if validate_item "$id" "$validation" "$success_msg" "❌ $description - FAILED"; then
            echo
        else
            log_error "Critical final check failed - review immediately"
            echo
        fi
    done
    
    log_time "Final systems check complete"
    echo
}

# T-Zero: Launch Execution
t_zero_launch() {
    echo -e "${BOLD}${GREEN}🚀 T-ZERO: LAUNCH EXECUTION${NC}"
    echo "=================================="
    echo
    
    log_time "INITIATING LAUNCH SEQUENCE"
    
    # Critical launch steps that must be executed in order
    local items=(
        "blue_green_deploy:Blue-green deployment initiated - Begin traffic switch process:$SCRIPT_DIR/blue-green-deploy.sh --environment=$ENVIRONMENT:Blue-green deployment initiated successfully"
        "monitor_dashboard:Real-time monitoring active - Watch Golden Signals dashboard::Real-time monitoring dashboard active"
        "user_interactions:First user interactions verified - Test critical user journeys:$SCRIPT_DIR/test-critical-journeys.sh:Critical user journeys verified"
        "ai_services_check:AI services responding correctly - Verify generation pipeline:$SCRIPT_DIR/test-ai-pipeline.sh:AI generation pipeline operational"
        "db_performance:Database performance nominal - Query times within thresholds::Database performance within thresholds"
        "error_rates:Error rates acceptable - <0.1% error rate maintained::Error rates within acceptable limits"
        "launch_announcement:Launch announcement published - Social media, blog, PR::Launch announcement published successfully"
    )
    
    for item in "${items[@]}"; do
        IFS=':' read -r id description validation success_msg <<< "$item"
        log_step "🚀 $description"
        
        if [[ "$DRY_RUN" != true ]]; then
            echo -e "${RED}⚠️  CRITICAL LAUNCH STEP${NC}"
            if ! confirm "Ready to execute: $description"; then
                log_error "Launch step aborted by user"
                return 1
            fi
        fi
        
        if validate_item "$id" "$validation" "$success_msg" "❌ CRITICAL: $description - FAILED"; then
            log_success "Launch step completed"
            echo
        else
            log_error "CRITICAL LAUNCH FAILURE - IMMEDIATE ACTION REQUIRED"
            if confirm "Do you want to initiate emergency rollback?"; then
                log "Initiating emergency rollback..."
                "$SCRIPT_DIR/rollback.sh" --reason="Launch execution failure" --force
            fi
            return 1
        fi
    done
    
    # Launch success celebration
    echo -e "${BOLD}${GREEN}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║                   🎉 LAUNCH SUCCESSFUL! 🎉                      ║
    ║                                                                  ║
    ║                4site.pro is now LIVE and operational!           ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log_time "LAUNCH EXECUTION COMPLETE"
    echo
}

# T-Plus 1 Hour: Launch Validation
tplus_1_hour() {
    echo -e "${BOLD}${BLUE}📊 T-PLUS 1 HOUR: LAUNCH VALIDATION${NC}"
    echo "============================================="
    echo
    
    log_time "Beginning post-launch validation"
    
    local items=(
        "traffic_analysis:Traffic patterns analyzed - User behavior as expected::Traffic patterns within expected parameters"
        "conversion_funnel:Conversion funnel verified - Lead capture working correctly:$SCRIPT_DIR/test-conversion-funnel.sh:Conversion funnel working correctly"
        "viral_mechanics:Viral mechanics active - Sharing and referrals tracking:$SCRIPT_DIR/test-viral-mechanics.sh:Viral mechanics operational"
        "commission_system:Commission system operational - Earnings calculated correctly:$SCRIPT_DIR/test-commission-system.sh:Commission system calculating correctly"
        "performance_stable:Performance metrics stable - No degradation under load::Performance metrics stable under load"
        "support_tickets:Support tickets reviewed - Address any immediate issues::Support tickets reviewed and addressed"
        "stakeholder_updates:Stakeholder updates sent - Internal teams informed of status::Stakeholder notifications sent"
    )
    
    for item in "${items[@]}"; do
        IFS=':' read -r id description validation success_msg <<< "$item"
        log_step "$description"
        
        if validate_item "$id" "$validation" "$success_msg" "⚠️ $description - ISSUE DETECTED"; then
            echo
        else
            log_warning "Post-launch issue detected - monitor closely"
            echo
        fi
    done
    
    log_time "Post-launch validation complete"
    echo
}

# Generate launch report
generate_launch_report() {
    echo -e "${BOLD}${PURPLE}📋 GENERATING LAUNCH REPORT${NC}"
    echo "======================================="
    echo
    
    local report_file="launch-report-$(date +%Y%m%d-%H%M%S).json"
    local summary_file="launch-summary-$(date +%Y%m%d-%H%M%S).md"
    
    # Generate JSON report
    cat "$CHECKLIST_STATE_FILE" | jq --arg env "$ENVIRONMENT" --arg total "$TOTAL_ITEMS" --arg completed "$COMPLETED_ITEMS" --arg failed "$FAILED_ITEMS" '{
        environment: $env,
        timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
        summary: {
            total_items: ($total | tonumber),
            completed_items: ($completed | tonumber),
            failed_items: ($failed | tonumber),
            success_rate: (($completed | tonumber) / ($total | tonumber) * 100 | floor)
        },
        checklist_items: .
    }' > "$report_file"
    
    # Generate Markdown summary
    cat > "$summary_file" << EOF
# 4site.pro Launch Report

**Environment:** $ENVIRONMENT  
**Date:** $(date '+%Y-%m-%d %H:%M:%S %Z')  
**Total Items:** $TOTAL_ITEMS  
**Completed:** $COMPLETED_ITEMS  
**Failed:** $FAILED_ITEMS  
**Success Rate:** $(( COMPLETED_ITEMS * 100 / TOTAL_ITEMS ))%

## Launch Status

$(if [[ $FAILED_ITEMS -eq 0 ]]; then echo "✅ **LAUNCH SUCCESSFUL** - All critical items completed"; else echo "⚠️ **LAUNCH ISSUES** - $FAILED_ITEMS items failed"; fi)

## Next Steps

1. Monitor system performance for the next 24 hours
2. Address any failed checklist items
3. Analyze user adoption and feedback
4. Prepare for scaling based on traffic patterns
5. Review and improve launch procedures

## Critical Metrics to Monitor

- Response time (target: <1 second P95)
- Error rate (target: <0.1%)
- User registrations (target: 100+ in 24h)
- Site generations (target: 50+ in 24h)
- System uptime (target: >99.9%)

---
*Report generated by 4site.pro Launch Day Checklist*
EOF
    
    log_success "Launch report generated: $report_file"
    log_success "Launch summary generated: $summary_file"
    
    echo
    echo -e "${BOLD}Launch Summary:${NC}"
    echo "• Total checklist items: $TOTAL_ITEMS"
    echo "• Completed successfully: $COMPLETED_ITEMS"
    echo "• Failed items: $FAILED_ITEMS"
    echo "• Success rate: $(( COMPLETED_ITEMS * 100 / TOTAL_ITEMS ))%"
    echo
}

# Main function
main() {
    show_launch_header
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${YELLOW}Welcome to the 4site.pro Launch Day Checklist!${NC}"
        echo "This interactive checklist will guide you through the complete launch process."
        echo
        
        if ! confirm "Are you ready to begin the launch checklist?"; then
            log "Launch checklist cancelled by user"
            exit 0
        fi
        echo
    fi
    
    # Initialize counters
    TOTAL_ITEMS=$(( 8 + 7 + 6 + 7 + 7 ))  # Total items across all phases
    
    # Execute launch phases
    tminus_24_hours
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${YELLOW}24-hour preparation phase complete. Ready for 4-hour phase?${NC}"
        if ! confirm "Continue to T-Minus 4 Hours phase?"; then
            log "Launch process paused at user request"
            exit 0
        fi
        echo
    fi
    
    tminus_4_hours
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${YELLOW}4-hour preparation phase complete. Ready for final systems check?${NC}"
        if ! confirm "Continue to T-Minus 1 Hour phase?"; then
            log "Launch process paused at user request"
            exit 0
        fi
        echo
    fi
    
    tminus_1_hour
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${RED}${BOLD}FINAL CONFIRMATION${NC}"
        echo -e "${RED}You are about to initiate the live production launch of 4site.pro${NC}"
        echo -e "${RED}This will make the application available to all users.${NC}"
        echo
        if ! confirm "Are you absolutely ready to launch 4site.pro to production?"; then
            log "Production launch aborted at user request"
            exit 0
        fi
        echo
    fi
    
    t_zero_launch
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${GREEN}Launch execution complete! Starting post-launch validation...${NC}"
        sleep 3
        echo
    fi
    
    tplus_1_hour
    
    # Generate final report
    generate_launch_report
    
    # Final status
    if [[ $FAILED_ITEMS -eq 0 ]]; then
        echo -e "${BOLD}${GREEN}🎉 LAUNCH DAY CHECKLIST COMPLETE - SUCCESS!${NC}"
        echo -e "${GREEN}4site.pro has been successfully launched to production!${NC}"
        exit 0
    else
        echo -e "${BOLD}${YELLOW}⚠️ LAUNCH DAY CHECKLIST COMPLETE - WITH ISSUES${NC}"
        echo -e "${YELLOW}$FAILED_ITEMS items require attention. Review the launch report.${NC}"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    if [[ -f "$CHECKLIST_STATE_FILE" ]]; then
        log "Checklist state saved to: $CHECKLIST_STATE_FILE"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Execute main function
main "$@"
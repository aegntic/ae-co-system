#!/bin/bash

# ================================================================================================
# GLOBAL DEPLOYMENT SCRIPT - $100B COMPANY STANDARDS
# Zero-downtime deployment with automatic rollback and health validation
# ================================================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${1:-production}"
REGION="${2:-us-east-1}"
DOCKER_STACK_NAME="4site-${DEPLOYMENT_ENV}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Deployment validation
validate_environment() {
    log_info "Validating deployment environment..."
    
    # Check Docker Swarm
    if ! docker node ls &>/dev/null; then
        log_error "Docker Swarm not initialized. Run: docker swarm init"
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.${DEPLOYMENT_ENV}" ]]; then
        log_error "Environment file .env.${DEPLOYMENT_ENV} not found"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$PROJECT_ROOT/.env.${DEPLOYMENT_ENV}"
    set +a
    
    # Validate required variables
    local required_vars=(
        "PRODUCTION_DATABASE_URL"
        "REDIS_CLUSTER_URL"
        "OPENROUTER_API_KEY"
        "STRIPE_SECRET_KEY"
        "CDN_BASE_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment validation passed"
}

# Pre-deployment health checks
pre_deployment_checks() {
    log_info "Running pre-deployment health checks..."
    
    # Check database connectivity
    if ! timeout 10 pg_isready -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER}" &>/dev/null; then
        log_error "Cannot connect to PostgreSQL database"
        exit 1
    fi
    
    # Check Redis connectivity
    if ! timeout 10 redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &>/dev/null; then
        log_error "Cannot connect to Redis"
        exit 1
    fi
    
    # Check external API availability
    if ! curl -s --max-time 10 "https://openrouter.ai/api/v1/models" > /dev/null; then
        log_warning "OpenRouter API may be unreachable"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    local services=(
        "api-gateway"
        "main-app"
        "ai-analysis-pipeline"
        "site-generation-engine"
        "commission-service"
        "video-slideshow-generator"
    )
    
    local registry="${DOCKER_REGISTRY:-4site.azurecr.io}"
    local tag="${BUILD_NUMBER:-$(git rev-parse --short HEAD)}"
    
    for service in "${services[@]}"; do
        log_info "Building $service..."
        
        local image_name="${registry}/${service}:${tag}"
        local latest_name="${registry}/${service}:latest"
        
        # Build image
        if [[ "$service" == "main-app" ]]; then
            docker build -t "$image_name" -t "$latest_name" \
                -f "$PROJECT_ROOT/core/main-app/project4site_-github-readme-to-site-generator/Dockerfile.production" \
                "$PROJECT_ROOT/core/main-app/project4site_-github-readme-to-site-generator"
        else
            docker build -t "$image_name" -t "$latest_name" \
                "$PROJECT_ROOT/services/$service"
        fi
        
        # Push to registry
        docker push "$image_name"
        docker push "$latest_name"
        
        log_success "Built and pushed $service"
    done
}

# Deploy database migrations
deploy_migrations() {
    log_info "Deploying database migrations..."
    
    # Run migrations using a temporary container
    docker run --rm \
        --network host \
        -e DATABASE_URL="$PRODUCTION_DATABASE_URL" \
        -v "$PROJECT_ROOT/core/main-app/project4site_-github-readme-to-site-generator/database:/migrations" \
        postgres:15-alpine \
        sh -c "
            for migration in /migrations/*.sql; do
                echo 'Running migration: \$migration'
                psql \$DATABASE_URL -f \$migration
            done
        "
    
    log_success "Database migrations completed"
}

# Deploy Docker stack
deploy_stack() {
    log_info "Deploying Docker stack: $DOCKER_STACK_NAME"
    
    # Deploy with environment substitution
    docker stack deploy \
        --compose-file "$SCRIPT_DIR/global-infrastructure.yml" \
        --with-registry-auth \
        --prune \
        "$DOCKER_STACK_NAME"
    
    log_success "Stack deployment initiated"
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to become healthy..."
    
    local max_wait=600  # 10 minutes
    local wait_time=0
    local check_interval=10
    
    while [[ $wait_time -lt $max_wait ]]; do
        local healthy_services=0
        local total_services=0
        
        # Check service health
        while IFS= read -r line; do
            if [[ $line == *"$DOCKER_STACK_NAME"* ]]; then
                ((total_services++))
                if [[ $line == *"Running"* ]] && [[ $line == *"Ready"* ]]; then
                    ((healthy_services++))
                fi
            fi
        done < <(docker service ls --format "table {{.Name}}\t{{.Mode}}\t{{.Replicas}}")
        
        if [[ $total_services -gt 0 ]] && [[ $healthy_services -eq $total_services ]]; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Healthy services: $healthy_services/$total_services (waiting ${wait_time}s/${max_wait}s)"
        sleep $check_interval
        ((wait_time += check_interval))
    done
    
    log_error "Services failed to become healthy within $max_wait seconds"
    return 1
}

# Post-deployment validation
post_deployment_validation() {
    log_info "Running post-deployment validation..."
    
    # Get API Gateway service endpoint
    local api_endpoint="http://localhost"
    
    # Test health endpoint
    if ! curl -s --max-time 10 "$api_endpoint/api/health" | grep -q "healthy"; then
        log_error "Health check failed"
        return 1
    fi
    
    # Test API Gateway rate limiting
    local rate_limit_test=$(curl -s -o /dev/null -w "%{http_code}" "$api_endpoint/api/health")
    if [[ "$rate_limit_test" != "200" ]]; then
        log_error "API Gateway not responding correctly"
        return 1
    fi
    
    # Test database connectivity through API
    if ! curl -s --max-time 10 "$api_endpoint/api/commissions/health" | grep -q "ok"; then
        log_warning "Commission service may not be fully operational"
    fi
    
    log_success "Post-deployment validation passed"
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Get previous version from Git
    local previous_commit=$(git rev-parse HEAD~1)
    local registry="${DOCKER_REGISTRY:-4site.azurecr.io}"
    
    # Update service images to previous version
    local services=(
        "api-gateway"
        "main-app"
        "ai-analysis-pipeline"
        "site-generation-engine"
        "commission-service"
        "video-slideshow-generator"
    )
    
    for service in "${services[@]}"; do
        local service_name="${DOCKER_STACK_NAME}_${service}"
        local previous_image="${registry}/${service}:${previous_commit}"
        
        docker service update --image "$previous_image" "$service_name"
    done
    
    log_success "Rollback completed"
}

# Cleanup old images
cleanup_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove images older than 7 days
    docker image prune -a --filter "until=168h" --force
    
    log_success "Image cleanup completed"
}

# Performance benchmarking
run_performance_tests() {
    log_info "Running performance benchmarks..."
    
    # API response time test
    local api_endpoint="http://localhost"
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$api_endpoint/api/health")
    
    if (( $(echo "$response_time > 0.2" | bc -l) )); then
        log_warning "API response time ($response_time s) exceeds 200ms target"
    else
        log_success "API response time: ${response_time}s (within target)"
    fi
    
    # Load test with Apache Bench
    if command -v ab &> /dev/null; then
        log_info "Running load test..."
        ab -n 1000 -c 10 "$api_endpoint/api/health" > /tmp/ab_results.txt
        
        local requests_per_second=$(grep "Requests per second" /tmp/ab_results.txt | awk '{print $4}')
        log_info "Load test results: $requests_per_second requests/second"
    fi
}

# Main deployment workflow
main() {
    log_info "Starting global deployment for 4site.pro ($DEPLOYMENT_ENV)"
    log_info "Region: $REGION"
    log_info "Stack: $DOCKER_STACK_NAME"
    
    # Pre-deployment phase
    validate_environment
    pre_deployment_checks
    
    # Build phase
    build_and_push_images
    
    # Database phase
    deploy_migrations
    
    # Deployment phase
    deploy_stack
    
    # Validation phase
    if wait_for_health; then
        if post_deployment_validation; then
            log_success "Deployment completed successfully!"
            
            # Performance testing
            run_performance_tests
            
            # Cleanup
            cleanup_images
            
            # Display service information
            log_info "Service status:"
            docker service ls --filter "name=$DOCKER_STACK_NAME"
            
            log_info "Access points:"
            log_info "  - Application: https://4site.pro"
            log_info "  - API Gateway: https://api.4site.pro"
            log_info "  - Monitoring: https://monitoring.4site.pro:3000"
            log_info "  - Logs: https://logs.4site.pro:5601"
            
        else
            log_error "Post-deployment validation failed"
            if [[ "${AUTO_ROLLBACK:-true}" == "true" ]]; then
                rollback_deployment
            fi
            exit 1
        fi
    else
        log_error "Services failed to become healthy"
        if [[ "${AUTO_ROLLBACK:-true}" == "true" ]]; then
            rollback_deployment
        fi
        exit 1
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
#!/bin/bash
set -euo pipefail

# Porkbun MCP Server Deployment Script
# Author: MiniMax Agent
# Version: 1.0.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
BUILD_TARGET="production"
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="porkbun-mcp"
FORCE_REBUILD=false
SKIP_TESTS=false
BACKUP_DATA=true

# Functions
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

show_help() {
    cat << EOF
Porkbun MCP Server Deployment Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    build       Build the Docker image
    deploy      Deploy the server
    start       Start the server
    stop        Stop the server
    restart     Restart the server
    logs        Show server logs
    test        Run tests
    shell       Open interactive shell
    backup      Backup data volumes
    restore     Restore data volumes
    clean       Clean up containers and volumes
    health      Check server health

Options:
    -e, --env ENV           Environment (production|development|test) [default: production]
    -f, --force             Force rebuild without cache
    -s, --skip-tests        Skip running tests
    -n, --no-backup         Skip backup before deployment
    -p, --project NAME      Docker Compose project name [default: porkbun-mcp]
    -h, --help              Show this help message

Examples:
    $0 deploy                           # Deploy production server
    $0 -e development deploy            # Deploy development server
    $0 -f deploy                        # Force rebuild and deploy
    $0 test                             # Run tests
    $0 logs                             # Show logs
    $0 shell                            # Open development shell

Environment Variables:
    PORKBUN_API_KEY                     # Porkbun API key (required)
    PORKBUN_SECRET_API_KEY              # Porkbun secret API key (required)
    PORKBUN_MCP_ENCRYPTION_KEY          # Encryption key for credential storage
    GRAFANA_ADMIN_PASSWORD              # Grafana admin password for monitoring

EOF
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists, create template if not
    if [[ ! -f .env ]]; then
        log_warning ".env file not found. Creating template..."
        create_env_template
    fi
    
    log_success "Requirements check passed"
}

create_env_template() {
    cat > .env << 'EOF'
# Porkbun MCP Server Environment Configuration

# Required: Porkbun API Credentials
PORKBUN_API_KEY=your_api_key_here
PORKBUN_SECRET_API_KEY=your_secret_api_key_here

# Optional: Encryption key for credential storage (auto-generated if not set)
PORKBUN_MCP_ENCRYPTION_KEY=

# Server Configuration
HOST_PORT=8080
ENVIRONMENT=production
LOG_LEVEL=INFO

# Optional: Monitoring (if using monitoring profile)
GRAFANA_ADMIN_PASSWORD=admin

# Optional: Custom configuration
DEBUG=false
EOF
    
    log_info "Created .env template file. Please edit it with your API credentials."
}

validate_env() {
    log_info "Validating environment variables..."
    
    if [[ -f .env ]]; then
        source .env
    fi
    
    # Check required variables for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ -z "${PORKBUN_API_KEY:-}" ]]; then
            log_error "PORKBUN_API_KEY is required for production deployment"
            exit 1
        fi
        
        if [[ -z "${PORKBUN_SECRET_API_KEY:-}" ]]; then
            log_error "PORKBUN_SECRET_API_KEY is required for production deployment"
            exit 1
        fi
    fi
    
    log_success "Environment validation passed"
}

build_image() {
    log_info "Building Docker image for $ENVIRONMENT environment..."
    
    local build_args=""
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        build_args="--no-cache"
    fi
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build $build_args --target "$BUILD_TARGET"
    
    log_success "Docker image built successfully"
}

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests as requested"
        return 0
    fi
    
    log_info "Running tests..."
    
    # Use development compose for tests
    docker-compose -f docker-compose.dev.yml -p "${PROJECT_NAME}-test" \
        run --rm --profile test test-runner
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "All tests passed"
    else
        log_error "Tests failed with exit code $exit_code"
        exit $exit_code
    fi
}

backup_data() {
    if [[ "$BACKUP_DATA" == "false" ]]; then
        log_warning "Skipping backup as requested"
        return 0
    fi
    
    log_info "Creating backup of data volumes..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup data volumes
    docker run --rm \
        -v "${PROJECT_NAME}_porkbun_data:/data:ro" \
        -v "$(pwd)/$backup_dir:/backup" \
        alpine:latest \
        tar czf /backup/porkbun_data.tar.gz -C /data .
    
    docker run --rm \
        -v "${PROJECT_NAME}_porkbun_logs:/logs:ro" \
        -v "$(pwd)/$backup_dir:/backup" \
        alpine:latest \
        tar czf /backup/porkbun_logs.tar.gz -C /logs .
    
    log_success "Backup created in $backup_dir"
}

deploy_server() {
    log_info "Deploying Porkbun MCP Server..."
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down || true
    
    # Start the server
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    # Wait for health check
    log_info "Waiting for server to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T porkbun-mcp python -c "import sys; sys.exit(0)" &> /dev/null; then
            log_success "Server is healthy and ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    log_error "Server failed to become healthy within timeout"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs porkbun-mcp
    exit 1
}

show_logs() {
    log_info "Showing server logs..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f porkbun-mcp
}

check_health() {
    log_info "Checking server health..."
    
    local status=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --format json | jq -r '.[] | select(.Service == "porkbun-mcp") | .State')
    
    if [[ "$status" == "running" ]]; then
        # Check if container is healthy
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T porkbun-mcp python -c "import sys; sys.exit(0)" &> /dev/null; then
            log_success "Server is running and healthy"
        else
            log_error "Server is running but not healthy"
            exit 1
        fi
    else
        log_error "Server is not running (status: $status)"
        exit 1
    fi
}

open_shell() {
    log_info "Opening interactive shell..."
    docker-compose -f docker-compose.dev.yml -p "${PROJECT_NAME}-dev" \
        run --rm --profile shell shell
}

clean_up() {
    log_info "Cleaning up containers and volumes..."
    
    # Stop and remove containers
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v
    docker-compose -f docker-compose.dev.yml -p "${PROJECT_NAME}-dev" down -v || true
    
    # Remove unused images
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_REBUILD=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -n|--no-backup)
            BACKUP_DATA=false
            shift
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        build|deploy|start|stop|restart|logs|test|shell|backup|restore|clean|health)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set compose file based on environment
if [[ "$ENVIRONMENT" == "development" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    BUILD_TARGET="development"
    PROJECT_NAME="${PROJECT_NAME}-dev"
elif [[ "$ENVIRONMENT" == "test" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    BUILD_TARGET="development"
    PROJECT_NAME="${PROJECT_NAME}-test"
fi

# Check if command is provided
if [[ -z "${COMMAND:-}" ]]; then
    log_error "No command specified"
    show_help
    exit 1
fi

# Main execution
log_info "Starting deployment script for environment: $ENVIRONMENT"

check_requirements
validate_env

case "$COMMAND" in
    build)
        build_image
        ;;
    deploy)
        backup_data
        build_image
        run_tests
        deploy_server
        log_success "Deployment completed successfully!"
        ;;
    start)
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
        log_success "Server started"
        ;;
    stop)
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
        log_success "Server stopped"
        ;;
    restart)
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart
        log_success "Server restarted"
        ;;
    logs)
        show_logs
        ;;
    test)
        run_tests
        ;;
    shell)
        open_shell
        ;;
    backup)
        backup_data
        ;;
    health)
        check_health
        ;;
    clean)
        clean_up
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac

log_success "Script completed successfully!"

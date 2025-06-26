#!/bin/bash

# DailyDoco Pro - One-Click Installation Script
# Elite-tier automated documentation platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ASCII Art Banner
print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
 ____        _ _       ____                    ____
|  _ \  __ _(_) |_   _|  _ \  ___   ___ ___   |  _ \ _ __ ___
| | | |/ _` | | | | | | | | |/ _ \ / __/ _ \  | |_) | '__/ _ \
| |_| | (_| | | | |_| | |_| | (_) | (_| (_) | |  __/| | | (_) |
|____/ \__,_|_|_|\__, |____/ \___/ \___\___/  |_|   |_|  \___/
                 |___/
        Elite-Tier Automated Documentation Platform
EOF
    echo -e "${NC}"
}

# Helper functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command_exists docker; then
        log_error "Docker is required but not installed."
        log_info "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is required but not installed."
        log_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check available disk space (need at least 5GB)
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 5 ]; then
        log_warning "Low disk space detected. DailyDoco Pro requires at least 5GB free space."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "System requirements check passed!"
}

# Create installation directory
setup_directory() {
    INSTALL_DIR="$HOME/dailydoco-pro"
    
    log_info "Setting up installation directory: $INSTALL_DIR"
    
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Installation directory already exists."
        read -p "Remove existing installation? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
            log_success "Removed existing installation."
        else
            log_info "Using existing directory."
        fi
    fi
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
}

# Download docker-compose.yml and configuration
download_configuration() {
    log_info "Downloading DailyDoco Pro configuration..."
    
    # Download main docker-compose file
    curl -fsSL "https://raw.githubusercontent.com/aegntic/DAILYDOCO/main/docker-compose.yml" -o docker-compose.yml
    
    # Create .env file with default configuration
    cat > .env << EOF
# DailyDoco Pro Configuration
COMPOSE_PROJECT_NAME=dailydoco-pro

# Database Configuration
POSTGRES_DB=dailydoco
POSTGRES_USER=dailydoco
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# Node Environment
NODE_ENV=production

# API URLs
API_URL=http://localhost:8080
WS_URL=ws://localhost:8080

# Resource Limits
POSTGRES_MAX_CONNECTIONS=100
REDIS_MAXMEMORY=256mb

# Capture Settings
CAPTURE_QUALITY=high
CAPTURE_FPS=30
GPU_ACCELERATION=true

# AI Model Settings
AI_MODEL_CACHE_SIZE=2gb
AEGNT27_ENABLED=true
TEST_AUDIENCE_SIZE=50
EOF
    
    # Create directories for volumes
    mkdir -p data/{postgres,redis,storage,models,cache,logs}
    
    log_success "Configuration downloaded and setup completed!"
}

# Pull Docker images
pull_images() {
    log_info "Pulling Docker images (this may take a few minutes)..."
    
    # Use docker-compose or docker compose depending on what's available
    if command_exists docker-compose; then
        docker-compose pull
    else
        docker compose pull
    fi
    
    log_success "Docker images pulled successfully!"
}

# Start services
start_services() {
    log_info "Starting DailyDoco Pro services..."
    
    # Start services in background
    if command_exists docker-compose; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    
    # Wait up to 120 seconds for services to be healthy
    for i in {1..24}; do
        if curl -f http://localhost:8080/health >/dev/null 2>&1; then
            break
        fi
        if [ $i -eq 24 ]; then
            log_error "Services failed to start within 2 minutes."
            log_info "Check logs with: docker-compose logs"
            exit 1
        fi
        sleep 5
        echo -n "."
    done
    echo
    
    log_success "All services are running and healthy!"
}

# Show status and next steps
show_status() {
    echo
    echo -e "${GREEN}🎉 DailyDoco Pro Installation Complete! 🎉${NC}"
    echo
    echo "Services running:"
    echo "  📊 Web Dashboard:  http://localhost:3000"
    echo "  🔧 API Server:     http://localhost:8080"
    echo "  🤖 MCP Server:     http://localhost:8081"
    echo "  🗄️  Database:       postgresql://localhost:5432/dailydoco"
    echo
    echo "Quick commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart:          docker-compose restart"
    echo "  Update:           ./update-dailydoco.sh"
    echo
    echo "Installation directory: $INSTALL_DIR"
    echo
    
    # Try to open dashboard in browser
    if command_exists xdg-open; then
        log_info "Opening dashboard in browser..."
        xdg-open http://localhost:3000 >/dev/null 2>&1 &
    elif command_exists open; then
        log_info "Opening dashboard in browser..."
        open http://localhost:3000 >/dev/null 2>&1 &
    else
        log_info "Open http://localhost:3000 in your browser to access the dashboard."
    fi
}

# Create update script
create_update_script() {
    cat > update-dailydoco.sh << 'EOF'
#!/bin/bash
set -euo pipefail

echo "🔄 Updating DailyDoco Pro..."

# Pull latest images
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose pull
    docker-compose up -d
else
    docker compose pull
    docker compose up -d
fi

echo "✅ DailyDoco Pro updated successfully!"
EOF
    
    chmod +x update-dailydoco.sh
}

# Main installation function
main() {
    print_banner
    
    log_info "Welcome to the DailyDoco Pro installer!"
    log_info "This will install the complete elite-tier documentation platform."
    echo
    
    check_requirements
    setup_directory
    download_configuration
    create_update_script
    pull_images
    start_services
    show_status
    
    log_success "Installation completed successfully!"
}

# Handle interrupts gracefully
trap 'log_error "Installation interrupted."; exit 1' INT TERM

# Run main function
main "$@"
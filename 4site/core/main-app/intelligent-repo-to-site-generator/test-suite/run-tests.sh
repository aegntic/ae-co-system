#!/bin/bash

# 4SITE.PRO TEST RUNNER
# Production-ready test execution script
# 
# Usage:
#   ./run-tests.sh [options]
#   
# Options:
#   --environment=staging|production  Set test environment
#   --parallel                        Run tests in parallel
#   --ci                             Run in CI mode
#   --quick                          Run only essential tests
#   --performance                    Run only performance tests
#   --security                       Run only security tests
#   --viral                          Run only viral mechanics tests

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT="staging"
PARALLEL="false"
CI_MODE="false"
TEST_TYPE="all"
BASE_URL="http://localhost:5173"
HEADLESS="false"
MAX_RETRIES="2"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment=*)
      ENVIRONMENT="${1#*=}"
      shift
      ;;
    --parallel)
      PARALLEL="true"
      shift
      ;;
    --ci)
      CI_MODE="true"
      HEADLESS="true"
      shift
      ;;
    --quick)
      TEST_TYPE="quick"
      shift
      ;;
    --performance)
      TEST_TYPE="performance"
      shift
      ;;
    --security)
      TEST_TYPE="security"
      shift
      ;;
    --viral)
      TEST_TYPE="viral"
      shift
      ;;
    --base-url=*)
      BASE_URL="${1#*=}"
      shift
      ;;
    --headless)
      HEADLESS="true"
      shift
      ;;
    --help)
      echo "4site.pro Test Runner"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --environment=staging|production  Set test environment (default: staging)"
      echo "  --parallel                        Run tests in parallel"
      echo "  --ci                             Run in CI mode (headless, strict)"
      echo "  --quick                          Run only essential tests"
      echo "  --performance                    Run only performance tests"
      echo "  --security                       Run only security tests"
      echo "  --viral                          Run only viral mechanics tests"
      echo "  --base-url=URL                   Set base URL for testing (default: http://localhost:5173)"
      echo "  --headless                       Run browsers in headless mode"
      echo "  --help                           Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

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

print_header() {
  echo ""
  echo -e "${GREEN}🚀 4SITE.PRO COMPREHENSIVE TEST SUITE${NC}"
  echo "=================================================================="
  echo "Environment: $ENVIRONMENT"
  echo "Test Type: $TEST_TYPE"
  echo "Base URL: $BASE_URL"
  echo "Parallel: $PARALLEL"
  echo "CI Mode: $CI_MODE"
  echo "Headless: $HEADLESS"
  echo "=================================================================="
  echo ""
}

# Function to check prerequisites
check_prerequisites() {
  print_status "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
  fi
  
  NODE_VERSION=$(node --version)
  print_status "Node.js version: $NODE_VERSION"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
  fi
  
  # Check if we're in the right directory
  if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run from the project root directory."
    exit 1
  fi
  
  # Check if test suite exists
  if [[ ! -d "test-suite" ]]; then
    print_error "test-suite directory not found"
    exit 1
  fi
  
  print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
  print_status "Installing/updating dependencies..."
  
  if npm ci > /dev/null 2>&1; then
    print_success "Dependencies installed via npm ci"
  elif npm install > /dev/null 2>&1; then
    print_success "Dependencies installed via npm install"
  else
    print_error "Failed to install dependencies"
    exit 1
  fi
}

# Function to check if services are running
check_services() {
  print_status "Checking required services..."
  
  # Check if the application is running
  if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
    print_success "Application is accessible at $BASE_URL"
  else
    print_warning "Application may not be running at $BASE_URL"
    
    if [[ "$CI_MODE" == "true" ]]; then
      print_error "Application must be running for CI tests"
      exit 1
    else
      print_status "Attempting to start development server..."
      start_dev_server
    fi
  fi
}

# Function to start development server
start_dev_server() {
  print_status "Starting development server..."
  
  # Start in background
  npm run dev > dev-server.log 2>&1 &
  DEV_SERVER_PID=$!
  
  # Wait for server to start
  for i in {1..30}; do
    if curl -s --max-time 2 "$BASE_URL" > /dev/null 2>&1; then
      print_success "Development server started (PID: $DEV_SERVER_PID)"
      return 0
    fi
    sleep 2
  done
  
  print_error "Failed to start development server"
  kill $DEV_SERVER_PID 2>/dev/null || true
  exit 1
}

# Function to setup environment variables
setup_environment() {
  print_status "Setting up environment variables..."
  
  # Set common environment variables
  export NODE_ENV="test"
  export TEST_ENVIRONMENT="$ENVIRONMENT"
  export TEST_BASE_URL="$BASE_URL"
  export HEADLESS="$HEADLESS"
  export PARALLEL_TESTS="$PARALLEL"
  export MAX_RETRIES="$MAX_RETRIES"
  
  if [[ "$CI_MODE" == "true" ]]; then
    export CI="true"
    export HEADLESS="true"
  fi
  
  # Create test results directory
  mkdir -p test-results
  
  print_success "Environment configured"
}

# Function to run specific test types
run_tests() {
  print_status "Running tests..."
  
  local test_start_time=$(date +%s)
  local test_command=""
  
  # Set test results path
  export ARTIFACT_PATH="./test-results"
  
  case $TEST_TYPE in
    "quick")
      print_status "Running quick test suite (functional tests only)..."
      test_command="node test-suite/functional-tests.js"
      ;;
    "performance")
      print_status "Running performance tests..."
      test_command="node test-suite/performance-tests.js"
      ;;
    "security")
      print_status "Running security tests..."
      test_command="node test-suite/security-tests.js"
      ;;
    "viral")
      print_status "Running viral mechanics tests..."
      test_command="node test-suite/viral-mechanics-tests.js"
      ;;
    "all")
      if [[ "$CI_MODE" == "true" ]]; then
        print_status "Running CI integration..."
        test_command="node test-suite/ci-integration.js"
      else
        print_status "Running comprehensive test suite..."
        test_command="node test-suite/comprehensive-test-suite.js"
      fi
      ;;
    *)
      print_error "Unknown test type: $TEST_TYPE"
      exit 1
      ;;
  esac
  
  # Run the tests
  if eval "$test_command"; then
    local test_end_time=$(date +%s)
    local test_duration=$((test_end_time - test_start_time))
    print_success "Tests completed successfully in ${test_duration}s"
    return 0
  else
    local test_end_time=$(date +%s)
    local test_duration=$((test_end_time - test_start_time))
    print_error "Tests failed after ${test_duration}s"
    return 1
  fi
}

# Function to generate test summary
generate_summary() {
  print_status "Generating test summary..."
  
  # Check if test results exist
  if [[ -d "test-results" ]]; then
    local result_files=$(find test-results -name "*.json" -o -name "*.html" -o -name "*.png" | wc -l)
    print_success "Generated $result_files test artifacts in test-results/"
    
    # List key artifacts
    if [[ -f "test-results/comprehensive-test-report.html" ]]; then
      print_status "📊 HTML Report: test-results/comprehensive-test-report.html"
    fi
    
    if [[ -f "test-results/comprehensive-test-report.json" ]]; then
      print_status "📋 JSON Report: test-results/comprehensive-test-report.json"
    fi
    
    if [[ -f "test-results/executive-summary.md" ]]; then
      print_status "📝 Executive Summary: test-results/executive-summary.md"
    fi
    
    if [[ -f "test-results/ci-report.json" ]]; then
      print_status "🔧 CI Report: test-results/ci-report.json"
    fi
  else
    print_warning "No test results directory found"
  fi
}

# Function to cleanup
cleanup() {
  print_status "Cleaning up..."
  
  # Kill development server if we started it
  if [[ -n "$DEV_SERVER_PID" ]]; then
    kill $DEV_SERVER_PID 2>/dev/null || true
    print_status "Development server stopped"
  fi
  
  # Clean up any remaining processes
  pkill -f "node.*test-suite" 2>/dev/null || true
  pkill -f "chromium" 2>/dev/null || true
  pkill -f "firefox" 2>/dev/null || true
}

# Main execution
main() {
  # Set up signal handlers for cleanup
  trap cleanup EXIT INT TERM
  
  print_header
  
  check_prerequisites
  install_dependencies
  setup_environment
  check_services
  
  # Run tests and capture exit code
  if run_tests; then
    generate_summary
    print_success "🎉 All tests completed successfully!"
    exit 0
  else
    generate_summary
    print_error "❌ Test execution failed!"
    exit 1
  fi
}

# Run main function
main "$@"
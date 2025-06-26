#!/bin/bash

# DailyDoco Pro Scale Testing Infrastructure Setup
# Sets up comprehensive testing environment for 10M videos/month validation

set -e

echo "🚀 Setting up DailyDoco Pro Scale Testing Infrastructure"
echo "Target: 10M videos/month (333,333 videos/day peak)"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "pyproject.toml" ]]; then
    print_error "Please run this script from the scale-testing directory"
    exit 1
fi

print_status "Installing Python dependencies with uv..."

# Install uv if not present
if ! command -v uv &> /dev/null; then
    print_warning "uv not found, installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env
fi

# Create virtual environment and install dependencies
print_status "Creating virtual environment and installing dependencies..."
uv sync

# Install additional GPU dependencies if NVIDIA GPU is available
if command -v nvidia-smi &> /dev/null; then
    print_status "NVIDIA GPU detected, installing GPU acceleration dependencies..."
    uv add cupy-cuda12x nvidia-ml-py
else
    print_warning "No NVIDIA GPU detected, skipping GPU dependencies"
fi

# Install visualization dependencies
print_status "Installing visualization and dashboard dependencies..."
uv add streamlit plotly jupyter notebook

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p {results,logs,config,dashboards/static,infrastructure/k8s,infrastructure/docker}

# Set up configuration files
print_status "Setting up configuration files..."

# Create main config file
cat > config/scale_testing_config.yaml << 'EOF'
# DailyDoco Pro Scale Testing Configuration

targets:
  monthly_videos: 10000000
  daily_videos: 333333
  peak_videos_per_second: 4
  uptime_target: 0.999
  cost_per_video_target: 0.10
  rto_target_seconds: 900

infrastructure:
  max_pods: 10000
  gpu_cluster_size: 1000
  storage_capacity_tb: 50
  network_bandwidth_gbps: 100
  database_connections: 10000

youtube_api:
  channels_count: 1000
  daily_quota_per_channel: 10000
  upload_cost_per_video: 1600
  target_success_rate: 0.995

regions:
  - name: "north_america"
    timezone_offset: -5
    user_percentage: 0.4
  - name: "europe" 
    timezone_offset: 1
    user_percentage: 0.3
  - name: "asia_pacific"
    timezone_offset: 8
    user_percentage: 0.2
  - name: "latin_america"
    timezone_offset: -3
    user_percentage: 0.06
  - name: "africa_middle_east"
    timezone_offset: 2
    user_percentage: 0.04

simulation:
  user_base_size: 100000
  active_user_percentage: 0.2
  test_duration_days: 30
  peak_events_per_month: 5
EOF

# Create Docker Compose for test infrastructure
print_status "Setting up Docker test infrastructure..."

cat > infrastructure/docker/docker-compose.test.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dailydoco_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru

  neo4j:
    image: neo4j:5
    environment:
      NEO4J_AUTH: neo4j/test_password
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data

  influxdb:
    image: influxdb:2.7
    environment:
      INFLUXDB_DB: dailydoco_metrics
      INFLUXDB_ADMIN_USER: admin
      INFLUXDB_ADMIN_PASSWORD: admin_password
    ports:
      - "8086:8086"
    volumes:
      - influxdb_data:/var/lib/influxdb2

  grafana:
    image: grafana/grafana:10.0.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - ./grafana/provisioning:/etc/grafana/provisioning

volumes:
  postgres_data:
  neo4j_data:
  influxdb_data:
  grafana_data:
EOF

# Create Kubernetes test manifests
print_status "Setting up Kubernetes test manifests..."

cat > infrastructure/k8s/test-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dailydoco-scale-test
  labels:
    app: dailydoco-scale-test
spec:
  replicas: 10
  selector:
    matchLabels:
      app: dailydoco-scale-test
  template:
    metadata:
      labels:
        app: dailydoco-scale-test
    spec:
      containers:
      - name: scale-test-runner
        image: python:3.12-slim
        command: ["python", "-c", "import time; time.sleep(3600)"]
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: dailydoco-scale-test-service
spec:
  selector:
    app: dailydoco-scale-test
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dailydoco-scale-test-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dailydoco-scale-test
  minReplicas: 10
  maxReplicas: 10000
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF

# Create monitoring configuration
print_status "Setting up monitoring configuration..."

mkdir -p infrastructure/grafana/dashboards infrastructure/grafana/provisioning/dashboards infrastructure/grafana/provisioning/datasources

cat > infrastructure/grafana/provisioning/datasources/datasources.yaml << 'EOF'
apiVersion: 1

datasources:
  - name: InfluxDB
    type: influxdb
    access: proxy
    url: http://influxdb:8086
    database: dailydoco_metrics
    user: admin
    password: admin_password
    isDefault: true
EOF

cat > infrastructure/grafana/provisioning/dashboards/dashboards.yaml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create test runner scripts
print_status "Creating test runner scripts..."

cat > run_performance_tests.sh << 'EOF'
#!/bin/bash
echo "🚀 Running Performance Tests"
uv run python performance/benchmark_suite.py
EOF

cat > run_scalability_tests.sh << 'EOF' 
#!/bin/bash
echo "📈 Running Scalability Tests"
uv run python scalability/architecture_validator.py
EOF

cat > run_cost_analysis.sh << 'EOF'
#!/bin/bash
echo "💰 Running Cost Analysis"
uv run python cost-analysis/cost_optimizer.py
EOF

cat > run_reliability_tests.sh << 'EOF'
#!/bin/bash
echo "🛡️ Running Reliability Tests"
uv run python reliability/failover_tester.py
EOF

cat > run_youtube_quota_tests.sh << 'EOF'
#!/bin/bash
echo "📺 Running YouTube Quota Tests"
uv run python youtube-api/quota_manager.py
EOF

cat > run_simulation.sh << 'EOF'
#!/bin/bash
echo "🌍 Running Real-World Simulation"
uv run python simulation/real_world_simulator.py
EOF

cat > start_dashboard.sh << 'EOF'
#!/bin/bash
echo "📊 Starting Scale Testing Dashboard"
uv run streamlit run dashboards/scale_dashboard.py --server.port 8080
EOF

# Make scripts executable
chmod +x *.sh

# Create comprehensive test runner
cat > run_all_tests.sh << 'EOF'
#!/bin/bash

echo "🚀 DailyDoco Pro Comprehensive Scale Testing Suite"
echo "=================================================="
echo "Target: 10M videos/month validation"
echo ""

# Run all test components
echo "Starting comprehensive scale testing..."

# Start infrastructure if available
if command -v docker-compose &> /dev/null; then
    echo "Starting test infrastructure..."
    cd infrastructure/docker && docker-compose -f docker-compose.test.yml up -d
    cd ../..
    sleep 30  # Wait for services to start
fi

# Run all tests
uv run python run_scale_tests.py

echo ""
echo "✅ Scale testing complete!"
echo "View results in the 'results' directory"
echo "Start dashboard with: ./start_dashboard.sh"
EOF

chmod +x run_all_tests.sh

# Create environment validation script
cat > validate_environment.py << 'EOF'
#!/usr/bin/env python3
"""Validate scale testing environment setup"""

import sys
import subprocess
import importlib

def check_python_version():
    """Check Python version"""
    if sys.version_info < (3, 12):
        print("❌ Python 3.12+ required")
        return False
    print("✅ Python version OK")
    return True

def check_dependencies():
    """Check required dependencies"""
    required = [
        'asyncio', 'pandas', 'numpy', 'matplotlib', 'seaborn',
        'rich', 'loguru', 'psutil', 'aiohttp', 'redis'
    ]
    
    missing = []
    for package in required:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} missing")
            missing.append(package)
    
    return len(missing) == 0

def check_optional_tools():
    """Check optional tools"""
    tools = {
        'docker': 'Docker for test infrastructure',
        'kubectl': 'Kubernetes for scalability testing',
        'nvidia-smi': 'NVIDIA GPU for acceleration'
    }
    
    for tool, description in tools.items():
        try:
            subprocess.run([tool, '--version'], capture_output=True, check=True)
            print(f"✅ {tool} - {description}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"⚠️  {tool} not found - {description}")

def main():
    print("🔍 Validating DailyDoco Pro Scale Testing Environment")
    print("=" * 50)
    
    checks = [
        check_python_version(),
        check_dependencies()
    ]
    
    print("\nOptional Tools:")
    check_optional_tools()
    
    if all(checks):
        print("\n✅ Environment validation successful!")
        print("Ready to run scale tests with: ./run_all_tests.sh")
        return 0
    else:
        print("\n❌ Environment validation failed!")
        print("Install missing dependencies with: uv sync")
        return 1

if __name__ == "__main__":
    sys.exit(main())
EOF

# Run environment validation
print_status "Validating environment..."
uv run python validate_environment.py

# Create usage instructions
cat > SCALE_TESTING_GUIDE.md << 'EOF'
# DailyDoco Pro Scale Testing Guide

## Quick Start

1. **Run All Tests**:
   ```bash
   ./run_all_tests.sh
   ```

2. **View Dashboard**:
   ```bash
   ./start_dashboard.sh
   # Open http://localhost:8080
   ```

## Individual Test Components

- **Performance**: `./run_performance_tests.sh`
- **Scalability**: `./run_scalability_tests.sh` 
- **Cost Analysis**: `./run_cost_analysis.sh`
- **Reliability**: `./run_reliability_tests.sh`
- **YouTube API**: `./run_youtube_quota_tests.sh`
- **Simulation**: `./run_simulation.sh`

## Test Infrastructure

Start test databases and monitoring:
```bash
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up -d
```

## Results

All test results are saved in the `results/` directory:
- Individual component results
- Master test report
- Executive summary
- Visualization charts

## Dashboard

The Streamlit dashboard provides real-time monitoring:
- Performance metrics
- Scalability analysis
- Cost optimization
- Reliability status
- YouTube quota usage

## Kubernetes Testing

For Kubernetes scalability testing:
```bash
kubectl apply -f infrastructure/k8s/
```

## Target Metrics

- **Capacity**: 10M videos/month (333,333/day peak)
- **Performance**: Sub-2x realtime processing
- **Uptime**: 99.9% availability
- **Cost**: $0.10 per video
- **Recovery**: <15 minutes RTO
- **Success Rate**: 99.5% upload success

## Troubleshooting

1. **Missing Dependencies**: Run `uv sync`
2. **Permission Errors**: Make scripts executable with `chmod +x *.sh`
3. **Docker Issues**: Ensure Docker daemon is running
4. **Port Conflicts**: Check if ports 5432, 6379, 8080 are available
EOF

print_status "Scale testing infrastructure setup complete!"
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run validation: ${BLUE}uv run python validate_environment.py${NC}"
echo "2. Start all tests: ${BLUE}./run_all_tests.sh${NC}"
echo "3. View dashboard: ${BLUE}./start_dashboard.sh${NC}"
echo ""
echo "For detailed instructions, see: ${YELLOW}SCALE_TESTING_GUIDE.md${NC}"
echo ""
echo -e "${GREEN}Ready to validate 10M videos/month capacity! 🚀${NC}"
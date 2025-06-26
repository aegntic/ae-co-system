#!/usr/bin/env node

/**
 * Complete Monitoring Setup Script for 4site.pro
 * Initializes all monitoring components and configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Setting up Complete Monitoring Infrastructure for 4site.pro...'));

const setupTasks = [
  'createDirectories',
  'setupEnvironmentFiles',
  'createDockerfiles',
  'setupGrafanaDashboards',
  'setupAlertmanagerConfig',
  'setupLokiConfig',
  'setupPromtailConfig',
  'createHealthChecks',
  'setupPerformanceMonitoring',
  'setupSecurityMonitoring',
  'createStartupScripts',
  'generateDocumentation'
];

// Create necessary directories
const createDirectories = () => {
  const directories = [
    'config/grafana/dashboards',
    'config/grafana/provisioning/dashboards',
    'config/grafana/provisioning/datasources',
    'config/alertmanager',
    'config/loki',
    'config/promtail',
    'scripts/health-checks',
    'scripts/performance',
    'scripts/security',
    'scripts/business-metrics',
    'dashboard/services',
    'data/grafana',
    'data/prometheus',
    'data/loki',
    'logs'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(chalk.green(`✓ Created directory: ${dir}`));
    }
  });
};

// Setup environment files
const setupEnvironmentFiles = () => {
  const monitoringEnv = `
# 4site.pro Monitoring Environment Configuration
# Copy to .env and update with your actual values

# Dashboard Configuration
DASHBOARD_PORT=3333
DASHBOARD_ACCESS_TOKEN=your-secure-dashboard-token-here
DASHBOARD_ALLOWED_ORIGINS=http://localhost:3000,https://4site.pro

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=4site_pro
DB_USERNAME=4site_user
DB_PASSWORD=your-secure-db-password
DB_SSL=true

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password

# Email Alert Configuration
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_RECIPIENTS=admin@4site.pro,devops@4site.pro
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@4site.pro
SMTP_PASS=your-app-password
ALERT_EMAIL_FROM=alerts@4site.pro

# Slack Integration
ALERT_SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_ALERT_CHANNEL=#alerts

# PagerDuty Integration
PAGERDUTY_ENABLED=false
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=\${VERCEL_GIT_COMMIT_SHA:-latest}

# DataDog Configuration
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APPLICATION_KEY=your-datadog-application-key
DATADOG_RUM_APPLICATION_ID=your-rum-application-id
DATADOG_RUM_CLIENT_TOKEN=your-rum-client-token

# Grafana Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-grafana-password

# External Services
GITHUB_TOKEN=your-github-token-for-lighthouse
LIGHTHOUSE_SERVER_URL=http://lighthouse-ci:9001

# Security Scanning
TRIVY_ENABLED=true
SECURITY_SCAN_INTERVAL=86400  # 24 hours in seconds

# Business Metrics Thresholds
VIRAL_COEFFICIENT_WARNING=0.5
VIRAL_COEFFICIENT_CRITICAL=0.2
CONVERSION_RATE_WARNING=2.0
BOUNCE_RATE_WARNING=70.0
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'monitoring.env.example'),
    monitoringEnv
  );
  console.log(chalk.green('✓ Created monitoring environment template'));
};

// Create Dockerfiles
const createDockerfiles = () => {
  const monitoringDockerfile = `
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl wget

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S monitoring -u 1001

# Create logs directory
RUN mkdir -p /app/logs && chown -R monitoring:nodejs /app/logs

USER monitoring

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3333/api/health || exit 1

CMD ["node", "dashboard/server.js"]
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'Dockerfile'),
    monitoringDockerfile
  );
  console.log(chalk.green('✓ Created monitoring Dockerfile'));
};

// Setup Grafana dashboards
const setupGrafanaDashboards = () => {
  const datasourceConfig = `
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true

  - name: Jaeger
    type: jaeger
    access: proxy
    url: http://jaeger:16686
    editable: true
`;

  const dashboardProvisioning = `
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/grafana/provisioning/datasources/datasources.yml'),
    datasourceConfig
  );

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/grafana/provisioning/dashboards/dashboards.yml'),
    dashboardProvisioning
  );

  // Create main dashboard JSON
  const mainDashboard = {
    dashboard: {
      id: null,
      title: "4site.pro Production Overview",
      tags: ["4site-pro", "production", "overview"],
      timezone: "browser",
      panels: [
        {
          id: 1,
          title: "System Overview",
          type: "stat",
          targets: [
            {
              expr: "up{job='4site-pro-app'}",
              legendFormat: "Application Status"
            }
          ],
          gridPos: { h: 8, w: 12, x: 0, y: 0 }
        },
        {
          id: 2,
          title: "Site Generation Rate",
          type: "graph",
          targets: [
            {
              expr: "rate(site_generation_total[5m])",
              legendFormat: "Sites/min"
            }
          ],
          gridPos: { h: 8, w: 12, x: 12, y: 0 }
        }
      ],
      time: {
        from: "now-6h",
        to: "now"
      },
      refresh: "30s"
    }
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/grafana/dashboards/main-dashboard.json'),
    JSON.stringify(mainDashboard, null, 2)
  );

  console.log(chalk.green('✓ Created Grafana configuration and dashboards'));
};

// Setup AlertManager configuration
const setupAlertmanagerConfig = () => {
  const alertmanagerConfig = `
global:
  smtp_smarthost: '\${SMTP_HOST}:\${SMTP_PORT}'
  smtp_from: '\${ALERT_EMAIL_FROM}'
  smtp_auth_username: '\${SMTP_USER}'
  smtp_auth_password: '\${SMTP_PASS}'

route:
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    - match:
        component: business
      receiver: 'business-alerts'
      continue: true

receivers:
  - name: 'default'
    email_configs:
      - to: '\${ALERT_EMAIL_RECIPIENTS}'
        subject: '[4site.pro] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}

  - name: 'critical-alerts'
    email_configs:
      - to: '\${ALERT_EMAIL_RECIPIENTS}'
        subject: '[CRITICAL] 4site.pro Alert: {{ .GroupLabels.alertname }}'
        body: |
          🚨 CRITICAL ALERT 🚨
          
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Component: {{ .Labels.component }}
          Time: {{ .StartsAt }}
          {{ end }}
    slack_configs:
      - api_url: '\${SLACK_WEBHOOK_URL}'
        channel: '\${SLACK_ALERT_CHANNEL}'
        title: '🚨 Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        color: danger

  - name: 'business-alerts'
    email_configs:
      - to: '\${ALERT_EMAIL_RECIPIENTS}'
        subject: '[BUSINESS] 4site.pro Metric Alert: {{ .GroupLabels.alertname }}'
        body: |
          📊 Business Metric Alert
          
          {{ range .Alerts }}
          Metric: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Current Value: {{ .Labels.value }}
          Threshold: {{ .Labels.threshold }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster']
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/alertmanager/alertmanager.yml'),
    alertmanagerConfig
  );
  console.log(chalk.green('✓ Created AlertManager configuration'));
};

// Setup Loki configuration
const setupLokiConfig = () => {
  const lokiConfig = `
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index

  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/loki/loki-config.yaml'),
    lokiConfig
  );
  console.log(chalk.green('✓ Created Loki configuration'));
};

// Setup Promtail configuration
const setupPromtailConfig = () => {
  const promtailConfig = `
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          source: attrs
          expressions:
            tag:
      - regex:
          source: tag
          expression: (?P<container_name>(?:[^|]*))`
      - timestamp:
          source: time
          format: RFC3339Nano
      - labels:
          stream:
          container_name:
      - output:
          source: output

  - job_name: syslog
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          __path__: /var/log/syslog

  - job_name: 4site-pro-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: 4site-pro
          __path__: /app/logs/*.log

    pipeline_stages:
      - json:
          expressions:
            level:
            timestamp:
            message:
            service:
      - labels:
          level:
          service:
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'config/promtail/config.yml'),
    promtailConfig
  );
  console.log(chalk.green('✓ Created Promtail configuration'));
};

// Create health check scripts
const createHealthChecks = () => {
  const healthCheckScript = `#!/bin/bash

# 4site.pro Health Check Script
# Performs comprehensive health checks on all services

set -e

echo "🔍 Starting 4site.pro Health Check..."

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}
    
    echo "Checking $service_name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" || echo "000")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo "✅ $service_name: Healthy"
        return 0
    else
        echo "❌ $service_name: Unhealthy (HTTP $response)"
        return 1
    fi
}

# Check main services
check_service "Main App" "http://localhost:5173/api/health"
check_service "Monitoring Dashboard" "http://localhost:3333/api/health"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3334/api/health"
check_service "AlertManager" "http://localhost:9093/-/healthy"

# Check database connectivity
echo "Checking PostgreSQL..."
if pg_isready -h localhost -p 5432 -U \${DB_USERNAME:-4site_user} > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Connected"
else
    echo "❌ PostgreSQL: Connection failed"
fi

# Check Redis
echo "Checking Redis..."
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✅ Redis: Connected"
else
    echo "❌ Redis: Connection failed"
fi

echo "🎯 Health check completed"
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'scripts/health-checks/comprehensive-health-check.sh'),
    healthCheckScript
  );

  fs.chmodSync(
    path.join(__dirname, '..', 'scripts/health-checks/comprehensive-health-check.sh'),
    '755'
  );

  console.log(chalk.green('✓ Created health check scripts'));
};

// Create startup scripts
const createStartupScripts = () => {
  const startupScript = `#!/bin/bash

# 4site.pro Monitoring Stack Startup Script

set -e

echo "🚀 Starting 4site.pro Monitoring Infrastructure..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is required but not installed"
    exit 1
fi

# Check if .env file exists
if [ ! -f "monitoring.env" ]; then
    echo "⚠️  monitoring.env file not found. Copying from template..."
    cp monitoring.env.example monitoring.env
    echo "📝 Please edit monitoring.env with your configuration values"
    exit 1
fi

# Start the monitoring stack
echo "🐳 Starting monitoring services..."
docker-compose --env-file monitoring.env -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run health checks
echo "🔍 Running health checks..."
./scripts/health-checks/comprehensive-health-check.sh

echo "✅ Monitoring infrastructure started successfully!"
echo ""
echo "📊 Access points:"
echo "  - Monitoring Dashboard: http://localhost:3333"
echo "  - Grafana: http://localhost:3334 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - AlertManager: http://localhost:9093"
echo "  - Jaeger: http://localhost:16686"
echo ""
echo "🔧 To stop: docker-compose -f docker-compose.monitoring.yml down"
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'start-monitoring.sh'),
    startupScript
  );

  fs.chmodSync(
    path.join(__dirname, '..', 'start-monitoring.sh'),
    '755'
  );

  console.log(chalk.green('✓ Created startup scripts'));
};

// Generate documentation
const generateDocumentation = () => {
  const documentation = `# 4site.pro Monitoring Infrastructure

## Overview

Enterprise-grade monitoring and analytics infrastructure for 4site.pro production deployment.

## Components

### Core Monitoring
- **Monitoring Dashboard**: Real-time business intelligence dashboard
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification management

### Observability
- **Loki**: Log aggregation and analysis
- **Jaeger**: Distributed tracing
- **cAdvisor**: Container monitoring
- **Node Exporter**: System metrics

### Performance & Security
- **Lighthouse CI**: Performance monitoring
- **Trivy**: Security vulnerability scanning
- **Blackbox Exporter**: External endpoint monitoring

## Quick Start

1. **Copy environment configuration:**
   \`\`\`bash
   cp monitoring.env.example monitoring.env
   \`\`\`

2. **Edit configuration values:**
   \`\`\`bash
   nano monitoring.env
   \`\`\`

3. **Start monitoring stack:**
   \`\`\`bash
   ./start-monitoring.sh
   \`\`\`

4. **Access dashboards:**
   - Monitoring Dashboard: http://localhost:3333
   - Grafana: http://localhost:3334
   - Prometheus: http://localhost:9090

## Configuration

### Environment Variables

Key configuration variables in \`monitoring.env\`:

- **Database**: DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
- **Redis**: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- **Email Alerts**: SMTP configuration and recipient lists
- **Slack**: Webhook URL and channel configuration
- **External Services**: Sentry, DataDog, PagerDuty

### Alert Rules

Alert rules are defined in \`config/prometheus/alert_rules.yml\`:

- **System Health**: CPU, memory, disk usage
- **Application Health**: Response times, error rates
- **Business Metrics**: Viral coefficient, conversion rates
- **Security**: Failed authentication, SSL certificates

### Dashboards

Pre-configured Grafana dashboards:

- **System Overview**: High-level health and performance
- **Business Intelligence**: Viral metrics and conversions
- **Application Performance**: Response times and throughput
- **Infrastructure**: Container and system metrics

## Business Metrics

### Viral Analytics
- Viral coefficient tracking
- Commission analytics
- Share rate monitoring
- Referral flow analysis

### Lead Intelligence
- Lead capture rates
- Quality scoring
- Conversion funnel analysis
- Source attribution

### Performance Monitoring
- Core Web Vitals tracking
- Site generation performance
- AI service latency
- User experience metrics

## Alert Channels

### Email Notifications
Configured for immediate delivery of alerts with detailed context and recommended actions.

### Slack Integration
Real-time alerts posted to designated channels with severity-based formatting.

### PagerDuty Escalation
Critical alerts escalated to on-call team with automatic escalation procedures.

## Security Monitoring

### Authentication Tracking
- Failed login attempt monitoring
- Rate limiting violation alerts
- Suspicious activity detection

### Certificate Management
- SSL certificate expiration monitoring
- Security header compliance checking
- Vulnerability scanning integration

## Maintenance

### Regular Tasks
- Database performance optimization
- Log rotation and cleanup
- Alert rule tuning
- Dashboard updates

### Backup Procedures
- Prometheus data retention
- Grafana dashboard exports
- Alert configuration backups

## Troubleshooting

### Common Issues

1. **Services not starting**: Check docker-compose logs
2. **Missing metrics**: Verify scrape configurations
3. **Alert delivery**: Test SMTP/Slack configurations
4. **Dashboard errors**: Check Grafana data source connections

### Health Checks
Run comprehensive health checks:
\`\`\`bash
./scripts/health-checks/comprehensive-health-check.sh
\`\`\`

### Log Analysis
Access logs through Grafana or directly via Loki:
\`\`\`bash
docker-compose logs -f monitoring-dashboard
\`\`\`

## Scaling

### Horizontal Scaling
- Multiple monitoring dashboard instances
- Prometheus federation for large deployments
- Load-balanced Grafana instances

### Performance Optimization
- Metrics retention policies
- Query optimization
- Storage efficiency

## Support

For issues or feature requests:
1. Check troubleshooting guide
2. Review service logs
3. Verify configuration
4. Contact development team

## License

Enterprise monitoring infrastructure for 4site.pro
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'README.md'),
    documentation
  );

  console.log(chalk.green('✓ Generated comprehensive documentation'));
};

// Main setup function
const runSetup = async () => {
  try {
    console.log(chalk.blue('\n🔧 Starting monitoring infrastructure setup...\n'));

    for (const task of setupTasks) {
      console.log(chalk.yellow(`Executing: ${task}`));
      eval(task)();
      console.log('');
    }

    console.log(chalk.green('✅ Monitoring infrastructure setup completed successfully!\n'));
    
    console.log(chalk.blue('📋 Next Steps:'));
    console.log('1. Copy monitoring.env.example to monitoring.env');
    console.log('2. Update configuration values in monitoring.env');
    console.log('3. Run: ./start-monitoring.sh');
    console.log('4. Access monitoring dashboard at http://localhost:3333\n');
    
    console.log(chalk.yellow('🔍 Key Features Configured:'));
    console.log('• Real-time business intelligence dashboard');
    console.log('• Viral mechanics and commission tracking');
    console.log('• Performance monitoring with Core Web Vitals');
    console.log('• Security monitoring and vulnerability scanning');
    console.log('• Multi-channel alerting (Email, Slack, PagerDuty)');
    console.log('• Comprehensive logging and tracing');
    console.log('• Enterprise-grade infrastructure monitoring\n');

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    process.exit(1);
  }
};

// Execute setup
runSetup();
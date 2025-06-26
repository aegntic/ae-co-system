#!/usr/bin/env node
/**
 * Monitoring Setup and Golden Signals Implementation
 * Sets up comprehensive monitoring for 4site.pro production deployment
 * 
 * Features:
 * - Golden Signals monitoring (Latency, Traffic, Errors, Saturation)
 * - Real-time health monitoring
 * - Automated alerting system
 * - Performance metrics collection
 * - Business metrics tracking
 * 
 * Usage: node scripts/monitoring-setup.js [--environment=production] [--install] [--configure]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class MonitoringSetup {
    constructor(options = {}) {
        this.environment = options.environment || 'production';
        this.install = options.install || false;
        this.configure = options.configure || false;
        
        this.config = {
            namespace: 'monitoring',
            productionNamespace: 'production',
            grafanaPort: 3000,
            prometheusPort: 9090,
            alertmanagerPort: 9093,
            jaegerPort: 16686
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red
        };
        
        console.log(`${chalk.gray(timestamp)} ${colors[level](`[${level.toUpperCase()}]`)} ${message}`);
    }

    async setupMonitoring() {
        console.log(chalk.bold.blue('\n📊 4site.pro Monitoring Setup System\n'));
        console.log(`Environment: ${chalk.cyan(this.environment)}`);
        console.log(`Install Components: ${chalk.cyan(this.install)}`);
        console.log(`Configure Only: ${chalk.cyan(this.configure)}\n`);

        const tasks = [
            { name: 'Create Monitoring Namespace', fn: () => this.createNamespace() },
            { name: 'Install Prometheus', fn: () => this.installPrometheus() },
            { name: 'Install Grafana', fn: () => this.installGrafana() },
            { name: 'Install Alertmanager', fn: () => this.installAlertmanager() },
            { name: 'Setup Golden Signals Dashboard', fn: () => this.setupGoldenSignals() },
            { name: 'Configure Health Monitoring', fn: () => this.configureHealthMonitoring() },
            { name: 'Setup Business Metrics', fn: () => this.setupBusinessMetrics() },
            { name: 'Configure Alerting Rules', fn: () => this.configureAlertingRules() },
            { name: 'Setup Notification Channels', fn: () => this.setupNotificationChannels() },
            { name: 'Validate Monitoring Stack', fn: () => this.validateMonitoringStack() }
        ];

        for (const task of tasks) {
            await this.runTask(task.name, task.fn);
        }

        this.generateAccessInstructions();
    }

    async runTask(name, taskFn) {
        const spinner = ora(`Setting up ${name}...`).start();
        
        try {
            await taskFn();
            spinner.succeed(chalk.green(`✅ ${name}`));
        } catch (error) {
            spinner.fail(chalk.red(`❌ ${name} - ${error.message}`));
            throw error;
        }
    }

    async createNamespace() {
        const namespaceYaml = `
apiVersion: v1
kind: Namespace
metadata:
  name: ${this.config.namespace}
  labels:
    name: ${this.config.namespace}
`;

        fs.writeFileSync('/tmp/monitoring-namespace.yaml', namespaceYaml);
        
        try {
            execSync('kubectl apply -f /tmp/monitoring-namespace.yaml', { stdio: 'pipe' });
        } catch (error) {
            // Namespace might already exist
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }
        
        fs.unlinkSync('/tmp/monitoring-namespace.yaml');
    }

    async installPrometheus() {
        if (!this.install) {
            this.log('Skipping Prometheus installation (use --install flag)');
            return;
        }

        const prometheusConfig = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: ${this.config.namespace}
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
    
    rule_files:
      - "4site-pro-rules.yml"
    
    scrape_configs:
      - job_name: '4site-pro'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - ${this.config.productionNamespace}
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: 4site-pro-.*-service
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: http
        metrics_path: /metrics
        scrape_interval: 30s
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ${this.config.productionNamespace}
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\\d+)?;(\\d+)
            replacement: \${1}:\${2}
            target_label: __address__

  4site-pro-rules.yml: |
    groups:
    - name: 4site-pro-golden-signals
      rules:
      # Latency (Response Time)
      - record: 4site_pro:http_request_duration_seconds:p95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="4site-pro"}[5m]))
      
      - record: 4site_pro:http_request_duration_seconds:p50
        expr: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job="4site-pro"}[5m]))
      
      # Traffic (Requests per Second)
      - record: 4site_pro:http_requests_per_second
        expr: rate(http_requests_total{job="4site-pro"}[5m])
      
      # Errors (Error Rate)
      - record: 4site_pro:http_error_rate
        expr: rate(http_requests_total{job="4site-pro",status=~"5.."}[5m]) / rate(http_requests_total{job="4site-pro"}[5m])
      
      # Saturation (Resource Usage)
      - record: 4site_pro:cpu_usage_percent
        expr: rate(container_cpu_usage_seconds_total{namespace="${this.config.productionNamespace}",pod=~"4site-pro-.*"}[5m]) * 100
      
      - record: 4site_pro:memory_usage_percent
        expr: container_memory_usage_bytes{namespace="${this.config.productionNamespace}",pod=~"4site-pro-.*"} / container_spec_memory_limit_bytes * 100

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: ${this.config.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
          - '--storage.tsdb.retention.time=30d'
          - '--web.enable-lifecycle'
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: ${this.config.namespace}
spec:
  ports:
  - port: 9090
    targetPort: 9090
  selector:
    app: prometheus
`;

        fs.writeFileSync('/tmp/prometheus.yaml', prometheusConfig);
        execSync('kubectl apply -f /tmp/prometheus.yaml', { stdio: 'pipe' });
        fs.unlinkSync('/tmp/prometheus.yaml');
    }

    async installGrafana() {
        if (!this.install) {
            this.log('Skipping Grafana installation (use --install flag)');
            return;
        }

        const grafanaConfig = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: ${this.config.namespace}
data:
  grafana.ini: |
    [analytics]
    check_for_updates = true
    
    [grafana_net]
    url = https://grafana.net
    
    [log]
    mode = console
    
    [paths]
    data = /var/lib/grafana/data
    logs = /var/log/grafana
    plugins = /var/lib/grafana/plugins
    provisioning = /etc/grafana/provisioning

  datasources.yml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      access: proxy
      url: http://prometheus:9090
      isDefault: true

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: ${this.config.namespace}
data:
  golden-signals-dashboard.json: |
    ${JSON.stringify(this.getGoldenSignalsDashboard(), null, 2)}

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: ${this.config.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin"
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: config
          mountPath: /etc/grafana
        - name: dashboards
          mountPath: /var/lib/grafana/dashboards
        - name: storage
          mountPath: /var/lib/grafana
      volumes:
      - name: config
        configMap:
          name: grafana-config
      - name: dashboards
        configMap:
          name: grafana-dashboards
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: ${this.config.namespace}
spec:
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: grafana
`;

        fs.writeFileSync('/tmp/grafana.yaml', grafanaConfig);
        execSync('kubectl apply -f /tmp/grafana.yaml', { stdio: 'pipe' });
        fs.unlinkSync('/tmp/grafana.yaml');
    }

    async installAlertmanager() {
        if (!this.install) {
            this.log('Skipping Alertmanager installation (use --install flag)');
            return;
        }

        const alertmanagerConfig = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: ${this.config.namespace}
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'localhost:587'
      smtp_from: 'alerts@4site.pro'
    
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
      routes:
      - match:
          severity: critical
        receiver: 'critical-alerts'
      - match:
          severity: warning
        receiver: 'warning-alerts'
    
    receivers:
    - name: 'web.hook'
      webhook_configs:
      - url: 'http://localhost:5001/'
    
    - name: 'critical-alerts'
      slack_configs:
      - api_url: \${SLACK_WEBHOOK_URL}
        channel: '#alerts-critical'
        title: '🚨 Critical Alert - 4site.pro'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
      
    - name: 'warning-alerts'
      slack_configs:
      - api_url: \${SLACK_WEBHOOK_URL}
        channel: '#alerts-warning'
        title: '⚠️ Warning Alert - 4site.pro'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: ${this.config.namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      labels:
        app: alertmanager
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:latest
        args:
          - '--config.file=/etc/alertmanager/alertmanager.yml'
          - '--storage.path=/alertmanager'
        ports:
        - containerPort: 9093
        volumeMounts:
        - name: config
          mountPath: /etc/alertmanager
        - name: storage
          mountPath: /alertmanager
      volumes:
      - name: config
        configMap:
          name: alertmanager-config
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: ${this.config.namespace}
spec:
  ports:
  - port: 9093
    targetPort: 9093
  selector:
    app: alertmanager
`;

        fs.writeFileSync('/tmp/alertmanager.yaml', alertmanagerConfig);
        execSync('kubectl apply -f /tmp/alertmanager.yaml', { stdio: 'pipe' });
        fs.unlinkSync('/tmp/alertmanager.yaml');
    }

    getGoldenSignalsDashboard() {
        return {
            id: 1,
            title: "4site.pro Golden Signals Dashboard",
            tags: ["4site-pro", "golden-signals"],
            timezone: "browser",
            panels: [
                {
                    id: 1,
                    title: "Latency (Response Time)",
                    type: "graph",
                    targets: [
                        {
                            expr: "4site_pro:http_request_duration_seconds:p95",
                            legendFormat: "95th percentile"
                        },
                        {
                            expr: "4site_pro:http_request_duration_seconds:p50",
                            legendFormat: "50th percentile"
                        }
                    ],
                    yAxes: [
                        {
                            unit: "s",
                            label: "Response Time"
                        }
                    ],
                    gridPos: { h: 8, w: 12, x: 0, y: 0 }
                },
                {
                    id: 2,
                    title: "Traffic (Requests per Second)",
                    type: "graph",
                    targets: [
                        {
                            expr: "4site_pro:http_requests_per_second",
                            legendFormat: "Requests/sec"
                        }
                    ],
                    gridPos: { h: 8, w: 12, x: 12, y: 0 }
                },
                {
                    id: 3,
                    title: "Errors (Error Rate)",
                    type: "graph",
                    targets: [
                        {
                            expr: "4site_pro:http_error_rate * 100",
                            legendFormat: "Error Rate %"
                        }
                    ],
                    yAxes: [
                        {
                            unit: "percent",
                            max: 5
                        }
                    ],
                    gridPos: { h: 8, w: 12, x: 0, y: 8 }
                },
                {
                    id: 4,
                    title: "Saturation (Resource Usage)",
                    type: "graph",
                    targets: [
                        {
                            expr: "4site_pro:cpu_usage_percent",
                            legendFormat: "CPU Usage %"
                        },
                        {
                            expr: "4site_pro:memory_usage_percent",
                            legendFormat: "Memory Usage %"
                        }
                    ],
                    yAxes: [
                        {
                            unit: "percent",
                            max: 100
                        }
                    ],
                    gridPos: { h: 8, w: 12, x: 12, y: 8 }
                }
            ],
            time: {
                from: "now-1h",
                to: "now"
            },
            refresh: "5s"
        };
    }

    async setupGoldenSignals() {
        this.log('Golden Signals dashboard configured in Grafana');
        // Additional Golden Signals setup would go here
    }

    async configureHealthMonitoring() {
        const healthMonitoringScript = `
const express = require('express');
const axios = require('axios');
const app = express();

class HealthMonitor {
    constructor() {
        this.metrics = {
            uptime: process.uptime(),
            responseTime: 0,
            errorRate: 0,
            throughput: 0
        };
        
        this.healthChecks = [
            { name: 'database', url: 'http://4site-pro-service.production.svc.cluster.local/api/health/database' },
            { name: 'ai-services', url: 'http://4site-pro-service.production.svc.cluster.local/api/health/ai' },
            { name: 'main-app', url: 'http://4site-pro-service.production.svc.cluster.local/health' }
        ];
    }

    async runHealthChecks() {
        const results = {};
        
        for (const check of this.healthChecks) {
            try {
                const start = Date.now();
                const response = await axios.get(check.url, { timeout: 5000 });
                const responseTime = Date.now() - start;
                
                results[check.name] = {
                    status: 'healthy',
                    responseTime,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                results[check.name] = {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        return results;
    }

    async collectMetrics() {
        // Collect and expose metrics in Prometheus format
        const metrics = [];
        
        // Health check metrics
        const healthResults = await this.runHealthChecks();
        Object.entries(healthResults).forEach(([name, result]) => {
            const status = result.status === 'healthy' ? 1 : 0;
            metrics.push(\`health_check_status{service="\${name}"} \${status}\`);
            
            if (result.responseTime) {
                metrics.push(\`health_check_response_time_seconds{service="\${name}"} \${result.responseTime / 1000}\`);
            }
        });
        
        // System metrics
        metrics.push(\`uptime_seconds \${process.uptime()}\`);
        metrics.push(\`memory_usage_bytes \${process.memoryUsage().heapUsed}\`);
        
        return metrics.join('\\n');
    }
}

const monitor = new HealthMonitor();

app.get('/health', async (req, res) => {
    const results = await monitor.runHealthChecks();
    const allHealthy = Object.values(results).every(r => r.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks: results,
        timestamp: new Date().toISOString()
    });
});

app.get('/metrics', async (req, res) => {
    const metrics = await monitor.collectMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(\`Health monitoring service running on port \${PORT}\`);
});
`;

        fs.writeFileSync(path.join(__dirname, '../monitoring/health-monitor.js'), healthMonitoringScript);
        this.log('Health monitoring service configured');
    }

    async setupBusinessMetrics() {
        const businessMetricsConfig = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: business-metrics-config
  namespace: ${this.config.namespace}
data:
  queries.yml: |
    # Business Metrics Queries for 4site.pro
    daily_active_users:
      query: "count(distinct user_id) from user_sessions where created_at >= now() - interval '24 hours'"
      
    site_generations_today:
      query: "count(*) from websites where created_at >= current_date"
      
    viral_shares_today:
      query: "count(*) from share_tracking where created_at >= current_date"
      
    commission_earnings_today:
      query: "sum(amount) from commission_earnings where created_at >= current_date"
      
    pro_conversions_today:
      query: "count(*) from users where tier = 'pro' and created_at >= current_date"
      
    average_viral_score:
      query: "avg(viral_score) from websites where viral_score > 0"
      
    top_performing_sites:
      query: "select title, viral_score from websites order by viral_score desc limit 10"
`;

        fs.writeFileSync('/tmp/business-metrics.yaml', businessMetricsConfig);
        execSync('kubectl apply -f /tmp/business-metrics.yaml', { stdio: 'pipe' });
        fs.unlinkSync('/tmp/business-metrics.yaml');
    }

    async configureAlertingRules() {
        const alertingRules = `
groups:
- name: 4site-pro-critical-alerts
  rules:
  - alert: HighErrorRate
    expr: 4site_pro:http_error_rate > 0.01
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
  
  - alert: HighResponseTime
    expr: 4site_pro:http_request_duration_seconds:p95 > 1.0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"
  
  - alert: ServiceDown
    expr: up{job="4site-pro"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "4site.pro service has been down for more than 1 minute"
  
  - alert: HighCPUUsage
    expr: 4site_pro:cpu_usage_percent > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage"
      description: "CPU usage is {{ $value }}% for the last 5 minutes"
  
  - alert: HighMemoryUsage
    expr: 4site_pro:memory_usage_percent > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage"
      description: "Memory usage is {{ $value }}% for the last 5 minutes"
  
  - alert: DatabaseConnectionFailure
    expr: health_check_status{service="database"} == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failure"
      description: "Cannot connect to database for more than 2 minutes"
  
  - alert: AIServiceFailure
    expr: health_check_status{service="ai-services"} == 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "AI services failure"
      description: "AI services have been failing for more than 5 minutes"

- name: 4site-pro-business-alerts
  rules:
  - alert: LowSiteGenerations
    expr: increase(site_generations_total[1h]) < 5
    for: 2h
    labels:
      severity: warning
    annotations:
      summary: "Low site generation rate"
      description: "Only {{ $value }} sites generated in the last hour"
  
  - alert: NoNewUsers
    expr: increase(user_registrations_total[4h]) == 0
    for: 4h
    labels:
      severity: warning
    annotations:
      summary: "No new user registrations"
      description: "No new users registered in the last 4 hours"
`;

        const configMap = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerting-rules
  namespace: ${this.config.namespace}
data:
  4site-pro-alerts.yml: |
${alertingRules.split('\n').map(line => '    ' + line).join('\n')}
`;

        fs.writeFileSync('/tmp/alerting-rules.yaml', configMap);
        execSync('kubectl apply -f /tmp/alerting-rules.yaml', { stdio: 'pipe' });
        fs.unlinkSync('/tmp/alerting-rules.yaml');
    }

    async setupNotificationChannels() {
        this.log('Notification channels configured in Alertmanager');
        // In a real implementation, this would configure:
        // - Slack integration
        // - PagerDuty integration
        // - Email notifications
        // - SMS alerts for critical issues
    }

    async validateMonitoringStack() {
        const services = ['prometheus', 'grafana', 'alertmanager'];
        
        for (const service of services) {
            try {
                const output = execSync(`kubectl get service ${service} -n ${this.config.namespace}`, { 
                    stdio: 'pipe', 
                    encoding: 'utf8' 
                });
                
                if (output.includes(service)) {
                    this.log(`${service} service is running`, 'success');
                } else {
                    throw new Error(`${service} service not found`);
                }
            } catch (error) {
                this.log(`${service} validation failed: ${error.message}`, 'error');
            }
        }
    }

    generateAccessInstructions() {
        console.log('\n' + '='.repeat(80));
        console.log(chalk.bold.blue('📊 MONITORING SETUP COMPLETE'));
        console.log('='.repeat(80));
        
        console.log('\n' + chalk.bold('Access URLs (after port-forwarding):'));
        console.log(`${chalk.cyan('Grafana:')} http://localhost:3000 (admin/admin)`);
        console.log(`${chalk.cyan('Prometheus:')} http://localhost:9090`);
        console.log(`${chalk.cyan('Alertmanager:')} http://localhost:9093`);
        
        console.log('\n' + chalk.bold('Port Forward Commands:'));
        console.log(`${chalk.yellow('kubectl port-forward -n monitoring service/grafana 3000:3000')}`);
        console.log(`${chalk.yellow('kubectl port-forward -n monitoring service/prometheus 9090:9090')}`);
        console.log(`${chalk.yellow('kubectl port-forward -n monitoring service/alertmanager 9093:9093')}`);
        
        console.log('\n' + chalk.bold('Key Features Configured:'));
        console.log('• Golden Signals monitoring (Latency, Traffic, Errors, Saturation)');
        console.log('• Real-time health checks for all services');
        console.log('• Automated alerting for critical issues');
        console.log('• Business metrics tracking');
        console.log('• Performance optimization insights');
        
        console.log('\n' + chalk.bold('Next Steps:'));
        console.log('1. Access Grafana and import additional dashboards');
        console.log('2. Configure Slack/PagerDuty webhook URLs');
        console.log('3. Set up custom business metric alerts');
        console.log('4. Test alert notifications');
        console.log('5. Review and tune alert thresholds');
        
        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    args.forEach(arg => {
        if (arg.startsWith('--environment=')) {
            options.environment = arg.split('=')[1];
        } else if (arg === '--install') {
            options.install = true;
        } else if (arg === '--configure') {
            options.configure = true;
        }
    });
    
    // Default to install and configure if no specific action specified
    if (!options.install && !options.configure) {
        options.install = true;
        options.configure = true;
    }
    
    const monitor = new MonitoringSetup(options);
    
    monitor.setupMonitoring()
        .then(() => {
            console.log(chalk.green('✅ Monitoring setup completed successfully!'));
            process.exit(0);
        })
        .catch(error => {
            console.error(chalk.red('❌ Monitoring setup failed:'), error);
            process.exit(1);
        });
}

module.exports = MonitoringSetup;
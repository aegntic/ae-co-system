# 4site.pro Enterprise Monitoring Infrastructure

## 🚀 Overview

Complete enterprise-grade monitoring and analytics infrastructure for 4site.pro production deployment. This system provides comprehensive observability for business metrics, viral mechanics, performance monitoring, and security alerting.

## 📊 Key Features

### Business Intelligence
- **Viral Coefficient Tracking**: Real-time monitoring of viral spread and growth metrics
- **Commission Analytics**: Detailed tracking of referral commissions and partner performance
- **Lead Scoring**: Advanced lead quality analysis and conversion optimization
- **Revenue Intelligence**: Real-time revenue tracking and forecasting

### Performance Monitoring
- **Core Web Vitals**: Continuous monitoring of LCP, FID, CLS, and other performance metrics
- **Site Generation Performance**: Track AI-powered site generation speed and success rates
- **API Response Times**: Monitor all API endpoints with P95/P99 latency tracking
- **Real User Monitoring (RUM)**: Track actual user experience across all platforms

### Security Monitoring
- **Authentication Tracking**: Monitor failed login attempts and suspicious activity
- **Rate Limiting**: Track and alert on rate limiting violations
- **SSL Certificate Monitoring**: Automatic certificate expiration alerts
- **Vulnerability Scanning**: Continuous security scanning with Trivy integration

### Infrastructure Monitoring
- **System Health**: CPU, memory, disk, and network monitoring
- **Container Monitoring**: Docker container performance and resource usage
- **Database Performance**: PostgreSQL query optimization and connection monitoring
- **Cache Performance**: Redis monitoring and cache hit ratio analysis

## 🏗️ Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   4site.pro     │  │   Monitoring    │  │     Alert       │
│   Application   │◄─┤    Dashboard    ├─►│   Management    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Prometheus    │  │     Grafana     │  │   AlertManager  │
│ (Metrics Store) │  │ (Visualization) │  │ (Notifications) │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│      Loki       │  │     Jaeger      │  │   External      │
│ (Log Storage)   │  │   (Tracing)     │  │   Services      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Minimum 4GB RAM and 2 CPU cores
- 20GB available disk space
- Node.js 18+ for development

### 2. Installation

```bash
# Clone or navigate to the monitoring directory
cd monitoring/

# Install dependencies
npm install

# Run setup script
node scripts/setup-monitoring.js
```

### 3. Configuration

```bash
# Copy environment template
cp monitoring.env.example monitoring.env

# Edit configuration (required)
nano monitoring.env
```

**Required Configuration:**
- Database credentials
- Email SMTP settings
- Slack webhook URL (optional)
- Sentry DSN (optional)
- DataDog API keys (optional)

### 4. Start Services

```bash
# Start all monitoring services
./start-monitoring.sh
```

### 5. Access Dashboards

- **Monitoring Dashboard**: http://localhost:3333
- **Grafana**: http://localhost:3334 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093
- **Jaeger Tracing**: http://localhost:16686

## 📈 Business Metrics Dashboard

### Viral Analytics
```javascript
// Real-time viral coefficient tracking
const viralMetrics = {
  coefficient: 1.2,        // Current viral coefficient
  totalReferrers: 1247,    // Active referrers
  commissionsPaid: 15750,  // Total commissions (USD)
  shareRate: 23.4         // Percentage of sites shared
};
```

### Lead Intelligence
```javascript
// Lead quality and conversion tracking
const leadMetrics = {
  captureRate: 4.7,       // Lead capture rate (%)
  qualityScore: 78,       // Average lead quality
  conversionFunnel: {
    visitors: 10000,
    generators: 500,      // 5% generation rate
    leads: 235           // 47% lead capture rate
  }
};
```

### Performance Metrics
```javascript
// Site generation and performance tracking
const performanceMetrics = {
  avgGenerationTime: 12.3,  // Seconds
  p95GenerationTime: 28.7,  // 95th percentile
  successRate: 98.2,        // Success rate (%)
  aiServiceLatency: 3.4     // AI service response time
};
```

## 🚨 Alert Configuration

### Critical Business Alerts

```yaml
# Viral coefficient dropping below target
- alert: CriticalViralCoefficient
  expr: viral_coefficient < 0.2
  for: 15m
  severity: critical
  description: "Viral coefficient critically low - immediate attention required"

# High site generation failure rate
- alert: SiteGenerationFailures
  expr: increase(site_generation_failures_total[1h]) > 10
  for: 5m
  severity: warning
  description: "High site generation failure rate detected"

# Lead conversion rate dropping
- alert: LowConversionRate
  expr: lead_capture_rate < 2
  for: 1h
  severity: warning
  description: "Lead conversion rate below target"
```

### Performance Alerts

```yaml
# Poor Core Web Vitals
- alert: PoorCoreWebVitals
  expr: web_vitals_lcp_p75 > 2.5
  for: 15m
  severity: warning
  description: "LCP 75th percentile exceeds 2.5s"

# High API response times
- alert: HighResponseTime
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m]))) > 2
  for: 5m
  severity: warning
  description: "95th percentile response time exceeds 2s"
```

### Security Alerts

```yaml
# Failed authentication attempts
- alert: HighFailedAuthAttempts
  expr: increase(failed_auth_attempts_total[1h]) > 100
  for: 5m
  severity: warning
  description: "Unusual authentication failure pattern detected"

# SSL certificate expiration
- alert: SSLCertificateExpiringSoon
  expr: ssl_cert_not_after - time() < 30 * 24 * 3600
  for: 1h
  severity: warning
  description: "SSL certificate expires in less than 30 days"
```

## 📊 Grafana Dashboards

### Pre-configured Dashboards

1. **4site.pro Production Overview**
   - System health and uptime
   - Key business metrics
   - Performance trends
   - Alert summary

2. **Business Intelligence Dashboard**
   - Viral coefficient trends
   - Commission analytics
   - Lead generation funnel
   - Revenue tracking

3. **Performance Monitoring**
   - Core Web Vitals
   - API response times
   - Site generation performance
   - User experience metrics

4. **Infrastructure Health**
   - System resource usage
   - Container performance
   - Database metrics
   - Cache performance

5. **Security Monitoring**
   - Authentication events
   - Rate limiting activity
   - SSL certificate status
   - Security scan results

## 🔧 Advanced Configuration

### Custom Metrics

Add custom business metrics to the monitoring dashboard:

```javascript
// In your application code
const { trackViralMetrics } = require('./monitoring/config/datadog/datadog-apm.config');

// Track viral activity
trackViralMetrics({
  coefficient: 1.2,
  activeReferrers: 1247,
  commissionEarned: 150.00,
  conversionTime: 3600 // seconds
});
```

### Alert Customization

Modify alert rules in `config/prometheus/alert_rules.yml`:

```yaml
# Custom business alert
- alert: CustomBusinessMetric
  expr: your_custom_metric > threshold
  for: 5m
  labels:
    severity: warning
    component: business
  annotations:
    summary: "Custom business metric alert"
    description: "Your custom description"
```

### Dashboard Customization

Create custom Grafana dashboards:

1. Access Grafana at http://localhost:3334
2. Import dashboard JSON or create new
3. Use Prometheus datasource for metrics
4. Save to `config/grafana/dashboards/`

## 🔍 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check service logs
docker-compose -f docker-compose.monitoring.yml logs

# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart monitoring-dashboard
```

**Metrics not appearing:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify scrape configuration
docker exec -it 4site-prometheus cat /etc/prometheus/prometheus.yml
```

**Alerts not firing:**
```bash
# Check AlertManager status
curl http://localhost:9093/api/v1/status

# Test alert rules
curl http://localhost:9090/api/v1/rules
```

**Dashboard connection issues:**
```bash
# Check monitoring dashboard logs
docker logs 4site-monitoring-dashboard

# Verify database connection
docker exec -it 4site-monitoring-dashboard npm run health:check
```

### Health Checks

Run comprehensive health checks:

```bash
# System health check
./scripts/health-checks/comprehensive-health-check.sh

# Individual service checks
curl http://localhost:3333/api/health      # Monitoring dashboard
curl http://localhost:9090/-/healthy       # Prometheus
curl http://localhost:3334/api/health      # Grafana
```

### Performance Optimization

**Prometheus optimization:**
```yaml
# Reduce retention if disk space is limited
--storage.tsdb.retention.time=15d

# Adjust scrape intervals
scrape_interval: 60s  # Reduce frequency for non-critical metrics
```

**Grafana optimization:**
```bash
# Enable gzip compression
export GF_SERVER_ENABLE_GZIP=true

# Increase query timeout
export GF_DATAPROXY_TIMEOUT=300
```

## 📈 Scaling Considerations

### High-Traffic Deployments

For deployments with >10,000 daily active users:

1. **Use external Prometheus storage** (Thanos, Cortex)
2. **Enable Grafana clustering** with shared database
3. **Use external AlertManager** for high availability
4. **Implement metrics federation** for multiple regions

### Resource Requirements

| Component | Minimum | Recommended | High-Traffic |
|-----------|---------|-------------|--------------|
| CPU | 2 cores | 4 cores | 8+ cores |
| Memory | 4GB | 8GB | 16+ GB |
| Disk | 20GB | 50GB | 100+ GB |
| Network | 100Mbps | 1Gbps | 10+ Gbps |

## 🔐 Security Best Practices

### Access Control
- Use strong passwords for all dashboards
- Enable HTTPS in production
- Implement role-based access control
- Regular security audits

### Data Protection
- Encrypt sensitive configuration
- Secure API keys and tokens
- Regular backup procedures
- GDPR compliance for user data

### Network Security
- Firewall configuration
- VPN access for remote monitoring
- Network segmentation
- SSL/TLS everywhere

## 📞 Support

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Guide](https://prometheus.io/docs/alerting/alertmanager/)

### Contact
- Development Team: dev@4site.pro
- DevOps Team: devops@4site.pro
- Emergency: Use PagerDuty escalation

### Contributing
1. Fork the monitoring repository
2. Create feature branch
3. Test changes thoroughly
4. Submit pull request with documentation

---

**Built for 4site.pro** - Enterprise-grade monitoring for viral growth platforms.

*Last updated: 2024 - Version 1.0.0*
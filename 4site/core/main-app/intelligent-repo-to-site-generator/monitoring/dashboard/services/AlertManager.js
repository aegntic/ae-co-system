/**
 * Alert Manager for 4site.pro
 * Handles alert generation, escalation, and notification delivery
 */

const nodemailer = require('nodemailer');
const axios = require('axios');
const { Pool } = require('pg');
const Redis = require('ioredis');

class AlertManager {
  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true'
    });
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
    
    this.alertCallbacks = [];
    this.escalationTimers = new Map();
    
    // Email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Alert rules configuration
    this.alertRules = {
      // System alerts
      high_database_connections: {
        threshold: 80,
        metric: 'database.connection_percentage',
        severity: 'warning',
        description: 'Database connection pool usage is high'
      },
      critical_database_connections: {
        threshold: 90,
        metric: 'database.connection_percentage',
        severity: 'critical',
        description: 'Database connection pool near capacity'
      },
      slow_database_queries: {
        threshold: 5000,
        metric: 'database.avg_query_time',
        severity: 'warning',
        description: 'Database queries are running slowly'
      },
      
      // Business alerts
      low_viral_coefficient: {
        threshold: 0.5,
        metric: 'viral.coefficient',
        severity: 'warning',
        description: 'Viral coefficient has dropped below target'
      },
      critical_viral_coefficient: {
        threshold: 0.2,
        metric: 'viral.coefficient',
        severity: 'critical',
        description: 'Viral coefficient critically low - immediate attention required'
      },
      low_conversion_rate: {
        threshold: 2,
        metric: 'conversion.lead_rate',
        severity: 'warning',
        description: 'Lead conversion rate below target'
      },
      high_bounce_rate: {
        threshold: 70,
        metric: 'analytics.bounce_rate',
        severity: 'warning',
        description: 'Website bounce rate is high'
      },
      
      // Performance alerts
      slow_site_generation: {
        threshold: 30000,
        metric: 'performance.site_generation_p95',
        severity: 'warning',
        description: 'Site generation time exceeding target'
      },
      ai_service_errors: {
        threshold: 5,
        metric: 'ai.error_rate_percentage',
        severity: 'critical',
        description: 'High error rate in AI services'
      },
      poor_core_web_vitals: {
        threshold: 2500,
        metric: 'performance.lcp_p95',
        severity: 'warning',
        description: 'Core Web Vitals degraded - affects SEO'
      },
      
      // Security alerts
      failed_auth_attempts: {
        threshold: 10,
        metric: 'security.failed_auth_per_hour',
        severity: 'warning',
        description: 'Increased failed authentication attempts detected'
      },
      rate_limit_breaches: {
        threshold: 100,
        metric: 'security.rate_limit_breaches_per_hour',
        severity: 'warning',
        description: 'High rate limiting activity detected'
      },
      ssl_expiry_warning: {
        threshold: 30,
        metric: 'security.ssl_days_to_expiry',
        severity: 'warning',
        description: 'SSL certificate expiring soon'
      }
    };
  }
  
  async initialize() {
    try {
      await this.createAlertsTable();
      await this.redis.ping();
      console.log('✅ Alert Manager initialized');
      
      // Start alert processing
      this.startAlertProcessing();
      
    } catch (error) {
      console.error('❌ Alert Manager initialization failed:', error);
      throw error;
    }
  }
  
  async createAlertsTable() {
    const createTableQuery = \`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) NOT NULL,
        metric_name VARCHAR(100),
        metric_value NUMERIC,
        threshold NUMERIC,
        status VARCHAR(20) DEFAULT 'active',
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_by VARCHAR(255),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
    \`;
    
    await this.db.query(createTableQuery);
  }
  
  /**
   * Check metrics against alert rules and trigger alerts
   */
  async evaluateAlerts(metrics) {
    const triggeredAlerts = [];
    
    for (const [ruleId, rule] of Object.entries(this.alertRules)) {
      try {
        const metricValue = this.getMetricValue(metrics, rule.metric);
        
        if (metricValue !== null && this.shouldTriggerAlert(rule, metricValue)) {
          const alert = await this.createAlert(ruleId, rule, metricValue);
          triggeredAlerts.push(alert);
        }
        
      } catch (error) {
        console.error(\`Error evaluating alert rule \${ruleId}:\`, error);
      }
    }
    
    return triggeredAlerts;
  }
  
  /**
   * Create a new alert
   */
  async createAlert(ruleId, rule, metricValue) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await this.db.query(
        'SELECT id FROM alerts WHERE rule_id = $1 AND status = $2 AND created_at > NOW() - INTERVAL \\'1 hour\\'',
        [ruleId, 'active']
      );
      
      if (existingAlert.rows.length > 0) {
        // Don't create duplicate alerts within 1 hour
        return null;
      }
      
      const alertData = {
        ruleId,
        title: this.generateAlertTitle(rule, metricValue),
        description: rule.description,
        severity: rule.severity,
        metricName: rule.metric,
        metricValue,
        threshold: rule.threshold,
        metadata: {
          ruleConfig: rule,
          context: await this.getAlertContext(rule.metric)
        }
      };
      
      // Insert into database
      const insertQuery = \`
        INSERT INTO alerts (
          rule_id, title, description, severity, 
          metric_name, metric_value, threshold, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      \`;
      
      const result = await this.db.query(insertQuery, [
        alertData.ruleId,
        alertData.title,
        alertData.description,
        alertData.severity,
        alertData.metricName,
        alertData.metricValue,
        alertData.threshold,
        JSON.stringify(alertData.metadata)
      ]);
      
      const alert = result.rows[0];
      
      // Trigger notifications
      await this.sendAlertNotifications(alert);
      
      // Set up escalation if critical
      if (alert.severity === 'critical') {
        this.scheduleEscalation(alert);
      }
      
      // Notify callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert callback:', error);
        }
      });
      
      console.log(\`🚨 Alert created: \${alert.title}\`);
      return alert;
      
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }
  
  /**
   * Send alert notifications via configured channels
   */
  async sendAlertNotifications(alert) {
    const notifications = [];
    
    try {
      // Email notifications
      if (process.env.ALERT_EMAIL_ENABLED === 'true') {
        notifications.push(this.sendEmailAlert(alert));
      }
      
      // Slack notifications
      if (process.env.ALERT_SLACK_ENABLED === 'true') {
        notifications.push(this.sendSlackAlert(alert));
      }
      
      // PagerDuty for critical alerts
      if (alert.severity === 'critical' && process.env.PAGERDUTY_ENABLED === 'true') {
        notifications.push(this.sendPagerDutyAlert(alert));
      }
      
      await Promise.all(notifications);
      
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }
  
  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    if (!process.env.ALERT_EMAIL_RECIPIENTS) return;
    
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS.split(',');
    const severity = alert.severity.toUpperCase();
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    
    const html = \`
      <h2>\${emoji} 4site.pro Alert - \${severity}</h2>
      <h3>\${alert.title}</h3>
      <p><strong>Description:</strong> \${alert.description}</p>
      <p><strong>Metric:</strong> \${alert.metric_name}</p>
      <p><strong>Current Value:</strong> \${alert.metric_value}</p>
      <p><strong>Threshold:</strong> \${alert.threshold}</p>
      <p><strong>Time:</strong> \${new Date(alert.created_at).toLocaleString()}</p>
      
      <h4>Next Steps:</h4>
      <ul>
        <li>Check the monitoring dashboard for more details</li>
        <li>Review recent deployments or changes</li>
        <li>Acknowledge the alert once investigated</li>
      </ul>
      
      <p><a href="http://localhost:3333/alerts/\${alert.id}">View Alert Details</a></p>
    \`;
    
    const mailOptions = {
      from: process.env.ALERT_EMAIL_FROM || 'alerts@4site.pro',
      to: recipients.join(','),
      subject: \`[\${severity}] 4site.pro Alert: \${alert.title}\`,
      html
    };
    
    await this.emailTransporter.sendMail(mailOptions);
  }
  
  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    
    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const emoji = alert.severity === 'critical' ? ':rotating_light:' : ':warning:';
    
    const payload = {
      username: 'MonitoringBot',
      icon_emoji: ':chart_with_upwards_trend:',
      channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
      attachments: [{
        color,
        title: \`\${emoji} \${alert.title}\`,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Metric',
            value: alert.metric_name,
            short: true
          },
          {
            title: 'Current Value',
            value: alert.metric_value.toString(),
            short: true
          },
          {
            title: 'Threshold',
            value: alert.threshold.toString(),
            short: true
          }
        ],
        timestamp: Math.floor(new Date(alert.created_at).getTime() / 1000)
      }]
    };
    
    await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
  }
  
  /**
   * Send PagerDuty alert
   */
  async sendPagerDutyAlert(alert) {
    if (!process.env.PAGERDUTY_INTEGRATION_KEY) return;
    
    const payload = {
      routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
      event_action: 'trigger',
      dedup_key: \`4site-alert-\${alert.id}\`,
      payload: {
        summary: alert.title,
        source: '4site.pro',
        severity: alert.severity,
        component: alert.metric_name,
        group: 'monitoring',
        class: 'alert',
        custom_details: {
          description: alert.description,
          metric_value: alert.metric_value,
          threshold: alert.threshold,
          alert_id: alert.id
        }
      }
    };
    
    await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
  }
  
  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    const result = await this.db.query(
      'SELECT * FROM alerts WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );
    
    return result.rows;
  }
  
  /**
   * Get alerts by status
   */
  async getAlerts(status = 'active', limit = 100) {
    const result = await this.db.query(
      'SELECT * FROM alerts WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
      [status, limit]
    );
    
    return result.rows;
  }
  
  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    const result = await this.db.query(
      \`UPDATE alerts 
       SET acknowledged = true, acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *\`,
      [acknowledgedBy, alertId]
    );
    
    if (result.rows.length > 0) {
      // Cancel escalation timer
      if (this.escalationTimers.has(alertId)) {
        clearTimeout(this.escalationTimers.get(alertId));
        this.escalationTimers.delete(alertId);
      }
    }
    
    return result.rows[0];
  }
  
  /**
   * Resolve an alert
   */
  async resolveAlert(alertId, resolvedBy) {
    const result = await this.db.query(
      \`UPDATE alerts 
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *\`,
      [alertId]
    );
    
    if (result.rows.length > 0) {
      // Cancel escalation timer
      if (this.escalationTimers.has(alertId)) {
        clearTimeout(this.escalationTimers.get(alertId));
        this.escalationTimers.delete(alertId);
      }
    }
    
    return result.rows[0];
  }
  
  /**
   * Helper methods
   */
  getMetricValue(metrics, metricPath) {
    const parts = metricPath.split('.');
    let value = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return typeof value === 'number' ? value : null;
  }
  
  shouldTriggerAlert(rule, metricValue) {
    // For most metrics, alert when value exceeds threshold
    if (rule.metric.includes('coefficient') || rule.metric.includes('rate')) {
      // For rates and coefficients, alert when below threshold
      return metricValue < rule.threshold;
    } else if (rule.metric.includes('ssl_days_to_expiry')) {
      // For SSL expiry, alert when below threshold
      return metricValue < rule.threshold;
    } else {
      // For most other metrics, alert when above threshold
      return metricValue > rule.threshold;
    }
  }
  
  generateAlertTitle(rule, metricValue) {
    const metric = rule.metric.split('.').pop();
    return \`\${rule.severity.toUpperCase()}: \${metric} = \${metricValue} (threshold: \${rule.threshold})\`;
  }
  
  async getAlertContext(metricName) {
    // Provide additional context for alerts
    return {
      timestamp: new Date().toISOString(),
      metric: metricName,
      dashboardUrl: 'http://localhost:3333'
    };
  }
  
  scheduleEscalation(alert) {
    const escalationDelay = 60 * 60 * 1000; // 1 hour
    
    const timer = setTimeout(async () => {
      if (!alert.acknowledged) {
        console.log(\`⚠️ Escalating critical alert: \${alert.title}\`);
        // Send escalation notifications
        await this.sendEscalationNotifications(alert);
      }
    }, escalationDelay);
    
    this.escalationTimers.set(alert.id, timer);
  }
  
  async sendEscalationNotifications(alert) {
    // Send to on-call team or additional channels
    // Implementation depends on your escalation procedures
    console.log('Sending escalation notifications for alert:', alert.id);
  }
  
  startAlertProcessing() {
    // Start background alert processing
    setInterval(async () => {
      try {
        // Auto-resolve old alerts that are no longer triggering
        await this.autoResolveAlerts();
      } catch (error) {
        console.error('Error in alert processing:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  async autoResolveAlerts() {
    // Auto-resolve alerts older than 24 hours that haven't been manually resolved
    await this.db.query(
      \`UPDATE alerts 
       SET status = 'auto_resolved', resolved_at = CURRENT_TIMESTAMP 
       WHERE status = 'active' AND created_at < NOW() - INTERVAL '24 hours'\`
    );
  }
  
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }
}

module.exports = AlertManager;
#!/usr/bin/env node

/**
 * DataDog Setup Script for 4site.pro
 * Configures APM, RUM, and Infrastructure Monitoring
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Setting up DataDog APM & RUM Monitoring...'));

// DataDog RUM configuration for frontend
const datadogRumConfig = `
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: '${process.env.DATADOG_RUM_APPLICATION_ID || 'YOUR_APPLICATION_ID'}',
  clientToken: '${process.env.DATADOG_RUM_CLIENT_TOKEN || 'YOUR_CLIENT_TOKEN'}',
  site: 'datadoghq.com',
  service: '4site-pro-frontend',
  env: '${process.env.NODE_ENV || 'production'}',
  version: '${process.env.APP_VERSION || '1.0.0'}',
  sessionSampleRate: 100,
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
  
  beforeSend: (event) => {
    // Filter sensitive data from RUM events
    if (event.type === 'action' && event.action.target) {
      // Remove sensitive form data
      if (event.action.target.selector?.includes('[type="password"]')) {
        return false;
      }
    }
    return true;
  }
});

// Custom RUM tracking for business metrics
export const trackSiteGeneration = (siteData) => {
  datadogRum.addAction('site_generation_started', {
    site_type: siteData.projectType,
    tech_stack: siteData.techStack?.join(','),
    features_count: siteData.features?.length || 0,
    user_tier: siteData.userTier || 'free'
  });
};

export const trackSiteGenerationComplete = (siteData, duration) => {
  datadogRum.addAction('site_generation_completed', {
    site_id: siteData.id,
    generation_time: duration,
    success: true,
    template_used: siteData.template
  });
  
  // Custom timing for site generation
  datadogRum.addTiming('site_generation_duration', duration);
};

export const trackViralAction = (action, data) => {
  datadogRum.addAction(\`viral_\${action}\`, {
    referrer_id: data.referrerId,
    commission_amount: data.commissionAmount,
    viral_coefficient: data.viralCoefficient,
    conversion_path: data.conversionPath
  });
};

export const trackLeadCapture = (leadData) => {
  datadogRum.addAction('lead_captured', {
    source: leadData.source,
    quality_score: leadData.qualityScore,
    conversion_path: leadData.conversionPath,
    user_type: leadData.userType,
    form_completion_time: leadData.completionTime
  });
};

export const trackAIServiceCall = (service, startTime) => {
  return {
    complete: (success, responseData) => {
      const duration = Date.now() - startTime;
      datadogRum.addAction('ai_service_call', {
        service_name: service,
        duration,
        success,
        tokens_used: responseData?.tokensUsed,
        model_used: responseData?.model,
        cost: responseData?.cost
      });
      
      datadogRum.addTiming(\`ai_service_\${service}_duration\`, duration);
    }
  };
};

// Core Web Vitals tracking with business context
export const trackWebVitals = () => {
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      datadogRum.addAction('web_vital_cls', {
        value: metric.value,
        rating: metric.rating,
        page_type: getPageType()
      });
    });
    
    onFID((metric) => {
      datadogRum.addAction('web_vital_fid', {
        value: metric.value,
        rating: metric.rating,
        page_type: getPageType()
      });
    });
    
    onFCP((metric) => {
      datadogRum.addAction('web_vital_fcp', {
        value: metric.value,
        rating: metric.rating,
        page_type: getPageType()
      });
    });
    
    onLCP((metric) => {
      datadogRum.addAction('web_vital_lcp', {
        value: metric.value,
        rating: metric.rating,
        page_type: getPageType()
      });
    });
    
    onTTFB((metric) => {
      datadogRum.addAction('web_vital_ttfb', {
        value: metric.value,
        rating: metric.rating,
        page_type: getPageType()
      });
    });
  });
};

const getPageType = () => {
  const path = window.location.pathname;
  if (path === '/') return 'homepage';
  if (path.includes('/generator')) return 'generator';
  if (path.includes('/dashboard')) return 'dashboard';
  if (path.includes('/pricing')) return 'pricing';
  return 'other';
};

// Error tracking integration
export const trackError = (error, context = {}) => {
  datadogRum.addError(error, {
    ...context,
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    page_type: getPageType()
  });
};

export default datadogRum;
`;

// DataDog APM configuration for backend
const datadogApmConfig = `
const tracer = require('dd-trace').init({
  service: '4site-pro-backend',
  env: process.env.NODE_ENV || 'production',
  version: process.env.APP_VERSION || '1.0.0',
  runtimeMetrics: true,
  profiling: true,
  appsec: true, // Application Security Monitoring
  
  // Custom tags for all traces
  tags: {
    'team': 'engineering',
    'product': '4site-pro',
    'tier': 'production'
  },
  
  // Sampling rules
  samplingRules: [
    {
      service: '4site-pro-backend',
      name: 'express.request',
      sample_rate: 1.0 // Sample all web requests
    },
    {
      service: '4site-pro-backend',
      name: 'ai.service.call',
      sample_rate: 1.0 // Sample all AI service calls
    },
    {
      service: '4site-pro-backend',
      name: 'database.query',
      sample_rate: 0.1 // Sample 10% of database queries
    }
  ]
});

// Custom business metrics
const { StatsD } = require('node-statsd');
const dogstatsd = new StatsD({
  host: process.env.DATADOG_AGENT_HOST || 'localhost',
  port: process.env.DATADOG_AGENT_PORT || 8125,
  prefix: '4site.pro.',
  suffix: '',
  globalize: false,
  cacheDns: true,
  mock: process.env.NODE_ENV === 'test'
});

// Business metrics tracking functions
const trackViralMetrics = (metrics) => {
  dogstatsd.gauge('viral.coefficient', metrics.coefficient);
  dogstatsd.gauge('viral.active_referrers', metrics.activeReferrers);
  dogstatsd.increment('viral.commission.earned', metrics.commissionEarned);
  dogstatsd.histogram('viral.conversion_time', metrics.conversionTime);
  
  // Add custom tags
  const span = tracer.scope().active();
  if (span) {
    span.setTag('viral.coefficient', metrics.coefficient);
    span.setTag('viral.tier', metrics.tier);
  }
};

const trackLeadMetrics = (metrics) => {
  dogstatsd.gauge('leads.capture_rate', metrics.captureRate);
  dogstatsd.gauge('leads.quality_score', metrics.qualityScore);
  dogstatsd.increment('leads.total_captured', 1);
  dogstatsd.histogram('leads.form_completion_time', metrics.completionTime);
  
  // Track by source
  dogstatsd.increment(\`leads.by_source.\${metrics.source}\`, 1);
  
  const span = tracer.scope().active();
  if (span) {
    span.setTag('lead.source', metrics.source);
    span.setTag('lead.quality', metrics.qualityScore);
  }
};

const trackSiteGeneration = (siteData, duration) => {
  dogstatsd.histogram('site.generation.duration', duration);
  dogstatsd.increment('site.generation.total', 1);
  dogstatsd.increment(\`site.generation.by_type.\${siteData.projectType}\`, 1);
  
  const span = tracer.scope().active();
  if (span) {
    span.setTag('site.type', siteData.projectType);
    span.setTag('site.tech_stack', siteData.techStack.join(','));
    span.setTag('site.features_count', siteData.features.length);
  }
};

const trackAIServicePerformance = (service, duration, tokens, cost) => {
  dogstatsd.histogram(\`ai.service.\${service}.duration\`, duration);
  dogstatsd.histogram(\`ai.service.\${service}.tokens\`, tokens);
  dogstatsd.histogram(\`ai.service.\${service}.cost\`, cost);
  dogstatsd.increment(\`ai.service.\${service}.calls\`, 1);
  
  const span = tracer.scope().active();
  if (span) {
    span.setTag('ai.service', service);
    span.setTag('ai.tokens', tokens);
    span.setTag('ai.cost', cost);
  }
};

const trackDatabasePerformance = (operation, table, duration) => {
  dogstatsd.histogram(\`database.\${operation}.duration\`, duration);
  dogstatsd.increment(\`database.\${operation}.total\`, 1);
  dogstatsd.increment(\`database.table.\${table}.operations\`, 1);
  
  const span = tracer.scope().active();
  if (span) {
    span.setTag('db.operation', operation);
    span.setTag('db.table', table);
  }
};

// Express middleware for automatic tracing
const setupExpressTracing = (app) => {
  // Request tracing middleware
  app.use((req, res, next) => {
    const span = tracer.scope().active();
    if (span) {
      span.setTag('http.method', req.method);
      span.setTag('http.url', req.url);
      span.setTag('user.tier', req.user?.tier || 'anonymous');
      span.setTag('user.id', req.user?.id || 'anonymous');
    }
    next();
  });
  
  // Response time tracking
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      dogstatsd.histogram('http.request.duration', duration);
      dogstatsd.increment(\`http.status.\${res.statusCode}\`, 1);
      dogstatsd.increment(\`http.method.\${req.method.toLowerCase()}\`, 1);
    });
    
    next();
  });
};

// Health check with DataDog integration
const healthCheck = async () => {
  const checks = {
    database: false,
    redis: false,
    external_apis: false,
    memory: false,
    cpu: false
  };
  
  try {
    // Database check
    const dbResult = await checkDatabase();
    checks.database = dbResult.healthy;
    dogstatsd.gauge('health.database', dbResult.healthy ? 1 : 0);
    
    // Redis check
    const redisResult = await checkRedis();
    checks.redis = redisResult.healthy;
    dogstatsd.gauge('health.redis', redisResult.healthy ? 1 : 0);
    
    // Memory check
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    checks.memory = memoryUsagePercent < 90;
    dogstatsd.gauge('system.memory.usage_percent', memoryUsagePercent);
    
    // CPU check (simplified)
    const cpuUsage = process.cpuUsage();
    checks.cpu = true; // Simplified for now
    dogstatsd.gauge('system.cpu.user', cpuUsage.user);
    dogstatsd.gauge('system.cpu.system', cpuUsage.system);
    
  } catch (error) {
    console.error('Health check error:', error);
    dogstatsd.increment('health.check.errors', 1);
  }
  
  return checks;
};

module.exports = {
  tracer,
  dogstatsd,
  trackViralMetrics,
  trackLeadMetrics,
  trackSiteGeneration,
  trackAIServicePerformance,
  trackDatabasePerformance,
  setupExpressTracing,
  healthCheck
};
`;

// DataDog Logs configuration
const datadogLogsConfig = `
const winston = require('winston');
require('winston-datadog');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: '4site-pro',
    environment: process.env.NODE_ENV || 'production',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'production'
    }),
    
    // File logging
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10
    }),
    
    // DataDog logs transport
    new winston.transports.Datadog({
      apiKey: process.env.DATADOG_API_KEY,
      hostname: process.env.HOSTNAME || 'localhost',
      service: '4site-pro',
      ddsource: 'nodejs',
      ddtags: \`env:\${process.env.NODE_ENV || 'production'},version:\${process.env.APP_VERSION || '1.0.0'}\`
    })
  ]
});

// Business-specific logging functions
const logViralActivity = (activity, data) => {
  logger.info('Viral activity', {
    activity_type: activity,
    referrer_id: data.referrerId,
    commission: data.commission,
    viral_coefficient: data.viralCoefficient,
    tags: ['viral', 'business_metrics']
  });
};

const logLeadCapture = (leadData) => {
  logger.info('Lead captured', {
    lead_id: leadData.id,
    source: leadData.source,
    quality_score: leadData.qualityScore,
    conversion_path: leadData.conversionPath,
    tags: ['leads', 'business_metrics']
  });
};

const logSiteGeneration = (siteData, performance) => {
  logger.info('Site generated', {
    site_id: siteData.id,
    project_type: siteData.projectType,
    generation_time: performance.duration,
    ai_tokens_used: performance.tokensUsed,
    user_tier: siteData.userTier,
    tags: ['site_generation', 'ai_services']
  });
};

const logAIServiceCall = (service, request, response, performance) => {
  const logLevel = response.success ? 'info' : 'error';
  
  logger.log(logLevel, 'AI service call', {
    service_name: service,
    duration: performance.duration,
    tokens_used: response.tokensUsed,
    cost: response.cost,
    model: response.model,
    success: response.success,
    error: response.error,
    tags: ['ai_services', 'external_apis']
  });
};

const logSecurityEvent = (event, details) => {
  logger.warn('Security event', {
    event_type: event,
    ip_address: details.ip,
    user_agent: details.userAgent,
    user_id: details.userId,
    endpoint: details.endpoint,
    tags: ['security', 'alerts']
  });
};

const logPerformanceAlert = (metric, value, threshold) => {
  logger.warn('Performance alert', {
    metric_name: metric,
    current_value: value,
    threshold,
    severity: value > threshold * 1.5 ? 'critical' : 'warning',
    tags: ['performance', 'alerts']
  });
};

module.exports = {
  logger,
  logViralActivity,
  logLeadCapture,
  logSiteGeneration,
  logAIServiceCall,
  logSecurityEvent,
  logPerformanceAlert
};
`;

// Create necessary directories
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(chalk.green(`✓ Created directory: ${dirPath}`));
  }
};

try {
  // Create DataDog configuration files
  const datadogDir = path.join(__dirname, '..', 'config', 'datadog');
  ensureDirectoryExists(datadogDir);
  
  // Write RUM configuration
  fs.writeFileSync(
    path.join(datadogDir, 'datadog-rum.config.js'),
    datadogRumConfig
  );
  console.log(chalk.green('✓ Created DataDog RUM configuration'));
  
  // Write APM configuration
  fs.writeFileSync(
    path.join(datadogDir, 'datadog-apm.config.js'),
    datadogApmConfig
  );
  console.log(chalk.green('✓ Created DataDog APM configuration'));
  
  // Write Logs configuration
  fs.writeFileSync(
    path.join(datadogDir, 'datadog-logs.config.js'),
    datadogLogsConfig
  );
  console.log(chalk.green('✓ Created DataDog Logs configuration'));
  
  // Create DataDog dashboard configuration
  const dashboardConfig = `
{
  "title": "4site.pro Production Dashboard",
  "description": "Comprehensive monitoring dashboard for 4site.pro platform",
  "widgets": [
    {
      "id": 1,
      "definition": {
        "type": "timeseries",
        "requests": [
          {
            "q": "avg:4site.pro.site.generation.duration{*}",
            "display_type": "line",
            "style": {
              "palette": "dog_classic",
              "line_type": "solid",
              "line_width": "normal"
            }
          }
        ],
        "title": "Site Generation Performance",
        "title_size": "16",
        "title_align": "left"
      }
    },
    {
      "id": 2,
      "definition": {
        "type": "query_value",
        "requests": [
          {
            "q": "avg:4site.pro.viral.coefficient{*}",
            "aggregator": "avg"
          }
        ],
        "title": "Viral Coefficient",
        "title_size": "16",
        "title_align": "left",
        "precision": 2
      }
    },
    {
      "id": 3,
      "definition": {
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:4site.pro.leads.total_captured{*}.as_count()",
            "display_type": "bars",
            "style": {
              "palette": "dog_classic"
            }
          }
        ],
        "title": "Lead Capture Rate",
        "title_size": "16",
        "title_align": "left"
      }
    }
  ],
  "layout_type": "ordered",
  "is_read_only": false,
  "notify_list": [],
  "reflow_type": "fixed"
}
`;

  fs.writeFileSync(
    path.join(datadogDir, 'dashboard.json'),
    dashboardConfig
  );
  console.log(chalk.green('✓ Created DataDog dashboard configuration'));
  
  // Create environment variables template
  const envTemplate = `
# DataDog Configuration
DATADOG_API_KEY=your-api-key
DATADOG_APPLICATION_KEY=your-application-key
DATADOG_RUM_APPLICATION_ID=your-rum-application-id
DATADOG_RUM_CLIENT_TOKEN=your-rum-client-token
DATADOG_AGENT_HOST=localhost
DATADOG_AGENT_PORT=8125

# Optional: Custom tags
DD_TAGS=env:production,team:engineering,product:4site-pro
DD_SERVICE=4site-pro
DD_ENV=production
DD_VERSION=1.0.0
`;

  fs.writeFileSync(
    path.join(datadogDir, 'datadog.env.example'),
    envTemplate
  );
  console.log(chalk.green('✓ Created DataDog environment variables template'));
  
  // Create DataDog agent configuration
  const agentConfig = `
# DataDog Agent Configuration for 4site.pro
# Place this in /etc/datadog-agent/datadog.yaml

api_key: YOUR_API_KEY_HERE

# Site configuration
site: datadoghq.com

# Hostname override
hostname: 4site-pro-production

# Tags
tags:
  - env:production
  - service:4site-pro
  - team:engineering

# APM configuration
apm_config:
  enabled: true
  apm_non_local_traffic: true

# Logs configuration
logs_enabled: true
logs_config:
  container_collect_all: true

# Process monitoring
process_config:
  enabled: true

# Network monitoring
network_config:
  enabled: true

# Live processes
live_process_config:
  enabled: true

# Collect system metrics
collect_ec2_tags: true
`;

  fs.writeFileSync(
    path.join(datadogDir, 'datadog-agent.yaml'),
    agentConfig
  );
  console.log(chalk.green('✓ Created DataDog agent configuration'));
  
  console.log(chalk.blue('\n📋 DataDog Setup Complete!'));
  console.log(chalk.yellow('\nNext steps:'));
  console.log('1. Create a DataDog account at https://datadoghq.com');
  console.log('2. Get your API key and RUM application ID');
  console.log('3. Update environment variables');
  console.log('4. Install DataDog agent on your servers');
  console.log('5. Import dashboard configuration');
  
  console.log(chalk.green('\n✅ DataDog configuration files created successfully!'));
  
} catch (error) {
  console.error(chalk.red('❌ Error setting up DataDog:'), error.message);
  process.exit(1);
}
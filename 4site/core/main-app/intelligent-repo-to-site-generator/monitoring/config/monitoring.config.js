/**
 * 4site.pro Enterprise Monitoring Configuration
 * Centralized configuration for all monitoring services
 */

const config = {
  // Application Configuration
  app: {
    name: '4site-pro',
    environment: process.env.NODE_ENV || 'production',
    version: process.env.APP_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'us-east-1'
  },

  // Sentry Configuration - Error Tracking & Performance
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.SENTRY_RELEASE || 'latest',
    beforeSend: (event) => {
      // Filter out sensitive data
      if (event.request && event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
    integrations: [
      'Http',
      'OnUncaughtException',
      'OnUnhandledRejection',
      'ContextLines'
    ]
  },

  // DataDog Configuration - APM & Infrastructure
  datadog: {
    applicationKey: process.env.DATADOG_APPLICATION_KEY,
    apiKey: process.env.DATADOG_API_KEY,
    service: '4site-pro',
    env: process.env.NODE_ENV || 'production',
    version: process.env.APP_VERSION || '1.0.0',
    site: 'datadoghq.com',
    rum: {
      applicationId: process.env.DATADOG_RUM_APPLICATION_ID,
      clientId: process.env.DATADOG_RUM_CLIENT_ID,
      sampleRate: 100,
      trackInteractions: true,
      trackResources: true,
      trackLongTasks: true
    },
    logs: {
      enabled: true,
      level: 'info',
      hostname: process.env.HOSTNAME || 'localhost'
    }
  },

  // Database Monitoring
  database: {
    postgresql: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true',
      monitoring: {
        slowQueryThreshold: 1000, // ms
        connectionPoolWarning: 80, // % of max connections
        connectionPoolCritical: 90,
        deadlockThreshold: 5, // per hour
        cacheHitRatioWarning: 90, // %
        cacheHitRatioCritical: 85
      }
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      monitoring: {
        memoryUsageWarning: 80, // %
        memoryUsageCritical: 90,
        connectionWarning: 80,
        connectionCritical: 90
      }
    }
  },

  // Business Metrics Thresholds
  business: {
    viral: {
      coefficientWarning: 0.8, // Viral coefficient below 0.8
      coefficientCritical: 0.5, // Viral coefficient below 0.5
      commissionThreshold: 1000, // Monthly commission tracking
      shareRateWarning: 0.1, // Share rate below 10%
      shareRateCritical: 0.05 // Share rate below 5%
    },
    leads: {
      captureRateWarning: 0.05, // Conversion rate below 5%
      captureRateCritical: 0.02, // Conversion rate below 2%
      qualityScoreWarning: 70, // Lead quality score below 70
      qualityScoreCritical: 50, // Lead quality score below 50
      bounceRateWarning: 0.7, // Bounce rate above 70%
      bounceRateCritical: 0.85 // Bounce rate above 85%
    },
    performance: {
      coreWebVitals: {
        lcp: { good: 2500, needsImprovement: 4000 }, // ms
        fid: { good: 100, needsImprovement: 300 }, // ms
        cls: { good: 0.1, needsImprovement: 0.25 }, // score
        fcp: { good: 1800, needsImprovement: 3000 }, // ms
        ttfb: { good: 800, needsImprovement: 1800 } // ms
      },
      apiResponse: {
        p95Warning: 2000, // ms
        p95Critical: 5000, // ms
        p99Warning: 5000, // ms
        p99Critical: 10000 // ms
      }
    }
  },

  // Alert Configuration
  alerts: {
    channels: {
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(','),
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT || 587,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        from: process.env.ALERT_EMAIL_FROM || 'alerts@4site.pro'
      },
      slack: {
        enabled: process.env.ALERT_SLACK_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
        username: 'MonitoringBot',
        iconEmoji: ':warning:'
      },
      pagerduty: {
        enabled: process.env.PAGERDUTY_ENABLED === 'true',
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
        severity: {
          critical: 'critical',
          warning: 'warning',
          info: 'info'
        }
      }
    },
    escalation: {
      // Escalation timings in minutes
      warning: {
        initialDelay: 5,
        reminderInterval: 30,
        maxReminders: 3
      },
      critical: {
        initialDelay: 1,
        reminderInterval: 15,
        maxReminders: 5,
        escalateAfter: 60 // Escalate to on-call after 1 hour
      }
    }
  },

  // Security Monitoring
  security: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // per window per IP
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    failedAuth: {
      threshold: 5, // failed attempts
      windowMinutes: 15,
      blockDurationMinutes: 60
    },
    ssl: {
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      expirationWarningDays: 30,
      expirationCriticalDays: 7
    },
    vulnerabilities: {
      scanInterval: 7 * 24 * 60 * 60 * 1000, // weekly
      criticalSeverityAlert: true,
      highSeverityAlert: true
    }
  },

  // Performance Monitoring
  performance: {
    lighthouse: {
      enabled: true,
      interval: 60 * 60 * 1000, // hourly
      urls: [
        'https://4site.pro',
        'https://4site.pro/generator',
        'https://4site.pro/dashboard'
      ],
      thresholds: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 95
      }
    },
    uptime: {
      checkInterval: 60 * 1000, // 1 minute
      timeout: 30 * 1000, // 30 seconds
      endpoints: [
        { url: 'https://4site.pro', name: 'Homepage' },
        { url: 'https://4site.pro/api/health', name: 'API Health' },
        { url: 'https://4site.pro/generator', name: 'Generator' }
      ]
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: true,
      filename: 'logs/4site-pro.log',
      maxSize: '50m',
      maxFiles: 10
    },
    console: {
      enabled: process.env.NODE_ENV !== 'production',
      colorize: true
    }
  },

  // Metrics Collection
  metrics: {
    prometheus: {
      enabled: true,
      port: process.env.METRICS_PORT || 9090,
      endpoint: '/metrics'
    },
    collection: {
      interval: 60 * 1000, // 1 minute
      retention: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    custom: {
      viral_coefficient: {
        type: 'gauge',
        help: 'Current viral coefficient of the platform'
      },
      lead_capture_rate: {
        type: 'gauge',
        help: 'Lead capture conversion rate'
      },
      site_generation_time: {
        type: 'histogram',
        help: 'Time taken to generate sites',
        buckets: [1, 5, 10, 30, 60, 120, 300]
      },
      ai_service_latency: {
        type: 'histogram',
        help: 'AI service response times',
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
      }
    }
  },

  // Health Check Configuration
  healthCheck: {
    timeout: 5000, // ms
    interval: 30000, // ms
    checks: [
      'database',
      'redis',
      'external_apis',
      'file_system',
      'memory_usage',
      'cpu_usage'
    ]
  }
};

module.exports = config;
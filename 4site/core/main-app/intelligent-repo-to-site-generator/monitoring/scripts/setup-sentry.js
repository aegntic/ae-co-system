#!/usr/bin/env node

/**
 * Sentry Setup Script for 4site.pro
 * Configures error tracking and performance monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Setting up Sentry Error Tracking & Performance Monitoring...'));

// Sentry configuration for frontend (React)
const sentryReactConfig = `
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "${process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE'}",
  environment: "${process.env.NODE_ENV || 'production'}",
  release: "${process.env.SENTRY_RELEASE || 'latest'}",
  
  integrations: [
    new BrowserTracing({
      // Set up automatic route-based performance monitoring
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: ${process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'},
  
  // Release Health
  autoSessionTracking: true,
  
  // Custom error filtering
  beforeSend(event) {
    // Filter out network errors that aren't actionable
    if (event.exception) {
      const error = event.exception.values[0];
      if (error && error.type === 'NetworkError') {
        return null;
      }
    }
    
    // Filter out localhost development errors
    if (event.request && event.request.url && event.request.url.includes('localhost')) {
      return null;
    }
    
    return event;
  },

  // Custom tags for business context
  initialScope: {
    tags: {
      component: 'frontend',
      platform: '4site-pro'
    },
    user: {
      id: 'anonymous'
    }
  }
});

// Custom performance measurements
export const measureSiteGeneration = (siteData) => {
  return Sentry.startTransaction({
    name: 'Site Generation',
    op: 'custom.site_generation',
    data: {
      siteType: siteData.projectType,
      techStack: siteData.techStack,
      features: siteData.features.length
    }
  });
};

// Custom error boundary
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Business metrics tracking
export const trackViralMetrics = (metrics) => {
  Sentry.addBreadcrumb({
    category: 'viral.metrics',
    message: 'Viral metrics updated',
    data: metrics,
    level: 'info'
  });
  
  Sentry.setTag('viral_coefficient', metrics.coefficient);
  Sentry.setContext('viral_performance', metrics);
};

export const trackLeadCapture = (leadData) => {
  Sentry.addBreadcrumb({
    category: 'lead.capture',
    message: 'Lead captured',
    data: {
      source: leadData.source,
      quality: leadData.qualityScore,
      conversionPath: leadData.conversionPath
    },
    level: 'info'
  });
};

export const trackAIServicePerformance = (service, duration, success) => {
  Sentry.addBreadcrumb({
    category: 'ai.service',
    message: \`AI service \${service} completed\`,
    data: {
      service,
      duration,
      success,
      timestamp: Date.now()
    },
    level: success ? 'info' : 'warning'
  });
};

export default Sentry;
`;

// Sentry configuration for backend (Node.js)
const sentryNodeConfig = `
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "${process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE'}",
  environment: "${process.env.NODE_ENV || 'production'}",
  release: "${process.env.SENTRY_RELEASE || 'latest'}",
  
  integrations: [
    // Enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // Enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app: undefined }),
    // Enable profiling
    new ProfilingIntegration(),
  ],
  
  // Performance Monitoring
  tracesSampleRate: ${process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'},
  profilesSampleRate: ${process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'},
  
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.headers?.authorization;
      delete event.request.headers?.cookie;
      delete event.request.env;
    }
    
    if (event.extra) {
      delete event.extra.apiKey;
      delete event.extra.secret;
      delete event.extra.password;
    }
    
    return event;
  }
});

// Express middleware setup
const setupExpressErrorHandling = (app) => {
  // RequestHandler creates a separate execution context using domains
  app.use(Sentry.Handlers.requestHandler());
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
  
  // Error handler must be registered before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
};

// Custom business metrics for backend
const trackDatabasePerformance = (query, duration, success) => {
  Sentry.addBreadcrumb({
    category: 'database',
    message: \`Database query: \${query.slice(0, 50)}...\`,
    data: {
      duration,
      success,
      queryType: query.split(' ')[0].toUpperCase()
    },
    level: success ? 'info' : 'error'
  });
  
  if (duration > 1000) {
    Sentry.captureMessage('Slow database query detected', {
      level: 'warning',
      extra: {
        query: query.slice(0, 200),
        duration,
        threshold: 1000
      }
    });
  }
};

const trackViralCommission = (commissionData) => {
  Sentry.addBreadcrumb({
    category: 'viral.commission',
    message: 'Commission tracked',
    data: {
      amount: commissionData.amount,
      referrer: commissionData.referrerId,
      type: commissionData.type
    },
    level: 'info'
  });
  
  // Set user context for commission tracking
  Sentry.setUser({
    id: commissionData.referrerId,
    commission_tier: commissionData.tier
  });
};

const trackAPIPerformance = (endpoint, method, duration, statusCode) => {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  if (transaction) {
    transaction.setData('http.method', method);
    transaction.setData('http.status_code', statusCode);
    transaction.setData('http.endpoint', endpoint);
  }
  
  if (statusCode >= 400) {
    Sentry.addBreadcrumb({
      category: 'api.error',
      message: \`API error: \${method} \${endpoint}\`,
      data: {
        statusCode,
        duration,
        endpoint
      },
      level: 'error'
    });
  }
};

module.exports = {
  Sentry,
  setupExpressErrorHandling,
  trackDatabasePerformance,
  trackViralCommission,
  trackAPIPerformance
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
  // Create Sentry configuration files
  const sentryDir = path.join(__dirname, '..', 'config', 'sentry');
  ensureDirectoryExists(sentryDir);
  
  // Write frontend configuration
  fs.writeFileSync(
    path.join(sentryDir, 'sentry-react.config.js'),
    sentryReactConfig
  );
  console.log(chalk.green('✓ Created Sentry React configuration'));
  
  // Write backend configuration
  fs.writeFileSync(
    path.join(sentryDir, 'sentry-node.config.js'),
    sentryNodeConfig
  );
  console.log(chalk.green('✓ Created Sentry Node.js configuration'));
  
  // Create Sentry CLI configuration
  const sentryCliConfig = `
[defaults]
url = https://sentry.io/
org = ${process.env.SENTRY_ORG || 'your-org'}
project = ${process.env.SENTRY_PROJECT || '4site-pro'}

[auth]
token = ${process.env.SENTRY_AUTH_TOKEN || 'your-auth-token'}
`;
  
  fs.writeFileSync(
    path.join(process.cwd(), '.sentryclirc'),
    sentryCliConfig
  );
  console.log(chalk.green('✓ Created Sentry CLI configuration'));
  
  // Create release script
  const releaseScript = `#!/bin/bash
# Sentry Release Management Script

set -e

VERSION=\${1:-\$(date +%Y%m%d%H%M%S)}
echo "Creating Sentry release: \$VERSION"

# Create release
sentry-cli releases new "\$VERSION"

# Associate commits
sentry-cli releases set-commits "\$VERSION" --auto

# Upload source maps (for frontend)
sentry-cli releases files "\$VERSION" upload-sourcemaps ./dist --url-prefix ~/

# Finalize release
sentry-cli releases finalize "\$VERSION"

# Deploy
sentry-cli releases deploys "\$VERSION" new -e \${NODE_ENV:-production}

echo "✓ Sentry release \$VERSION created and deployed"
`;

  fs.writeFileSync(
    path.join(sentryDir, 'create-release.sh'),
    releaseScript
  );
  fs.chmodSync(path.join(sentryDir, 'create-release.sh'), '755');
  console.log(chalk.green('✓ Created Sentry release script'));
  
  // Update package.json to include Sentry dependencies
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    
    // Add Sentry dependencies
    packageJson.dependencies['@sentry/react'] = '^7.100.0';
    packageJson.dependencies['@sentry/tracing'] = '^7.100.0';
    packageJson.dependencies['@sentry/node'] = '^7.100.0';
    packageJson.dependencies['@sentry/profiling-node'] = '^1.3.0';
    packageJson.devDependencies['@sentry/cli'] = '^2.25.0';
    packageJson.devDependencies['@sentry/webpack-plugin'] = '^2.10.0';
    
    // Add scripts
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts['sentry:release'] = 'bash monitoring/config/sentry/create-release.sh';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green('✓ Updated package.json with Sentry dependencies'));
  }
  
  // Create environment variables template
  const envTemplate = `
# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=4site-pro
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_RELEASE=\${VERCEL_GIT_COMMIT_SHA:-latest}
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
`;

  fs.writeFileSync(
    path.join(sentryDir, 'sentry.env.example'),
    envTemplate
  );
  console.log(chalk.green('✓ Created Sentry environment variables template'));
  
  console.log(chalk.blue('\n📋 Sentry Setup Complete!'));
  console.log(chalk.yellow('\nNext steps:'));
  console.log('1. Create a Sentry account at https://sentry.io');
  console.log('2. Create a new project for 4site.pro');
  console.log('3. Copy your DSN and update environment variables');
  console.log('4. Run: npm install to install Sentry dependencies');
  console.log('5. Integrate Sentry configurations into your app');
  
  console.log(chalk.green('\n✅ Sentry configuration files created successfully!'));
  
} catch (error) {
  console.error(chalk.red('❌ Error setting up Sentry:'), error.message);
  process.exit(1);
}
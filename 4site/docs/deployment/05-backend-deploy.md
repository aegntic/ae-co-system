# Prompt 05: Backend API Deployment

## Objective
Deploy the Express.js backend API with proper scaling, security, and monitoring.

## Deployment Options
1. Railway (Recommended for Node.js)
2. Render
3. Fly.io
4. AWS ECS

## Implementation

### 1. Prepare Backend for Production

Update `server/package.json`:

```json
{
  "name": "4site-pro-api",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "dev": "nodemon src/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Create `server/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production
RUN npm install -D typescript @types/node

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### 2. Update Server Configuration

Create `server/src/config/production.ts`:

```typescript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';

export const productionConfig = {
  // Server
  port: process.env.PORT || 3000,
  env: 'production',
  
  // Security
  cors: {
    origin: [
      'https://4site.pro',
      'https://www.4site.pro',
      'https://preview.4site.pro'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.4site.pro"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  // Rate limiting
  rateLimits: {
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    }),
    
    api: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      keyGenerator: (req) => req.user?.id || req.ip,
    }),
    
    auth: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
    }),
    
    leadCapture: rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      keyGenerator: (req) => `${req.body.siteId}:${req.ip}`,
    })
  },
  
  // Database
  supabase: createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  ),
  
  // Cache
  redis: new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  }),
  
  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  }
};
```

### 3. Railway Deployment

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm ci && npm run build",
    "watchPatterns": [
      "server/**"
    ]
  },
  "deploy": {
    "runtime": "NODE",
    "startCommand": "cd server && npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "environments": {
    "production": {
      "NODE_ENV": "production",
      "PORT": "3000"
    }
  }
}
```

Deployment script `scripts/deploy-railway.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying API to Railway..."

# Install Railway CLI if needed
if ! command -v railway &> /dev/null; then
    curl -fsSL https://railway.app/install.sh | sh
fi

# Login to Railway
railway login

# Link to project
railway link

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=$SUPABASE_URL
railway variables set SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
railway variables set REDIS_URL=$REDIS_URL
railway variables set GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
railway variables set SENDGRID_API_KEY=$SENDGRID_API_KEY
railway variables set SENTRY_DSN=$SENTRY_DSN

# Deploy
echo "📦 Deploying to Railway..."
railway up

# Get deployment URL
DEPLOYMENT_URL=$(railway status --json | jq -r '.url')
echo "✅ API deployed to: $DEPLOYMENT_URL"

# Update DNS
echo "🌐 Updating DNS records..."
# Add CNAME record: api.4site.pro -> your-api.railway.app
```

### 4. API Server Implementation

Update `server/src/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { productionConfig } from './config/production';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRoutes } from './routes';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: productionConfig.sentry.dsn,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: productionConfig.sentry.tracesSampleRate,
  profilesSampleRate: 1.0,
});

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: productionConfig.cors
});

// Request tracking
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Security middleware
app.use(productionConfig.helmet);
app.use(cors(productionConfig.cors));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', productionConfig.rateLimits.api);
app.use('/auth/', productionConfig.rateLimits.auth);
app.use('/api/leads', productionConfig.rateLimits.leadCapture);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

// API routes
setupRoutes(app, io);

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Close database connections
  await productionConfig.redis.quit();
  
  process.exit(0);
});

// Start server
const PORT = productionConfig.port;
server.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📍 Environment: ${productionConfig.env}`);
});
```

### 5. API Endpoints Implementation

Create `server/src/routes/index.ts`:

```typescript
import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { authRoutes } from './auth';
import { leadRoutes } from './leads';
import { siteRoutes } from './sites';
import { analyticsRoutes } from './analytics';
import { webhookRoutes } from './webhooks';
import { widgetRoutes } from './widget';

export function setupRoutes(app: Express, io: SocketIOServer) {
  // Authentication
  app.use('/auth', authRoutes);
  
  // API routes
  app.use('/api/sites', siteRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/widget', widgetRoutes);
  
  // Webhooks
  app.use('/webhooks', webhookRoutes);
  
  // WebSocket for real-time analytics
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe:analytics', (siteId) => {
      socket.join(`analytics:${siteId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist'
    });
  });
}
```

### 6. Monitoring Setup

Create `server/src/monitoring/metrics.ts`:

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const activeConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

export const leadsCaptured = new Counter({
  name: 'leads_captured_total',
  help: 'Total number of leads captured',
  labelNames: ['site_id'],
  registers: [register]
});

// Metrics endpoint
export function setupMetrics(app: Express) {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
```

### 7. Load Testing

Create `scripts/load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const API_URL = 'https://api.4site.pro';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${API_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });
  
  // Test lead capture
  const leadRes = http.post(`${API_URL}/api/leads`, JSON.stringify({
    siteId: 'test-site-id',
    email: `test-${Date.now()}@example.com`,
    name: 'Load Test User'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(leadRes, {
    'lead capture status is 201': (r) => r.status === 201,
  });
  
  sleep(1);
}
```

## Expected Output Files
- `dockerfile-api` - Production Dockerfile
- `railway-config.json` - Railway deployment config
- `api-production-config.ts` - Production configuration
- `deploy-api-script.sh` - Deployment automation
- `load-test-script.js` - K6 load testing script

## Dependencies
- Requires: 01-production-env.md (API keys)
- Requires: 03-database-setup.md (database connection)

## Performance Requirements
- Response time: < 200ms (p95)
- Throughput: > 1000 req/s
- Error rate: < 0.1%
- Uptime: 99.9%

## Security Measures
- Helmet.js for security headers
- Rate limiting per endpoint
- API key authentication
- Request validation
- SQL injection prevention
- XSS protection

## Scaling Strategy
1. Horizontal scaling with Railway
2. Redis for caching
3. Database connection pooling
4. CDN for static assets
5. WebSocket sticky sessions

## Next Steps
- Set up CDN assets (Prompt 06)
- Configure DNS (Prompt 07)
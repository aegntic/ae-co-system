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
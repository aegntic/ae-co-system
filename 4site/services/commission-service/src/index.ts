
import Fastify from 'fastify';
import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, isAfter, isBefore } from 'date-fns';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import process from 'node:process';

import * as schema from './db/schema';
import { PartnerService } from './services/partner';
import { AttributionService } from './services/attribution';
import { WebhookService } from './services/webhook';
import { CommissionCalculator } from './services/commission';
import { AnalyticsService } from './services/analytics';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL!;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-secret';

const redis = new Redis(REDIS_URL);
const fastify = Fastify({ logger: true });

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient, { schema });

// Initialize services
const partnerService = new PartnerService(db);
const attributionService = new AttributionService(db, redis);
const webhookService = new WebhookService(db, WEBHOOK_SECRET);
const commissionCalculator = new CommissionCalculator(db);
const analyticsService = new AnalyticsService(db, redis);

// Validation schemas
const GenerateReferralSchema = z.object({
  partnerId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  customParams: z.record(z.string()).optional(),
});

const TrackClickSchema = z.object({
  partnerId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  destination: z.string().url().optional(),
});

const WebhookEventSchema = z.object({
  partnerId: z.string().uuid(),
  eventType: z.enum(['signup', 'purchase', 'subscription', 'trial']),
  userId: z.string().optional(),
  referenceId: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Register plugins
fastify.register(helmet, {
  contentSecurityPolicy: false,
});

fastify.register(cors, {
  origin: true,
  credentials: true,
});

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});


// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Check database connection
    await db.select().from(schema.partners).limit(1);
    
    // Check Redis connection
    await redis.ping();
    
    return { 
      status: 'healthy', 
      service: 'commission-service',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.code(503);
    return { 
      status: 'unhealthy', 
      service: 'commission-service',
      error: (error as Error).message
    };
  }
});

// Get service metrics
fastify.get('/metrics', async (request, reply) => {
  try {
    const metrics = await analyticsService.getServiceMetrics();
    return metrics;
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get metrics' };
  }
});

// Generate referral link
fastify.post('/api/referral/generate', async (request, reply) => {
  try {
    const data = GenerateReferralSchema.parse(request.body);
    
    const partner = await partnerService.getPartner(data.partnerId);
    if (!partner) {
      reply.code(404);
      return { error: 'Partner not found' };
    }
    
    const referralUrl = await partnerService.generateReferralUrl(
      data.partnerId,
      {
        userId: data.userId,
        projectId: data.projectId,
        siteId: data.siteId,
        customParams: data.customParams,
      }
    );
    
    return { 
      success: true,
      referralUrl,
      partnerId: data.partnerId,
      partnerName: partner.name
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Invalid request data', details: error.errors };
    }
    
    reply.code(500);
    return { error: 'Failed to generate referral link' };
  }
});

// Get partner information
fastify.get('/api/partners/:partnerId', async (request, reply) => {
  try {
    const { partnerId } = request.params as { partnerId: string };
    
    const partner = await partnerService.getPartner(partnerId);
    if (!partner) {
      reply.code(404);
      return { error: 'Partner not found' };
    }
    
    return {
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      description: partner.description,
      logoUrl: partner.logoUrl,
      categories: partner.categories,
      ctaText: partner.ctaText,
      isActive: partner.isActive,
    };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get partner info' };
  }
});

// List all active partners
fastify.get('/api/partners', async (request, reply) => {
  try {
    const partners = await partnerService.getActivePartners();
    return { partners };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get partners' };
  }
});

// Track click and redirect
fastify.get('/track/:partnerId', async (request, reply) => {
  try {
    const { partnerId } = request.params as { partnerId: string };
    const query = request.query as {
      userId?: string;
      projectId?: string;
      siteId?: string;
      destination?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
    
    // Validate partner exists
    const partner = await partnerService.getPartner(partnerId);
    if (!partner) {
      reply.code(404);
      return { error: 'Partner not found' };
    }
    
    // Track the click
    const clickData = await attributionService.trackClick({
      partnerId,
      userId: query.userId,
      projectId: query.projectId,
      siteId: query.siteId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] as string,
      referrer: request.headers.referer as string,
      metadata: {
        utm_source: query.utm_source,
        utm_medium: query.utm_medium,
        utm_campaign: query.utm_campaign,
      },
    });
    
    if (!clickData) {
      reply.code(500);
      return { error: 'Failed to track click' };
    }
    
    // Generate destination URL
    const destinationUrl = query.destination || 
      await partnerService.generateReferralUrl(partnerId, {
        userId: query.userId,
        projectId: query.projectId,
        siteId: query.siteId,
        clickId: clickData.id,
      });
    
    // Redirect to partner site
    reply.redirect(302, destinationUrl);
  } catch (error) {
    fastify.log.error(error, 'Failed to track click');
    reply.code(500);
    return { error: 'Failed to process click' };
  }
});

// Track click via POST (for analytics)
fastify.post('/api/track/click', async (request, reply) => {
  try {
    const data = TrackClickSchema.parse(request.body);
    
    const clickData = await attributionService.trackClick({
      partnerId: data.partnerId,
      userId: data.userId,
      projectId: data.projectId,
      siteId: data.siteId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] as string,
      referrer: request.headers.referer as string,
    });
    
    return {
      success: true,
      clickId: clickData?.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Invalid request data', details: error.errors };
    }
    
    reply.code(500);
    return { error: 'Failed to track click' };
  }
});


// Partner webhook endpoints
fastify.post('/webhooks/:partnerId', async (request, reply) => {
  try {
    const { partnerId } = request.params as { partnerId: string };
    const signature = request.headers['x-webhook-signature'] as string;
    const payload = request.body;
    
    // Verify webhook signature
    const isValid = await webhookService.verifyWebhook(
      partnerId,
      payload,
      signature
    );
    
    if (!isValid) {
      reply.code(401);
      return { error: 'Invalid webhook signature' };
    }
    
    // Process webhook event
    const result = await webhookService.processWebhookEvent(
      partnerId,
      payload
    );
    
    if (result.success) {
      return { 
        success: true,
        eventId: result.eventId,
        commissionCalculated: result.commissionCalculated
      };
    } else {
      reply.code(400);
      return { error: result.error };
    }
  } catch (error) {
    fastify.log.error(error, 'Webhook processing failed');
    reply.code(500);
    return { error: 'Webhook processing failed' };
  }
});

// Manual conversion tracking
fastify.post('/api/track/conversion', async (request, reply) => {
  try {
    const data = WebhookEventSchema.parse(request.body);
    
    const result = await attributionService.trackConversion({
      partnerId: data.partnerId,
      eventType: data.eventType,
      userId: data.userId,
      referenceId: data.referenceId,
      amount: data.amount,
      currency: data.currency || 'USD',
      metadata: data.metadata,
    });
    
    if (result.success) {
      return {
        success: true,
        conversionId: result.conversionId,
        commissionAmount: result.commissionAmount,
      };
    } else {
      reply.code(400);
      return { error: result.error };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Invalid request data', details: error.errors };
    }
    
    reply.code(500);
    return { error: 'Failed to track conversion' };
  }
});


// Analytics endpoints
fastify.get('/api/analytics/partner/:partnerId', async (request, reply) => {
  try {
    const { partnerId } = request.params as { partnerId: string };
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };
    
    const analytics = await analyticsService.getPartnerAnalytics(
      partnerId,
      startDate ? new Date(startDate) : addDays(new Date(), -30),
      endDate ? new Date(endDate) : new Date()
    );
    
    return analytics;
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get analytics' };
  }
});

fastify.get('/api/analytics/commission-summary', async (request, reply) => {
  try {
    const { partnerId, startDate, endDate } = request.query as {
      partnerId?: string;
      startDate?: string;
      endDate?: string;
    };
    
    const summary = await analyticsService.getCommissionSummary({
      partnerId,
      startDate: startDate ? new Date(startDate) : addDays(new Date(), -30),
      endDate: endDate ? new Date(endDate) : new Date(),
    });
    
    return summary;
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get commission summary' };
  }
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully');
  try {
    await fastify.close();
    await redis.disconnect();
    await queryClient.end();
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown');
    process.exit(1);
  }
});

const start = async () => {
  // Validate required environment variables
  if (!DATABASE_URL) {
    fastify.log.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  // Test database connection
  try {
    await db.select().from(schema.partners).limit(1);
    fastify.log.info('Database connection established');
  } catch (error) {
    fastify.log.error(error, 'Failed to connect to database');
    process.exit(1);
  }
  
  // Test Redis connection
  try {
    await redis.ping();
    fastify.log.info('Redis connection established');
  } catch (error) {
    fastify.log.error(error, 'Failed to connect to Redis');
    process.exit(1);
  }
  
  // Start HTTP server
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Commission Service listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

redis.on('connect', () => fastify.log.info('Commission Service connected to Redis.'));
redis.on('error', (err) => fastify.log.error('Redis connection error in Commission Service:', err));

start();
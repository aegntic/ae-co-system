
import Fastify from 'fastify';
import Redis from 'ioredis';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import process from 'node:process';
import archiver from 'archiver';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { createReadStream } from 'fs';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
import { QueueManager } from './services/queue';
import { DeploymentService } from './services/deployment';
import { CDNManager } from './services/cdn';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL!;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;

const redis = new Redis(REDIS_URL);
const fastify = Fastify({ logger: true });

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient, { schema });

const queueManager = new QueueManager(redis);
const cdnManager = new CDNManager();
const deploymentService = new DeploymentService(db, cdnManager);

interface DeployJobData {
  projectId: string;
  generatedSiteId: string;
  contentVersionId: string;
  bundlePath: string;
  deploymentProvider: 'vercel' | 'netlify' | 'cloudflare';
  customDomain?: string;
  envVars?: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
}

interface DeploymentStatus {
  siteId: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  deployedUrl?: string;
  errorMessage?: string;
  deploymentId?: string;
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Check database connection
    await db.select().from(schema.generatedSites).limit(1);
    
    // Check Redis connection
    await redis.ping();
    
    return { 
      status: 'healthy', 
      service: 'deployment-service',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.code(503);
    return { 
      status: 'unhealthy', 
      service: 'deployment-service',
      error: (error as Error).message
    };
  }
});

// Get deployment status
fastify.get('/deployments/:siteId/status', async (request, reply) => {
  const { siteId } = request.params as { siteId: string };
  
  try {
    const site = await db.select()
      .from(schema.generatedSites)
      .where(eq(schema.generatedSites.id, siteId))
      .limit(1);
    
    if (!site.length) {
      reply.code(404);
      return { error: 'Site not found' };
    }
    
    return {
      siteId,
      status: site[0].status,
      deployedUrl: site[0].deployedUrl,
      lastDeployedAt: site[0].lastDeployedAt
    };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get deployment status' };
  }
});

// Manual deployment trigger
fastify.post('/deployments/trigger', async (request, reply) => {
  const jobData = request.body as DeployJobData;
  
  try {
    const jobId = await queueManager.addDeploymentJob(jobData);
    return { success: true, jobId };
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to queue deployment job' };
  }
});

// Get queue statistics
fastify.get('/queue/stats', async (request, reply) => {
  try {
    const stats = await queueManager.getQueueStats();
    return stats;
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to get queue stats' };
  }
});

async function processDeploymentJobs() {
  fastify.log.info('Deployment Service: Worker started');
  
  while (true) {
    try {
      // Get job from queue with blocking pop
      const job = await queueManager.getDeploymentJob(10);
      
      if (job) {
        fastify.log.info(`Processing deployment job ${job.id}`);
        await processDeploymentJob(job);
      } else {
        // No jobs available, short sleep
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      fastify.log.error(error, 'Error in deployment worker loop');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function processDeploymentJob(job: any) {
  const jobData: DeployJobData = job.data;
  const { generatedSiteId, projectId, bundlePath, deploymentProvider } = jobData;
  
  try {
    // Update status to building
    await db.update(schema.generatedSites)
      .set({ 
        status: 'building',
        lastDeployedAt: new Date()
      })
      .where(eq(schema.generatedSites.id, generatedSiteId));
    
    fastify.log.info(`Starting deployment for site ${generatedSiteId} to ${deploymentProvider}`);
    
    // Deploy to selected CDN
    const result = await deploymentService.deployToProvider(
      deploymentProvider,
      {
        siteId: generatedSiteId,
        projectId,
        bundlePath,
        customDomain: jobData.customDomain,
        envVars: jobData.envVars || {},
        buildCommand: jobData.buildCommand,
        outputDirectory: jobData.outputDirectory
      }
    );
    
    if (result.success && result.deployedUrl) {
      // Update database with success
      await db.update(schema.generatedSites)
        .set({
          status: 'live',
          deployedUrl: result.deployedUrl,
          deploymentId: result.deploymentId,
          lastDeployedAt: new Date()
        })
        .where(eq(schema.generatedSites.id, generatedSiteId));
      
      fastify.log.info(`Deployment successful: ${result.deployedUrl}`);
    } else {
      throw new Error(result.error || 'Unknown deployment error');
    }
  } catch (error) {
    fastify.log.error(error, `Deployment failed for site ${generatedSiteId}`);
    
    // Update database with failure
    await db.update(schema.generatedSites)
      .set({
        status: 'deployment_failed',
        themeConfig: {
          ...{},
          deploymentError: (error as Error).message
        }
      })
      .where(eq(schema.generatedSites.id, generatedSiteId));
  }
}

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
    await db.select().from(schema.generatedSites).limit(1);
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
  
  // Start background job processor
  processDeploymentJobs().catch(err => {
    fastify.log.error(err, 'Deployment worker crashed');
    process.exit(1);
  });
  
  // Start HTTP server
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Deployment Service listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

redis.on('connect', () => fastify.log.info('Deployment Service connected to Redis.'));
redis.on('error', (err) => fastify.log.error('Redis connection error in Deployment Service:', err));

start();
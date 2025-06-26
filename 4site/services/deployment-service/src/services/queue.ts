/**
 * Queue management for deployment jobs
 * Handles Redis-based job queuing with priorities and retries
 */

import { Redis } from 'ioredis';
import { z } from 'zod';

// Job schemas for validation
const DeploymentJobSchema = z.object({
  id: z.string(),
  type: z.literal('deployment'),
  data: z.object({
    projectId: z.string(),
    generatedSiteId: z.string(),
    contentVersionId: z.string(),
    bundlePath: z.string(),
    deploymentProvider: z.enum(['vercel', 'netlify', 'cloudflare']),
    customDomain: z.string().optional(),
    envVars: z.record(z.string()).optional(),
    buildCommand: z.string().optional(),
    outputDirectory: z.string().optional(),
  }),
  priority: z.number().default(0),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  createdAt: z.date().default(() => new Date()),
});

export type DeploymentJob = z.infer<typeof DeploymentJobSchema>;

export class QueueManager {
  private redis: Redis;
  private readonly DEPLOYMENT_QUEUE = 'deployment_queue';
  private readonly FAILED_QUEUE = 'deployment_failed_queue';
  private readonly PROCESSING_SET = 'deployment_processing';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Add a deployment job to the queue
   */
  async addDeploymentJob(jobData: DeploymentJob['data'], priority = 0): Promise<string> {
    const job: DeploymentJob = {
      id: `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'deployment',
      data: jobData,
      priority,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };

    // Validate job data
    DeploymentJobSchema.parse(job);

    // Add to priority queue (higher priority = lower score)
    const score = Date.now() - priority * 1000000;
    await this.redis.zadd(this.DEPLOYMENT_QUEUE, score, JSON.stringify(job));

    return job.id;
  }

  /**
   * Get the next deployment job from the queue
   */
  async getDeploymentJob(timeout = 10): Promise<DeploymentJob | null> {
    // Use BZPOPMIN for blocking pop with priority
    const result = await this.redis.bzpopmin(this.DEPLOYMENT_QUEUE, timeout);
    
    if (!result) {
      return null;
    }

    const [, , jobStr] = result;
    const job = JSON.parse(jobStr) as DeploymentJob;
    
    // Add to processing set to track active jobs
    await this.redis.sadd(this.PROCESSING_SET, job.id);
    
    return job;
  }

  /**
   * Mark a job as completed and remove from processing
   */
  async completeJob(jobId: string): Promise<void> {
    await this.redis.srem(this.PROCESSING_SET, jobId);
  }

  /**
   * Mark a job as failed and handle retry logic
   */
  async failJob(job: DeploymentJob, error: string): Promise<void> {
    // Remove from processing set
    await this.redis.srem(this.PROCESSING_SET, job.id);

    // Increment retry count
    job.retryCount++;

    if (job.retryCount < job.maxRetries) {
      // Re-queue with exponential backoff
      const delay = Math.pow(2, job.retryCount) * 1000; // 2s, 4s, 8s...
      const score = Date.now() + delay - job.priority * 1000000;
      
      await this.redis.zadd(this.DEPLOYMENT_QUEUE, score, JSON.stringify(job));
    } else {
      // Move to failed queue for manual inspection
      const failedJob = {
        ...job,
        failedAt: new Date(),
        error,
      };
      
      await this.redis.lpush(this.FAILED_QUEUE, JSON.stringify(failedJob));
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    totalProcessed: number;
  }> {
    const [pending, processing, failed] = await Promise.all([
      this.redis.zcard(this.DEPLOYMENT_QUEUE),
      this.redis.scard(this.PROCESSING_SET),
      this.redis.llen(this.FAILED_QUEUE),
    ]);

    // Get total processed from a counter (if implemented)
    const totalProcessed = await this.redis.get('deployment_total_processed') || '0';

    return {
      pending,
      processing,
      failed,
      totalProcessed: parseInt(totalProcessed),
    };
  }

  /**
   * Get failed jobs for debugging
   */
  async getFailedJobs(limit = 10): Promise<any[]> {
    const jobs = await this.redis.lrange(this.FAILED_QUEUE, 0, limit - 1);
    return jobs.map(jobStr => JSON.parse(jobStr));
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobIndex: number): Promise<string | null> {
    const jobStr = await this.redis.lindex(this.FAILED_QUEUE, jobIndex);
    
    if (!jobStr) {
      return null;
    }

    const failedJob = JSON.parse(jobStr);
    
    // Reset retry count and re-queue
    const job: DeploymentJob = {
      ...failedJob,
      retryCount: 0,
      createdAt: new Date(),
    };

    const score = Date.now() - job.priority * 1000000;
    await this.redis.zadd(this.DEPLOYMENT_QUEUE, score, JSON.stringify(job));
    
    // Remove from failed queue
    await this.redis.lrem(this.FAILED_QUEUE, 1, jobStr);

    return job.id;
  }

  /**
   * Clear failed jobs queue
   */
  async clearFailedJobs(): Promise<number> {
    const count = await this.redis.llen(this.FAILED_QUEUE);
    await this.redis.del(this.FAILED_QUEUE);
    return count;
  }

  /**
   * Health check for queue system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    queueSizes: {
      pending: number;
      processing: number;
      failed: number;
    };
  }> {
    const start = Date.now();
    
    try {
      await this.redis.ping();
      const stats = await this.getQueueStats();
      
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency,
        queueSizes: {
          pending: stats.pending,
          processing: stats.processing,
          failed: stats.failed,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        queueSizes: {
          pending: 0,
          processing: 0,
          failed: 0,
        },
      };
    }
  }

  /**
   * Increment total processed counter
   */
  async incrementProcessedCounter(): Promise<void> {
    await this.redis.incr('deployment_total_processed');
  }
}
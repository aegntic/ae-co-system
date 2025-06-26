import Redis from 'ioredis';
import { z } from 'zod';

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface QueueOptions {
  priority?: number;
  delay?: number;
  maxAttempts?: number;
  backoffDelay?: number;
}

// Job schemas
export const RepoAnalysisJobSchema = z.object({
  projectId: z.string().uuid(),
  repositoryId: z.string().uuid(),
  repoUrl: z.string().url(),
  userId: z.string().uuid(),
  requestedAt: z.string(),
  options: z.object({
    forceReanalysis: z.boolean().default(false),
    includeFiles: z.array(z.string()).default([]),
    analysisDepth: z.enum(['basic', 'full', 'deep']).default('full'),
  }).optional(),
});

export const SiteGenerationJobSchema = z.object({
  projectId: z.string().uuid(),
  siteId: z.string().uuid(),
  repositoryId: z.string().uuid(),
  userId: z.string().uuid(),
  templateType: z.string(),
  analysisData: z.any(),
  requestedAt: z.string(),
  options: z.object({
    customTheme: z.any().optional(),
    includeDemo: z.boolean().default(true),
    enableVideo: z.boolean().default(true),
    enableSlideshow: z.boolean().default(true),
  }).optional(),
});

export const VideoGenerationJobSchema = z.object({
  projectId: z.string().uuid(),
  siteId: z.string().uuid(),
  userId: z.string().uuid(),
  contentSections: z.array(z.any()),
  voiceSettings: z.object({
    voice: z.string().default('alloy'),
    speed: z.number().min(0.25).max(4.0).default(1.0),
    language: z.string().default('en'),
  }).optional(),
  requestedAt: z.string(),
});

export const DeploymentJobSchema = z.object({
  projectId: z.string().uuid(),
  siteId: z.string().uuid(),
  userId: z.string().uuid(),
  deploymentTarget: z.enum(['vercel', 'netlify', 'cloudflare']),
  buildPath: z.string(),
  customDomain: z.string().optional(),
  requestedAt: z.string(),
});

export type RepoAnalysisJob = z.infer<typeof RepoAnalysisJobSchema>;
export type SiteGenerationJob = z.infer<typeof SiteGenerationJobSchema>;
export type VideoGenerationJob = z.infer<typeof VideoGenerationJobSchema>;
export type DeploymentJob = z.infer<typeof DeploymentJobSchema>;

export class QueueService {
  private redis: Redis;
  
  // Queue names
  static readonly QUEUES = {
    REPO_ANALYSIS: 'repo_analysis_queue',
    SITE_GENERATION: 'site_generation_queue',
    VIDEO_GENERATION: 'video_generation_queue',
    DEPLOYMENT: 'deployment_queue',
    COMMISSION_TRACKING: 'commission_tracking_queue',
    NOTIFICATION: 'notification_queue',
  } as const;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      console.error('Redis queue connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Queue service connected to Redis');
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    queueName: string,
    jobType: string,
    data: any,
    options: QueueOptions = {}
  ): Promise<string> {
    const jobId = crypto.randomUUID();
    const job: QueueJob = {
      id: jobId,
      type: jobType,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      scheduledAt: options.delay ? new Date(Date.now() + options.delay) : undefined,
    };

    const serializedJob = JSON.stringify(job);
    
    if (options.delay) {
      // Delayed job
      const score = Date.now() + options.delay;
      await this.redis.zadd(`${queueName}:delayed`, score, serializedJob);
    } else {
      // Immediate job - use priority queue
      const priority = options.priority || 0;
      if (priority > 0) {
        await this.redis.lpush(`${queueName}:priority`, serializedJob);
      } else {
        await this.redis.rpush(queueName, serializedJob);
      }
    }

    // Track job in jobs hash
    await this.redis.hset(`jobs:${jobId}`, {
      status: 'pending',
      queueName,
      createdAt: job.createdAt.toISOString(),
      data: JSON.stringify(data),
    });

    return jobId;
  }

  /**
   * Add repository analysis job
   */
  async addRepoAnalysisJob(data: RepoAnalysisJob, options?: QueueOptions): Promise<string> {
    const validatedData = RepoAnalysisJobSchema.parse(data);
    return this.addJob(
      QueueService.QUEUES.REPO_ANALYSIS,
      'repo_analysis',
      validatedData,
      { priority: 10, ...options }
    );
  }

  /**
   * Add site generation job
   */
  async addSiteGenerationJob(data: SiteGenerationJob, options?: QueueOptions): Promise<string> {
    const validatedData = SiteGenerationJobSchema.parse(data);
    return this.addJob(
      QueueService.QUEUES.SITE_GENERATION,
      'site_generation',
      validatedData,
      { priority: 8, ...options }
    );
  }

  /**
   * Add video generation job
   */
  async addVideoGenerationJob(data: VideoGenerationJob, options?: QueueOptions): Promise<string> {
    const validatedData = VideoGenerationJobSchema.parse(data);
    return this.addJob(
      QueueService.QUEUES.VIDEO_GENERATION,
      'video_generation',
      validatedData,
      { priority: 5, ...options }
    );
  }

  /**
   * Add deployment job
   */
  async addDeploymentJob(data: DeploymentJob, options?: QueueOptions): Promise<string> {
    const validatedData = DeploymentJobSchema.parse(data);
    return this.addJob(
      QueueService.QUEUES.DEPLOYMENT,
      'deployment',
      validatedData,
      { priority: 7, ...options }
    );
  }

  /**
   * Get next job from queue
   */
  async getNextJob(queueName: string, timeout: number = 10): Promise<QueueJob | null> {
    // First check priority queue
    let result = await this.redis.lpop(`${queueName}:priority`);
    
    if (!result) {
      // Then check regular queue with blocking
      const blockingResult = await this.redis.blpop(queueName, timeout);
      result = blockingResult?.[1] || null;
    }

    if (!result) {
      return null;
    }

    const job: QueueJob = JSON.parse(result);
    
    // Update job status
    await this.redis.hset(`jobs:${job.id}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
    });

    return job;
  }

  /**
   * Complete a job
   */
  async completeJob(jobId: string, result?: any): Promise<void> {
    await this.redis.hset(`jobs:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: result ? JSON.stringify(result) : '',
    });

    // Set expiration for completed jobs (7 days)
    await this.redis.expire(`jobs:${jobId}`, 7 * 24 * 60 * 60);
  }

  /**
   * Fail a job
   */
  async failJob(jobId: string, error: string, retry: boolean = false): Promise<void> {
    const jobInfo = await this.redis.hgetall(`jobs:${jobId}`);
    const attempts = parseInt(jobInfo.attempts || '0') + 1;

    if (retry && attempts < 3) {
      // Retry with exponential backoff
      const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
      
      await this.redis.hset(`jobs:${jobId}`, {
        status: 'pending',
        attempts: attempts.toString(),
        lastError: error,
        retryAt: new Date(Date.now() + delay).toISOString(),
      });

      // Re-queue with delay
      const queueName = jobInfo.queueName;
      const data = JSON.parse(jobInfo.data);
      await this.addJob(queueName, 'retry', data, { delay });
    } else {
      await this.redis.hset(`jobs:${jobId}`, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        attempts: attempts.toString(),
        error,
      });
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const jobInfo = await this.redis.hgetall(`jobs:${jobId}`);
    if (!jobInfo || Object.keys(jobInfo).length === 0) {
      return null;
    }
    return jobInfo;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    const [
      pendingCount,
      priorityCount,
      delayedCount,
    ] = await Promise.all([
      this.redis.llen(queueName),
      this.redis.llen(`${queueName}:priority`),
      this.redis.zcard(`${queueName}:delayed`),
    ]);

    return {
      pending: pendingCount,
      priority: priorityCount,
      delayed: delayedCount,
      total: pendingCount + priorityCount + delayedCount,
    };
  }

  /**
   * Process delayed jobs (to be called periodically)
   */
  async processDelayedJobs(): Promise<void> {
    const now = Date.now();
    
    for (const queueName of Object.values(QueueService.QUEUES)) {
      const delayedQueueName = `${queueName}:delayed`;
      
      // Get jobs that are ready to be processed
      const readyJobs = await this.redis.zrangebyscore(
        delayedQueueName,
        '-inf',
        now,
        'WITHSCORES'
      );

      for (let i = 0; i < readyJobs.length; i += 2) {
        const jobData = readyJobs[i];
        const score = readyJobs[i + 1];

        // Move job to regular queue
        await this.redis.rpush(queueName, jobData);
        await this.redis.zrem(delayedQueueName, jobData);
      }
    }
  }

  /**
   * Clean up expired jobs
   */
  async cleanupExpiredJobs(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;
    
    // This would need to be implemented based on your specific cleanup needs
    // For now, Redis TTL handles most cleanup automatically
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

import Fastify, { FastifyRequest } from 'fastify';
import { z } from 'zod';
import process from 'node:process';
import crypto from 'node:crypto';
import { db, repositories, generatedSites, repositoryFiles, users } from './db';
import { GitHubService, RepoMetadata } from './services/github';
import { QueueService } from './services/queue';
import { eq, and } from 'drizzle-orm';

// Environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Initialize services
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

const githubService = new GitHubService(GITHUB_TOKEN);
const queueService = new QueueService(REDIS_URL);

// Request schemas
const ProcessRepoSchema = z.object({
  repoUrl: z.string().url(),
  userId: z.string().uuid().optional(),
  options: z.object({
    forceReanalysis: z.boolean().default(false),
    templatePreference: z.string().optional(),
    customBranding: z.any().optional(),
  }).optional(),
});

const WebhookSchema = z.object({
  action: z.string(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    html_url: z.string(),
    default_branch: z.string(),
  }),
  sender: z.object({
    login: z.string(),
    id: z.number(),
  }),
});

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://project4site.com', 'https://4site.pro'] 
    : true,
});

fastify.register(require('@fastify/helmet'));

// Health check
fastify.get('/health', async (request, reply) => {
  try {
    // Check database connection
    await db.select().from(users).limit(1);
    
    // Check Redis connection
    await queueService.getQueueStats(QueueService.QUEUES.REPO_ANALYSIS);
    
    return { 
      status: 'ok', 
      service: 'github-app-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  } catch (error) {
    fastify.log.error(error, 'Health check failed');
    return reply.status(503).send({ 
      status: 'error', 
      service: 'github-app-service',
      error: 'Service unavailable',
    });
  }
});

// Repository processing endpoint
fastify.post('/api/process-repo', async (request, reply) => {
  try {
    const validatedBody = ProcessRepoSchema.safeParse(request.body);
    if (!validatedBody.success) {
      return reply.status(400).send({ 
        error: 'Invalid request body', 
        details: validatedBody.error.flatten() 
      });
    }

    const { repoUrl, userId, options } = validatedBody.data;
    
    fastify.log.info({ repoUrl, userId }, 'Processing repository request');

    // Parse GitHub URL
    const repoInfo = githubService.parseGitHubUrl(repoUrl);
    
    // Check if repository is accessible
    const isAccessible = await githubService.isRepositoryAccessible(repoInfo.owner, repoInfo.repo);
    if (!isAccessible) {
      return reply.status(404).send({ 
        error: 'Repository not found or is private' 
      });
    }

    // Get repository metadata
    const repoMetadata = await githubService.getRepositoryMetadata(repoInfo.owner, repoInfo.repo);
    
    // Create or find user (simplified for now)
    let userRecord;
    if (userId) {
      userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRecord.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
    } else {
      // Create anonymous user for demo purposes
      const anonymousUser = await db.insert(users).values({
        githubUsername: repoInfo.owner,
        githubId: repoMetadata.id,
        fullName: repoInfo.owner,
        subscriptionTier: 'free',
      }).returning({ id: users.id });
      userRecord = anonymousUser;
    }

    const finalUserId = userRecord[0].id;

    // Check if repository already exists
    let repositoryRecord = await db.select()
      .from(repositories)
      .where(and(
        eq(repositories.userId, finalUserId),
        eq(repositories.githubRepoUrl, repoUrl)
      ))
      .limit(1);

    let repositoryId: string;

    if (repositoryRecord.length === 0 || options?.forceReanalysis) {
      // Create new repository record or update existing
      if (repositoryRecord.length === 0) {
        const newRepo = await db.insert(repositories).values({
          userId: finalUserId,
          githubRepoUrl: repoUrl,
          githubRepoId: repoMetadata.id,
          repositoryName: repoMetadata.name,
          repositoryDescription: repoMetadata.description,
          branchName: repoInfo.branch || repoMetadata.defaultBranch,
          isPrivate: repoMetadata.isPrivate,
          repositoryTopics: repoMetadata.topics,
          primaryLanguage: repoMetadata.language,
          languages: repoMetadata.languages,
          starsCount: repoMetadata.starsCount,
          forksCount: repoMetadata.forksCount,
          watchersCount: repoMetadata.watchersCount,
          sizeKb: repoMetadata.sizeKb,
        }).returning({ id: repositories.id });
        
        repositoryId = newRepo[0].id;
      } else {
        repositoryId = repositoryRecord[0].id;
        
        // Update repository metadata
        await db.update(repositories)
          .set({
            repositoryDescription: repoMetadata.description,
            repositoryTopics: repoMetadata.topics,
            primaryLanguage: repoMetadata.language,
            languages: repoMetadata.languages,
            starsCount: repoMetadata.starsCount,
            forksCount: repoMetadata.forksCount,
            watchersCount: repoMetadata.watchersCount,
            sizeKb: repoMetadata.sizeKb,
            updatedAt: new Date(),
          })
          .where(eq(repositories.id, repositoryId));
      }

      // Fetch important files
      fastify.log.info({ repositoryId }, 'Fetching repository files');
      
      const importantFiles = await githubService.getImportantFiles(
        repoInfo.owner, 
        repoInfo.repo, 
        repoInfo.branch || repoMetadata.defaultBranch
      );

      // Store files in database
      for (const file of importantFiles) {
        const contentHash = crypto.createHash('sha256').update(file.content).digest('hex');
        const fileType = getFileType(file.path);
        
        await db.insert(repositoryFiles).values({
          repositoryId,
          filePath: file.path,
          fileType,
          contentHash,
          content: file.content,
          contentSize: file.size,
          lastModifiedAt: new Date(),
        }).onConflictDoUpdate({
          target: [repositoryFiles.repositoryId, repositoryFiles.filePath],
          set: {
            contentHash,
            content: file.content,
            contentSize: file.size,
            lastModifiedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } else {
      repositoryId = repositoryRecord[0].id;
    }

    // Create generated site record
    const siteRecord = await db.insert(generatedSites).values({
      repositoryId,
      userId: finalUserId,
      siteName: repoMetadata.name,
      siteDescription: repoMetadata.description || `Generated site for ${repoMetadata.name}`,
      templateUsed: options?.templatePreference || 'auto',
      status: 'generating',
    }).returning({ id: generatedSites.id });

    const siteId = siteRecord[0].id;

    // Enqueue analysis job
    const jobId = await queueService.addRepoAnalysisJob({
      projectId: siteId,
      repositoryId,
      repoUrl,
      userId: finalUserId,
      requestedAt: new Date().toISOString(),
      options: {
        forceReanalysis: options?.forceReanalysis || false,
        includeFiles: ['README.md', 'package.json', 'PLANNING.md', 'TASKS.md'],
        analysisDepth: 'full',
      },
    });

    fastify.log.info({ 
      siteId, 
      repositoryId, 
      jobId 
    }, 'Repository processing initiated');

    return reply.status(202).send({
      message: 'Repository analysis queued',
      siteId,
      repositoryId,
      jobId,
      repoMetadata: {
        name: repoMetadata.name,
        description: repoMetadata.description,
        language: repoMetadata.language,
        topics: repoMetadata.topics,
        stars: repoMetadata.starsCount,
      },
    });

  } catch (error: any) {
    fastify.log.error(error, 'Error in /api/process-repo');
    return reply.status(500).send({ 
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GitHub webhook endpoint
fastify.post('/api/webhook/github', async (request: FastifyRequest, reply) => {
  try {
    if (!GITHUB_WEBHOOK_SECRET) {
      return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const signature = request.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(request.body);
    
    if (!signature || !GitHubService.validateWebhookSignature(payload, signature, GITHUB_WEBHOOK_SECRET)) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    const validatedBody = WebhookSchema.safeParse(request.body);
    if (!validatedBody.success) {
      return reply.status(400).send({ error: 'Invalid webhook payload' });
    }

    const { action, repository: repo, sender } = validatedBody.data;
    
    fastify.log.info({ 
      action, 
      repo: repo.full_name, 
      sender: sender.login 
    }, 'GitHub webhook received');

    // Handle push events to trigger re-analysis
    if (action === 'push' || action === 'synchronize') {
      // Find repositories that match this GitHub repo
      const affectedRepos = await db.select()
        .from(repositories)
        .where(eq(repositories.githubRepoId, repo.id));

      for (const repoRecord of affectedRepos) {
        if (repoRecord.autoSyncEnabled) {
          // Trigger re-analysis
          const siteRecord = await db.insert(generatedSites).values({
            repositoryId: repoRecord.id,
            userId: repoRecord.userId,
            siteName: repo.name,
            siteDescription: `Updated site for ${repo.name}`,
            templateUsed: 'auto',
            status: 'generating',
          }).returning({ id: generatedSites.id });

          await queueService.addRepoAnalysisJob({
            projectId: siteRecord[0].id,
            repositoryId: repoRecord.id,
            repoUrl: repo.html_url,
            userId: repoRecord.userId,
            requestedAt: new Date().toISOString(),
            options: {
              forceReanalysis: true,
              analysisDepth: 'full',
            },
          });

          fastify.log.info({ 
            repositoryId: repoRecord.id, 
            siteId: siteRecord[0].id 
          }, 'Auto-sync triggered for repository');
        }
      }
    }

    return reply.status(200).send({ message: 'Webhook processed' });

  } catch (error: any) {
    fastify.log.error(error, 'Error processing GitHub webhook');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Get site status endpoint
fastify.get('/api/site/:siteId/status', async (request, reply) => {
  try {
    const { siteId } = request.params as { siteId: string };
    
    const siteRecord = await db.select()
      .from(generatedSites)
      .where(eq(generatedSites.id, siteId))
      .limit(1);

    if (siteRecord.length === 0) {
      return reply.status(404).send({ error: 'Site not found' });
    }

    const site = siteRecord[0];
    
    // Get queue job status if still processing
    let jobStatus = null;
    if (site.status === 'generating') {
      // This would need to be enhanced to track job IDs
      const queueStats = await queueService.getQueueStats(QueueService.QUEUES.REPO_ANALYSIS);
      jobStatus = queueStats;
    }

    return {
      siteId: site.id,
      status: site.status,
      siteName: site.siteName,
      siteDescription: site.siteDescription,
      deploymentUrl: site.deploymentUrl,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
      jobStatus,
    };

  } catch (error: any) {
    fastify.log.error(error, 'Error getting site status');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Get queue statistics endpoint
fastify.get('/api/admin/queue-stats', async (request, reply) => {
  try {
    const stats = {};
    
    for (const [queueName, queueKey] of Object.entries(QueueService.QUEUES)) {
      stats[queueName] = await queueService.getQueueStats(queueKey);
    }

    return {
      queues: stats,
      timestamp: new Date().toISOString(),
    };

  } catch (error: any) {
    fastify.log.error(error, 'Error getting queue statistics');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    await queueService.close();
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Helper function to determine file type
function getFileType(filePath: string): string {
  const filename = filePath.toLowerCase();
  
  if (filename.includes('readme')) return 'readme';
  if (filename.includes('planning')) return 'planning';
  if (filename.includes('task')) return 'tasks';
  if (filename.includes('package.json') || filename.includes('composer.json') || 
      filename.includes('requirements.txt') || filename.includes('cargo.toml')) return 'config';
  
  return 'other';
}

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`GitHub App Service listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
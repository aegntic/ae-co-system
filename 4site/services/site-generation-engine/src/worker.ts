import Redis from 'ioredis';
import { z } from 'zod';
import { db } from './lib/db';
import { generatedSites } from './db/schema';
import { eq } from 'drizzle-orm';
import { SiteGenerator } from './lib/site-generator';
import { StaticBundler } from './lib/static-bundler';
import { AssetOptimizer } from './lib/asset-optimizer';
import { QueueManager } from './lib/queue-manager';

// Environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './generated-sites';

// Job schema
const SiteGenerationJobSchema = z.object({
  siteId: z.string().uuid(),
  templateType: z.string(),
  analysisResult: z.object({
    project_type: z.string(),
    complexity_score: z.number(),
    recommended_template: z.string(),
    key_features: z.array(z.string()),
    tech_stack: z.array(z.string()),
    partner_recommendations: z.array(z.any()),
    content_sections: z.array(z.any()),
    seo_keywords: z.array(z.string()),
  }),
  requestedAt: z.string(),
  options: z.object({
    customTheme: z.any().optional(),
    includeDemo: z.boolean().default(true),
    enableVideo: z.boolean().default(true),
    enableSlideshow: z.boolean().default(true),
  }).optional(),
});

type SiteGenerationJob = z.infer<typeof SiteGenerationJobSchema>;

class SiteGenerationWorker {
  private redis: Redis;
  private queueManager: QueueManager;
  private siteGenerator: SiteGenerator;
  private staticBundler: StaticBundler;
  private assetOptimizer: AssetOptimizer;
  private isShuttingDown = false;

  constructor() {
    this.redis = new Redis(REDIS_URL);
    this.queueManager = new QueueManager(this.redis);
    this.siteGenerator = new SiteGenerator();
    this.staticBundler = new StaticBundler();
    this.assetOptimizer = new AssetOptimizer();

    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async start(): Promise<void> {
    console.log(`Starting Site Generation Worker with ${WORKER_CONCURRENCY} concurrent jobs`);
    
    // Start multiple worker processes
    const workers = [];
    for (let i = 0; i < WORKER_CONCURRENCY; i++) {
      workers.push(this.workerLoop(i));
    }

    // Wait for all workers to complete
    await Promise.all(workers);
  }

  private async workerLoop(workerId: number): Promise<void> {
    console.log(`Worker ${workerId} started`);

    while (!this.isShuttingDown) {
      try {
        const job = await this.queueManager.getNextJob('site_generation_queue', 30);
        
        if (job) {
          console.log(`Worker ${workerId} processing job: ${job.id}`);
          await this.processJob(job, workerId);
        }
      } catch (error) {
        console.error(`Worker ${workerId} error:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
    }

    console.log(`Worker ${workerId} stopped`);
  }

  private async processJob(job: any, workerId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate job data
      const validatedJob = SiteGenerationJobSchema.parse(job.data);
      
      // Update site status
      await this.updateSiteStatus(validatedJob.siteId, 'generating', {
        workerId,
        startedAt: new Date().toISOString(),
      });

      // Generate the site
      const siteData = await this.generateSite(validatedJob);
      
      // Bundle static assets
      const bundlePath = await this.bundleStaticSite(validatedJob.siteId, siteData);
      
      // Optimize assets
      await this.optimizeAssets(bundlePath);
      
      // Update site with completion data
      await this.updateSiteStatus(validatedJob.siteId, 'completed', {
        bundlePath,
        completedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      });

      // Queue deployment job
      await this.queueDeploymentJob(validatedJob.siteId, bundlePath, validatedJob.analysisResult);

      console.log(`Job ${job.id} completed in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      await this.updateSiteStatus(job.data.siteId, 'failed', {
        error: error.message,
        failedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      });
      
      throw error;
    }
  }

  private async generateSite(job: SiteGenerationJob): Promise<any> {
    const { siteId, templateType, analysisResult, options } = job;
    
    // Get site data from database
    const siteRecord = await db.select()
      .from(generatedSites)
      .where(eq(generatedSites.id, siteId))
      .limit(1);

    if (siteRecord.length === 0) {
      throw new Error(`Site not found: ${siteId}`);
    }

    const site = siteRecord[0];
    
    // Generate site using the selected template
    const siteData = await this.siteGenerator.generateSite({
      siteId,
      siteName: site.siteName,
      siteDescription: site.siteDescription,
      templateType: templateType || analysisResult.recommended_template,
      analysisResult,
      customizations: options?.customTheme || {},
      features: {
        includeDemo: options?.includeDemo ?? true,
        enableVideo: options?.enableVideo ?? true,
        enableSlideshow: options?.enableSlideshow ?? true,
      },
    });

    return siteData;
  }

  private async bundleStaticSite(siteId: string, siteData: any): Promise<string> {
    const outputPath = `${OUTPUT_DIR}/${siteId}`;
    
    // Bundle the site into static files
    const bundlePath = await this.staticBundler.bundle({
      siteData,
      outputPath,
      optimizeForProduction: true,
      generateSitemap: true,
      generateRobotsTxt: true,
    });

    return bundlePath;
  }

  private async optimizeAssets(bundlePath: string): Promise<void> {
    // Optimize images, minify CSS/JS, compress files
    await this.assetOptimizer.optimize({
      bundlePath,
      optimizeImages: true,
      minifyCSS: true,
      minifyJS: true,
      generateWebP: true,
      compressFiles: true,
    });
  }

  private async updateSiteStatus(siteId: string, status: string, metadata: any): Promise<void> {
    await db.update(generatedSites)
      .set({
        status,
        themeConfig: metadata,
        updatedAt: new Date(),
        ...(status === 'completed' && {
          generationCompletedAt: new Date(),
          generationTimeMs: metadata.processingTimeMs,
        }),
      })
      .where(eq(generatedSites.id, siteId));
  }

  private async queueDeploymentJob(siteId: string, bundlePath: string, analysisResult: any): Promise<void> {
    const deploymentJob = {
      siteId,
      bundlePath,
      deploymentTarget: this.selectDeploymentTarget(analysisResult),
      customDomain: null, // Can be configured later
      requestedAt: new Date().toISOString(),
    };

    await this.queueManager.addJob('deployment_queue', 'deployment', deploymentJob);
  }

  private selectDeploymentTarget(analysisResult: any): string {
    // Simple logic for deployment target selection
    if (analysisResult.project_type === 'web-application') {
      return 'vercel';
    } else if (analysisResult.complexity_score > 0.7) {
      return 'cloudflare';
    } else {
      return 'netlify';
    }
  }

  private async shutdown(): Promise<void> {
    console.log('Shutting down Site Generation Worker...');
    this.isShuttingDown = true;
    
    try {
      await this.redis.quit();
      console.log('Worker shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    
    process.exit(0);
  }
}

// Start the worker
const worker = new SiteGenerationWorker();
worker.start().catch(console.error);
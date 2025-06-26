/**
 * Main deployment service orchestrating CDN deployments
 * Handles provider selection, SSL setup, and deployment monitoring
 */

import { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { CDNManager, DeploymentConfig, DeploymentResult } from './cdn';
import fs from 'fs/promises';
import path from 'path';

export interface DeploymentServiceConfig {
  defaultProvider: 'vercel' | 'netlify' | 'cloudflare';
  enableCustomDomains: boolean;
  enableSSL: boolean;
  maxDeploymentTime: number; // in milliseconds
}

export class DeploymentService {
  private db: any; // DrizzleD1Database but using any for compatibility
  private cdnManager: CDNManager;
  private config: DeploymentServiceConfig;

  constructor(
    db: any,
    cdnManager: CDNManager,
    config: Partial<DeploymentServiceConfig> = {}
  ) {
    this.db = db;
    this.cdnManager = cdnManager;
    this.config = {
      defaultProvider: 'vercel',
      enableCustomDomains: true,
      enableSSL: true,
      maxDeploymentTime: 10 * 60 * 1000, // 10 minutes
      ...config,
    };
  }

  /**
   * Deploy site to specified provider
   */
  async deployToProvider(
    provider: 'vercel' | 'netlify' | 'cloudflare',
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    
    try {
      // Log deployment start
      const deploymentLog = await this.createDeploymentLog(
        config.siteId,
        provider,
        'started'
      );

      // Validate bundle exists
      await this.validateBundle(config.bundlePath);

      // Deploy to selected provider
      let result: DeploymentResult;
      
      switch (provider) {
        case 'vercel':
          result = await this.cdnManager.deployToVercel(config);
          break;
        case 'netlify':
          result = await this.cdnManager.deployToNetlify(config);
          break;
        case 'cloudflare':
          result = await this.cdnManager.deployToCloudflare(config);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Update deployment log
      await this.updateDeploymentLog(
        deploymentLog.id,
        result.success ? 'completed' : 'failed',
        {
          duration: Date.now() - startTime,
          deployedUrl: result.deployedUrl,
          deploymentId: result.deploymentId,
          error: result.error,
        }
      );

      // Setup custom domain if requested and successful
      if (result.success && config.customDomain) {
        await this.setupCustomDomain(
          config.siteId,
          provider,
          config.customDomain,
          result.deploymentId!
        );
      }

      return result;
    } catch (error) {
      // Log deployment failure
      await this.updateDeploymentLog(
        '', // We might not have a log ID if validation failed
        'failed',
        {
          duration: Date.now() - startTime,
          error: (error as Error).message,
        }
      );

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Auto-select best provider based on site requirements and provider health
   */
  async deployWithAutoSelection(config: DeploymentConfig): Promise<DeploymentResult> {
    // Check provider health
    const healthStatus = await this.cdnManager.healthCheck();
    
    // Get site requirements
    const siteInfo = await this.getSiteInfo(config.siteId);
    
    // Select best provider based on requirements and health
    const provider = this.selectOptimalProvider(siteInfo, healthStatus);
    
    return this.deployToProvider(provider, config);
  }

  /**
   * Get deployment status and history
   */
  async getDeploymentStatus(siteId: string): Promise<{
    currentDeployment?: {
      status: string;
      deployedUrl?: string;
      provider?: string;
      lastDeployedAt?: Date;
    };
    deploymentHistory: any[];
  }> {
    // Get current site status
    const site = await this.db.select()
      .from(schema.generatedSites)
      .where(eq(schema.generatedSites.id, siteId))
      .limit(1);

    // Get deployment history
    const history = await this.db.select()
      .from(schema.deploymentLogs)
      .where(eq(schema.deploymentLogs.siteId, siteId))
      .orderBy(schema.deploymentLogs.startedAt, 'desc')
      .limit(10);

    return {
      currentDeployment: site[0] ? {
        status: site[0].status,
        deployedUrl: site[0].deployedUrl,
        provider: site[0].deploymentProvider,
        lastDeployedAt: site[0].lastDeployedAt,
      } : undefined,
      deploymentHistory: history,
    };
  }

  /**
   * Rollback to previous deployment
   */
  async rollbackDeployment(siteId: string, targetDeploymentId: string): Promise<DeploymentResult> {
    // Get target deployment info
    const targetLog = await this.db.select()
      .from(schema.deploymentLogs)
      .where(eq(schema.deploymentLogs.deploymentId, targetDeploymentId))
      .limit(1);

    if (!targetLog.length) {
      return {
        success: false,
        error: 'Target deployment not found',
      };
    }

    const log = targetLog[0];
    
    // For now, this is a placeholder - real rollback would depend on provider APIs
    // Most CDN providers don't support direct rollbacks, so we'd need to redeploy
    
    return {
      success: false,
      error: 'Rollback not yet implemented - redeploy from previous version instead',
    };
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(siteId: string): Promise<DeploymentResult> {
    const site = await this.db.select()
      .from(schema.generatedSites)
      .where(eq(schema.generatedSites.id, siteId))
      .limit(1);

    if (!site.length) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // TODO: Implement actual deletion via provider APIs
    // For now, just mark as deleted in database
    
    await this.db.update(schema.generatedSites)
      .set({
        status: 'deleted',
        deployedUrl: null,
        deploymentId: null,
      })
      .where(eq(schema.generatedSites.id, siteId));

    return {
      success: true,
      metadata: {
        action: 'marked_deleted',
      },
    };
  }

  /**
   * Private helper methods
   */

  private async validateBundle(bundlePath: string): Promise<void> {
    try {
      const stats = await fs.stat(bundlePath);
      if (!stats.isDirectory()) {
        throw new Error('Bundle path is not a directory');
      }

      // Check for required files
      const indexPath = path.join(bundlePath, 'index.html');
      await fs.access(indexPath);
    } catch (error) {
      throw new Error(`Invalid bundle: ${(error as Error).message}`);
    }
  }

  private async createDeploymentLog(
    siteId: string,
    provider: string,
    status: string
  ): Promise<any> {
    const log = await this.db.insert(schema.deploymentLogs)
      .values({
        siteId,
        provider,
        status,
        startedAt: new Date(),
        metadata: {},
      })
      .returning();

    return log[0];
  }

  private async updateDeploymentLog(
    logId: string,
    status: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!logId) return; // Skip if no log ID

    await this.db.update(schema.deploymentLogs)
      .set({
        status,
        completedAt: new Date(),
        metadata,
        errorMessage: metadata.error || null,
      })
      .where(eq(schema.deploymentLogs.id, logId));
  }

  private async getSiteInfo(siteId: string): Promise<any> {
    const site = await this.db.select()
      .from(schema.generatedSites)
      .where(eq(schema.generatedSites.id, siteId))
      .limit(1);

    return site[0] || null;
  }

  private selectOptimalProvider(
    siteInfo: any,
    healthStatus: { vercel: boolean; netlify: boolean; cloudflare: boolean }
  ): 'vercel' | 'netlify' | 'cloudflare' {
    // Priority order based on health and features
    const providers: Array<'vercel' | 'netlify' | 'cloudflare'> = [
      'vercel',
      'netlify', 
      'cloudflare'
    ];

    // Filter to only healthy providers
    const healthyProviders = providers.filter(p => healthStatus[p]);

    if (healthyProviders.length === 0) {
      // Fallback to default if all are unhealthy
      return this.config.defaultProvider;
    }

    // For now, just return the first healthy provider
    // In the future, we could add more sophisticated selection logic
    // based on site requirements, geographic location, etc.
    return healthyProviders[0];
  }

  private async setupCustomDomain(
    siteId: string,
    provider: string,
    domain: string,
    deploymentId: string
  ): Promise<void> {
    // Custom domain setup is provider-specific and complex
    // This is a placeholder for future implementation
    
    // Update site record with custom domain info
    await this.db.update(schema.generatedSites)
      .set({
        customDomain: domain,
        themeConfig: {
          customDomain: {
            domain,
            provider,
            configuredAt: new Date(),
            sslEnabled: this.config.enableSSL,
          },
        },
      })
      .where(eq(schema.generatedSites.id, siteId));
  }
}
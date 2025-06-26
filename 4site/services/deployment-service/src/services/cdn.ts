/**
 * CDN Manager for multi-provider deployments
 * Supports Vercel, Netlify, and Cloudflare Pages
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import archiver from 'archiver';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { z } from 'zod';

// Deployment configuration schema
const DeploymentConfigSchema = z.object({
  siteId: z.string(),
  projectId: z.string(),
  bundlePath: z.string(),
  customDomain: z.string().optional(),
  envVars: z.record(z.string()).default({}),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().default('dist'),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export interface DeploymentResult {
  success: boolean;
  deployedUrl?: string;
  deploymentId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class CDNManager {
  private vercelToken: string;
  private netlifyToken: string;
  private cloudflareToken: string;
  private cloudflareAccountId: string;

  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN || '';
    this.netlifyToken = process.env.NETLIFY_TOKEN || '';
    this.cloudflareToken = process.env.CLOUDFLARE_TOKEN || '';
    this.cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      if (!this.vercelToken) {
        throw new Error('Vercel token not configured');
      }

      // Create deployment archive
      const archivePath = await this.createDeploymentArchive(config.bundlePath, config.siteId);
      
      // Upload to Vercel
      const deployment = await this.uploadToVercel(
        archivePath,
        config.projectId,
        config.envVars
      );

      // Clean up temporary archive
      await fs.unlink(archivePath);

      if (deployment.url) {
        return {
          success: true,
          deployedUrl: `https://${deployment.url}`,
          deploymentId: deployment.id,
          metadata: {
            provider: 'vercel',
            alias: deployment.alias,
            regions: deployment.regions,
          },
        };
      } else {
        throw new Error('Deployment failed - no URL returned');
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      if (!this.netlifyToken) {
        throw new Error('Netlify token not configured');
      }

      // Create site if it doesn't exist
      const site = await this.createNetlifySite(config.projectId, config.customDomain);
      
      // Deploy to Netlify
      const deployment = await this.uploadToNetlify(
        site.id,
        config.bundlePath,
        config.envVars
      );

      return {
        success: true,
        deployedUrl: deployment.ssl_url || deployment.url,
        deploymentId: deployment.id,
        metadata: {
          provider: 'netlify',
          siteId: site.id,
          siteName: site.name,
          branch: 'main',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Deploy to Cloudflare Pages
   */
  async deployToCloudflare(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      if (!this.cloudflareToken || !this.cloudflareAccountId) {
        throw new Error('Cloudflare credentials not configured');
      }

      // Create project if it doesn't exist
      const project = await this.createCloudflareProject(config.projectId);
      
      // Deploy to Cloudflare Pages
      const deployment = await this.uploadToCloudflare(
        project.name,
        config.bundlePath,
        config.envVars
      );

      return {
        success: true,
        deployedUrl: deployment.url,
        deploymentId: deployment.id,
        metadata: {
          provider: 'cloudflare',
          projectName: project.name,
          environment: 'production',
          subdomain: deployment.subdomain,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create deployment archive
   */
  private async createDeploymentArchive(bundlePath: string, siteId: string): Promise<string> {
    const archivePath = `/tmp/deployment_${siteId}_${Date.now()}.tar.gz`;
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath);
      const archive = archiver('tar', { gzip: true });

      output.on('close', () => resolve(archivePath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(bundlePath, false);
      archive.finalize();
    });
  }

  /**
   * Upload to Vercel
   */
  private async uploadToVercel(
    archivePath: string,
    projectName: string,
    envVars: Record<string, string>
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', createReadStream(archivePath));
    
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel deployment failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Create Netlify site
   */
  private async createNetlifySite(projectName: string, customDomain?: string): Promise<any> {
    const siteConfig = {
      name: `project4site-${projectName}`,
      custom_domain: customDomain,
      processing_settings: {
        html: {
          pretty_urls: true,
        },
      },
    };

    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(siteConfig),
    });

    if (!response.ok) {
      // Site might already exist, try to get it
      const existingResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteConfig.name}`,
        {
          headers: {
            'Authorization': `Bearer ${this.netlifyToken}`,
          },
        }
      );

      if (existingResponse.ok) {
        return existingResponse.json();
      }

      const error = await response.text();
      throw new Error(`Netlify site creation failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Upload to Netlify
   */
  private async uploadToNetlify(
    siteId: string,
    bundlePath: string,
    envVars: Record<string, string>
  ): Promise<any> {
    // Create deployment archive
    const archivePath = await this.createDeploymentArchive(bundlePath, siteId);
    
    try {
      const formData = new FormData();
      formData.append('file', createReadStream(archivePath));

      const response = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.netlifyToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Netlify deployment failed: ${error}`);
      }

      return response.json();
    } finally {
      // Clean up temporary archive
      await fs.unlink(archivePath);
    }
  }

  /**
   * Create Cloudflare Pages project
   */
  private async createCloudflareProject(projectName: string): Promise<any> {
    const projectConfig = {
      name: `project4site-${projectName}`,
      production_branch: 'main',
      compatibility_date: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/pages/projects`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cloudflareToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectConfig),
      }
    );

    if (!response.ok) {
      // Project might already exist
      const existingResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/pages/projects/${projectConfig.name}`,
        {
          headers: {
            'Authorization': `Bearer ${this.cloudflareToken}`,
          },
        }
      );

      if (existingResponse.ok) {
        const result = await existingResponse.json();
        return result.result;
      }

      const error = await response.text();
      throw new Error(`Cloudflare project creation failed: ${error}`);
    }

    const result = await response.json();
    return result.result;
  }

  /**
   * Upload to Cloudflare Pages
   */
  private async uploadToCloudflare(
    projectName: string,
    bundlePath: string,
    envVars: Record<string, string>
  ): Promise<any> {
    // Create deployment archive
    const archivePath = await this.createDeploymentArchive(bundlePath, projectName);
    
    try {
      const formData = new FormData();
      formData.append('file', createReadStream(archivePath));

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/pages/projects/${projectName}/deployments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.cloudflareToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare deployment failed: ${error}`);
      }

      const result = await response.json();
      return result.result;
    } finally {
      // Clean up temporary archive
      await fs.unlink(archivePath);
    }
  }

  /**
   * Health check for CDN providers
   */
  async healthCheck(): Promise<{
    vercel: boolean;
    netlify: boolean;
    cloudflare: boolean;
  }> {
    const checks = await Promise.allSettled([
      this.checkVercelHealth(),
      this.checkNetlifyHealth(),
      this.checkCloudflareHealth(),
    ]);

    return {
      vercel: checks[0].status === 'fulfilled' && checks[0].value,
      netlify: checks[1].status === 'fulfilled' && checks[1].value,
      cloudflare: checks[2].status === 'fulfilled' && checks[2].value,
    };
  }

  private async checkVercelHealth(): Promise<boolean> {
    if (!this.vercelToken) return false;
    
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: { 'Authorization': `Bearer ${this.vercelToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkNetlifyHealth(): Promise<boolean> {
    if (!this.netlifyToken) return false;
    
    try {
      const response = await fetch('https://api.netlify.com/api/v1/user', {
        headers: { 'Authorization': `Bearer ${this.netlifyToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkCloudflareHealth(): Promise<boolean> {
    if (!this.cloudflareToken || !this.cloudflareAccountId) return false;
    
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}`,
        {
          headers: { 'Authorization': `Bearer ${this.cloudflareToken}` },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
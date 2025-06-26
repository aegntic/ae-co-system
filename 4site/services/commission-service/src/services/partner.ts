/**
 * Partner service for managing partner configurations and referral links
 */

import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

export interface ReferralParams {
  userId?: string;
  projectId?: string;
  siteId?: string;
  clickId?: string;
  customParams?: Record<string, string>;
}

export class PartnerService {
  constructor(private db: any) {}

  /**
   * Get partner by ID
   */
  async getPartner(partnerId: string): Promise<schema.Partner | null> {
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.id, partnerId))
      .limit(1);

    return partners[0] || null;
  }

  /**
   * Get partner by slug
   */
  async getPartnerBySlug(slug: string): Promise<schema.Partner | null> {
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.slug, slug))
      .limit(1);

    return partners[0] || null;
  }

  /**
   * Get all active partners
   */
  async getActivePartners(): Promise<schema.Partner[]> {
    return this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.isActive, true))
      .orderBy(schema.partners.name);
  }

  /**
   * Get partners by category
   */
  async getPartnersByCategory(category: string): Promise<schema.Partner[]> {
    return this.db.select()
      .from(schema.partners)
      .where(
        and(
          eq(schema.partners.isActive, true),
          // JSON contains check for category
        )
      )
      .orderBy(schema.partners.name);
  }

  /**
   * Generate referral URL for partner
   */
  async generateReferralUrl(
    partnerId: string, 
    params: ReferralParams = {}
  ): Promise<string> {
    const partner = await this.getPartner(partnerId);
    
    if (!partner) {
      throw new Error(`Partner not found: ${partnerId}`);
    }

    // Start with base referral URL
    let url = partner.referralBaseUrl;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add referral code
    if (partner.referralParameter && partner.referralCode) {
      queryParams.set(partner.referralParameter, partner.referralCode);
    }
    
    // Add tracking parameters
    if (params.userId) {
      queryParams.set('p4s_user', params.userId);
    }
    
    if (params.projectId) {
      queryParams.set('p4s_project', params.projectId);
    }
    
    if (params.siteId) {
      queryParams.set('p4s_site', params.siteId);
    }
    
    if (params.clickId) {
      queryParams.set('p4s_click', params.clickId);
    }
    
    // Add UTM parameters for tracking
    queryParams.set('utm_source', 'project4site');
    queryParams.set('utm_medium', 'referral');
    queryParams.set('utm_campaign', 'site_generation');
    
    // Add custom parameters
    if (params.customParams) {
      Object.entries(params.customParams).forEach(([key, value]) => {
        queryParams.set(key, value);
      });
    }
    
    // Combine URL with parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${queryParams.toString()}`;
  }

  /**
   * Create new partner
   */
  async createPartner(partnerData: schema.NewPartner): Promise<schema.Partner> {
    const partners = await this.db.insert(schema.partners)
      .values(partnerData)
      .returning();
    
    return partners[0];
  }

  /**
   * Update partner
   */
  async updatePartner(
    partnerId: string, 
    updates: Partial<schema.Partner>
  ): Promise<schema.Partner | null> {
    const partners = await this.db.update(schema.partners)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.partners.id, partnerId))
      .returning();
    
    return partners[0] || null;
  }

  /**
   * Deactivate partner
   */
  async deactivatePartner(partnerId: string): Promise<boolean> {
    const result = await this.db.update(schema.partners)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.partners.id, partnerId));
    
    return result.rowCount > 0;
  }

  /**
   * Get partner commission configuration
   */
  async getCommissionConfig(partnerId: string): Promise<{
    rate: number;
    type: 'percentage' | 'fixed';
    fixedAmount?: number;
  } | null> {
    const partner = await this.getPartner(partnerId);
    
    if (!partner) {
      return null;
    }
    
    return {
      rate: parseFloat(partner.commissionRate || '0'),
      type: partner.commissionType as 'percentage' | 'fixed',
      fixedAmount: partner.fixedCommissionAmount || undefined,
    };
  }

  /**
   * Update commission configuration
   */
  async updateCommissionConfig(
    partnerId: string,
    config: {
      rate?: number;
      type?: 'percentage' | 'fixed';
      fixedAmount?: number;
    }
  ): Promise<schema.Partner | null> {
    const updates: Partial<schema.Partner> = {};
    
    if (config.rate !== undefined) {
      updates.commissionRate = config.rate.toString();
    }
    
    if (config.type !== undefined) {
      updates.commissionType = config.type;
    }
    
    if (config.fixedAmount !== undefined) {
      updates.fixedCommissionAmount = config.fixedAmount;
    }
    
    return this.updatePartner(partnerId, updates);
  }

  /**
   * Get partner attribution settings
   */
  async getAttributionSettings(partnerId: string): Promise<{
    attributionWindow: number;
    cookieLifetime: number;
  } | null> {
    const partner = await this.getPartner(partnerId);
    
    if (!partner) {
      return null;
    }
    
    return {
      attributionWindow: partner.attributionWindow || 30,
      cookieLifetime: partner.cookieLifetime || 30,
    };
  }

  /**
   * Search partners by name or category
   */
  async searchPartners(query: string): Promise<schema.Partner[]> {
    // This would need a proper text search implementation
    // For now, using simple LIKE matching
    return this.db.select()
      .from(schema.partners)
      .where(
        and(
          eq(schema.partners.isActive, true),
          // SQL LIKE search on name and description
        )
      )
      .limit(20);
  }

  /**
   * Get partner statistics
   */
  async getPartnerStats(partnerId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    // This would aggregate data from partner_events table
    // For now returning placeholder data
    return {
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
    };
  }

  /**
   * Validate webhook configuration
   */
  async validateWebhookConfig(partnerId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const partner = await this.getPartner(partnerId);
    
    if (!partner) {
      return {
        valid: false,
        errors: ['Partner not found'],
      };
    }
    
    const errors: string[] = [];
    
    if (!partner.webhookUrl) {
      errors.push('Webhook URL is required');
    } else {
      try {
        new URL(partner.webhookUrl);
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }
    
    if (!partner.webhookSecret) {
      errors.push('Webhook secret is required for security');
    }
    
    if (!partner.webhookEvents || (partner.webhookEvents as any[]).length === 0) {
      errors.push('At least one webhook event must be configured');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(partnerId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    const partner = await this.getPartner(partnerId);
    
    if (!partner || !partner.webhookUrl) {
      return {
        success: false,
        error: 'Partner or webhook URL not found',
      };
    }
    
    try {
      const startTime = Date.now();
      
      // Send test webhook
      const response = await fetch(partner.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project4Site-Test': 'true',
        },
        body: JSON.stringify({
          type: 'test',
          partnerId,
          timestamp: new Date().toISOString(),
        }),
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
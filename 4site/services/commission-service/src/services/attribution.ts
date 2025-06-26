/**
 * Attribution service for tracking clicks and conversions
 */

import { Redis } from 'ioredis';
import { eq, and, gte, lte } from 'drizzle-orm';
import { addDays, isAfter, isBefore } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../db/schema';

export interface ClickData {
  partnerId: string;
  userId?: string;
  projectId?: string;
  siteId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  landingPage?: string;
  metadata?: Record<string, any>;
}

export interface ConversionData {
  partnerId: string;
  eventType: 'signup' | 'purchase' | 'subscription' | 'trial_start' | 'trial_conversion' | 'renewal';
  userId?: string;
  referenceId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ConversionResult {
  success: boolean;
  conversionId?: string;
  commissionAmount?: number;
  error?: string;
}

export class AttributionService {
  constructor(
    private db: any,
    private redis: Redis
  ) {}

  /**
   * Track a click and create attribution record
   */
  async trackClick(clickData: ClickData): Promise<schema.Attribution | null> {
    try {
      // Get partner info for attribution window
      const partners = await this.db.select()
        .from(schema.partners)
        .where(eq(schema.partners.id, clickData.partnerId))
        .limit(1);

      const partner = partners[0];
      if (!partner) {
        throw new Error(`Partner not found: ${clickData.partnerId}`);
      }

      // Calculate attribution window
      const attributionStartsAt = new Date();
      const attributionExpiresAt = addDays(attributionStartsAt, partner.attributionWindow || 30);

      // Generate unique click ID
      const clickId = uuidv4();

      // Create attribution record
      const attributionData: schema.NewAttribution = {
        partnerId: clickData.partnerId,
        userId: clickData.userId,
        siteId: clickData.siteId,
        clickId,
        ipAddress: clickData.ipAddress,
        userAgent: clickData.userAgent,
        referrer: clickData.referrer,
        landingPage: clickData.landingPage,
        attributionStartsAt,
        attributionExpiresAt,
        metadata: clickData.metadata || {},
      };

      const attributions = await this.db.insert(schema.attributions)
        .values(attributionData)
        .returning();

      const attribution = attributions[0];

      // Store in Redis for fast lookup during conversion window
      const cacheKey = `attribution:${clickData.partnerId}:${clickData.userId || clickData.ipAddress}`;
      const cacheData = {
        attributionId: attribution.id,
        clickId,
        partnerId: clickData.partnerId,
        expiresAt: attributionExpiresAt.toISOString(),
      };

      // Set with expiration matching attribution window
      const ttlSeconds = Math.floor((attributionExpiresAt.getTime() - Date.now()) / 1000);
      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(cacheData));

      // Also store by click ID for direct lookup
      await this.redis.setex(`click:${clickId}`, ttlSeconds, JSON.stringify(cacheData));

      return attribution;
    } catch (error) {
      console.error('Failed to track click:', error);
      return null;
    }
  }

  /**
   * Track a conversion and calculate commission
   */
  async trackConversion(conversionData: ConversionData): Promise<ConversionResult> {
    try {
      // Find valid attribution within window
      const attribution = await this.findValidAttribution(
        conversionData.partnerId,
        conversionData.userId
      );

      if (!attribution) {
        return {
          success: false,
          error: 'No valid attribution found within window',
        };
      }

      // Get partner commission configuration
      const partner = await this.db.select()
        .from(schema.partners)
        .where(eq(schema.partners.id, conversionData.partnerId))
        .limit(1);

      if (!partner[0]) {
        return {
          success: false,
          error: 'Partner not found',
        };
      }

      // Calculate commission
      const commissionAmount = this.calculateCommission(
        partner[0],
        conversionData.amount || 0
      );

      // Create conversion event
      const eventData: schema.NewPartnerEvent = {
        partnerId: conversionData.partnerId,
        attributionId: attribution.id,
        userId: conversionData.userId,
        siteId: attribution.siteId,
        eventType: conversionData.eventType,
        externalId: conversionData.referenceId,
        amount: conversionData.amount,
        currency: conversionData.currency || 'USD',
        commissionAmount,
        commissionRate: partner[0].commissionRate,
        commissionStatus: 'pending',
        isVerified: false,
        eventData: conversionData.metadata || {},
      };

      const events = await this.db.insert(schema.partnerEvents)
        .values(eventData)
        .returning();

      const event = events[0];

      // Update analytics cache
      await this.updateAnalyticsCache(
        conversionData.partnerId,
        conversionData.eventType,
        conversionData.amount || 0,
        commissionAmount
      );

      return {
        success: true,
        conversionId: event.id,
        commissionAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Find valid attribution for conversion
   */
  private async findValidAttribution(
    partnerId: string,
    userId?: string
  ): Promise<schema.Attribution | null> {
    const now = new Date();

    // Try Redis cache first for performance
    if (userId) {
      const cacheKey = `attribution:${partnerId}:${userId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (new Date(cacheData.expiresAt) > now) {
          // Fetch full attribution data from database
          const attributions = await this.db.select()
            .from(schema.attributions)
            .where(eq(schema.attributions.id, cacheData.attributionId))
            .limit(1);
          
          return attributions[0] || null;
        }
      }
    }

    // Fallback to database query
    const query = this.db.select()
      .from(schema.attributions)
      .where(
        and(
          eq(schema.attributions.partnerId, partnerId),
          gte(schema.attributions.attributionExpiresAt, now)
        )
      )
      .orderBy(schema.attributions.createdAt, 'desc')
      .limit(1);

    if (userId) {
      query.where(eq(schema.attributions.userId, userId));
    }

    const attributions = await query;
    return attributions[0] || null;
  }

  /**
   * Calculate commission based on partner configuration
   */
  private calculateCommission(partner: schema.Partner, amount: number): number {
    if (partner.commissionType === 'fixed') {
      return partner.fixedCommissionAmount || 0;
    }

    // Percentage commission
    const rate = parseFloat(partner.commissionRate || '0') / 100;
    return Math.round(amount * rate);
  }

  /**
   * Get attribution history for user
   */
  async getAttributionHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<schema.Attribution[]> {
    let query = this.db.select()
      .from(schema.attributions)
      .where(eq(schema.attributions.userId, userId))
      .orderBy(schema.attributions.createdAt, 'desc');

    if (startDate) {
      query = query.where(gte(schema.attributions.createdAt, startDate));
    }

    if (endDate) {
      query = query.where(lte(schema.attributions.createdAt, endDate));
    }

    return query.limit(100);
  }

  /**
   * Get conversion events for attribution
   */
  async getConversionEvents(attributionId: string): Promise<schema.PartnerEvent[]> {
    return this.db.select()
      .from(schema.partnerEvents)
      .where(eq(schema.partnerEvents.attributionId, attributionId))
      .orderBy(schema.partnerEvents.createdAt, 'desc');
  }

  /**
   * Update attribution metadata
   */
  async updateAttributionMetadata(
    attributionId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    const result = await this.db.update(schema.attributions)
      .set({
        metadata,
      })
      .where(eq(schema.attributions.id, attributionId));

    return result.rowCount > 0;
  }

  /**
   * Verify conversion event
   */
  async verifyConversion(
    eventId: string,
    verificationData?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.db.update(schema.partnerEvents)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verificationData: verificationData || {},
        commissionStatus: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(schema.partnerEvents.id, eventId));

    return result.rowCount > 0;
  }

  /**
   * Dispute conversion event
   */
  async disputeConversion(
    eventId: string,
    reason: string
  ): Promise<boolean> {
    const result = await this.db.update(schema.partnerEvents)
      .set({
        commissionStatus: 'disputed',
        metadata: {
          disputeReason: reason,
          disputedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.partnerEvents.id, eventId));

    return result.rowCount > 0;
  }

  /**
   * Get attribution statistics
   */
  async getAttributionStats(
    partnerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
    avgOrderValue: number;
  }> {
    // Get click count
    const clickResults = await this.db.select({
      count: 'COUNT(*)',
    })
      .from(schema.attributions)
      .where(
        and(
          eq(schema.attributions.partnerId, partnerId),
          gte(schema.attributions.createdAt, startDate),
          lte(schema.attributions.createdAt, endDate)
        )
      );

    const totalClicks = parseInt(clickResults[0]?.count || '0');

    // Get conversion stats
    const conversionResults = await this.db.select({
      count: 'COUNT(*)',
      totalAmount: 'SUM(amount)',
    })
      .from(schema.partnerEvents)
      .where(
        and(
          eq(schema.partnerEvents.partnerId, partnerId),
          gte(schema.partnerEvents.createdAt, startDate),
          lte(schema.partnerEvents.createdAt, endDate),
          eq(schema.partnerEvents.isVerified, true)
        )
      );

    const totalConversions = parseInt(conversionResults[0]?.count || '0');
    const totalRevenue = parseInt(conversionResults[0]?.totalAmount || '0');

    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    return {
      totalClicks,
      totalConversions,
      totalRevenue,
      conversionRate,
      avgOrderValue,
    };
  }

  /**
   * Update analytics cache for real-time metrics
   */
  private async updateAnalyticsCache(
    partnerId: string,
    eventType: string,
    amount: number,
    commissionAmount: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `analytics:${partnerId}:${today}`;

    try {
      // Get current cache
      const cached = await this.redis.get(cacheKey);
      const analytics = cached ? JSON.parse(cached) : {
        clicks: 0,
        signups: 0,
        purchases: 0,
        revenue: 0,
        commissions: 0,
      };

      // Update metrics
      if (eventType === 'signup') {
        analytics.signups += 1;
      } else if (eventType === 'purchase') {
        analytics.purchases += 1;
        analytics.revenue += amount;
        analytics.commissions += commissionAmount;
      }

      // Cache for 24 hours
      await this.redis.setex(cacheKey, 86400, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to update analytics cache:', error);
    }
  }

  /**
   * Clean up expired attributions
   */
  async cleanupExpiredAttributions(): Promise<number> {
    const now = new Date();
    
    const result = await this.db.delete(schema.attributions)
      .where(lte(schema.attributions.attributionExpiresAt, now));

    return result.rowCount || 0;
  }
}
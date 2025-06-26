/**
 * Webhook service for processing partner webhooks
 */

import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

export interface WebhookProcessResult {
  success: boolean;
  eventId?: string;
  commissionCalculated?: boolean;
  error?: string;
}

export class WebhookService {
  constructor(
    private db: any,
    private webhookSecret: string
  ) {}

  /**
   * Verify webhook signature
   */
  async verifyWebhook(
    partnerId: string,
    payload: any,
    signature: string
  ): Promise<boolean> {
    try {
      // Get partner webhook configuration
      const partners = await this.db.select()
        .from(schema.partners)
        .where(eq(schema.partners.id, partnerId))
        .limit(1);

      const partner = partners[0];
      if (!partner || !partner.webhookSecret) {
        return false;
      }

      // Calculate expected signature
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', partner.webhookSecret)
        .update(payloadString)
        .digest('hex');

      // Compare signatures (constant time comparison)
      const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`, 'utf8');
      const actualBuffer = Buffer.from(signature, 'utf8');

      return expectedBuffer.length === actualBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event from partner
   */
  async processWebhookEvent(
    partnerId: string,
    payload: any
  ): Promise<WebhookProcessResult> {
    try {
      // Log webhook for debugging
      await this.logWebhookEvent(partnerId, payload);

      // Get partner configuration
      const partner = await this.getPartner(partnerId);
      if (!partner) {
        return {
          success: false,
          error: 'Partner not found',
        };
      }

      // Extract event data based on partner configuration
      const eventData = this.extractEventData(payload, partner);
      if (!eventData) {
        return {
          success: false,
          error: 'Could not extract event data from payload',
        };
      }

      // Find associated attribution
      const attribution = await this.findAttributionForEvent(
        partnerId,
        eventData.userId || eventData.email
      );

      // Create partner event
      const partnerEvent = await this.createPartnerEvent({
        partnerId,
        attributionId: attribution?.id,
        eventType: eventData.eventType,
        externalId: eventData.externalId,
        externalUserId: eventData.userId,
        amount: eventData.amount,
        currency: eventData.currency,
        eventData: payload,
        metadata: eventData.metadata,
      });

      // Calculate commission if applicable
      let commissionCalculated = false;
      if (this.isCommissionableEvent(eventData.eventType)) {
        const commissionAmount = await this.calculateCommission(
          partner,
          eventData.amount || 0
        );

        await this.updateEventCommission(partnerEvent.id, commissionAmount);
        commissionCalculated = true;
      }

      return {
        success: true,
        eventId: partnerEvent.id,
        commissionCalculated,
      };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Extract event data from webhook payload
   */
  private extractEventData(payload: any, partner: schema.Partner): any {
    try {
      // This would be customized per partner
      // For now, assuming a standard format
      
      // Railway webhook format example
      if (partner.slug === 'railway') {
        return this.extractRailwayEventData(payload);
      }
      
      // Vercel webhook format example
      if (partner.slug === 'vercel') {
        return this.extractVercelEventData(payload);
      }
      
      // Generic webhook format
      return this.extractGenericEventData(payload);
    } catch (error) {
      console.error('Failed to extract event data:', error);
      return null;
    }
  }

  /**
   * Extract Railway-specific event data
   */
  private extractRailwayEventData(payload: any): any {
    // Railway webhook payload structure
    if (payload.type === 'project.deployed' || payload.type === 'subscription.created') {
      return {
        eventType: payload.type === 'subscription.created' ? 'subscription' : 'signup',
        externalId: payload.project?.id || payload.subscription?.id,
        userId: payload.user?.id || payload.customer?.id,
        email: payload.user?.email || payload.customer?.email,
        amount: payload.subscription?.amount || 0,
        currency: payload.subscription?.currency || 'USD',
        metadata: {
          projectName: payload.project?.name,
          plan: payload.subscription?.plan,
        },
      };
    }
    
    return null;
  }

  /**
   * Extract Vercel-specific event data
   */
  private extractVercelEventData(payload: any): any {
    // Vercel webhook payload structure
    if (payload.type === 'deployment.succeeded' || payload.type === 'integration.configuration.created') {
      return {
        eventType: 'signup',
        externalId: payload.payload?.deployment?.id || payload.payload?.configuration?.id,
        userId: payload.payload?.user?.id,
        email: payload.payload?.user?.email,
        amount: 0, // Free tier
        currency: 'USD',
        metadata: {
          projectName: payload.payload?.project?.name,
          framework: payload.payload?.deployment?.framework,
        },
      };
    }
    
    return null;
  }

  /**
   * Extract generic event data
   */
  private extractGenericEventData(payload: any): any {
    return {
      eventType: payload.event_type || payload.type || 'signup',
      externalId: payload.id || payload.event_id,
      userId: payload.user_id || payload.customer_id,
      email: payload.email || payload.user_email,
      amount: payload.amount || payload.value || 0,
      currency: payload.currency || 'USD',
      metadata: payload.metadata || {},
    };
  }

  /**
   * Log webhook event for debugging
   */
  private async logWebhookEvent(partnerId: string, payload: any): Promise<void> {
    try {
      await this.db.insert(schema.webhookLogs)
        .values({
          partnerId,
          method: 'POST',
          url: '/webhook',
          payload,
          statusCode: 200,
          processed: false,
        });
    } catch (error) {
      console.error('Failed to log webhook:', error);
    }
  }

  /**
   * Find attribution for webhook event
   */
  private async findAttributionForEvent(
    partnerId: string,
    userIdentifier?: string
  ): Promise<schema.Attribution | null> {
    if (!userIdentifier) {
      return null;
    }

    // Try to find by user ID first
    let attributions = await this.db.select()
      .from(schema.attributions)
      .where(eq(schema.attributions.partnerId, partnerId))
      .where(eq(schema.attributions.userId, userIdentifier))
      .orderBy(schema.attributions.createdAt, 'desc')
      .limit(1);

    if (attributions.length > 0) {
      return attributions[0];
    }

    // If no direct match, try to find by recent attribution window
    // This would need more sophisticated matching logic in production
    attributions = await this.db.select()
      .from(schema.attributions)
      .where(eq(schema.attributions.partnerId, partnerId))
      .orderBy(schema.attributions.createdAt, 'desc')
      .limit(1);

    return attributions[0] || null;
  }

  /**
   * Create partner event record
   */
  private async createPartnerEvent(eventData: {
    partnerId: string;
    attributionId?: string;
    eventType: string;
    externalId?: string;
    externalUserId?: string;
    amount?: number;
    currency?: string;
    eventData: any;
    metadata?: any;
  }): Promise<schema.PartnerEvent> {
    const events = await this.db.insert(schema.partnerEvents)
      .values({
        partnerId: eventData.partnerId,
        attributionId: eventData.attributionId,
        eventType: eventData.eventType as any,
        externalId: eventData.externalId,
        externalUserId: eventData.externalUserId,
        amount: eventData.amount,
        currency: eventData.currency || 'USD',
        eventData: eventData.eventData,
        metadata: eventData.metadata || {},
        commissionStatus: 'pending',
        isVerified: false,
      })
      .returning();

    return events[0];
  }

  /**
   * Calculate commission for event
   */
  private async calculateCommission(
    partner: schema.Partner,
    amount: number
  ): Promise<number> {
    if (partner.commissionType === 'fixed') {
      return partner.fixedCommissionAmount || 0;
    }

    // Percentage commission
    const rate = parseFloat(partner.commissionRate || '0') / 100;
    return Math.round(amount * rate);
  }

  /**
   * Update event with commission information
   */
  private async updateEventCommission(
    eventId: string,
    commissionAmount: number
  ): Promise<void> {
    await this.db.update(schema.partnerEvents)
      .set({
        commissionAmount,
        updatedAt: new Date(),
      })
      .where(eq(schema.partnerEvents.id, eventId));
  }

  /**
   * Check if event type is commissionable
   */
  private isCommissionableEvent(eventType: string): boolean {
    const commissionableEvents = [
      'signup',
      'purchase',
      'subscription',
      'trial_conversion',
      'renewal',
    ];
    
    return commissionableEvents.includes(eventType);
  }

  /**
   * Get partner by ID
   */
  private async getPartner(partnerId: string): Promise<schema.Partner | null> {
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.id, partnerId))
      .limit(1);

    return partners[0] || null;
  }

  /**
   * Mark webhook as processed
   */
  async markWebhookProcessed(webhookLogId: string): Promise<void> {
    await this.db.update(schema.webhookLogs)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(schema.webhookLogs.id, webhookLogId));
  }

  /**
   * Get unprocessed webhooks for retry
   */
  async getUnprocessedWebhooks(limit = 100): Promise<schema.WebhookLog[]> {
    return this.db.select()
      .from(schema.webhookLogs)
      .where(eq(schema.webhookLogs.processed, false))
      .orderBy(schema.webhookLogs.createdAt)
      .limit(limit);
  }

  /**
   * Retry failed webhook processing
   */
  async retryWebhook(webhookLogId: string): Promise<WebhookProcessResult> {
    try {
      const logs = await this.db.select()
        .from(schema.webhookLogs)
        .where(eq(schema.webhookLogs.id, webhookLogId))
        .limit(1);

      const log = logs[0];
      if (!log) {
        return {
          success: false,
          error: 'Webhook log not found',
        };
      }

      // Retry processing
      const result = await this.processWebhookEvent(log.partnerId, log.payload);
      
      if (result.success) {
        await this.markWebhookProcessed(webhookLogId);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
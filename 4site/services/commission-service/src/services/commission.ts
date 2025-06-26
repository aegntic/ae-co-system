/**
 * Commission calculation and payout management service
 */

import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import * as schema from '../db/schema';

export interface CommissionSummary {
  partnerId: string;
  partnerName: string;
  totalEvents: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  confirmedCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  avgOrderValue: number;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
  totalAmount?: number;
  eventCount?: number;
}

export class CommissionCalculator {
  constructor(private db: any) {}

  /**
   * Calculate commission for a specific event
   */
  async calculateEventCommission(
    partnerId: string,
    eventType: string,
    amount: number
  ): Promise<number> {
    // Get partner commission configuration
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.id, partnerId))
      .limit(1);

    const partner = partners[0];
    if (!partner) {
      throw new Error(`Partner not found: ${partnerId}`);
    }

    // Calculate based on commission type
    if (partner.commissionType === 'fixed') {
      return partner.fixedCommissionAmount || 0;
    }

    // Percentage commission
    const rate = parseFloat(partner.commissionRate || '0') / 100;
    return Math.round(amount * rate);
  }

  /**
   * Get commission summary for partner
   */
  async getPartnerCommissionSummary(
    partnerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionSummary> {
    // Get partner info
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.id, partnerId))
      .limit(1);

    const partner = partners[0];
    if (!partner) {
      throw new Error(`Partner not found: ${partnerId}`);
    }

    // Get events in date range
    const events = await this.db.select()
      .from(schema.partnerEvents)
      .where(
        and(
          eq(schema.partnerEvents.partnerId, partnerId),
          gte(schema.partnerEvents.createdAt, startDate),
          lte(schema.partnerEvents.createdAt, endDate)
        )
      );

    // Calculate totals
    let totalRevenue = 0;
    let totalCommissions = 0;
    let pendingCommissions = 0;
    let confirmedCommissions = 0;
    let paidCommissions = 0;

    events.forEach(event => {
      totalRevenue += event.amount || 0;
      
      const commission = event.commissionAmount || 0;
      totalCommissions += commission;

      switch (event.commissionStatus) {
        case 'pending':
          pendingCommissions += commission;
          break;
        case 'confirmed':
          confirmedCommissions += commission;
          break;
        case 'paid':
          paidCommissions += commission;
          break;
      }
    });

    // Get attribution count for conversion rate
    const attributions = await this.db.select()
      .from(schema.attributions)
      .where(
        and(
          eq(schema.attributions.partnerId, partnerId),
          gte(schema.attributions.createdAt, startDate),
          lte(schema.attributions.createdAt, endDate)
        )
      );

    const totalClicks = attributions.length;
    const totalEvents = events.length;
    const conversionRate = totalClicks > 0 ? (totalEvents / totalClicks) * 100 : 0;
    const avgOrderValue = totalEvents > 0 ? totalRevenue / totalEvents : 0;

    return {
      partnerId,
      partnerName: partner.name,
      totalEvents,
      totalRevenue,
      totalCommissions,
      pendingCommissions,
      confirmedCommissions,
      paidCommissions,
      conversionRate,
      avgOrderValue,
    };
  }

  /**
   * Get commission summary for all partners
   */
  async getAllPartnersCommissionSummary(
    startDate: Date,
    endDate: Date
  ): Promise<CommissionSummary[]> {
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.isActive, true));

    const summaries = await Promise.all(
      partners.map(partner =>
        this.getPartnerCommissionSummary(partner.id, startDate, endDate)
      )
    );

    return summaries.sort((a, b) => b.totalCommissions - a.totalCommissions);
  }

  /**
   * Create payout for partner
   */
  async createPayout(
    partnerId: string,
    periodStart: Date,
    periodEnd: Date,
    includeEventTypes: string[] = ['purchase', 'subscription', 'renewal']
  ): Promise<PayoutResult> {
    try {
      // Get confirmed events for payout
      const events = await this.db.select()
        .from(schema.partnerEvents)
        .where(
          and(
            eq(schema.partnerEvents.partnerId, partnerId),
            gte(schema.partnerEvents.createdAt, periodStart),
            lte(schema.partnerEvents.createdAt, periodEnd),
            eq(schema.partnerEvents.commissionStatus, 'confirmed'),
            inArray(schema.partnerEvents.eventType, includeEventTypes)
          )
        );

      if (events.length === 0) {
        return {
          success: false,
          error: 'No confirmed events found for payout period',
        };
      }

      // Calculate totals
      const totalAmount = events.reduce(
        (sum, event) => sum + (event.commissionAmount || 0),
        0
      );

      const eventIds = events.map(event => event.id);

      // Create payout record
      const payouts = await this.db.insert(schema.commissionPayouts)
        .values({
          partnerId,
          periodStart,
          periodEnd,
          totalEvents: events.length,
          totalAmount,
          currency: 'USD', // Assuming USD, could be dynamic
          status: 'pending',
          eventIds,
        })
        .returning();

      const payout = payouts[0];

      // Mark events as paid
      await this.db.update(schema.partnerEvents)
        .set({
          commissionStatus: 'paid',
          updatedAt: new Date(),
        })
        .where(inArray(schema.partnerEvents.id, eventIds));

      return {
        success: true,
        payoutId: payout.id,
        totalAmount,
        eventCount: events.length,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process monthly payouts for all partners
   */
  async processMonthlyPayouts(month?: Date): Promise<PayoutResult[]> {
    const targetMonth = month || subMonths(new Date(), 1);
    const periodStart = startOfMonth(targetMonth);
    const periodEnd = endOfMonth(targetMonth);

    // Get all active partners
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.isActive, true));

    const results = await Promise.all(
      partners.map(partner =>
        this.createPayout(partner.id, periodStart, periodEnd)
      )
    );

    return results;
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(
    partnerId?: string,
    limit = 50
  ): Promise<schema.CommissionPayout[]> {
    let query = this.db.select()
      .from(schema.commissionPayouts)
      .orderBy(schema.commissionPayouts.createdAt, 'desc')
      .limit(limit);

    if (partnerId) {
      query = query.where(eq(schema.commissionPayouts.partnerId, partnerId));
    }

    return query;
  }

  /**
   * Mark payout as paid
   */
  async markPayoutPaid(
    payoutId: string,
    paymentReference: string
  ): Promise<boolean> {
    const result = await this.db.update(schema.commissionPayouts)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(schema.commissionPayouts.id, payoutId));

    return result.rowCount > 0;
  }

  /**
   * Dispute payout
   */
  async disputePayout(
    payoutId: string,
    reason: string
  ): Promise<boolean> {
    const result = await this.db.update(schema.commissionPayouts)
      .set({
        status: 'disputed',
        metadata: {
          disputeReason: reason,
          disputedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.commissionPayouts.id, payoutId));

    return result.rowCount > 0;
  }

  /**
   * Get top performing partners
   */
  async getTopPerformingPartners(
    startDate: Date,
    endDate: Date,
    limit = 10
  ): Promise<Array<{
    partnerId: string;
    partnerName: string;
    totalCommissions: number;
    totalEvents: number;
    conversionRate: number;
  }>> {
    // This would need a complex aggregation query
    // For now, getting summaries and sorting
    const summaries = await this.getAllPartnersCommissionSummary(startDate, endDate);
    
    return summaries
      .slice(0, limit)
      .map(summary => ({
        partnerId: summary.partnerId,
        partnerName: summary.partnerName,
        totalCommissions: summary.totalCommissions,
        totalEvents: summary.totalEvents,
        conversionRate: summary.conversionRate,
      }));
  }

  /**
   * Recalculate commission for event
   */
  async recalculateEventCommission(eventId: string): Promise<boolean> {
    try {
      // Get event details
      const events = await this.db.select()
        .from(schema.partnerEvents)
        .where(eq(schema.partnerEvents.id, eventId))
        .limit(1);

      const event = events[0];
      if (!event) {
        return false;
      }

      // Recalculate commission
      const newCommissionAmount = await this.calculateEventCommission(
        event.partnerId,
        event.eventType,
        event.amount || 0
      );

      // Update event
      await this.db.update(schema.partnerEvents)
        .set({
          commissionAmount: newCommissionAmount,
          updatedAt: new Date(),
        })
        .where(eq(schema.partnerEvents.id, eventId));

      return true;
    } catch (error) {
      console.error('Failed to recalculate commission:', error);
      return false;
    }
  }

  /**
   * Get commission trends
   */
  async getCommissionTrends(
    partnerId: string,
    months = 12
  ): Promise<Array<{
    month: string;
    commissions: number;
    events: number;
    revenue: number;
  }>> {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const summary = await this.getPartnerCommissionSummary(
        partnerId,
        monthStart,
        monthEnd
      );

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        commissions: summary.totalCommissions,
        events: summary.totalEvents,
        revenue: summary.totalRevenue,
      });
    }

    return trends;
  }

  /**
   * Validate commission calculation
   */
  async validateCommissionCalculation(eventId: string): Promise<{
    isValid: boolean;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
  }> {
    const events = await this.db.select()
      .from(schema.partnerEvents)
      .where(eq(schema.partnerEvents.id, eventId))
      .limit(1);

    const event = events[0];
    if (!event) {
      throw new Error('Event not found');
    }

    const expectedAmount = await this.calculateEventCommission(
      event.partnerId,
      event.eventType,
      event.amount || 0
    );

    const actualAmount = event.commissionAmount || 0;
    const difference = Math.abs(expectedAmount - actualAmount);

    return {
      isValid: difference === 0,
      expectedAmount,
      actualAmount,
      difference,
    };
  }
}
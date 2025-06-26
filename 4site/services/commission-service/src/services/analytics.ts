/**
 * Analytics service for commission tracking and reporting
 */

import { Redis } from 'ioredis';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  format,
  startOfMonth,
  endOfMonth 
} from 'date-fns';
import * as schema from '../db/schema';

export interface PartnerAnalytics {
  partnerId: string;
  partnerName: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalCommissions: number;
    conversionRate: number;
    avgOrderValue: number;
    avgCommissionPerEvent: number;
  };
  dailyBreakdown: Array<{
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
    commissions: number;
  }>;
  eventTypeBreakdown: Array<{
    eventType: string;
    count: number;
    revenue: number;
    commissions: number;
  }>;
}

export interface ServiceMetrics {
  totalPartners: number;
  activePartners: number;
  totalRevenue: number;
  totalCommissions: number;
  totalEvents: number;
  avgConversionRate: number;
  topPerformingPartner: string;
  recentActivity: Array<{
    type: string;
    partnerId: string;
    amount: number;
    timestamp: string;
  }>;
}

export interface CommissionSummaryOptions {
  partnerId?: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month';
}

export class AnalyticsService {
  constructor(
    private db: any,
    private redis: Redis
  ) {}

  /**
   * Get comprehensive analytics for a partner
   */
  async getPartnerAnalytics(
    partnerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PartnerAnalytics> {
    // Get partner info
    const partners = await this.db.select()
      .from(schema.partners)
      .where(eq(schema.partners.id, partnerId))
      .limit(1);

    const partner = partners[0];
    if (!partner) {
      throw new Error(`Partner not found: ${partnerId}`);
    }

    // Get clicks (attributions)
    const attributions = await this.db.select()
      .from(schema.attributions)
      .where(
        and(
          eq(schema.attributions.partnerId, partnerId),
          gte(schema.attributions.createdAt, startDate),
          lte(schema.attributions.createdAt, endDate)
        )
      );

    // Get conversions (events)
    const events = await this.db.select()
      .from(schema.partnerEvents)
      .where(
        and(
          eq(schema.partnerEvents.partnerId, partnerId),
          gte(schema.partnerEvents.createdAt, startDate),
          lte(schema.partnerEvents.createdAt, endDate)
        )
      );

    // Calculate metrics
    const totalClicks = attributions.length;
    const totalConversions = events.length;
    const totalRevenue = events.reduce((sum, event) => sum + (event.amount || 0), 0);
    const totalCommissions = events.reduce((sum, event) => sum + (event.commissionAmount || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
    const avgCommissionPerEvent = totalConversions > 0 ? totalCommissions / totalConversions : 0;

    // Generate daily breakdown
    const dailyBreakdown = await this.generateDailyBreakdown(
      partnerId,
      startDate,
      endDate,
      attributions,
      events
    );

    // Generate event type breakdown
    const eventTypeBreakdown = this.generateEventTypeBreakdown(events);

    return {
      partnerId,
      partnerName: partner.name,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommissions,
        conversionRate,
        avgOrderValue,
        avgCommissionPerEvent,
      },
      dailyBreakdown,
      eventTypeBreakdown,
    };
  }

  /**
   * Get service-wide metrics
   */
  async getServiceMetrics(): Promise<ServiceMetrics> {
    // Check cache first
    const cached = await this.redis.get('service_metrics');
    if (cached) {
      return JSON.parse(cached);
    }

    // Get partner counts
    const allPartners = await this.db.select()
      .from(schema.partners);
    
    const activePartners = allPartners.filter(p => p.isActive);

    // Get recent events for totals
    const recentDate = subDays(new Date(), 30);
    const recentEvents = await this.db.select()
      .from(schema.partnerEvents)
      .where(gte(schema.partnerEvents.createdAt, recentDate));

    // Calculate totals
    const totalRevenue = recentEvents.reduce((sum, event) => sum + (event.amount || 0), 0);
    const totalCommissions = recentEvents.reduce((sum, event) => sum + (event.commissionAmount || 0), 0);

    // Get conversion rates for active partners
    const conversionRates = await Promise.all(
      activePartners.map(async partner => {
        const analytics = await this.getPartnerAnalytics(
          partner.id,
          recentDate,
          new Date()
        );
        return analytics.metrics.conversionRate;
      })
    );

    const avgConversionRate = conversionRates.length > 0 
      ? conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length
      : 0;

    // Find top performing partner
    const partnerCommissions = await Promise.all(
      activePartners.map(async partner => {
        const analytics = await this.getPartnerAnalytics(
          partner.id,
          recentDate,
          new Date()
        );
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          totalCommissions: analytics.metrics.totalCommissions,
        };
      })
    );

    const topPartner = partnerCommissions.reduce((top, current) => 
      current.totalCommissions > top.totalCommissions ? current : top,
      { partnerId: '', partnerName: '', totalCommissions: 0 }
    );

    // Get recent activity
    const recentActivity = await this.getRecentActivity(10);

    const metrics: ServiceMetrics = {
      totalPartners: allPartners.length,
      activePartners: activePartners.length,
      totalRevenue,
      totalCommissions,
      totalEvents: recentEvents.length,
      avgConversionRate,
      topPerformingPartner: topPartner.partnerName,
      recentActivity,
    };

    // Cache for 5 minutes
    await this.redis.setex('service_metrics', 300, JSON.stringify(metrics));

    return metrics;
  }

  /**
   * Get commission summary with grouping
   */
  async getCommissionSummary(options: CommissionSummaryOptions): Promise<Array<{
    period: string;
    totalRevenue: number;
    totalCommissions: number;
    totalEvents: number;
    conversionRate: number;
  }>> {
    const { partnerId, startDate, endDate, groupBy = 'day' } = options;

    // Generate date periods
    const periods = this.generateDatePeriods(startDate, endDate, groupBy);

    const summary = await Promise.all(
      periods.map(async period => {
        let query = this.db.select()
          .from(schema.partnerEvents)
          .where(
            and(
              gte(schema.partnerEvents.createdAt, period.start),
              lte(schema.partnerEvents.createdAt, period.end)
            )
          );

        if (partnerId) {
          query = query.where(eq(schema.partnerEvents.partnerId, partnerId));
        }

        const events = await query;

        // Get attributions for conversion rate
        let attributionQuery = this.db.select()
          .from(schema.attributions)
          .where(
            and(
              gte(schema.attributions.createdAt, period.start),
              lte(schema.attributions.createdAt, period.end)
            )
          );

        if (partnerId) {
          attributionQuery = attributionQuery.where(eq(schema.attributions.partnerId, partnerId));
        }

        const attributions = await attributionQuery;

        const totalRevenue = events.reduce((sum, event) => sum + (event.amount || 0), 0);
        const totalCommissions = events.reduce((sum, event) => sum + (event.commissionAmount || 0), 0);
        const totalEvents = events.length;
        const totalClicks = attributions.length;
        const conversionRate = totalClicks > 0 ? (totalEvents / totalClicks) * 100 : 0;

        return {
          period: format(period.start, groupBy === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'),
          totalRevenue,
          totalCommissions,
          totalEvents,
          conversionRate,
        };
      })
    );

    return summary;
  }

  /**
   * Get real-time analytics from cache
   */
  async getRealTimeAnalytics(partnerId?: string): Promise<{
    todayClicks: number;
    todayConversions: number;
    todayRevenue: number;
    todayCommissions: number;
    last24hGrowth: {
      clicks: number;
      conversions: number;
      revenue: number;
    };
  }> {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    // Get today's data
    const todayData = await this.getDayAnalytics(today, partnerId);
    const yesterdayData = await this.getDayAnalytics(yesterday, partnerId);

    // Calculate growth rates
    const clicksGrowth = yesterdayData.clicks > 0 
      ? ((todayData.clicks - yesterdayData.clicks) / yesterdayData.clicks) * 100
      : 0;

    const conversionsGrowth = yesterdayData.conversions > 0
      ? ((todayData.conversions - yesterdayData.conversions) / yesterdayData.conversions) * 100
      : 0;

    const revenueGrowth = yesterdayData.revenue > 0
      ? ((todayData.revenue - yesterdayData.revenue) / yesterdayData.revenue) * 100
      : 0;

    return {
      todayClicks: todayData.clicks,
      todayConversions: todayData.conversions,
      todayRevenue: todayData.revenue,
      todayCommissions: todayData.commissions,
      last24hGrowth: {
        clicks: clicksGrowth,
        conversions: conversionsGrowth,
        revenue: revenueGrowth,
      },
    };
  }

  /**
   * Private helper methods
   */

  private async generateDailyBreakdown(
    partnerId: string,
    startDate: Date,
    endDate: Date,
    attributions: schema.Attribution[],
    events: schema.PartnerEvent[]
  ): Promise<Array<{
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
    commissions: number;
  }>> {
    const breakdown = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);

      const dayAttributions = attributions.filter(attr => 
        attr.createdAt >= dayStart && attr.createdAt <= dayEnd
      );

      const dayEvents = events.filter(event => 
        event.createdAt >= dayStart && event.createdAt <= dayEnd
      );

      breakdown.push({
        date: format(current, 'yyyy-MM-dd'),
        clicks: dayAttributions.length,
        conversions: dayEvents.length,
        revenue: dayEvents.reduce((sum, event) => sum + (event.amount || 0), 0),
        commissions: dayEvents.reduce((sum, event) => sum + (event.commissionAmount || 0), 0),
      });

      current.setDate(current.getDate() + 1);
    }

    return breakdown;
  }

  private generateEventTypeBreakdown(events: schema.PartnerEvent[]): Array<{
    eventType: string;
    count: number;
    revenue: number;
    commissions: number;
  }> {
    const breakdown = new Map<string, {
      count: number;
      revenue: number;
      commissions: number;
    }>();

    events.forEach(event => {
      const existing = breakdown.get(event.eventType) || {
        count: 0,
        revenue: 0,
        commissions: 0,
      };

      breakdown.set(event.eventType, {
        count: existing.count + 1,
        revenue: existing.revenue + (event.amount || 0),
        commissions: existing.commissions + (event.commissionAmount || 0),
      });
    });

    return Array.from(breakdown.entries()).map(([eventType, data]) => ({
      eventType,
      ...data,
    }));
  }

  private generateDatePeriods(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Array<{ start: Date; end: Date }> {
    const periods = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodEnd: Date;

      switch (groupBy) {
        case 'day':
          periodEnd = endOfDay(current);
          break;
        case 'week':
          periodEnd = addDays(current, 6);
          break;
        case 'month':
          periodEnd = endOfMonth(current);
          break;
      }

      periods.push({
        start: new Date(current),
        end: periodEnd > endDate ? endDate : periodEnd,
      });

      switch (groupBy) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          current.setDate(1);
          break;
      }
    }

    return periods;
  }

  private async getDayAnalytics(date: Date, partnerId?: string): Promise<{
    clicks: number;
    conversions: number;
    revenue: number;
    commissions: number;
  }> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get from cache first
    const cacheKey = `day_analytics:${format(date, 'yyyy-MM-dd')}${partnerId ? `:${partnerId}` : ''}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    let attributionQuery = this.db.select()
      .from(schema.attributions)
      .where(
        and(
          gte(schema.attributions.createdAt, dayStart),
          lte(schema.attributions.createdAt, dayEnd)
        )
      );

    let eventQuery = this.db.select()
      .from(schema.partnerEvents)
      .where(
        and(
          gte(schema.partnerEvents.createdAt, dayStart),
          lte(schema.partnerEvents.createdAt, dayEnd)
        )
      );

    if (partnerId) {
      attributionQuery = attributionQuery.where(eq(schema.attributions.partnerId, partnerId));
      eventQuery = eventQuery.where(eq(schema.partnerEvents.partnerId, partnerId));
    }

    const [attributions, events] = await Promise.all([
      attributionQuery,
      eventQuery,
    ]);

    const analytics = {
      clicks: attributions.length,
      conversions: events.length,
      revenue: events.reduce((sum, event) => sum + (event.amount || 0), 0),
      commissions: events.reduce((sum, event) => sum + (event.commissionAmount || 0), 0),
    };

    // Cache for 1 hour (longer for past dates)
    const ttl = date < startOfDay(new Date()) ? 86400 : 3600;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(analytics));

    return analytics;
  }

  private async getRecentActivity(limit: number): Promise<Array<{
    type: string;
    partnerId: string;
    amount: number;
    timestamp: string;
  }>> {
    const events = await this.db.select()
      .from(schema.partnerEvents)
      .orderBy(desc(schema.partnerEvents.createdAt))
      .limit(limit);

    return events.map(event => ({
      type: event.eventType,
      partnerId: event.partnerId,
      amount: event.amount || 0,
      timestamp: event.createdAt.toISOString(),
    }));
  }
}
/**
 * Business Intelligence Service for 4site.pro
 * Tracks viral mechanics, lead capture, and business KPIs
 */

const { Pool } = require('pg');
const Redis = require('ioredis');

class BusinessIntelligence {
  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true'
    });
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
    
    this.cachePrefix = '4site:bi:';
    this.cacheTTL = 300; // 5 minutes
  }
  
  async initialize() {
    try {
      await this.db.query('SELECT 1');
      await this.redis.ping();
      console.log('✅ Business Intelligence service initialized');
    } catch (error) {
      console.error('❌ Business Intelligence initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get comprehensive business metrics
   */
  async getBusinessMetrics(timeRange = '24h') {
    const cacheKey = \`\${this.cachePrefix}business:\${timeRange}\`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      const timeFilter = this.getTimeFilter(timeRange);
      
      const [
        overviewMetrics,
        conversionMetrics,
        revenueMetrics,
        userMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.getOverviewMetrics(timeFilter),
        this.getConversionMetrics(timeFilter),
        this.getRevenueMetrics(timeFilter),
        this.getUserMetrics(timeFilter),
        this.getPerformanceMetrics(timeFilter)
      ]);
      
      const metrics = {
        timestamp: new Date().toISOString(),
        timeRange,
        overview: overviewMetrics,
        conversion: conversionMetrics,
        revenue: revenueMetrics,
        users: userMetrics,
        performance: performanceMetrics,
        health: this.calculateBusinessHealth(overviewMetrics, conversionMetrics)
      };
      
      // Cache the results
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(metrics));
      
      return metrics;
      
    } catch (error) {
      console.error('Error getting business metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get viral mechanics metrics
   */
  async getViralMetrics(timeRange = '24h') {
    const cacheKey = \`\${this.cachePrefix}viral:\${timeRange}\`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Viral coefficient calculation
      const viralCoefficientQuery = \`
        WITH referral_data AS (
          SELECT 
            r.referrer_id,
            COUNT(DISTINCT r.referred_user_id) as direct_referrals,
            COUNT(DISTINCT nr.referred_user_id) as secondary_referrals
          FROM referrals r
          LEFT JOIN referrals nr ON r.referred_user_id = nr.referrer_id
          WHERE r.created_at >= \$1
          GROUP BY r.referrer_id
        ),
        coefficient_calc AS (
          SELECT 
            AVG(direct_referrals + COALESCE(secondary_referrals, 0)) as avg_referrals_per_user,
            COUNT(*) as total_referrers,
            SUM(direct_referrals) as total_direct_referrals,
            SUM(COALESCE(secondary_referrals, 0)) as total_secondary_referrals
          FROM referral_data
        )
        SELECT 
          COALESCE(avg_referrals_per_user, 0) as viral_coefficient,
          total_referrers,
          total_direct_referrals,
          total_secondary_referrals,
          CASE 
            WHEN avg_referrals_per_user >= 1.0 THEN 'viral'
            WHEN avg_referrals_per_user >= 0.5 THEN 'growing'
            WHEN avg_referrals_per_user >= 0.1 THEN 'steady'
            ELSE 'declining'
          END as status
        FROM coefficient_calc
      \`;
      
      // Commission tracking
      const commissionQuery = \`
        SELECT 
          SUM(amount) as total_commission,
          COUNT(*) as commission_events,
          AVG(amount) as avg_commission,
          COUNT(DISTINCT referrer_id) as earning_referrers,
          MAX(amount) as highest_commission
        FROM commissions 
        WHERE created_at >= \$1
      \`;
      
      // Share rate analysis
      const shareRateQuery = \`
        WITH site_shares AS (
          SELECT 
            s.id as site_id,
            s.created_at,
            COUNT(sh.id) as share_count,
            COUNT(DISTINCT sh.platform) as platforms_shared
          FROM sites s
          LEFT JOIN shares sh ON s.id = sh.site_id 
            AND sh.created_at >= \$1
          WHERE s.created_at >= \$1
          GROUP BY s.id, s.created_at
        )
        SELECT 
          COUNT(*) as total_sites,
          COUNT(*) FILTER (WHERE share_count > 0) as sites_shared,
          ROUND(
            COUNT(*) FILTER (WHERE share_count > 0)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 
            2
          ) as share_rate_percent,
          AVG(share_count) as avg_shares_per_site,
          SUM(share_count) as total_shares
        FROM site_shares
      \`;
      
      const [viralResult, commissionResult, shareResult] = await Promise.all([
        this.db.query(viralCoefficientQuery, [timeFilter]),
        this.db.query(commissionQuery, [timeFilter]),
        this.db.query(shareRateQuery, [timeFilter])
      ]);
      
      const viralData = viralResult.rows[0] || {};
      const commissionData = commissionResult.rows[0] || {};
      const shareData = shareResult.rows[0] || {};
      
      const metrics = {
        timestamp: new Date().toISOString(),
        timeRange,
        coefficient: {
          value: parseFloat(viralData.viral_coefficient) || 0,
          status: viralData.status || 'unknown',
          totalReferrers: parseInt(viralData.total_referrers) || 0,
          directReferrals: parseInt(viralData.total_direct_referrals) || 0,
          secondaryReferrals: parseInt(viralData.total_secondary_referrals) || 0
        },
        commissions: {
          total: parseFloat(commissionData.total_commission) || 0,
          events: parseInt(commissionData.commission_events) || 0,
          average: parseFloat(commissionData.avg_commission) || 0,
          earningReferrers: parseInt(commissionData.earning_referrers) || 0,
          highest: parseFloat(commissionData.highest_commission) || 0
        },
        sharing: {
          shareRate: parseFloat(shareData.share_rate_percent) || 0,
          totalSites: parseInt(shareData.total_sites) || 0,
          sitesShared: parseInt(shareData.sites_shared) || 0,
          totalShares: parseInt(shareData.total_shares) || 0,
          avgSharesPerSite: parseFloat(shareData.avg_shares_per_site) || 0
        }
      };
      
      // Cache the results
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(metrics));
      
      return metrics;
      
    } catch (error) {
      console.error('Error getting viral metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get lead quality and conversion metrics
   */
  async getLeadMetrics(timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    try {
      const leadQualityQuery = \`
        WITH lead_analysis AS (
          SELECT 
            l.*,
            CASE 
              WHEN l.email_verified = true AND l.phone IS NOT NULL THEN 100
              WHEN l.email_verified = true THEN 80
              WHEN l.email IS NOT NULL THEN 60
              ELSE 30
            END as quality_score
          FROM leads l
          WHERE l.created_at >= \$1
        )
        SELECT 
          COUNT(*) as total_leads,
          AVG(quality_score) as avg_quality_score,
          COUNT(*) FILTER (WHERE quality_score >= 80) as high_quality_leads,
          COUNT(*) FILTER (WHERE quality_score >= 60) as medium_quality_leads,
          COUNT(*) FILTER (WHERE quality_score < 60) as low_quality_leads,
          COUNT(DISTINCT source) as lead_sources,
          mode() WITHIN GROUP (ORDER BY source) as top_source
        FROM lead_analysis
      \`;
      
      const conversionQuery = \`
        WITH conversion_funnel AS (
          SELECT 
            COUNT(DISTINCT visitor_id) as total_visitors,
            COUNT(DISTINCT CASE WHEN event_type = 'site_generated' THEN visitor_id END) as site_generators,
            COUNT(DISTINCT l.visitor_id) as converted_leads
          FROM analytics a
          LEFT JOIN leads l ON a.visitor_id = l.visitor_id
          WHERE a.created_at >= \$1
        )
        SELECT 
          *,
          ROUND(
            site_generators::numeric / NULLIF(total_visitors, 0) * 100, 
            2
          ) as generation_conversion_rate,
          ROUND(
            converted_leads::numeric / NULLIF(site_generators, 0) * 100, 
            2
          ) as lead_conversion_rate,
          ROUND(
            converted_leads::numeric / NULLIF(total_visitors, 0) * 100, 
            2
          ) as overall_conversion_rate
        FROM conversion_funnel
      \`;
      
      const [leadResult, conversionResult] = await Promise.all([
        this.db.query(leadQualityQuery, [timeFilter]),
        this.db.query(conversionQuery, [timeFilter])
      ]);
      
      const leadData = leadResult.rows[0] || {};
      const conversionData = conversionResult.rows[0] || {};
      
      return {
        quality: {
          totalLeads: parseInt(leadData.total_leads) || 0,
          avgQualityScore: parseFloat(leadData.avg_quality_score) || 0,
          highQuality: parseInt(leadData.high_quality_leads) || 0,
          mediumQuality: parseInt(leadData.medium_quality_leads) || 0,
          lowQuality: parseInt(leadData.low_quality_leads) || 0,
          sources: parseInt(leadData.lead_sources) || 0,
          topSource: leadData.top_source || 'unknown'
        },
        conversion: {
          totalVisitors: parseInt(conversionData.total_visitors) || 0,
          siteGenerators: parseInt(conversionData.site_generators) || 0,
          convertedLeads: parseInt(conversionData.converted_leads) || 0,
          generationRate: parseFloat(conversionData.generation_conversion_rate) || 0,
          leadRate: parseFloat(conversionData.lead_conversion_rate) || 0,
          overallRate: parseFloat(conversionData.overall_conversion_rate) || 0
        }
      };
      
    } catch (error) {
      console.error('Error getting lead metrics:', error);
      throw error;
    }
  }
  
  /**
   * Helper methods
   */
  getTimeFilter(timeRange) {
    const now = new Date();
    const intervals = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const interval = intervals[timeRange] || intervals['24h'];
    return new Date(now.getTime() - interval);
  }
  
  async getOverviewMetrics(timeFilter) {
    const query = \`
      SELECT 
        COUNT(DISTINCT s.id) as sites_generated,
        COUNT(DISTINCT l.id) as leads_captured,
        COUNT(DISTINCT a.visitor_id) as unique_visitors,
        COUNT(DISTINCT r.id) as referrals_made,
        SUM(c.amount) as total_commissions
      FROM sites s
      FULL OUTER JOIN leads l ON s.created_at >= \$1 AND l.created_at >= \$1
      FULL OUTER JOIN analytics a ON a.created_at >= \$1
      FULL OUTER JOIN referrals r ON r.created_at >= \$1
      FULL OUTER JOIN commissions c ON c.created_at >= \$1
      WHERE s.created_at >= \$1
    \`;
    
    const result = await this.db.query(query, [timeFilter]);
    return result.rows[0] || {};
  }
  
  async getConversionMetrics(timeFilter) {
    const query = \`
      WITH funnel_data AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_id END) as visitors,
          COUNT(DISTINCT CASE WHEN event_type = 'url_entered' THEN visitor_id END) as url_entries,
          COUNT(DISTINCT CASE WHEN event_type = 'site_generated' THEN visitor_id END) as generations,
          COUNT(DISTINCT l.visitor_id) as conversions
        FROM analytics a
        LEFT JOIN leads l ON a.visitor_id = l.visitor_id
        WHERE a.created_at >= \$1
      )
      SELECT 
        *,
        ROUND(url_entries::numeric / NULLIF(visitors, 0) * 100, 2) as url_entry_rate,
        ROUND(generations::numeric / NULLIF(url_entries, 0) * 100, 2) as generation_rate,
        ROUND(conversions::numeric / NULLIF(generations, 0) * 100, 2) as conversion_rate
      FROM funnel_data
    \`;
    
    const result = await this.db.query(query, [timeFilter]);
    return result.rows[0] || {};
  }
  
  async getRevenueMetrics(timeFilter) {
    const query = \`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as revenue_events,
        AVG(amount) as avg_revenue_per_event,
        COUNT(DISTINCT user_id) as revenue_generating_users
      FROM revenue_events 
      WHERE created_at >= \$1
    \`;
    
    const result = await this.db.query(query, [timeFilter]);
    return result.rows[0] || {};
  }
  
  async getUserMetrics(timeFilter) {
    const query = \`
      SELECT 
        COUNT(DISTINCT visitor_id) as total_users,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) as registered_users,
        COUNT(DISTINCT CASE WHEN last_active >= NOW() - INTERVAL '1 hour' THEN visitor_id END) as active_users_1h,
        COUNT(DISTINCT CASE WHEN last_active >= NOW() - INTERVAL '24 hours' THEN visitor_id END) as active_users_24h
      FROM user_sessions 
      WHERE created_at >= \$1
    \`;
    
    const result = await this.db.query(query, [timeFilter]);
    return result.rows[0] || {};
  }
  
  async getPerformanceMetrics(timeFilter) {
    const query = \`
      SELECT 
        AVG(generation_time) as avg_generation_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time) as p95_generation_time,
        AVG(ai_response_time) as avg_ai_response_time,
        COUNT(*) FILTER (WHERE generation_time > 30000) as slow_generations
      FROM site_performance_logs 
      WHERE created_at >= \$1
    \`;
    
    const result = await this.db.query(query, [timeFilter]);
    return result.rows[0] || {};
  }
  
  calculateBusinessHealth(overview, conversion) {
    const scores = [];
    
    // Site generation health
    if (overview.sites_generated > 100) scores.push(100);
    else if (overview.sites_generated > 50) scores.push(80);
    else if (overview.sites_generated > 10) scores.push(60);
    else scores.push(30);
    
    // Conversion health
    if (conversion.conversion_rate > 5) scores.push(100);
    else if (conversion.conversion_rate > 3) scores.push(80);
    else if (conversion.conversion_rate > 1) scores.push(60);
    else scores.push(30);
    
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (averageScore >= 90) return 'excellent';
    if (averageScore >= 70) return 'good';
    if (averageScore >= 50) return 'warning';
    return 'critical';
  }
}

module.exports = BusinessIntelligence;
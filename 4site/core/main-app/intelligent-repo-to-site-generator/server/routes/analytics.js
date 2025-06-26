import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
);

// Helper function to get date range based on time period
const getDateRange = (timeRange) => {
  const now = new Date();
  const ranges = {
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  };
  return ranges[timeRange] || ranges['7d'];
};

// Helper function to get previous period for trend calculation
const getPreviousDateRange = (timeRange) => {
  const now = new Date();
  const periods = {
    '24h': {
      start: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      end: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    },
    '7d': {
      start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    },
    '30d': {
      start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    },
    '90d': {
      start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }
  };
  return periods[timeRange] || periods['7d'];
};

// Main analytics overview endpoint
router.get('/overview', async (req, res) => {
  try {
    const { timeRange = '7d', userId, siteId } = req.query;
    
    const startDate = getDateRange(timeRange);
    const previousPeriod = getPreviousDateRange(timeRange);
    
    // Build base query filters
    let leadFilters = supabase
      .from('waitlist_submissions')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    let visitorFilters = supabase
      .from('visitor_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Apply user/site specific filters
    if (userId) {
      leadFilters = leadFilters.eq('user_id', userId);
      visitorFilters = visitorFilters.eq('user_id', userId);
    }
    
    if (siteId) {
      leadFilters = leadFilters.eq('source_site_id', siteId);
      visitorFilters = visitorFilters.eq('site_id', siteId);
    }

    // Execute parallel queries
    const [
      leadsResult,
      visitorsResult,
      previousLeadsResult,
      socialConnectionsResult,
      sitesResult
    ] = await Promise.all([
      leadFilters,
      visitorFilters,
      supabase
        .from('waitlist_submissions')
        .select('id')
        .gte('created_at', previousPeriod.start.toISOString())
        .lt('created_at', previousPeriod.end.toISOString()),
      supabase
        .from('user_social_connections')
        .select('platform, verified, verification_data')
        .eq('verified', true),
      supabase
        .from('generated_sites')
        .select('id, site_id, deployment_status, created_at')
    ]);

    if (leadsResult.error) throw leadsResult.error;
    if (visitorsResult.error) throw visitorsResult.error;
    if (previousLeadsResult.error) throw previousLeadsResult.error;
    if (socialConnectionsResult.error) throw socialConnectionsResult.error;
    if (sitesResult.error) throw sitesResult.error;

    const leads = leadsResult.data || [];
    const visitors = visitorsResult.data || [];
    const previousLeads = previousLeadsResult.data || [];
    const socialConnections = socialConnectionsResult.data || [];
    const sites = sitesResult.data || [];

    // Calculate lead metrics
    const totalLeads = leads.length;
    const previousTotalLeads = previousLeads.length;
    const leadTrend = previousTotalLeads > 0 
      ? ((totalLeads - previousTotalLeads) / previousTotalLeads) * 100 
      : totalLeads > 0 ? 100 : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const leadsToday = leads.filter(lead => new Date(lead.created_at) >= today).length;
    const leadsThisWeek = leads.filter(lead => new Date(lead.created_at) >= thisWeek).length;
    const leadsThisMonth = leads.filter(lead => new Date(lead.created_at) >= thisMonth).length;

    // Calculate visitor metrics
    const totalVisitors = visitors.length;
    const uniqueVisitors = new Set(visitors.map(v => v.session_id)).size;
    const returningVisitors = totalVisitors - uniqueVisitors;
    
    const averageTimeOnSite = visitors.length > 0
      ? visitors.reduce((sum, v) => sum + (v.visit_duration || 0), 0) / visitors.length
      : 0;

    // Calculate bounce rate (sessions with only one page view)
    const sessionPageViews = visitors.reduce((acc, v) => {
      acc[v.session_id] = (acc[v.session_id] || 0) + 1;
      return acc;
    }, {});
    
    const singlePageSessions = Object.values(sessionPageViews).filter(count => count === 1).length;
    const bounceRate = uniqueVisitors > 0 ? (singlePageSessions / uniqueVisitors) * 100 : 0;

    // Calculate site metrics
    const totalSites = sites.length;
    const activeSites = sites.filter(site => site.deployment_status === 'active').length;
    const averageConversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;

    // Calculate social verification metrics
    const platformBreakdown = socialConnections.reduce((acc, conn) => {
      acc[conn.platform] = (acc[conn.platform] || 0) + 1;
      return acc;
    }, {});

    // Calculate average verification score
    const verificationScores = await Promise.all(
      [...new Set(socialConnections.map(c => c.user_email || 'unknown'))].map(async (email) => {
        if (email === 'unknown') return 0;
        
        const { data: scoreData } = await supabase
          .rpc('calculate_user_verification_score', { user_email_param: email });
        
        return scoreData?.[0]?.total_score || 0;
      })
    );

    const averageVerificationScore = verificationScores.length > 0
      ? verificationScores.reduce((sum, score) => sum + score, 0) / verificationScores.length
      : 0;

    // Get top performing sites
    const sitePerformance = await Promise.all(
      sites.slice(0, 10).map(async (site) => {
        const siteLeads = leads.filter(lead => lead.source_site_id === site.site_id);
        const siteVisitors = visitors.filter(visitor => visitor.site_id === site.site_id);
        
        return {
          siteId: site.site_id,
          siteName: site.site_name || `Site ${site.site_id.slice(0, 8)}`,
          leads: siteLeads.length,
          visitors: siteVisitors.length,
          conversionRate: siteVisitors.length > 0 ? (siteLeads.length / siteVisitors.length) * 100 : 0
        };
      })
    );

    const topPerformingSites = sitePerformance
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // Calculate lead sources
    const leadSources = leads.reduce((acc, lead) => {
      const source = lead.visitor_metadata?.referrer || 'direct';
      const sourceKey = source === 'direct' ? 'direct' :
                       source.includes('github.com') ? 'github' :
                       source.includes('linkedin.com') ? 'linkedin' :
                       source.includes('twitter.com') ? 'twitter' :
                       source.includes('reddit.com') ? 'reddit' :
                       'other';
      acc[sourceKey] = (acc[sourceKey] || 0) + 1;
      return acc;
    }, {});

    // Calculate device breakdown
    const deviceBreakdown = visitors.reduce((acc, visitor) => {
      const device = visitor.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Calculate geographic data (simplified)
    const geoData = visitors.reduce((acc, visitor) => {
      const timezone = visitor.timezone || 'unknown';
      const region = timezone.split('/')[0] || 'unknown';
      const country = {
        'America': 'United States',
        'Europe': 'Europe',
        'Asia': 'Asia',
        'Australia': 'Australia',
        'Africa': 'Africa'
      }[region] || 'Other';
      
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Compile response
    const analyticsData = {
      leads: {
        total: totalLeads,
        today: leadsToday,
        thisWeek: leadsThisWeek,
        thisMonth: leadsThisMonth,
        trend: leadTrend
      },
      visitors: {
        total: totalVisitors,
        unique: uniqueVisitors,
        returning: returningVisitors,
        averageTimeOnSite: Math.round(averageTimeOnSite),
        bounceRate: Math.round(bounceRate * 10) / 10
      },
      sites: {
        totalGenerated: totalSites,
        activeDeployments: activeSites,
        averageConversionRate: Math.round(averageConversionRate * 10) / 10
      },
      socialVerification: {
        totalVerified: socialConnections.length,
        platformBreakdown,
        averageScore: Math.round(averageVerificationScore * 10) / 10
      },
      performance: {
        topPerformingSites,
        leadSources,
        deviceBreakdown,
        geoData
      }
    };

    res.json({
      success: true,
      data: analyticsData,
      timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview'
    });
  }
});

// Time series data endpoint
router.get('/timeseries', async (req, res) => {
  try {
    const { timeRange = '7d', userId, siteId } = req.query;
    
    const startDate = getDateRange(timeRange);
    
    // Determine the appropriate interval based on time range
    const intervals = {
      '24h': 'hour',
      '7d': 'day',
      '30d': 'day',
      '90d': 'week'
    };
    const interval = intervals[timeRange] || 'day';

    // Build query filters
    let leadQuery = supabase
      .from('waitlist_submissions')
      .select('created_at')
      .gte('created_at', startDate.toISOString());
    
    let visitorQuery = supabase
      .from('visitor_tracking')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (userId) {
      leadQuery = leadQuery.eq('user_id', userId);
      visitorQuery = visitorQuery.eq('user_id', userId);
    }
    
    if (siteId) {
      leadQuery = leadQuery.eq('source_site_id', siteId);
      visitorQuery = visitorQuery.eq('site_id', siteId);
    }

    const [leadsResult, visitorsResult] = await Promise.all([
      leadQuery,
      visitorQuery
    ]);

    if (leadsResult.error) throw leadsResult.error;
    if (visitorsResult.error) throw visitorsResult.error;

    const leads = leadsResult.data || [];
    const visitors = visitorsResult.data || [];

    // Generate time series data
    const timeSeriesData = [];
    const now = new Date();
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= date && leadDate < nextDate;
      }).length;
      
      const dayVisitors = visitors.filter(visitor => {
        const visitorDate = new Date(visitor.created_at);
        return visitorDate >= date && visitorDate < nextDate;
      }).length;
      
      const conversionRate = dayVisitors > 0 ? (dayLeads / dayVisitors) * 100 : 0;
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        leads: dayLeads,
        visitors: dayVisitors,
        conversionRate: Math.round(conversionRate * 10) / 10
      });
    }

    res.json({
      success: true,
      data: timeSeriesData,
      timeRange,
      interval
    });

  } catch (error) {
    console.error('Time series analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time series data'
    });
  }
});

// Site-specific analytics
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { timeRange = '7d' } = req.query;
    
    const startDate = getDateRange(timeRange);

    // Fetch site-specific data
    const [leadsResult, visitorsResult, siteResult] = await Promise.all([
      supabase
        .from('waitlist_submissions')
        .select('*')
        .eq('source_site_id', siteId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('visitor_tracking')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('generated_sites')
        .select('*')
        .eq('site_id', siteId)
        .single()
    ]);

    if (siteResult.error) throw siteResult.error;

    const leads = leadsResult.data || [];
    const visitors = visitorsResult.data || [];
    const site = siteResult.data;

    // Calculate site-specific metrics
    const totalLeads = leads.length;
    const totalVisitors = visitors.length;
    const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
    
    const averageTimeOnSite = visitors.length > 0
      ? visitors.reduce((sum, v) => sum + (v.visit_duration || 0), 0) / visitors.length
      : 0;

    // Top pages/sections viewed
    const sectionsViewed = visitors.reduce((acc, visitor) => {
      const sections = visitor.behavior_data?.sectionsViewed || [];
      sections.forEach(section => {
        acc[section] = (acc[section] || 0) + 1;
      });
      return acc;
    }, {});

    // Lead quality distribution
    const leadQualityDistribution = leads.reduce((acc, lead) => {
      const score = lead.lead_score || 0;
      const quality = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {});

    const siteAnalytics = {
      site: {
        id: site.site_id,
        name: site.site_name,
        url: site.deployment_url,
        status: site.deployment_status,
        createdAt: site.created_at
      },
      metrics: {
        totalLeads,
        totalVisitors,
        conversionRate: Math.round(conversionRate * 10) / 10,
        averageTimeOnSite: Math.round(averageTimeOnSite),
      },
      engagement: {
        sectionsViewed: Object.entries(sectionsViewed)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [section, count]) => {
            acc[section] = count;
            return acc;
          }, {})
      },
      leadQuality: leadQualityDistribution
    };

    res.json({
      success: true,
      data: siteAnalytics,
      timeRange
    });

  } catch (error) {
    console.error('Site analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site analytics'
    });
  }
});

// Real-time metrics endpoint
router.get('/realtime', async (req, res) => {
  try {
    const { userId, siteId } = req.query;
    
    // Get data from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    let leadQuery = supabase
      .from('waitlist_submissions')
      .select('id, created_at, lead_score')
      .gte('created_at', oneHourAgo.toISOString());
    
    let visitorQuery = supabase
      .from('visitor_tracking')
      .select('id, created_at, session_id')
      .gte('created_at', oneHourAgo.toISOString());

    if (userId) {
      leadQuery = leadQuery.eq('user_id', userId);
      visitorQuery = visitorQuery.eq('user_id', userId);
    }
    
    if (siteId) {
      leadQuery = leadQuery.eq('source_site_id', siteId);
      visitorQuery = visitorQuery.eq('site_id', siteId);
    }

    const [leadsResult, visitorsResult] = await Promise.all([
      leadQuery,
      visitorQuery
    ]);

    const leads = leadsResult.data || [];
    const visitors = visitorsResult.data || [];

    // Calculate real-time metrics
    const activeVisitors = new Set(visitors.map(v => v.session_id)).size;
    const recentLeads = leads.length;
    const averageLeadScore = leads.length > 0
      ? leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / leads.length
      : 0;

    // Generate minute-by-minute data for the last hour
    const minutelyData = [];
    for (let i = 59; i >= 0; i--) {
      const minute = new Date(Date.now() - i * 60 * 1000);
      const nextMinute = new Date(minute.getTime() + 60 * 1000);
      
      const minuteLeads = leads.filter(lead => {
        const leadTime = new Date(lead.created_at);
        return leadTime >= minute && leadTime < nextMinute;
      }).length;
      
      const minuteVisitors = visitors.filter(visitor => {
        const visitorTime = new Date(visitor.created_at);
        return visitorTime >= minute && visitorTime < nextMinute;
      }).length;
      
      minutelyData.push({
        time: minute.toISOString(),
        leads: minuteLeads,
        visitors: minuteVisitors
      });
    }

    res.json({
      success: true,
      data: {
        activeVisitors,
        recentLeads,
        averageLeadScore: Math.round(averageLeadScore * 10) / 10,
        minutelyData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics'
    });
  }
});

// Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { timeRange = '30d', format = 'json', userId, siteId } = req.query;
    
    const startDate = getDateRange(timeRange);

    // Fetch comprehensive data for export
    let leadQuery = supabase
      .from('waitlist_submissions')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    let visitorQuery = supabase
      .from('visitor_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (userId) {
      leadQuery = leadQuery.eq('user_id', userId);
      visitorQuery = visitorQuery.eq('user_id', userId);
    }
    
    if (siteId) {
      leadQuery = leadQuery.eq('source_site_id', siteId);
      visitorQuery = visitorQuery.eq('site_id', siteId);
    }

    const [leadsResult, visitorsResult] = await Promise.all([
      leadQuery,
      visitorQuery
    ]);

    const leads = leadsResult.data || [];
    const visitors = visitorsResult.data || [];

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timeRange,
        totalLeads: leads.length,
        totalVisitors: visitors.length,
        userId: userId || null,
        siteId: siteId || null
      },
      leads: leads.map(lead => ({
        id: lead.id,
        email: lead.email,
        projectInterests: lead.project_interests,
        socialPlatforms: lead.social_platforms_connected,
        leadScore: lead.lead_score,
        source: lead.source_site_id,
        createdAt: lead.created_at
      })),
      visitors: visitors.map(visitor => ({
        sessionId: visitor.session_id,
        siteId: visitor.site_id,
        deviceType: visitor.device_type,
        visitDuration: visitor.visit_duration,
        createdAt: visitor.created_at
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = [
        ['Type', 'ID', 'Email', 'Site ID', 'Score', 'Created At'],
        ...leads.map(lead => [
          'Lead',
          lead.id,
          lead.email,
          lead.source_site_id,
          lead.lead_score,
          lead.created_at
        ]),
        ...visitors.map(visitor => [
          'Visitor',
          visitor.session_id,
          '',
          visitor.site_id,
          '',
          visitor.created_at
        ])
      ].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=4site-analytics-${timeRange}.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=4site-analytics-${timeRange}.json`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

export default router;
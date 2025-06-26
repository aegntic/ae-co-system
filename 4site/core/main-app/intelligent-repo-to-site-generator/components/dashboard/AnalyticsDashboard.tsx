import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Mail,
  Eye,
  Clock,
  MousePointer,
  Share2,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface AnalyticsData {
  leads: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number; // percentage change
  };
  visitors: {
    total: number;
    unique: number;
    returning: number;
    averageTimeOnSite: number;
    bounceRate: number;
  };
  sites: {
    totalGenerated: number;
    activeDeployments: number;
    averageConversionRate: number;
  };
  socialVerification: {
    totalVerified: number;
    platformBreakdown: Record<string, number>;
    averageScore: number;
  };
  performance: {
    topPerformingSites: Array<{
      siteId: string;
      siteName: string;
      leads: number;
      visitors: number;
      conversionRate: number;
    }>;
    leadSources: Record<string, number>;
    deviceBreakdown: Record<string, number>;
    geoData: Record<string, number>;
  };
}

interface TimeSeriesData {
  date: string;
  leads: number;
  visitors: number;
  conversionRate: number;
}

interface AnalyticsDashboardProps {
  userId?: string;
  siteId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  refreshInterval?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  siteId,
  timeRange = '7d',
  refreshInterval = 30000 // 30 seconds
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch analytics data
  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        ...(userId && { userId }),
        ...(siteId && { siteId })
      });

      const [analyticsResponse, timeSeriesResponse] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/timeseries?${params}`)
      ]);

      if (!analyticsResponse.ok || !timeSeriesResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await analyticsResponse.json();
      const timeSeriesData = await timeSeriesResponse.json();

      setData(analyticsData.data);
      setTimeSeriesData(timeSeriesData.data);
      setError(null);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedTimeRange, userId, siteId, refreshInterval]);

  // Calculate trend indicators
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Export data functionality
  const exportData = () => {
    if (!data) return;

    const exportData = {
      overview: data,
      timeSeries: timeSeriesData,
      exported: new Date().toISOString(),
      timeRange: selectedTimeRange
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4site-analytics-${selectedTimeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Analytics Error</h2>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                4site.pro Analytics
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time insights into your lead generation and site performance
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                {['24h', '7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range as typeof selectedTimeRange)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      selectedTimeRange === range
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={isRefreshing}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isRefreshing && <span className="text-blue-400">(Refreshing...)</span>}
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Leads</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data?.leads.total.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {getTrendIcon(data?.leads.trend || 0)}
              <span className={`text-sm ${getTrendColor(data?.leads.trend || 0)}`}>
                {Math.abs(data?.leads.trend || 0).toFixed(1)}% from last period
              </span>
            </div>
          </motion.div>

          {/* Site Visitors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Site Visitors</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data?.visitors.total.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-400">
                {data?.visitors.unique.toLocaleString() || '0'} unique visitors
              </span>
            </div>
          </motion.div>

          {/* Generated Sites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Generated Sites</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data?.sites.totalGenerated.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-400">
                {data?.sites.activeDeployments.toLocaleString() || '0'} active deployments
              </span>
            </div>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {(data?.sites.averageConversionRate || 0).toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-400">
                Visitors to leads ratio
              </span>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Leads Over Time</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {timeSeriesData.map((item, index) => (
                <div key={item.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-400 hover:to-blue-300"
                    style={{
                      height: `${(item.leads / Math.max(...timeSeriesData.map(d => d.leads))) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                  <span className="text-xs text-gray-400 mt-2">
                    {new Date(item.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social Verification Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Social Verification</h3>
            <div className="space-y-4">
              {data?.socialVerification.platformBreakdown &&
                Object.entries(data.socialVerification.platformBreakdown).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      <span className="text-gray-300 capitalize">{platform}</span>
                    </div>
                    <span className="text-white font-semibold">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Average Score</span>
                <span className="text-2xl font-bold text-white">
                  {(data?.socialVerification.averageScore || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Sites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Top Performing Sites</h3>
            <div className="space-y-4">
              {data?.performance.topPerformingSites.map((site, index) => (
                <div key={site.siteId} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{site.siteName}</h4>
                    <p className="text-sm text-gray-400">{site.leads} leads • {site.visitors} visitors</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {site.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">conversion</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Lead Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Lead Sources</h3>
            <div className="space-y-4">
              {data?.performance.leadSources &&
                Object.entries(data.performance.leadSources)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Share2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 capitalize">{source.replace('_', ' ')}</span>
                      </div>
                      <span className="text-white font-semibold">{count.toLocaleString()}</span>
                    </div>
                  ))}
            </div>
          </motion.div>
        </div>

        {/* Device and Geo Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Device Types</h3>
            <div className="space-y-4">
              {data?.performance.deviceBreakdown &&
                Object.entries(data.performance.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MousePointer className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 capitalize">{device}</span>
                    </div>
                    <span className="text-white font-semibold">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Geographic Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Top Countries</h3>
            <div className="space-y-4">
              {data?.performance.geoData &&
                Object.entries(data.performance.geoData)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{country}</span>
                      </div>
                      <span className="text-white font-semibold">{count.toLocaleString()}</span>
                    </div>
                  ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
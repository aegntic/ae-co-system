import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Users, 
  Globe,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import type { Website } from '../../types/database';

interface UsageMetricsProps {
  websites: Website[];
  analyticsData: any;
  tier: string;
}

export const UsageMetrics: React.FC<UsageMetricsProps> = ({ 
  websites, 
  analyticsData,
  tier 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedWebsite, setSelectedWebsite] = useState<string>('all');

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  // Mock data for charts (in real app, this would come from the API)
  const generateChartData = () => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.floor(Math.random() * 1000) + 100,
        visitors: Math.floor(Math.random() * 500) + 50,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const maxViews = Math.max(...chartData.map(d => d.views));

  const topPerformers = websites
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const totalViews = websites.reduce((sum, site) => sum + site.views, 0);
  const totalVisitors = websites.reduce((sum, site) => sum + site.unique_visitors, 0);
  const avgViewsPerSite = websites.length > 0 ? Math.round(totalViews / websites.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
        
        <div className="flex items-center gap-3">
          {/* Website Filter */}
          <select
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
          >
            <option value="all">All Websites</option>
            {websites.map(site => (
              <option key={site.id} value={site.id}>{site.title}</option>
            ))}
          </select>

          {/* Period Filter */}
          <div className="flex bg-white/10 rounded-lg p-1">
            {periods.map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-primary-400 text-black font-medium'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <Download className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Eye}
          label="Total Views"
          value={totalViews.toLocaleString()}
          change="+12.5%"
          positive
        />
        <SummaryCard
          icon={Users}
          label="Unique Visitors"
          value={totalVisitors.toLocaleString()}
          change="+8.3%"
          positive
        />
        <SummaryCard
          icon={Globe}
          label="Active Sites"
          value={websites.filter(w => w.status === 'published').length}
          total={websites.length}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Avg. Views/Site"
          value={avgViewsPerSite.toLocaleString()}
          change="-2.1%"
          positive={false}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Traffic Overview</h3>
        
        {/* Simple Bar Chart */}
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col items-center">
                  <span className="text-xs text-white/40 mb-1">
                    {data.views}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.views / maxViews) * 180}px` }}
                    transition={{ delay: index * 0.02 }}
                    className="w-full bg-primary-400/80 rounded-t"
                  />
                </div>
                <span className="text-xs text-white/40 transform -rotate-45 origin-left">
                  {data.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-400 rounded" />
            <span className="text-sm text-white/60">Page Views</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Sites */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Sites</h3>
          
          {topPerformers.length === 0 ? (
            <p className="text-white/40 text-center py-8">No data available yet</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((site, index) => (
                <div key={site.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white/20">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{site.title}</p>
                      <p className="text-sm text-white/40">
                        {site.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                  <a
                    href={site.deployment_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-white/40" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Features */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics Features</h3>
          
          <div className="space-y-4">
            {tier === 'free' ? (
              <>
                <p className="text-white/60 mb-4">
                  Upgrade to Pro for advanced analytics features:
                </p>
                <FeatureItem 
                  label="Real-time visitor tracking" 
                  included={false} 
                />
                <FeatureItem 
                  label="Geographic data & heatmaps" 
                  included={false} 
                />
                <FeatureItem 
                  label="Conversion funnel analysis" 
                  included={false} 
                />
                <FeatureItem 
                  label="Custom event tracking" 
                  included={false} 
                />
                <FeatureItem 
                  label="Export data to CSV/PDF" 
                  included={false} 
                />
                
                <a
                  href="/pricing"
                  className="block w-full mt-6 px-4 py-3 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg text-center transition-colors"
                >
                  Upgrade to Pro
                </a>
              </>
            ) : (
              <>
                <FeatureItem 
                  label="Real-time visitor tracking" 
                  included={true} 
                />
                <FeatureItem 
                  label="Geographic data & heatmaps" 
                  included={true} 
                />
                <FeatureItem 
                  label="Conversion funnel analysis" 
                  included={true} 
                />
                <FeatureItem 
                  label="Custom event tracking" 
                  included={true} 
                />
                <FeatureItem 
                  label="Export data to CSV/PDF" 
                  included={true} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  total?: number;
}> = ({ icon: Icon, label, value, change, positive, total }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
    <div className="flex items-start justify-between mb-4">
      <Icon className="w-8 h-8 text-white/20" />
      {change && (
        <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      )}
    </div>
    <p className="text-sm text-white/60 mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">
      {value}
      {total !== undefined && (
        <span className="text-lg text-white/40"> / {total}</span>
      )}
    </p>
  </div>
);

// Feature Item Component
const FeatureItem: React.FC<{
  label: string;
  included: boolean;
}> = ({ label, included }) => (
  <div className="flex items-center gap-3">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
      included ? 'bg-green-400/20' : 'bg-white/10'
    }`}>
      {included ? (
        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
    <span className={`text-sm ${included ? 'text-white' : 'text-white/40'}`}>
      {label}
    </span>
  </div>
);
import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { FlyWheelMetrics } from '../auth/unified-auth.types';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  description
}) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '➡️'
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                {change !== undefined && (
                  <span className={`text-sm font-medium ${trendColors[trend]} flex items-center`}>
                    {trendIcons[trend]} {Math.abs(change)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface FlywheelVisualizationProps {
  metrics: FlyWheelMetrics;
}

const FlywheelVisualization: React.FC<FlywheelVisualizationProps> = ({ metrics }) => {
  const steps = [
    {
      id: 'websites',
      label: 'Websites Created',
      value: metrics.metrics.websites_created,
      color: 'from-blue-500 to-blue-600',
      icon: '🌐'
    },
    {
      id: 'tutorials',
      label: 'Tutorials Generated',
      value: metrics.metrics.tutorials_generated,
      color: 'from-purple-500 to-purple-600',
      icon: '🎬'
    },
    {
      id: 'views',
      label: 'Tutorial Views',
      value: metrics.metrics.tutorial_views,
      color: 'from-green-500 to-green-600',
      icon: '👀'
    },
    {
      id: 'newUsers',
      label: 'New Users',
      value: metrics.metrics.new_users_from_tutorials,
      color: 'from-amber-500 to-amber-600',
      icon: '👥'
    }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <span className="mr-3">🔄</span>
        Growth Flywheel Visualization
      </h3>

      <div className="relative">
        {/* Central Circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {(metrics.metrics.viral_coefficient * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-200">Viral Rate</div>
            </div>
          </div>
        </div>

        {/* Flywheel Steps */}
        <div className="grid grid-cols-2 gap-8 w-80 h-80">
          {steps.map((step, index) => {
            const positions = [
              'top-0 left-1/2 transform -translate-x-1/2',
              'top-1/2 right-0 transform -translate-y-1/2',
              'bottom-0 left-1/2 transform -translate-x-1/2',
              'top-1/2 left-0 transform -translate-y-1/2'
            ];

            return (
              <div
                key={step.id}
                className={`absolute ${positions[index]} w-20 h-20`}
              >
                <div className={`w-full h-full rounded-full bg-gradient-to-r ${step.color} flex flex-col items-center justify-center text-white shadow-lg`}>
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-xs font-medium">{step.value}</span>
                </div>
                <div className="text-xs text-gray-400 text-center mt-2 w-24">
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Flow Arrows */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>
          
          {/* Curved arrows between steps */}
          <path d="M 200 60 Q 260 120 200 180" stroke="#6366f1" strokeWidth="2" fill="none" 
                markerEnd="url(#arrowhead)" className="animate-pulse" />
          <path d="M 200 200 Q 140 260 80 200" stroke="#6366f1" strokeWidth="2" fill="none" 
                markerEnd="url(#arrowhead)" className="animate-pulse" />
          <path d="M 60 140 Q 120 80 180 140" stroke="#6366f1" strokeWidth="2" fill="none" 
                markerEnd="url(#arrowhead)" className="animate-pulse" />
          <path d="M 180 140 Q 220 100 200 60" stroke="#6366f1" strokeWidth="2" fill="none" 
                markerEnd="url(#arrowhead)" className="animate-pulse" />
        </svg>
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-gray-400">
          Current Flywheel Velocity: <span className="text-white font-semibold">
            {metrics.metrics.viral_coefficient > 1 ? 'Accelerating 🚀' : 'Building Momentum ⚡'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ConversionFunnelProps {
  metrics: FlyWheelMetrics;
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ metrics }) => {
  const funnelSteps = [
    {
      label: 'Website Visitors',
      value: 10000, // This would come from actual analytics
      percentage: 100,
      color: 'bg-blue-500'
    },
    {
      label: 'Website Creators',
      value: metrics.metrics.websites_created,
      percentage: (metrics.metrics.websites_created / 10000) * 100,
      color: 'bg-purple-500'
    },
    {
      label: 'Tutorial Generators',
      value: metrics.metrics.tutorials_generated,
      percentage: (metrics.metrics.tutorials_generated / metrics.metrics.websites_created) * 100,
      color: 'bg-green-500'
    },
    {
      label: 'Viral Tutorials',
      value: Math.floor(metrics.metrics.tutorials_generated * 0.3), // 30% go viral
      percentage: 30,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <span className="mr-3">📊</span>
        Conversion Funnel Analysis
      </h3>

      <div className="space-y-4">
        {funnelSteps.map((step, index) => (
          <div key={step.label} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">{step.label}</span>
              <div className="text-right">
                <span className="text-white font-semibold">{step.value.toLocaleString()}</span>
                <span className="text-gray-400 text-sm ml-2">({step.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${step.color} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(step.percentage, 5)}%` }}
              />
            </div>

            {index < funnelSteps.length - 1 && (
              <div className="flex justify-center py-2">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">Optimization Opportunities</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Increase website → tutorial conversion rate (currently {(metrics.metrics.tutorial_conversion_rate * 100).toFixed(1)}%)</li>
          <li>• Improve tutorial virality through better titles and thumbnails</li>
          <li>• Enhance new user acquisition from viral content</li>
        </ul>
      </div>
    </div>
  );
};

export const FlywheelAnalyticsDashboard: React.FC<{
  timeframe?: '24h' | '7d' | '30d' | '90d';
}> = ({ timeframe = '30d' }) => {
  const { user, getFlyWheelMetrics } = useUnifiedAuth();
  const [metrics, setMetrics] = useState<FlyWheelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user, selectedTimeframe]);

  const loadMetrics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userMetrics = await getFlyWheelMetrics(selectedTimeframe);
      setMetrics(userMetrics);
    } catch (error) {
      console.error('Failed to load flywheel metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p>Unable to load analytics data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Growth Flywheel Analytics
          </h2>
          <p className="text-gray-400">
            Track your cross-platform performance and viral coefficient
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedTimeframe(period as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedTimeframe === period
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Websites Created"
          value={metrics.metrics.websites_created}
          trend="up"
          change={12}
          icon={<span className="text-lg">🌐</span>}
          description="Active website projects"
        />
        
        <AnalyticsCard
          title="Tutorials Generated"
          value={metrics.metrics.tutorials_generated}
          trend="up"
          change={25}
          icon={<span className="text-lg">🎬</span>}
          description="Automated video content"
        />
        
        <AnalyticsCard
          title="Viral Coefficient"
          value={`${(metrics.metrics.viral_coefficient * 100).toFixed(1)}%`}
          trend={metrics.metrics.viral_coefficient > 1 ? 'up' : 'neutral'}
          change={8}
          icon={<span className="text-lg">🚀</span>}
          description="Content sharing multiplier"
        />
        
        <AnalyticsCard
          title="Revenue per Tutorial"
          value={`$${metrics.metrics.revenue_per_tutorial.toFixed(0)}`}
          trend="up"
          change={15}
          icon={<span className="text-lg">💰</span>}
          description="Average monetization"
        />
      </div>

      {/* Main Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FlywheelVisualization metrics={metrics} />
        <ConversionFunnel metrics={metrics} />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cross-Platform Flow */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="mr-3">🔄</span>
            Cross-Platform Flow
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <div className="text-white font-medium">4site.pro → DailyDoco</div>
                  <div className="text-sm text-gray-400">Website to tutorial conversion</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">
                  {metrics.metrics.foursitepro_to_dailydoco_conversion}
                </div>
                <div className="text-xs text-gray-400">conversions</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎬</span>
                <div>
                  <div className="text-white font-medium">DailyDoco → 4site.pro</div>
                  <div className="text-sm text-gray-400">Tutorial to website creation</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-purple-400">
                  {metrics.metrics.dailydoco_to_foursitepro_conversion}
                </div>
                <div className="text-xs text-gray-400">conversions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="mr-3">💡</span>
            Performance Insights
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">Strong Performance</span>
                <span className="text-green-400">✅</span>
              </div>
              <p className="text-sm text-gray-300">
                Tutorial conversion rate is {(metrics.metrics.tutorial_conversion_rate * 100).toFixed(1)}% 
                - above industry average
              </p>
            </div>

            <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 font-medium">Optimization Opportunity</span>
                <span className="text-amber-400">⚡</span>
              </div>
              <p className="text-sm text-gray-300">
                Increase viral coefficient to 1.5x for exponential growth
              </p>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-medium">Growth Potential</span>
                <span className="text-blue-400">🚀</span>
              </div>
              <p className="text-sm text-gray-300">
                LTV:CAC ratio suggests 3x scaling potential
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-3">🎯</span>
          AI-Powered Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/20 rounded-lg">
            <h4 className="text-white font-medium mb-2">Increase Tutorial Creation</h4>
            <p className="text-sm text-gray-400 mb-3">
              Only {(metrics.metrics.tutorial_conversion_rate * 100).toFixed(0)}% of websites become tutorials
            </p>
            <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
              Implement Smart Prompts
            </button>
          </div>

          <div className="p-4 bg-black/20 rounded-lg">
            <h4 className="text-white font-medium mb-2">Optimize for Virality</h4>
            <p className="text-sm text-gray-400 mb-3">
              Improve thumbnail and title generation for higher engagement
            </p>
            <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
              A/B Test Content
            </button>
          </div>

          <div className="p-4 bg-black/20 rounded-lg">
            <h4 className="text-white font-medium mb-2">Cross-Platform Integration</h4>
            <p className="text-sm text-gray-400 mb-3">
              Strengthen the connection between platforms
            </p>
            <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors">
              Deploy Smart CTAs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
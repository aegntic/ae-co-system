import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface UsageMetricsProps {
  usage: any[];
  websites: any[];
}

export const UsageMetrics: React.FC<UsageMetricsProps> = ({ usage, websites }) => {
  // Calculate metrics from usage data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyPageviews = usage
    .filter(u => u.resource_type === 'pageview' && u.created_at.startsWith(currentMonth))
    .reduce((sum, u) => sum + u.amount, 0);

  const monthlyApiCalls = usage
    .filter(u => u.resource_type === 'api_call' && u.created_at.startsWith(currentMonth))
    .reduce((sum, u) => sum + u.amount, 0);

  const storageUsed = usage
    .filter(u => u.resource_type === 'storage')
    .reduce((sum, u) => sum + u.amount, 0);

  // Mock data for charts (in a real app, this would come from analytics)
  const pageviewTrend = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    views: Math.floor(Math.random() * 1000) + 100
  }));

  const topPages = websites.slice(0, 5).map(site => ({
    title: site.title,
    views: site.pageviews,
    percentage: (site.pageviews / websites.reduce((sum, s) => sum + s.pageviews, 1)) * 100
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Monthly Pageviews</h3>
            <Icon name="trending-up" size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold">{monthlyPageviews.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">+23% from last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Calls</h3>
            <Icon name="activity" size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{monthlyApiCalls.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">This month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Storage Used</h3>
            <Icon name="hard-drive" size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{(storageUsed / 1024).toFixed(1)}GB</p>
          <p className="text-sm text-gray-400 mt-1">Across all sites</p>
        </motion.div>
      </div>

      {/* Pageview Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Pageview Trend</h3>
        <div className="h-64 flex items-end space-x-1">
          {pageviewTrend.map((day, index) => {
            const height = (day.views / Math.max(...pageviewTrend.map(d => d.views))) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t hover:opacity-80 transition-opacity relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.views} views
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{pageviewTrend[0].date}</span>
          <span>{pageviewTrend[pageviewTrend.length - 1].date}</span>
        </div>
      </motion.div>

      {/* Top Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Top Performing Sites</h3>
        <div className="space-y-3">
          {topPages.map((page, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{page.title}</p>
                <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                    style={{ width: `${page.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="font-semibold">{page.views.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{page.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
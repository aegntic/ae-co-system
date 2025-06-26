import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DownloadIcon,
  CalendarIcon,
  BarChartIcon,
  ArrowUpIcon,
  ClockIcon
} from '@radix-ui/react-icons';
import { cn } from '@/utils/cn';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Advanced analytics data
const productivityData = [
  { month: 'Jan', docs: 1234, hours: 892, efficiency: 72 },
  { month: 'Feb', docs: 1456, hours: 945, efficiency: 78 },
  { month: 'Mar', docs: 1678, hours: 1023, efficiency: 82 },
  { month: 'Apr', docs: 1890, hours: 1089, efficiency: 85 },
  { month: 'May', docs: 2134, hours: 1156, efficiency: 88 },
  { month: 'Jun', docs: 2456, hours: 1234, efficiency: 91 },
];

const departmentRadarData = [
  { metric: 'Adoption', Engineering: 88, Product: 75, Design: 82, Sales: 65, Marketing: 70 },
  { metric: 'Quality', Engineering: 92, Product: 85, Design: 90, Sales: 78, Marketing: 80 },
  { metric: 'Speed', Engineering: 85, Product: 80, Design: 78, Sales: 88, Marketing: 82 },
  { metric: 'Collaboration', Engineering: 78, Product: 88, Design: 85, Sales: 92, Marketing: 90 },
  { metric: 'Innovation', Engineering: 90, Product: 92, Design: 88, Sales: 70, Marketing: 85 },
];

const costSavingsData = [
  { quarter: 'Q1 2024', traditional: 145000, withDailyDoco: 68000, savings: 77000 },
  { quarter: 'Q2 2024', traditional: 158000, withDailyDoco: 62000, savings: 96000 },
  { quarter: 'Q3 2024', traditional: 172000, withDailyDoco: 58000, savings: 114000 },
  { quarter: 'Q4 2024', traditional: 189000, withDailyDoco: 54000, savings: 135000 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('quarter');
  const [department, setDepartment] = useState('all');

  const kpiCards = [
    {
      title: 'Total Time Saved',
      value: '8,456',
      unit: 'hours',
      change: '+23%',
      icon: ClockIcon,
      description: 'vs. last quarter',
    },
    {
      title: 'Cost Reduction',
      value: '$422K',
      unit: 'saved',
      change: '+31%',
      icon: ArrowUpIcon,
      description: 'documentation costs',
    },
    {
      title: 'Productivity Gain',
      value: '91%',
      unit: 'efficiency',
      change: '+12%',
      icon: BarChartIcon,
      description: 'team efficiency score',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Advanced Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Deep insights into documentation patterns and ROI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="product">Product</option>
            <option value="design">Design</option>
            <option value="sales">Sales</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
            <DownloadIcon className="w-4 h-4" />
            Export Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="data-card p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {kpi.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {kpi.value}
                  </span>
                  <span className="text-lg text-slate-600 dark:text-slate-400">
                    {kpi.unit}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-emerald-600">
                    {kpi.change}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {kpi.description}
                  </span>
                </div>
              </div>
              <kpi.icon className="w-8 h-8 text-primary-600" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Productivity Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="data-card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Productivity Trends
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={productivityData}>
            <defs>
              <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1492ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1492ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis 
              dataKey="month" 
              className="text-slate-600 dark:text-slate-400"
              stroke="currentColor"
            />
            <YAxis 
              className="text-slate-600 dark:text-slate-400"
              stroke="currentColor"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="docs"
              stroke="#1492ff"
              fillOpacity={1}
              fill="url(#colorDocs)"
              strokeWidth={2}
              name="Documents Created"
            />
            <Area
              type="monotone"
              dataKey="efficiency"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorEfficiency)"
              strokeWidth={2}
              name="Efficiency Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="data-card p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Department Performance Matrix
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={departmentRadarData}>
              <PolarGrid className="stroke-slate-300 dark:stroke-slate-700" />
              <PolarAngleAxis 
                dataKey="metric" 
                className="text-slate-600 dark:text-slate-400"
                stroke="currentColor"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                className="text-slate-600 dark:text-slate-400"
                stroke="currentColor"
              />
              <Radar
                name="Engineering"
                dataKey="Engineering"
                stroke="#1492ff"
                fill="#1492ff"
                fillOpacity={0.3}
              />
              <Radar
                name="Product"
                dataKey="Product"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Radar
                name="Design"
                dataKey="Design"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '0.375rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Savings Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="data-card p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Cost Savings Analysis
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={costSavingsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis 
                dataKey="quarter" 
                className="text-slate-600 dark:text-slate-400"
                stroke="currentColor"
              />
              <YAxis 
                className="text-slate-600 dark:text-slate-400"
                stroke="currentColor"
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '0.375rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="traditional" fill="#94a3b8" name="Traditional Costs" />
              <Bar dataKey="withDailyDoco" fill="#1492ff" name="With DailyDoco" />
              <Bar dataKey="savings" fill="#10b981" name="Savings" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Insights & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="data-card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          AI-Powered Insights
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                High Performer: Engineering Team
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                The Engineering team has shown a 23% increase in documentation quality and speed. 
                Consider implementing their workflow patterns across other departments.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                Optimization Opportunity
              </h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Tuesday afternoons show 40% lower documentation activity. Consider scheduling 
                team training sessions during this time for maximum impact.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
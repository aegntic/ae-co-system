import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  ActivityLogIcon,
  TimerIcon,
  PersonIcon,
  FileTextIcon
} from '@radix-ui/react-icons';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { mockData } from '@shared/utils/api';
import { cn } from '@/utils/cn';
import type { Analytics } from '@shared/types';

// Import Recharts components
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Enhanced mock data for enterprise
const performanceData = [
  { time: '00:00', cpu: 12, memory: 45, docs: 89 },
  { time: '04:00', cpu: 8, memory: 42, docs: 124 },
  { time: '08:00', cpu: 28, memory: 58, docs: 342 },
  { time: '12:00', cpu: 42, memory: 72, docs: 567 },
  { time: '16:00', cpu: 35, memory: 68, docs: 489 },
  { time: '20:00', cpu: 18, memory: 52, docs: 234 },
  { time: '24:00', cpu: 14, memory: 48, docs: 156 },
];

const departmentData = [
  { name: 'Engineering', value: 42, color: '#1492ff' },
  { name: 'Product', value: 28, color: '#8b5cf6' },
  { name: 'Design', value: 18, color: '#14b8a6' },
  { name: 'Sales', value: 12, color: '#f97316' },
];

const teamActivity = [
  { name: 'Mon', frontend: 45, backend: 38, devops: 22 },
  { name: 'Tue', frontend: 52, backend: 42, devops: 28 },
  { name: 'Wed', frontend: 68, backend: 55, devops: 35 },
  { name: 'Thu', frontend: 72, backend: 68, devops: 42 },
  { name: 'Fri', frontend: 85, backend: 72, devops: 38 },
];

export default function DashboardPage() {
  const { metrics } = useWebSocket();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    setAnalytics(mockData.analytics);
  }, []);

  const statCards = [
    {
      title: 'Total Documents',
      value: analytics?.videosCreated || 0,
      change: 12.5,
      icon: FileTextIcon,
      color: 'primary',
    },
    {
      title: 'Active Users',
      value: metrics?.activeUsers || 0,
      change: 8.2,
      icon: PersonIcon,
      color: 'emerald',
    },
    {
      title: 'Avg. Processing Time',
      value: '2.3 min',
      change: -15.8,
      icon: TimerIcon,
      color: 'purple',
    },
    {
      title: 'System Uptime',
      value: '99.99%',
      change: 0.01,
      icon: ActivityLogIcon,
      color: 'teal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Enterprise Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time insights across your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="metric-card"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn(
                "w-8 h-8",
                stat.color === 'primary' && "text-primary-600",
                stat.color === 'emerald' && "text-emerald-600",
                stat.color === 'purple' && "text-purple-600",
                stat.color === 'teal' && "text-teal-600"
              )} />
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                stat.change > 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {stat.change > 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {stat.title}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2 data-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              System Performance
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Docs/hr</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis 
                dataKey="time" 
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
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#1492ff" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="docs" 
                stroke="#14b8a6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="data-card p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Department Usage
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '0.375rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {departmentData.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: dept.color }}
                  ></div>
                  <span className="text-slate-600 dark:text-slate-400">{dept.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {dept.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Team Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="data-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Team Activity
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Frontend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Backend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">DevOps</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={teamActivity}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis 
              dataKey="name" 
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
            <Bar dataKey="frontend" fill="#1492ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="backend" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="devops" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="data-card p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Recent Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="data-table-header">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[
                { user: 'Alice Johnson', doc: 'API Migration Guide', dept: 'Engineering', time: '2 min ago', status: 'completed' },
                { user: 'Bob Chen', doc: 'Q4 Product Roadmap', dept: 'Product', time: '5 min ago', status: 'processing' },
                { user: 'Carol Martinez', doc: 'Design System v2', dept: 'Design', time: '12 min ago', status: 'completed' },
                { user: 'David Kim', doc: 'Sales Playbook Update', dept: 'Sales', time: '18 min ago', status: 'completed' },
                { user: 'Emma Wilson', doc: 'Infrastructure Review', dept: 'DevOps', time: '25 min ago', status: 'processing' },
              ].map((activity, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {activity.user}
                  </td>
                  <td className="px-4 py-3">{activity.doc}</td>
                  <td className="px-4 py-3">{activity.dept}</td>
                  <td className="px-4 py-3">{activity.time}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      activity.status === 'completed'
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    )}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
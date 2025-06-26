import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CubeIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  MagicWandIcon,
  TimerIcon,
  LayersIcon
} from '@radix-ui/react-icons';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { mockData } from '@shared/utils/api';
import { cn } from '@/utils/cn';
import type { Analytics } from '@shared/types';

// Mock neural data
const neuralActivity = [
  { id: 1, type: 'documentation', status: 'processing', progress: 67 },
  { id: 2, type: 'analysis', status: 'completed', progress: 100 },
  { id: 3, type: 'prediction', status: 'active', progress: 34 },
  { id: 4, type: 'optimization', status: 'queued', progress: 0 },
];

const aiInsights = [
  {
    type: 'prediction',
    title: 'Documentation Gap Detected',
    description: 'Neural analysis predicts 3 undocumented API endpoints in authentication module',
    confidence: 92,
  },
  {
    type: 'optimization',
    title: 'Performance Enhancement Available',
    description: 'AI suggests parallel processing could reduce documentation time by 47%',
    confidence: 88,
  },
  {
    type: 'anomaly',
    title: 'Unusual Pattern Detected',
    description: 'Code complexity spike detected in payment processing module',
    confidence: 76,
  },
];

export default function DashboardPage() {
  const { metrics } = useWebSocket();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('realtime');

  useEffect(() => {
    setAnalytics(mockData.analytics);
  }, []);

  const neuralMetrics = [
    {
      label: 'Neural Processing',
      value: '2.7 THz',
      change: '+12%',
      icon: CubeIcon,
      color: 'neural-blue',
    },
    {
      label: 'Quantum Efficiency',
      value: '99.7%',
      change: '+0.3%',
      icon: LightningBoltIcon,
      color: 'neural-purple',
    },
    {
      label: 'Predictions Made',
      value: '1,247',
      change: '+89',
      icon: MagicWandIcon,
      color: 'neural-pink',
    },
    {
      label: 'Time Saved',
      value: '428 hrs',
      change: '+24%',
      icon: TimerIcon,
      color: 'neural-cyan',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Neural Command Center
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time AI documentation intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 glass rounded-lg text-sm text-white bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-neural-blue/50"
          >
            <option value="realtime">Real-time</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button className="px-4 py-2 bg-gradient-to-r from-neural-blue to-neural-purple rounded-lg text-white font-medium hover:opacity-90 transition-opacity">
            Neural Report
          </button>
        </div>
      </div>

      {/* Neural Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {neuralMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="ai-card group"
          >
            <div className="flex items-start justify-between mb-4">
              <metric.icon className={cn(
                "w-8 h-8",
                metric.color === 'neural-blue' && "text-neural-blue",
                metric.color === 'neural-purple' && "text-neural-purple",
                metric.color === 'neural-pink' && "text-neural-pink",
                metric.color === 'neural-cyan' && "text-neural-cyan"
              )} />
              <span className="text-xs text-neural-green">
                {metric.change}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-1">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-white">
              {metric.value}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: `var(--${metric.color})` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Neural Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2 ai-card"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ActivityLogIcon className="w-5 h-5 text-neural-blue" />
            Neural Activity Stream
          </h3>
          <div className="space-y-4">
            {neuralActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activity.status === 'processing' && "bg-neural-purple animate-pulse",
                  activity.status === 'completed' && "bg-neural-green",
                  activity.status === 'active' && "bg-neural-blue animate-pulse",
                  activity.status === 'queued' && "bg-gray-500"
                )} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white capitalize">
                      {activity.type} Neural Process
                    </span>
                    <span className="text-xs text-gray-400">
                      {activity.status}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neural-blue to-neural-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${activity.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {activity.progress}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="ai-card"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MagicWandIcon className="w-5 h-5 text-neural-purple" />
            AI Insights
          </h3>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-3 glass rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">
                    {insight.title}
                  </h4>
                  <span className="text-xs text-neural-cyan">
                    {insight.confidence}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {insight.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    insight.type === 'prediction' && "bg-neural-blue/20 text-neural-blue",
                    insight.type === 'optimization' && "bg-neural-purple/20 text-neural-purple",
                    insight.type === 'anomaly' && "bg-neural-pink/20 text-neural-pink"
                  )}>
                    {insight.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Holographic Data Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="ai-card"
      >
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <LayersIcon className="w-5 h-5 text-neural-cyan" />
          4D Documentation Timeline
        </h3>
        <div className="h-64 relative overflow-hidden rounded-lg">
          {/* Simulated 3D visualization */}
          <div className="absolute inset-0 cyber-grid opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                className="w-32 h-32 border-2 border-neural-cyan rounded-lg"
                animate={{
                  rotateY: [0, 360],
                  rotateX: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: 1000,
                }}
              >
                <div className="absolute inset-2 bg-neural-blue/20 rounded"></div>
              </motion.div>
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-neural-purple rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-gray-400">
              <div>Time: {new Date().toLocaleTimeString()}</div>
              <div>Dimension: Documentation</div>
              <div>Neural Sync: Active</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live Neural Feed */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="glass rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Live Neural Feed</span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-neural-cyan">
                DOCS: {metrics.docsCreatedToday}
              </span>
              <span className="text-neural-purple">
                NODES: {metrics.activeUsers}
              </span>
              <span className="text-neural-pink">
                QUEUE: {metrics.processingQueue}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
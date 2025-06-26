import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  PlayIcon,
  CpuChipIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import YouTubeAnalyzer from '@/components/analysis/YouTubeAnalyzer'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentAnalyses from '@/components/dashboard/RecentAnalyses'
import KnowledgeGraphPreview from '@/components/dashboard/KnowledgeGraphPreview'

const Dashboard: React.FC = () => {
  const [showAnalyzer, setShowAnalyzer] = useState(false)

  // Fetch dashboard data
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000,
  })

  const { data: graphStats } = useQuery({
    queryKey: ['knowledge-graph-stats'],
    queryFn: api.getKnowledgeGraphStats,
    refetchInterval: 60000,
  })

  const { data: recentAnalyses } = useQuery({
    queryKey: ['recent-analyses'],
    queryFn: () => api.getAnalysisHistory(5),
    refetchInterval: 30000,
  })

  const { data: graphittiHealth } = useQuery({
    queryKey: ['graphitti-health'],
    queryFn: api.getGraphittiHealth,
    refetchInterval: 60000,
  })

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aegntic-600/20 via-aegntic-500/10 to-transparent border border-aegntic-600/30 p-8"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-2xl">
              <motion.h1
                className="text-4xl font-bold gradient-text mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                YouTube Intelligence Engine
              </motion.h1>
              <motion.p
                className="text-lg text-neural-300 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Transform YouTube content into actionable insights and intelligent 
                suggestions for the DailyDoco Pro ecosystem.
              </motion.p>
              <motion.div
                className="flex items-center space-x-4 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ pointerEvents: 'auto' }}
              >
                <button
                  onClick={() => {
                    console.log('Button clicked!');
                    setShowAnalyzer(true);
                  }}
                  className="neural-button flex items-center space-x-2 px-6 py-3 text-lg neural-glow-hover relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <PlayIcon className="w-5 h-5" />
                  <span>Analyze YouTube URL</span>
                </button>
                <button className="neural-button-secondary flex items-center space-x-2 px-6 py-3">
                  <EyeIcon className="w-5 h-5" />
                  <span>View Knowledge Graph</span>
                </button>
              </motion.div>
            </div>
            
            {/* Animated Neural Network Visualization */}
            <motion.div
              className="hidden lg:block w-64 h-64 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-aegntic-500/20 to-aegntic-600/20 rounded-full animate-neural-pulse" />
              <div className="absolute inset-4 bg-gradient-to-br from-aegntic-400/15 to-aegntic-500/15 rounded-full animate-neural-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-8 bg-gradient-to-br from-aegntic-300/10 to-aegntic-400/10 rounded-full animate-neural-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <CpuChipIcon className="w-16 h-16 text-aegntic-400" />
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')"
          }} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards 
        systemHealth={systemHealth}
        graphStats={graphStats}
        graphittiHealth={graphittiHealth}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Analyses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <RecentAnalyses analyses={recentAnalyses} />
        </motion.div>

        {/* Knowledge Graph Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <KnowledgeGraphPreview stats={graphStats} />
        </motion.div>
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="neural-card p-6"
      >
        <h3 className="text-lg font-semibold text-neural-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-neural-800/50 hover:bg-neural-800 transition-colors border border-neural-700 hover:border-neural-600">
            <PlayIcon className="w-5 h-5 text-aegntic-400" />
            <div className="text-left">
              <p className="font-medium text-neural-100">New Analysis</p>
              <p className="text-sm text-neural-400">Analyze YouTube content</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-neural-800/50 hover:bg-neural-800 transition-colors border border-neural-700 hover:border-neural-600">
            <ChartBarIcon className="w-5 h-5 text-aegntic-400" />
            <div className="text-left">
              <p className="font-medium text-neural-100">Export Graph</p>
              <p className="text-sm text-neural-400">Download knowledge data</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-neural-800/50 hover:bg-neural-800 transition-colors border border-neural-700 hover:border-neural-600">
            <DocumentDuplicateIcon className="w-5 h-5 text-aegntic-400" />
            <div className="text-left">
              <p className="font-medium text-neural-100">Create Snapshot</p>
              <p className="text-sm text-neural-400">Version checkpoint</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-neural-800/50 hover:bg-neural-800 transition-colors border border-neural-700 hover:border-neural-600">
            <BoltIcon className="w-5 h-5 text-aegntic-400" />
            <div className="text-left">
              <p className="font-medium text-neural-100">Optimize Graph</p>
              <p className="text-sm text-neural-400">Performance tuning</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* YouTube Analyzer Modal */}
      {showAnalyzer && (
        <YouTubeAnalyzer onClose={() => setShowAnalyzer(false)} />
      )}
    </div>
  )
}

export default Dashboard
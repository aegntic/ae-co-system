import React from 'react'
import { motion } from 'framer-motion'
import { 
  CpuChipIcon, 
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const Header: React.FC = () => {
  // Fetch system health status
  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <header className="bg-neural-900/30 backdrop-blur-sm border-b border-neural-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-aegntic-500 to-aegntic-600 rounded-lg flex items-center justify-center neural-glow">
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  YouTube Intelligence Engine
                </h1>
                <p className="text-sm text-neural-400">
                  Aegntic.ai Ecosystem
                </p>
              </div>
            </motion.div>
          </div>

          {/* System Status */}
          <motion.div
            className="flex items-center space-x-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Health Score */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                healthData?.health_score > 0.8 
                  ? 'bg-green-500 animate-pulse-glow' 
                  : healthData?.health_score > 0.6
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`} />
              <span className="text-sm text-neural-300">
                Health: {healthData?.health_score ? `${Math.round(healthData.health_score * 100)}%` : '--'}
              </span>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center space-x-2">
              <BoltIcon className="w-4 h-4 text-aegntic-400" />
              <span className="text-sm text-neural-300">
                {healthData?.active_analyses || 0} Active
              </span>
            </div>

            {/* Knowledge Graph Size */}
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4 text-aegntic-400" />
              <span className="text-sm text-neural-300">
                {healthData?.total_concepts || 0} Concepts
              </span>
            </div>

            {/* Real-time timestamp */}
            <div className="text-xs text-neural-500 font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}

export default Header
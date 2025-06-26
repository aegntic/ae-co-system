import React from 'react'
import { motion } from 'framer-motion'
import {
  CpuChipIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  BoltIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

interface StatsCardsProps {
  systemHealth?: {
    health_score: number
    active_analyses: number
    total_concepts: number
    total_relationships: number
    recent_errors: number
    uptime: number
  }
  graphStats?: {
    total_concepts: number
    total_relationships: number
    top_concepts: Array<{ name: string; count: number; relevance: number }>
    recent_additions: Array<{ concept: string; timestamp: string }>
  }
  graphittiHealth?: {
    overall_health_score: number
    health_grade: string
    statistics: Record<string, number>
    recommendations: string[]
  }
}

const StatsCards: React.FC<StatsCardsProps> = ({
  systemHealth,
  graphStats,
  graphittiHealth
}) => {
  const cards = [
    {
      title: 'System Health',
      value: systemHealth?.health_score ? `${Math.round(systemHealth.health_score * 100)}%` : '--',
      subtitle: systemHealth?.active_analyses ? `${systemHealth.active_analyses} active analyses` : 'No active analyses',
      icon: CpuChipIcon,
      color: systemHealth?.health_score > 0.8 ? 'green' : systemHealth?.health_score > 0.6 ? 'yellow' : 'red',
      gradient: 'from-green-500/20 to-green-600/20',
      trend: systemHealth?.recent_errors === 0 ? 'up' : 'down'
    },
    {
      title: 'Knowledge Graph',
      value: graphStats?.total_concepts?.toLocaleString() || '0',
      subtitle: `${graphStats?.total_relationships?.toLocaleString() || '0'} relationships`,
      icon: ShareIcon,
      color: 'blue',
      gradient: 'from-aegntic-500/20 to-aegntic-600/20',
      trend: 'up'
    },
    {
      title: 'Graph Performance',
      value: graphittiHealth?.health_grade || '--',
      subtitle: `${Math.round((graphittiHealth?.overall_health_score || 0) * 100)}% health score`,
      icon: ChartBarIcon,
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/20',
      trend: 'up'
    },
    {
      title: 'System Uptime',
      value: systemHealth?.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h` : '--',
      subtitle: systemHealth?.recent_errors ? `${systemHealth.recent_errors} recent errors` : 'No recent errors',
      icon: ShieldCheckIcon,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      trend: systemHealth?.recent_errors === 0 ? 'up' : 'down'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className={`neural-card p-6 relative overflow-hidden group hover:neural-glow-hover transition-all duration-300`}
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Trend indicator */}
              <div className={`flex items-center space-x-1 text-xs ${
                card.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  card.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
                } animate-pulse`} />
                <span className="font-mono">
                  {card.trend === 'up' ? '↗' : '↘'}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neural-400 mb-1">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-neural-100 mb-1">
                {card.value}
              </p>
              <p className="text-sm text-neural-500">
                {card.subtitle}
              </p>
            </div>
          </div>
          
          {/* Data flow animation */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-aegntic-500/30 to-transparent data-flow-animation" />
        </motion.div>
      ))}
    </div>
  )
}

export default StatsCards
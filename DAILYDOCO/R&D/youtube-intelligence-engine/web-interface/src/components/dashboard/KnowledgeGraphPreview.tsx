import React from 'react'
import { motion } from 'framer-motion'
import {
  ShareIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface KnowledgeGraphPreviewProps {
  stats?: {
    total_concepts: number
    total_relationships: number
    top_concepts: Array<{ name: string; count: number; relevance: number }>
    recent_additions: Array<{ concept: string; timestamp: string }>
  }
}

const KnowledgeGraphPreview: React.FC<KnowledgeGraphPreviewProps> = ({ stats }) => {
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'bg-green-400/20 text-green-400'
    if (relevance >= 0.6) return 'bg-yellow-400/20 text-yellow-400'
    return 'bg-blue-400/20 text-blue-400'
  }

  if (!stats) {
    return (
      <div className="neural-card p-6">
        <h3 className="text-lg font-semibold text-neural-100 mb-4 flex items-center">
          <ShareIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          Knowledge Graph
        </h3>
        <div className="text-center py-8">
          <ShareIcon className="w-12 h-12 text-neural-600 mx-auto mb-4" />
          <p className="text-neural-400 mb-2">Loading graph data...</p>
          <p className="text-sm text-neural-500">
            Knowledge graph is building connections
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="neural-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neural-100 flex items-center">
          <ShareIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          Knowledge Graph
        </h3>
        <button className="text-sm text-aegntic-400 hover:text-aegntic-300 transition-colors flex items-center space-x-1">
          <span>Explore</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-neural-100">
                {(stats.total_concepts || 0).toLocaleString()}
              </p>
              <p className="text-sm text-neural-400">Concepts</p>
            </div>
            <SparklesIcon className="w-8 h-8 text-aegntic-400" />
          </div>
        </div>
        
        <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-neural-100">
                {(stats.total_relationships || 0).toLocaleString()}
              </p>
              <p className="text-sm text-neural-400">Connections</p>
            </div>
            <ShareIcon className="w-8 h-8 text-aegntic-400" />
          </div>
        </div>
      </div>

      {/* Top Concepts */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neural-300 mb-3 flex items-center">
          <ChartBarIcon className="w-4 h-4 mr-1" />
          Top Concepts
        </h4>
        <div className="space-y-2">
          {(stats.top_concepts || []).slice(0, 4).map((concept, index) => (
            <motion.div
              key={concept.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-neural-800/20 rounded-lg border border-neural-700/50 hover:border-neural-600/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-aegntic-400 rounded-full" />
                <span className="text-sm font-medium text-neural-200">
                  {concept.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(concept.relevance)}`}>
                  {Math.round(concept.relevance * 100)}%
                </span>
                <span className="text-xs text-neural-500 font-mono">
                  {concept.count}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Additions */}
      <div>
        <h4 className="text-sm font-medium text-neural-300 mb-3 flex items-center">
          <SparklesIcon className="w-4 h-4 mr-1" />
          Recent Additions
        </h4>
        <div className="space-y-2">
          {(stats.recent_additions || []).slice(0, 3).map((addition, index) => (
            <motion.div
              key={`${addition.concept}-${addition.timestamp}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neural-800/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-neural-300">
                  {addition.concept}
                </span>
              </div>
              <span className="text-xs text-neural-500">
                {formatTimeAgo(addition.timestamp)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Graph Visualization Preview */}
      <div className="mt-6 p-4 bg-neural-800/20 rounded-lg border border-neural-700/50">
        <div className="flex items-center justify-center h-24 relative">
          {/* Animated nodes */}
          <motion.div
            className="absolute w-3 h-3 bg-aegntic-400 rounded-full"
            animate={{ 
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-aegntic-300 rounded-full"
            animate={{ 
              x: [0, -25, 15, 0],
              y: [0, 20, -5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-2.5 h-2.5 bg-aegntic-500 rounded-full"
            animate={{ 
              x: [0, 15, -20, 0],
              y: [0, -20, 8, 0]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Connections */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border border-aegntic-400/30 rounded-full animate-pulse" />
            <div className="absolute w-8 h-8 border border-aegntic-300/20 rounded-full animate-pulse" />
          </div>
          
          <p className="text-xs text-neural-500 mt-8">
            Interactive visualization available in full view
          </p>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeGraphPreview
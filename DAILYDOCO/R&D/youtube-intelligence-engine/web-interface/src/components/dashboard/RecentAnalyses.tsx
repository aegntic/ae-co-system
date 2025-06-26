import React from 'react'
import { motion } from 'framer-motion'
import {
  PlayIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Analysis {
  analysis_id: string
  url: string
  content: {
    title: string
    description: string
    duration: number
  }
  analysis: {
    summary: string
    relevance_score: number
    implementation_complexity: number
  }
  actions: Array<{
    type: string
    title: string
    feasibility_score: number
  }>
  processing_time: number
  timestamp: string
}

interface RecentAnalysesProps {
  analyses?: Analysis[]
}

const RecentAnalyses: React.FC<RecentAnalysesProps> = ({ analyses = [] }) => {
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400 bg-green-400/20'
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-400/20'
    return 'text-red-400 bg-red-400/20'
  }

  const getComplexityColor = (score: number) => {
    if (score <= 0.3) return 'text-green-400'
    if (score <= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (analyses.length === 0) {
    return (
      <div className="neural-card p-6">
        <h3 className="text-lg font-semibold text-neural-100 mb-4 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          Recent Analyses
        </h3>
        <div className="text-center py-8">
          <PlayIcon className="w-12 h-12 text-neural-600 mx-auto mb-4" />
          <p className="text-neural-400 mb-2">No analyses yet</p>
          <p className="text-sm text-neural-500">
            Start by analyzing a YouTube URL to see results here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="neural-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neural-100 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          Recent Analyses
        </h3>
        <button className="text-sm text-aegntic-400 hover:text-aegntic-300 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {analyses.map((analysis, index) => (
          <motion.div
            key={analysis.analysis_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-neural-800/30 rounded-lg p-4 border border-neural-700 hover:border-neural-600 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neural-100 truncate group-hover:text-aegntic-300 transition-colors">
                  {analysis.content.title}
                </h4>
                <p className="text-sm text-neural-400 mt-1 line-clamp-2">
                  {analysis.analysis.summary}
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className="text-xs text-neural-500">
                  {formatTimeAgo(analysis.timestamp)}
                </p>
                <p className="text-xs text-neural-600 mt-1">
                  {formatDuration(analysis.content.duration)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Relevance Score */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neural-500">Relevance:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(analysis.analysis.relevance_score)}`}>
                    {Math.round(analysis.analysis.relevance_score * 100)}%
                  </span>
                </div>

                {/* Complexity */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neural-500">Complexity:</span>
                  <span className={`text-xs ${getComplexityColor(analysis.analysis.implementation_complexity)}`}>
                    {analysis.analysis.implementation_complexity <= 0.3 ? 'Low' : 
                     analysis.analysis.implementation_complexity <= 0.7 ? 'Medium' : 'High'}
                  </span>
                </div>

                {/* Actions Count */}
                <div className="flex items-center space-x-1 text-xs text-neural-500">
                  <ChartBarIcon className="w-3 h-3" />
                  <span>{analysis.actions.length} actions</span>
                </div>
              </div>

              <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-xs text-aegntic-400 hover:text-aegntic-300">
                <EyeIcon className="w-4 h-4" />
                <span>View</span>
              </button>
            </div>

            {/* Processing time indicator */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {analysis.actions.slice(0, 3).map((action, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-neural-700/50 text-neural-300 px-2 py-1 rounded-md"
                  >
                    {action.type.replace('_', ' ')}
                  </span>
                ))}
                {analysis.actions.length > 3 && (
                  <span className="text-xs text-neural-500">
                    +{analysis.actions.length - 3} more
                  </span>
                )}
              </div>
              <span className="text-xs text-neural-600 font-mono">
                {analysis.processing_time.toFixed(1)}s
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default RecentAnalyses
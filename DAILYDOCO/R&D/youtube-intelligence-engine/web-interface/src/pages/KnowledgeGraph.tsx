import React from 'react'
import { motion } from 'framer-motion'
import { ShareIcon } from '@heroicons/react/24/outline'

const KnowledgeGraph: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Knowledge Graph</h1>
        <p className="text-neural-400">
          Explore interconnected concepts and relationships
        </p>
      </div>

      <div className="neural-card p-8 text-center">
        <ShareIcon className="w-16 h-16 text-neural-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neural-200 mb-2">
          Interactive Graph Visualization Coming Soon
        </h2>
        <p className="text-neural-400 mb-4">
          3D network visualization, concept clustering, and relationship exploration.
        </p>
        <p className="text-sm text-neural-500">
          The knowledge graph is actively building connections in the background.
        </p>
      </div>
    </motion.div>
  )
}

export default KnowledgeGraph
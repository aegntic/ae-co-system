import React from 'react'
import { motion } from 'framer-motion'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'

const Graphitti: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Graphitti v2.0</h1>
        <p className="text-neural-400">
          Advanced knowledge graph versioning and evolution tracking
        </p>
      </div>

      <div className="neural-card p-8 text-center">
        <DocumentDuplicateIcon className="w-16 h-16 text-neural-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neural-200 mb-2">
          Version Management Dashboard Coming Soon
        </h2>
        <p className="text-neural-400 mb-4">
          Snapshot management, iteration comparisons, and automated scheduling.
        </p>
        <p className="text-sm text-neural-500">
          Graphitti is actively tracking changes and creating automated snapshots.
        </p>
      </div>
    </motion.div>
  )
}

export default Graphitti
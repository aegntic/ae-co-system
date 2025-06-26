import React from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const Analysis: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Analysis Center</h1>
        <p className="text-neural-400">
          Detailed YouTube content analysis and action management
        </p>
      </div>

      <div className="neural-card p-8 text-center">
        <MagnifyingGlassIcon className="w-16 h-16 text-neural-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neural-200 mb-2">
          Analysis Dashboard Coming Soon
        </h2>
        <p className="text-neural-400 mb-4">
          Advanced analysis features, batch processing, and detailed results management.
        </p>
        <p className="text-sm text-neural-500">
          Use the main dashboard to perform individual analyses for now.
        </p>
      </div>
    </motion.div>
  )
}

export default Analysis
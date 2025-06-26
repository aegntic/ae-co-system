import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { DeepAnalysisProgress as ProgressType } from '../../services/deepAnalysisOrchestrator';

interface DeepAnalysisProgressProps {
  progress: ProgressType;
}

export const DeepAnalysisProgress: React.FC<DeepAnalysisProgressProps> = ({ progress }) => {
  const stageIcons: Record<string, string> = {
    repository: 'FolderTree',
    insights: 'Brain',
    diagrams: 'GitBranchPlus',
    content: 'FileText',
    pages: 'Layers',
    optimization: 'Zap'
  };

  const stageColors: Record<string, string> = {
    repository: 'from-blue-500 to-blue-600',
    insights: 'from-purple-500 to-purple-600',
    diagrams: 'from-green-500 to-green-600',
    content: 'from-yellow-500 to-yellow-600',
    pages: 'from-orange-500 to-orange-600',
    optimization: 'from-red-500 to-red-600'
  };

  const formatETA = (seconds: number): string => {
    if (seconds <= 0) return 'Complete';
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
        {/* Icon and Title */}
        <div className="flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${stageColors[progress.stage]} p-4`}
          >
            <Icon name={stageIcons[progress.stage]} className="w-full h-full text-white" />
          </motion.div>
        </div>

        {/* Main Message */}
        <h3 className="text-2xl font-bold text-center mb-4 text-white">
          {progress.message}
        </h3>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${stageColors[progress.stage]}`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white drop-shadow-lg">
              {progress.progress}%
            </span>
          </div>
        </div>

        {/* ETA */}
        {progress.eta !== undefined && (
          <p className="text-center text-gray-400 mb-6">
            <Icon name="Clock" size={16} className="inline mr-2" />
            {formatETA(progress.eta)}
          </p>
        )}

        {/* Substeps */}
        {progress.substeps && progress.substeps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-2">Current tasks:</p>
            {progress.substeps.map((substep, index) => (
              <motion.div
                key={substep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-wu-gold animate-pulse" />
                <span className="text-gray-300">{substep}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stage Progress Indicators */}
        <div className="mt-8 grid grid-cols-6 gap-2">
          {['repository', 'insights', 'diagrams', 'content', 'pages', 'optimization'].map((stage) => (
            <div key={stage} className="text-center">
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                  progress.stage === stage
                    ? `bg-gradient-to-br ${stageColors[stage]} scale-110`
                    : progress.progress > 
                      (stage === 'repository' ? 0 :
                       stage === 'insights' ? 30 :
                       stage === 'diagrams' ? 50 :
                       stage === 'content' ? 65 :
                       stage === 'pages' ? 85 : 95)
                    ? 'bg-gray-600'
                    : 'bg-gray-700'
                }`}
              >
                <Icon 
                  name={stageIcons[stage]} 
                  size={20} 
                  className={progress.stage === stage || progress.progress > 
                    (stage === 'repository' ? 0 :
                     stage === 'insights' ? 30 :
                     stage === 'diagrams' ? 50 :
                     stage === 'content' ? 65 :
                     stage === 'pages' ? 85 : 95)
                    ? 'text-white' : 'text-gray-500'
                  }
                />
              </div>
              <p className="text-xs mt-1 text-gray-500 capitalize">{stage}</p>
            </div>
          ))}
        </div>

        {/* Fun Facts */}
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-sm text-gray-400 text-center">
            <Icon name="Sparkles" size={16} className="inline mr-2 text-wu-gold" />
            {progress.stage === 'repository' && 'Analyzing your codebase structure and dependencies...'}
            {progress.stage === 'insights' && 'AI is understanding your project\'s purpose and architecture...'}
            {progress.stage === 'diagrams' && 'Creating visual representations of your system...'}
            {progress.stage === 'content' && 'Generating comprehensive documentation pages...'}
            {progress.stage === 'pages' && 'Building your multi-page professional site...'}
            {progress.stage === 'optimization' && 'Final touches for perfect performance...'}
          </p>
        </div>
      </div>
    </div>
  );
};
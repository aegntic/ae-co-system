import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

interface GenerationModeSelectorProps {
  onSelectMode: (mode: 'quick' | 'deep') => void;
  onClose: () => void;
}

export const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({ onSelectMode, onClose }) => {
  const modes = [
    {
      id: 'quick' as const,
      title: 'Quick Generation',
      subtitle: '15 seconds • Single page',
      description: 'Perfect for a fast, beautiful landing page from your README',
      features: [
        'AI-generated hero visuals',
        'Responsive single-page site',
        'SEO optimized',
        'Instant preview'
      ],
      icon: 'Zap',
      color: 'from-blue-500 to-purple-500',
      borderColor: 'border-blue-500/50',
      time: '~15 seconds'
    },
    {
      id: 'deep' as const,
      title: 'Deep Analysis',
      subtitle: '2-5 minutes • Multi-page',
      description: 'Comprehensive repository analysis for professional documentation sites',
      features: [
        'Complete file structure analysis',
        'Architecture diagrams',
        'Multi-page documentation',
        'API reference generation',
        'Code insights & metrics'
      ],
      icon: 'Brain',
      color: 'from-green-500 to-teal-500',
      borderColor: 'border-green-500/50',
      time: '2-5 minutes'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3 text-white">
            Choose Your Generation Mode
          </h2>
          <p className="text-gray-400">
            Select how deeply you want to analyze your repository
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {modes.map((mode) => (
            <motion.div
              key={mode.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`p-6 cursor-pointer border-2 ${mode.borderColor} hover:border-opacity-100 transition-all duration-300 h-full`}
                onClick={() => onSelectMode(mode.id)}
              >
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{mode.title}</h3>
                    <p className="text-sm text-gray-400">{mode.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} p-3`}>
                    <Icon name={mode.icon} className="w-full h-full text-white" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6">{mode.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {mode.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Icon name="CheckCircle" size={16} className="text-wu-gold flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Time Indicator */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon name="Clock" size={16} />
                    <span>{mode.time}</span>
                  </div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-1 text-wu-gold text-sm font-medium"
                  >
                    <span>Select</span>
                    <Icon name="ArrowRight" size={16} />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold mb-4 text-white">Quick Comparison</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div></div>
            <div className="text-center font-medium text-gray-300">Quick</div>
            <div className="text-center font-medium text-gray-300">Deep</div>
            
            {[
              ['Generation Time', '~15s', '2-5 min'],
              ['Number of Pages', '1', '5-10+'],
              ['Repository Analysis', 'README only', 'Full codebase'],
              ['Diagrams', '❌', '✅'],
              ['API Documentation', '❌', '✅'],
              ['Quality Metrics', 'Basic', 'Comprehensive']
            ].map(([label, quick, deep]) => (
              <React.Fragment key={label}>
                <div className="text-gray-400">{label}</div>
                <div className="text-center text-gray-300">{quick}</div>
                <div className="text-center text-gray-300">{deep}</div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
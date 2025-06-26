import React from 'react';
import { motion } from 'framer-motion';
import { GenerationProgress } from '../../services/multiModalOrchestrator';

interface GlassLoadingIndicatorProps {
  message?: string;
  progress?: GenerationProgress;
}

export const GlassLoadingIndicator: React.FC<GlassLoadingIndicatorProps> = ({ 
  message = "Processing...", 
  progress 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-container max-w-2xl w-full mx-4"
    >
      <div className="relative">
        {/* Glass layers */}
        <div className="absolute z-0 inset-0 backdrop-blur-md glass-filter overflow-hidden isolate rounded-3xl" />
        <div className="z-10 absolute inset-0 bg-white bg-opacity-15 rounded-3xl" />
        <div className="glass-inner-shadow rounded-3xl" />
        
        {/* Content */}
        <div className="z-30 relative p-12 text-center">
          {/* Animated loader */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle ring */}
            <motion.div
              className="absolute inset-4 rounded-full border-4 border-white/30 border-t-white/80"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner circle */}
            <motion.div
              className="absolute inset-8 rounded-full bg-gradient-to-br from-white/40 to-white/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="glass-inner-shadow rounded-full" />
            </motion.div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl font-bold text-white"
              >
                4
              </motion.div>
            </div>
          </div>

          {/* Status text */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-light text-white mb-3"
          >
            Creating Your Website
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-normal text-white/70 mb-8"
          >
            {progress?.message || message}
          </motion.p>

          {/* Progress bar */}
          <div className="max-w-sm mx-auto">
            <div className="glass-input h-3 rounded-full overflow-hidden">
              <div className="glass-input-shadow rounded-full" />
              <motion.div
                className="relative z-30 h-full bg-gradient-to-r from-white/60 to-white/40 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: progress ? `${progress.progress}%` : "60%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 glass-shimmer" />
              </motion.div>
            </div>
            
            {progress && (
              <div className="mt-2 text-xs text-white/60">
                {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)} • {progress.progress}%
              </div>
            )}
          </div>

          {/* Status steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex justify-center gap-6"
          >
            {['Analyzing', 'Generating', 'Finalizing'].map((step, index) => (
              <motion.div
                key={step}
                className="flex items-center gap-2"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-xs text-white/60">{step}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-4 glass-card max-w-sm mx-auto"
          >
            <div className="glass-card-content">
              <p className="text-xs text-white/70">
                <span className="font-medium text-white/90">Did you know?</span> Your site will automatically 
                update when you push changes to your repository.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
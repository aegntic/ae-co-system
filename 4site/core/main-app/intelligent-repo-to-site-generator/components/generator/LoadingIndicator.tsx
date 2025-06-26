
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { GenerationProgress } from '../../services/multiModalOrchestrator';

interface LoadingIndicatorProps {
  message?: string;
  progress?: GenerationProgress;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = "Processing...", progress }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center p-12 bg-gh-bg-secondary/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gh-border-default relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Subtle background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-wu-gold-subtle via-transparent to-white/5"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        style={{ backgroundSize: '200% 200%' }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-wu-gold/20 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      <div className="relative z-10">
        {/* Spinning loader with multiple rings */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Icon name="LoaderCircle" size={80} className="text-wu-gold" />
          </motion.div>
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Icon name="LoaderCircle" size={60} className="text-wu-gold-muted opacity-60" />
          </motion.div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Icon name="LoaderCircle" size={40} className="text-text-muted opacity-40" />
          </motion.div>
        </div>

        <motion.h2 
          className="text-3xl font-bold text-gradient-wu mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Hold Tight!
        </motion.h2>
        
        <motion.p 
          className="text-gh-text-secondary max-w-sm font-mono text-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {progress?.message || message}
        </motion.p>

        {/* Enhanced progress bar with actual progress */}
        <div className="w-full bg-gh-bg-tertiary rounded-full h-3 overflow-hidden border border-gh-border-default shadow-inner mb-2">
          {progress ? (
            <motion.div 
              className="bg-wu-gold h-3 rounded-full relative"
              initial={{ width: "0%" }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
              }}
            />
          ) : (
            <motion.div 
              className="bg-wu-gold h-3 rounded-full relative"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              style={{
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
              }}
            />
          )}
        </div>

        {progress && (
          <div className="text-xs text-gh-text-muted mb-4">
            {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)} • {progress.progress}%
          </div>
        )}

        <motion.div
          className="mt-6 flex items-center justify-center space-x-2 text-sm text-gh-text-muted font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {progress?.stage === 'visuals' 
              ? 'Creating visuals powered by aegntic.ai with FLUX.1'
              : progress?.stage === 'finalizing'
              ? 'Finalizing your incredible site'
              : 'Project 4site by aegntic.ai is analyzing the repository'
            }
          </motion.span>
        </motion.div>

        {/* Status indicators */}
        <motion.div
          className="mt-6 flex justify-center space-x-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {['Content', 'Visuals', 'Finalizing'].map((step, index) => (
            <motion.div
              key={step}
              className="flex items-center space-x-2 text-xs font-mono"
              animate={{
                color: [
                  'rgb(107, 114, 126)',  // muted
                  'rgb(255, 215, 0)',    // wu-gold
                  'rgb(107, 114, 126)'   // muted
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: index * 0.5,
              }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-current"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              />
              <span>{step}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

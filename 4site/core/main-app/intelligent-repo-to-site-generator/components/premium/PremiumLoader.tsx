import React from 'react';
import { motion } from 'framer-motion';

interface PremiumLoaderProps {
  progress?: any;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ progress }) => {
  return (
    <div className="premium-loader-container">
      <div className="premium-loader">
        <div className="premium-loader-ring" />
        <div className="premium-loader-ring" />
        <div className="premium-loader-ring" />
      </div>
      
      {progress && (
        <motion.div 
          className="premium-loader-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="premium-heading-3">{progress.message || 'Generating...'}</h3>
          <div className="premium-progress-bar">
            <motion.div 
              className="premium-progress-fill"
              animate={{ width: `${progress.progress}%` }}
            >
              <div className="premium-progress-glow" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
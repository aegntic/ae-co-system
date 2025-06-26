import React from 'react';
import { motion } from 'framer-motion';

export const NeuralBranding: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
        {/* 4site.pro Logo */}
        <img 
          src="/4sitepro-logo.png" 
          alt="4site.pro" 
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-contain filter drop-shadow-sm"
          onError={(e) => {
            // Fallback to gradient design if logo fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling!.style.display = 'flex';
          }}
        />
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center" style={{display: 'none'}}>
          <div className="text-xs font-bold text-black">4</div>
        </div>
        
        <div className="text-xs sm:text-sm text-white/80 font-medium">
          Made with <span className="text-white font-semibold">4site.pro</span>
        </div>
      </div>
    </motion.div>
  );
};
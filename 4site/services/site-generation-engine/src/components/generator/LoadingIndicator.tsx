
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon'; // Adjusted

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = "Processing..." }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/80 rounded-xl shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <Icon name="LoaderCircle" size={64} className="text-accent mb-6" />
      </motion.div>
      <h2 className="text-2xl font-semibold text-sky-300 mb-2">Hold Tight!</h2>
      <p className="text-slate-300 max-w-sm">{message}</p>
      <div className="w-full bg-slate-700 rounded-full h-2.5 mt-6 overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-sky-500 to-teal-500 h-2.5 rounded-full"
          initial={{ x: "-100%" }}
          animate={{ x: "0%"}}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'mirror', ease: "easeInOut" }}
         />
      </div>
       <p className="text-xs text-slate-400 mt-4">
        Project4Site AI is analyzing the repository and crafting your site...
      </p>
    </motion.div>
  );
};

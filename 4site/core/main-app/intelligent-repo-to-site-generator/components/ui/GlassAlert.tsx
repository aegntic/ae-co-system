import React from 'react';
import { motion } from 'framer-motion';

interface GlassAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const GlassAlert: React.FC<GlassAlertProps> = ({ type, message }) => {
  const typeStyles = {
    success: {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-400/20 to-emerald-400/20',
      borderColor: 'border-green-400/30'
    },
    error: {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-red-400/20 to-rose-400/20',
      borderColor: 'border-red-400/30'
    },
    warning: {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'from-amber-400/20 to-orange-400/20',
      borderColor: 'border-amber-400/30'
    },
    info: {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-400/20 to-cyan-400/20',
      borderColor: 'border-blue-400/30'
    }
  };

  const { icon, color, borderColor } = typeStyles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card overflow-visible"
    >
      <div className="glass-card-content">
        <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl blur-xl opacity-50`} />
        <div className={`relative flex items-start gap-3 p-4 border ${borderColor} rounded-2xl`}>
          <div className="flex-shrink-0 text-white/80">
            {icon}
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  onClose?: () => void;
  variant?: 'default' | 'futuristic';
}

export const Alert: React.FC<AlertProps> = ({ 
  message, 
  type = 'info', 
  className = '', 
  onClose,
  variant = 'default'
}) => {
  const alertStyles = {
    base: "p-4 rounded-lg flex items-start text-sm font-medium relative overflow-hidden backdrop-blur-sm",
    success: variant === 'futuristic' 
      ? "bg-success/10 text-success border-2 border-success/30 shadow-lg shadow-success/20" 
      : "bg-success/20 text-success border border-success/40",
    error: variant === 'futuristic'
      ? "bg-error/10 text-error border-2 border-error/30 shadow-lg shadow-error/20"
      : "bg-error/20 text-error border border-error/40",
    warning: variant === 'futuristic'
      ? "bg-wu-gold-subtle text-wu-gold border-2 border-wu-gold/30 shadow-lg shadow-wu-gold/20"
      : "bg-wu-gold-subtle text-wu-gold border border-wu-gold/40",
    info: variant === 'futuristic'
      ? "bg-wu-gold-subtle text-wu-gold border-2 border-wu-gold/30 shadow-lg shadow-wu-gold/20"
      : "bg-wu-gold-subtle text-wu-gold border border-wu-gold/40",
  };

  const iconMap = {
    success: 'CheckCircle2',
    error: 'AlertTriangle',
    warning: 'AlertCircle',
    info: 'Info',
  };

  const glowColors = {
    success: 'rgba(34, 197, 94, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(255, 215, 0, 0.1)',
    info: 'rgba(255, 215, 0, 0.1)',
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={`${alertStyles.base} ${alertStyles[type]} ${className}`} 
        role="alert"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {variant === 'futuristic' && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(45deg, ${glowColors[type]}, transparent, ${glowColors[type]})`,
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        
        <motion.div
          className="relative z-10 flex items-start w-full"
          initial={{ x: -10 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <Icon name={iconMap[type]} size={20} className="mr-3 flex-shrink-0 mt-0.5" />
          </motion.div>
          
          <div className="flex-grow font-mono">{message}</div>
          
          {onClose && (
            <motion.button 
              onClick={onClose} 
              className="ml-4 -mr-1 -mt-1 p-1 rounded hover:bg-white/10 transition-all duration-200 hover:scale-110"
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon name="X" size={18} />
              <span className="sr-only">Close</span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

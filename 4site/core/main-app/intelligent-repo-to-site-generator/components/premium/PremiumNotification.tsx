import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumNotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

export const PremiumNotification: React.FC<PremiumNotificationProps> = ({
  type,
  message,
  onClose
}) => {
  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info'
  };
  
  return (
    <motion.div
      className={`premium-notification premium-glass premium-notification-${type}`}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <Icon name={icons[type]} size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="premium-notification-close">
        <Icon name="x" size={16} />
      </button>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

export const PremiumUserMenu: React.FC = () => {
  return (
    <motion.div className="premium-user-menu premium-glass">
      <div className="premium-user-menu-item">
        <Icon name="layout-dashboard" size={16} />
        <span>Dashboard</span>
      </div>
      <div className="premium-user-menu-item">
        <Icon name="settings" size={16} />
        <span>Settings</span>
      </div>
      <div className="premium-user-menu-item">
        <Icon name="log-out" size={16} />
        <span>Sign Out</span>
      </div>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumNavigationProps {
  user: any;
  profile: any;
}

export const PremiumNavigation: React.FC<PremiumNavigationProps> = ({ user, profile }) => {
  return (
    <motion.nav 
      className="premium-navigation premium-glass"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="premium-nav-container">
        <div className="premium-nav-logo">
          <span className="premium-text-gradient">Project4Site</span>
        </div>
        
        <div className="premium-nav-actions">
          {user ? (
            <>
              <div className="premium-nav-tier">
                {profile?.tier || 'FREE'}
              </div>
              <button className="premium-nav-user">
                <Icon name="user" size={20} />
              </button>
            </>
          ) : (
            <button className="premium-button premium-button-glass">
              Sign In
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
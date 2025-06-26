import React from 'react';
import { motion } from 'framer-motion';

interface PoweredByFooterProps {
  siteId: string;
  isPro: boolean;
  referralCode?: string;
  style?: 'minimal' | 'standard' | 'prominent';
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export const PoweredByFooter: React.FC<PoweredByFooterProps> = ({ 
  siteId, 
  isPro, 
  referralCode,
  style = 'standard',
  position = 'bottom-right'
}) => {
  // Pro users can remove branding
  if (isPro) return null;
  
  const trackingUrl = `https://4site.pro/?ref=${referralCode || siteId}&utm_source=powered_by&utm_medium=footer&utm_campaign=viral`;
  
  const trackClick = async () => {
    try {
      // Track in analytics
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'powered_by_click',
          siteId,
          source: 'footer',
          referralCode: referralCode || siteId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const styleVariants = {
    minimal: {
      container: 'px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full',
      text: 'text-xs',
      logo: 'text-xs',
      animation: { scale: [1, 1.05, 1] }
    },
    standard: {
      container: 'px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 hover:border-white/20',
      text: 'text-sm',
      logo: 'text-sm font-semibold',
      animation: { scale: [1, 1.1, 1] }
    },
    prominent: {
      container: 'px-5 py-3 bg-gradient-to-r from-primary-400/20 to-primary-600/20 backdrop-blur-md rounded-lg border border-primary-400/30 hover:border-primary-400/50 shadow-lg',
      text: 'text-base',
      logo: 'text-base font-bold',
      animation: { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
    }
  };

  const variant = styleVariants[style];

  return (
    <motion.div 
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      <a 
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-2 ${variant.container} transition-all`}
        onClick={trackClick}
      >
        <span className={`${variant.text} text-white/70 group-hover:text-white/90`}>
          Powered by
        </span>
        <span className={`${variant.logo} text-white group-hover:text-primary-400 transition-colors`}>
          4site.pro
        </span>
        <motion.span 
          className={`${variant.text} text-primary-400`}
          animate={variant.animation}
          transition={{ repeat: Infinity, duration: 2, delay: 3 }}
        >
          ✨
        </motion.span>
      </a>
    </motion.div>
  );
};

// Inline styles version for embedding in generated sites
export const getPoweredByFooterHTML = (siteId: string, referralCode?: string, style: 'minimal' | 'standard' | 'prominent' = 'standard') => {
  const trackingUrl = `https://4site.pro/?ref=${referralCode || siteId}&utm_source=powered_by&utm_medium=footer&utm_campaign=viral`;
  
  const styles = {
    minimal: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: '50',
      padding: '6px 12px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      borderRadius: '9999px',
      fontSize: '12px',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    standard: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: '50',
      padding: '8px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '9999px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '14px',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    prominent: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: '50',
      padding: '12px 20px',
      background: 'linear-gradient(to right, rgba(34, 211, 238, 0.2), rgba(14, 165, 233, 0.2))',
      backdropFilter: 'blur(12px)',
      borderRadius: '8px',
      border: '1px solid rgba(34, 211, 238, 0.3)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      fontSize: '16px',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }
  };

  const selectedStyle = styles[style];
  
  return `
    <a 
      href="${trackingUrl}"
      target="_blank"
      rel="noopener noreferrer"
      style="${Object.entries(selectedStyle).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`).join('; ')}"
      onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'"
      onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'"
      onclick="
        // Track click event
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'powered_by_click',
            siteId: '${siteId}',
            source: 'footer',
            referralCode: '${referralCode || siteId}',
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);
      "
    >
      <span style="color: rgba(255, 255, 255, 0.7); font-weight: normal;">Powered by</span>
      <span style="color: white; font-weight: 600;">4site.pro</span>
      <span style="color: #22d3ee; animation: sparkle 2s infinite;">✨</span>
    </a>
    
    <style>
      @keyframes sparkle {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    </style>
  `;
};

// Component for embedding in templates
export const PoweredByFooterEmbed: React.FC<{ 
  siteId: string; 
  userTier?: string;
  referralCode?: string;
}> = ({ siteId, userTier = 'free', referralCode }) => {
  // Only show for free tier users
  if (userTier !== 'free') return null;
  
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: getPoweredByFooterHTML(siteId, referralCode, 'standard') 
      }} 
    />
  );
};
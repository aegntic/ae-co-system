import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  message: string;
  currentTier: string;
  compact?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  message, 
  currentTier,
  compact = false 
}) => {
  const getUpgradeTarget = () => {
    switch (currentTier) {
      case 'free':
        return { tier: 'Pro', price: '$29/mo' };
      case 'pro':
        return { tier: 'Business', price: '$99/mo' };
      case 'business':
        return { tier: 'Enterprise', price: 'Custom' };
      default:
        return { tier: 'Pro', price: '$29/mo' };
    }
  };

  const { tier, price } = getUpgradeTarget();

  if (compact) {
    return (
      <motion.a
        href="/pricing"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-400/25 transition-all"
      >
        <Crown className="w-4 h-4" />
        <span>Upgrade to {tier}</span>
        <ArrowRight className="w-4 h-4" />
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary-400/20 to-primary-600/20 backdrop-blur-sm rounded-lg p-4 border border-primary-400/30"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-400/20 rounded-lg">
            <Zap className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-white font-medium">{message}</p>
            <p className="text-sm text-white/60">
              Upgrade to {tier} for {price}
            </p>
          </div>
        </div>
        
        <motion.a
          href="/pricing"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Crown className="w-4 h-4" />
          <span>Upgrade Now</span>
        </motion.a>
      </div>
    </motion.div>
  );
};
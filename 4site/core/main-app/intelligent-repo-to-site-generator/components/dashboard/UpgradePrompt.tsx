import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface UpgradePromptProps {
  message: string;
  currentTier: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ message, currentTier }) => {
  const upgradePlans = [
    {
      tier: 'pro',
      price: '$29',
      period: '/month',
      features: ['Unlimited websites', 'Custom domains', 'Remove branding', 'Priority support'],
      color: 'from-blue-600 to-purple-600',
      recommended: currentTier === 'free'
    },
    {
      tier: 'business',
      price: '$99',
      period: '/month',
      features: ['Everything in Pro', 'Team collaboration', 'White-label options', 'API access'],
      color: 'from-purple-600 to-pink-600',
      recommended: currentTier === 'pro'
    },
    {
      tier: 'enterprise',
      price: 'Custom',
      period: '',
      features: ['Source code access', 'On-premise deployment', 'Custom development', 'SLA guarantees'],
      color: 'from-pink-600 to-red-600',
      recommended: currentTier === 'business'
    }
  ];

  const availablePlans = upgradePlans.filter(plan => {
    const tierOrder = ['free', 'pro', 'business', 'enterprise'];
    return tierOrder.indexOf(plan.tier) > tierOrder.indexOf(currentTier);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="glass-card p-6 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start space-x-3">
          <Icon name="alert-circle" size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-400 mb-1">Upgrade Required</h3>
            <p className="text-gray-300 mb-4">{message}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.tier}
                  className={`relative p-4 rounded-lg border ${
                    plan.recommended 
                      ? 'border-white/20 bg-white/10' 
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-semibold">
                      Recommended
                    </div>
                  )}
                  
                  <h4 className="font-semibold capitalize mb-2">{plan.tier}</h4>
                  <div className="mb-3">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-1 mb-4">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start">
                        <Icon name="check" size={14} className="text-green-400 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <a
                    href="/pricing"
                    className={`block w-full py-2 px-4 text-center rounded-lg bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity text-white font-medium text-sm`}
                  >
                    Upgrade to {plan.tier}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
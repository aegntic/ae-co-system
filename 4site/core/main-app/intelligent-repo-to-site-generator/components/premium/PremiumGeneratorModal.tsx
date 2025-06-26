import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumGeneratorModalProps {
  url: string;
  onClose: () => void;
  onGenerate: (mode: 'quick' | 'deep', options: any) => void;
  userTier: string;
}

export const PremiumGeneratorModal: React.FC<PremiumGeneratorModalProps> = ({
  url,
  onClose,
  onGenerate,
  userTier
}) => {
  const [selectedMode, setSelectedMode] = useState<'quick' | 'deep'>('quick');
  
  const modes = [
    {
      id: 'quick',
      title: 'Quick Generation',
      description: 'Perfect for MVPs and rapid prototyping',
      features: ['30 second generation', 'AI-optimized design', 'Mobile responsive'],
      icon: 'zap',
      available: true
    },
    {
      id: 'deep',
      title: 'Deep Analysis',
      description: 'Enterprise-grade analysis with advanced features',
      features: ['Full codebase analysis', 'Custom visualizations', 'Performance optimization'],
      icon: 'cpu',
      available: userTier !== 'free'
    }
  ];
  
  return (
    <div className="premium-modal-overlay active" onClick={onClose}>
      <motion.div 
        className="premium-modal premium-glass"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button onClick={onClose} className="premium-modal-close">
          <Icon name="x" size={20} />
        </button>
        
        <div className="premium-modal-content">
          <h2 className="premium-heading-2">Choose Generation Mode</h2>
          <p className="premium-body premium-text-muted">
            Repository: {url}
          </p>
          
          <div className="premium-generator-modes">
            {modes.map((mode) => (
              <motion.div
                key={mode.id}
                className={`premium-generator-mode premium-glass ${
                  selectedMode === mode.id ? 'active' : ''
                } ${!mode.available ? 'disabled' : ''}`}
                onClick={() => mode.available && setSelectedMode(mode.id as 'quick' | 'deep')}
                whileHover={mode.available ? { scale: 1.02 } : {}}
                whileTap={mode.available ? { scale: 0.98 } : {}}
              >
                <Icon name={mode.icon} size={32} />
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
                <ul>
                  {mode.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {!mode.available && (
                  <div className="premium-mode-locked">
                    <Icon name="lock" size={16} />
                    <span>Pro only</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          <button
            onClick={() => onGenerate(selectedMode, {})}
            className="premium-button premium-button-primary"
          >
            Start Generation
          </button>
        </div>
      </motion.div>
    </div>
  );
};
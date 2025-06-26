import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumTemplate {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  preview: string;
}

interface PremiumTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  userTier: 'free' | 'pro' | 'business' | 'enterprise';
}

export const PremiumTemplateSelector: React.FC<PremiumTemplateSelectorProps> = ({
  onSelectTemplate,
  userTier
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  
  // Sample premium templates (would be loaded from aeLTD collection)
  const premiumTemplates: PremiumTemplate[] = [
    {
      id: 'ae-7689edde',
      name: 'Ethereal Portfolio × aeLTD',
      price: 171,
      rating: 8,
      category: 'Portfolio',
      preview: '/templates/ethereal-preview.jpg'
    },
    {
      id: 'ae-71f9e9f1', 
      name: 'Quantum Interface Pro × aeLTD',
      price: 332,
      rating: 9,
      category: 'Agency',
      preview: '/templates/quantum-preview.jpg'
    },
    {
      id: 'ae-f925fdf1',
      name: 'Liquid Metal Commerce × aeLTD',
      price: 458,
      rating: 10,
      category: 'E-commerce', 
      preview: '/templates/liquid-preview.jpg'
    }
  ];

  const canAccessPremium = userTier !== 'free';

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">
          Premium Templates by{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            aeLTD
          </span>
        </h3>
        <p className="text-gray-400">
          {canAccessPremium 
            ? 'Select a premium template for your project'
            : 'Upgrade to Pro to access premium templates'
          }
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {premiumTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -5 }}
            onHoverStart={() => setHoveredTemplate(template.id)}
            onHoverEnd={() => setHoveredTemplate(null)}
            className={`relative group ${!canAccessPremium ? 'opacity-50' : ''}`}
          >
            <button
              onClick={() => canAccessPremium && onSelectTemplate(template.id)}
              disabled={!canAccessPremium}
              className="w-full text-left"
            >
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-500/50 transition-all">
                {/* Preview */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl font-bold text-yellow-500">
                      {template.rating}/10
                    </div>
                  </div>
                  
                  {/* Lock overlay for free users */}
                  {!canAccessPremium && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Icon name="Lock" size={32} className="text-white/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-500">{template.category}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-yellow-500">
                      ${template.price}
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full">
                      aeLTD Premium
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Hover tooltip */}
            {hoveredTemplate === template.id && canAccessPremium && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black rounded-lg text-xs whitespace-nowrap z-10"
              >
                Click to use this template
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Upgrade prompt */}
      {!canAccessPremium && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Premium templates include advanced features, animations, and exclusive designs
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full"
          >
            Upgrade to Pro
          </motion.button>
        </div>
      )}

      {/* aeLTD Badge */}
      <div className="mt-8 text-center text-xs text-gray-500">
        All templates exceed 11% modification threshold
        <br />
        #####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ
      </div>
    </div>
  );
};
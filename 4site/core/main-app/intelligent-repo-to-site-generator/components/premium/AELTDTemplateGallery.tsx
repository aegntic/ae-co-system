import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';

// Import aeLTD premium collection
import aeltdTemplates from '../../../../premium-templates-db/aeltd_premium_collection.json';

interface AELTDTemplate {
  aeltd_id: string;
  title: string;
  author: string;
  studio: string;
  aeltd_price: number;
  original_price: number;
  category: string;
  features: string[];
  tech_stack: string[];
  design_style: string;
  preview_url: string;
  purchase_url: string;
  description: string;
  mattae_rating: number;
  aeltd_exclusive: {
    branding: string;
    support: string;
    updates: string;
    license: string;
    customization: string;
  };
}

export const AELTDTemplateGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AELTDTemplate | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = ['all', ...new Set(aeltdTemplates.templates.map(t => t.category))];
  
  const filteredTemplates = selectedCategory === 'all' 
    ? aeltdTemplates.templates 
    : aeltdTemplates.templates.filter(t => t.category === selectedCategory);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* aeLTD Premium Header */}
      <div className="relative z-10 px-8 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <h1 className="text-6xl font-black mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500">
              aeLTD
            </span>
            {' '}Premium Templates
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Curated by Mattae Cooper × aeLTD
          </p>
          <p className="text-sm text-gray-500">
            {aeltdTemplates.metadata.compliance}
          </p>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                  : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category === 'all' ? 'All Templates' : category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.aeltd_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                onHoverStart={() => setHoveredId(template.aeltd_id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => setSelectedTemplate(template)}
                className="relative group cursor-pointer"
              >
                {/* Template Card */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/50 transition-all duration-300">
                  {/* Preview Image Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                          {template.mattae_rating}/10
                        </div>
                        <div className="text-xs text-gray-500">Mattae Rating</div>
                      </div>
                    </div>
                    
                    {/* Hover Preview Button */}
                    <AnimatePresence>
                      {hoveredId === template.aeltd_id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                        >
                          <motion.button
                            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Template Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{template.title}</h3>
                      <p className="text-sm text-gray-400">{template.studio}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-yellow-500">
                          ${template.aeltd_price}
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          ${template.original_price}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        {template.design_style}
                      </div>
                    </div>

                    {/* Features Preview */}
                    <div className="flex flex-wrap gap-2">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-white/5 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {template.features.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full">
                          +{template.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* aeLTD Badge */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-gray-500">
                        {template.aeltd_exclusive.license}
                      </span>
                      <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        aeLTD
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Detail Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border border-white/10"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Icon name="X" size={24} />
              </button>

              {/* Content */}
              <div className="p-8 md:p-12 space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-4xl font-black mb-2">{selectedTemplate.title}</h2>
                  <p className="text-xl text-gray-400">{selectedTemplate.studio}</p>
                  <div className="flex items-center space-x-4 mt-4">
                    <span className="text-3xl font-bold text-yellow-500">
                      ${selectedTemplate.aeltd_price}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ${selectedTemplate.original_price}
                    </span>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">
                      {selectedTemplate.savings_badge}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-lg text-gray-300 leading-relaxed">
                  {selectedTemplate.description}
                </p>

                {/* Features Grid */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Premium Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedTemplate.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <Icon name="Check" size={20} className="text-yellow-500" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Technology Stack</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedTemplate.tech_stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-white/5 rounded-lg border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* aeLTD Exclusive */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-500/20">
                  <h3 className="text-2xl font-bold mb-4 text-yellow-500">
                    aeLTD Exclusive Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedTemplate.aeltd_exclusive).map(([key, value]) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Icon name="Star" size={20} className="text-yellow-500 mt-1" />
                        <div>
                          <div className="font-semibold capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-400">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.a
                    href={selectedTemplate.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-center font-bold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Live Preview
                  </motion.a>
                  <motion.a
                    href={selectedTemplate.purchase_url}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full text-center font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Purchase Template
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-gray-500">
        {aeltdTemplates.metadata.legal_notice}
        <br />
        #####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ
      </div>
    </div>
  );
};
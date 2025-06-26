import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { generateGEOContent } from '../../utils/seoHelpers';

interface Feature {
  icon: string;
  title: string;
  description: string;
  highlight: string;
  color: string;
}

export const EnhancedFeaturesSection: React.FC = () => {
  const geoContent = generateGEOContent('howItWorks');
  
  const features: Feature[] = [
    {
      icon: 'Sparkles',
      title: 'aegntic.ai-Generated Visuals',
      description: 'Every project gets unique FLUX.1 generated hero images and icons powered by aegntic.ai with automatic background removal',
      highlight: 'Industry First',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: 'Zap',
      title: '15-Second Generation',
      description: 'From GitHub URL to stunning website in seconds with parallel content and image processing',
      highlight: '10x Faster',
      color: 'from-blue-400 to-purple-500'
    },
    {
      icon: 'Brain',
      title: 'Gemini Intelligence by aegntic.ai',
      description: 'Advanced content analysis powered by aegntic.ai and tech stack detection for perfectly tailored designs',
      highlight: 'Smart Detection',
      color: 'from-green-400 to-teal-500'
    },
    {
      icon: 'Package',
      title: 'Export Ready Assets',
      description: 'Download all aegntic.ai-generated images with transparent backgrounds for any use',
      highlight: 'Professional Quality',
      color: 'from-pink-400 to-red-500'
    },
    {
      icon: 'Shield',
      title: 'Privacy First',
      description: 'No data storage, no tracking, no signup required - your code stays yours',
      highlight: '100% Secure',
      color: 'from-gray-400 to-gray-600'
    },
    {
      icon: 'Rocket',
      title: 'Instant Deployment',
      description: 'One-click deployment to Vercel, Netlify, or export static files',
      highlight: 'Production Ready',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  return (
    <section 
      className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden"
      itemScope 
      itemType="https://schema.org/ItemList"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23FFD700%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] bg-center" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" itemProp="name">
            <span className="text-white">Why Project4Site is the </span>
            <span className="bg-gradient-to-r from-wu-gold to-wu-gold-muted bg-clip-text text-transparent">
              Future of README Generators
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto" itemProp="description">
            The first and only GitHub README generator powered by aegntic.ai with automated visual creation, 
            real-time progress tracking, and professional asset export
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <meta itemProp="position" content={String(index + 1)} />
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 hover:border-wu-gold/50 transition-all duration-300 h-full">
                {/* Highlight Badge */}
                <div className="absolute -top-3 right-6">
                  <span className={`bg-gradient-to-r ${feature.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {feature.highlight}
                  </span>
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon name={feature.icon} className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-white" itemProp="name">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed" itemProp="description">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works Process */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            {geoContent.title}
          </h3>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-wu-gold to-transparent transform -translate-y-1/2 hidden lg:block" />
            
            <div className="grid md:grid-cols-4 gap-8">
              {geoContent.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 text-center border border-gray-700 hover:border-wu-gold/50 transition-all duration-300">
                    {/* Step Number */}
                    <div className="w-12 h-12 bg-gradient-to-br from-wu-gold to-wu-gold-muted rounded-full flex items-center justify-center text-black font-bold text-lg mx-auto mb-4 relative z-10">
                      {index + 1}
                    </div>
                    
                    <h4 className="font-semibold text-lg mb-2 text-white">
                      {step.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {step.description}
                    </p>
                    
                    {/* Keywords for SEO */}
                    <div className="mt-3 flex flex-wrap gap-1 justify-center">
                      {step.keywords.map((keyword) => (
                        <span key={keyword} className="text-xs text-gray-500">
                          #{keyword.replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQ Section for GEO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6" itemScope itemType="https://schema.org/FAQPage">
            {generateGEOContent('faq').map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h4 className="font-semibold text-lg mb-3 text-white flex items-center" itemProp="name">
                  <Icon name="HelpCircle" size={20} className="mr-3 text-wu-gold" />
                  {faq.question}
                </h4>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-gray-300 pl-8" itemProp="text">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
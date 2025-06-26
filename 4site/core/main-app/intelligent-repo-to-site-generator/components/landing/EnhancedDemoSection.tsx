import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { generateGEOContent } from '../../utils/seoHelpers';
import { LANDING_PAGE_VISUALS, generateLandingPageVisuals } from '../../services/landingPageVisuals';

interface DemoProject {
  title: string;
  description: string;
  techStack: string[];
  imageUrl: string;
  alt: string;
  stats: {
    generation: string;
    visuals: string;
    optimization: string;
  };
}

export const EnhancedDemoSection: React.FC = () => {
  const [visuals, setVisuals] = useState(LANDING_PAGE_VISUALS);
  const [activeDemo, setActiveDemo] = useState(0);
  const geoContent = generateGEOContent('features');

  useEffect(() => {
    // Try to load AI-generated demo images
    generateLandingPageVisuals()
      .then(newVisuals => setVisuals(newVisuals))
      .catch(() => {}); // Use fallback images on error
  }, []);

  const demoProjects: DemoProject[] = visuals.demoImages.map((demo, index) => ({
    title: demo.title,
    description: `aegntic.ai-enhanced showcase with FLUX.1 generated visuals`,
    techStack: demo.techStack,
    imageUrl: demo.url,
    alt: demo.alt,
    stats: {
      generation: '12s',
      visuals: 'FLUX.1',
      optimization: '99/100'
    }
  }));

  return (
    <section 
      className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden"
      itemScope 
      itemType="https://schema.org/ItemList"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with GEO Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" itemProp="name">
            <span className="bg-gradient-to-r from-wu-gold to-white bg-clip-text text-transparent">
              {geoContent.title}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto" itemProp="description">
            See real examples of GitHub repositories transformed into stunning websites powered by aegntic.ai with FLUX.1-generated visuals
          </p>
        </motion.div>

        {/* Interactive Demo Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
              {/* Browser Chrome */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-900 rounded px-4 py-1 text-xs text-gray-400 font-mono">
                    project4site.com/demo/{demoProjects[activeDemo]?.title.toLowerCase().replace(/\s+/g, '-')}
                  </div>
                </div>
              </div>
              
              {/* Demo Image */}
              <div className="relative bg-gray-900 aspect-video">
                <motion.img
                  key={activeDemo}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={demoProjects[activeDemo]?.imageUrl}
                  alt={demoProjects[activeDemo]?.alt}
                  className="w-full h-full object-cover"
                />
                
                {/* AI Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2"
                >
                  <Icon name="Sparkles" size={16} className="text-wu-gold" />
                  <span className="text-sm font-medium text-white">AI Generated</span>
                </motion.div>
              </div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 grid grid-cols-3 gap-4"
            >
              {Object.entries(demoProjects[activeDemo]?.stats || {}).map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-wu-gold font-bold text-lg">{value}</div>
                  <div className="text-gray-400 text-sm capitalize">{key}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Demo Selector */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-6 text-white">
              Live Examples with AI Visuals
            </h3>
            
            {demoProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <Card
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    activeDemo === index
                      ? 'border-wu-gold bg-wu-gold/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                  onClick={() => setActiveDemo(index)}
                >
                  <meta itemProp="position" content={String(index + 1)} />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2 text-white" itemProp="name">
                        {project.title}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3" itemProp="description">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: activeDemo === index ? 0 : -90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon
                        name="ChevronRight"
                        size={20}
                        className={activeDemo === index ? 'text-wu-gold' : 'text-gray-600'}
                      />
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Feature Comparison for GEO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            Why We're Different
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {geoContent.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
              >
                <h4 className="text-xl font-semibold mb-3 text-wu-gold">
                  {item.title}
                </h4>
                <p className="text-gray-300 mb-4">
                  {item.description}
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-500 line-through mb-2">
                    {item.comparison.split(' | ')[0]}
                  </div>
                  <div className="text-green-400">
                    ✓ {item.comparison.split(' | ')[1]}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-2xl text-gray-300 mb-8">
            Ready to transform your GitHub project?
          </p>
          <button className="bg-gradient-to-r from-wu-gold to-wu-gold-muted hover:from-wu-gold-muted hover:to-wu-gold text-black font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
            Start Generating Now - It's Free!
          </button>
        </motion.div>
      </div>
    </section>
  );
};
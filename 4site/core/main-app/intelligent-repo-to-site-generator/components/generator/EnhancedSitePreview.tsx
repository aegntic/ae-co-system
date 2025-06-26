import React from 'react';
import { motion } from 'framer-motion';
import { SiteData } from '../../types';
import { TechProjectTemplate } from '../templates/TechProjectTemplate';
import { CreativeProjectTemplate } from '../templates/CreativeProjectTemplate';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface EnhancedSitePreviewProps {
  siteData: SiteData;
  onReset: () => void;
  error: string | null;
}

export const EnhancedSitePreview: React.FC<EnhancedSitePreviewProps> = ({ siteData, onReset, error }) => {
  const TemplateComponent = siteData.template === 'CreativeProjectTemplate' 
    ? CreativeProjectTemplate 
    : TechProjectTemplate;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show success toast or feedback
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Header with Metrics */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {siteData.visuals?.projectIconNoBackground && (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  src={siteData.visuals.projectIconNoBackground}
                  alt={siteData.title}
                  className="w-12 h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{siteData.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Icon name="Sparkles" size={14} className="text-yellow-500" />
                    AI Enhanced
                  </span>
                  {siteData.generationMetrics && (
                    <>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {(siteData.generationMetrics.totalTime / 1000).toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Image" size={14} />
                        {siteData.generationMetrics.visualsGenerated ? 'Visuals Generated' : 'Content Only'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Icon name="Share2" size={16} className="mr-2" />
                Share
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Icon name="Download" size={16} className="mr-2" />
                Export
              </Button>
              <Button
                onClick={onReset}
                variant="primary"
                size="sm"
              >
                <Icon name="Plus" size={16} className="mr-2" />
                New Site
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Visual Showcase Section */}
      {siteData.visuals && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          {/* Hero Image Background */}
          <div className="absolute inset-0 h-[400px] overflow-hidden">
            <img
              src={siteData.visuals.heroImage}
              alt="Hero Background"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900" />
          </div>

          {/* Content Overlay */}
          <div className="relative container mx-auto px-4 py-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {siteData.title}
              </h2>
              {siteData.generationMetrics?.techStackIdentified && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  {siteData.generationMetrics.techStackIdentified.map((tech, index) => (
                    <motion.span
                      key={tech}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm font-mono"
                      style={{
                        borderColor: siteData.visuals?.colorPalette[index % siteData.visuals.colorPalette.length],
                        borderWidth: '1px'
                      }}
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Generated Site Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative"
      >
        <TemplateComponent siteData={siteData} />
      </motion.main>

      {/* Visual Credits Footer */}
      {siteData.visuals && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-gray-800 border-t border-gray-700 py-8 mt-16"
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Icon name="Sparkles" size={16} className="text-yellow-500" />
                <span>Enhanced with AI-generated visuals</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://project4site.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Powered by Project4Site
                </a>
                <span className="text-gray-600">•</span>
                <a
                  href={siteData.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Icon name="Github" size={14} />
                  View Repository
                </a>
              </div>
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
};
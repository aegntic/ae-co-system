import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreativeProjectTemplate } from '../templates/CreativeProjectTemplate';
import { TechProjectTemplate } from '../templates/TechProjectTemplate';
import { GlassAlert } from '../ui/GlassAlert';
import { SiteData } from '../../types';
import { MADE_WITH_PROJECT4SITE_TEXT, PROJECT4SITE_URL } from '../../constants';

interface GlassSitePreviewProps {
  siteData: SiteData;
  onReset: () => void;
  error?: string | null;
}

export const GlassSitePreview: React.FC<GlassSitePreviewProps> = ({ siteData, onReset, error }) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentStatus('idle');
    
    // Simulate deployment process
    setTimeout(() => {
      setIsDeploying(false);
      setDeploymentStatus('success');
      setTimeout(() => setDeploymentStatus('idle'), 3000);
    }, 2000);
  };

  const TemplateComponent = siteData.template === 'CreativeProjectTemplate' 
    ? CreativeProjectTemplate 
    : TechProjectTemplate;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Preview Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button"
              >
                <div className="glass-button-shadow" />
                <div className="glass-button-content py-2 px-4 text-sm">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  New Site
                </div>
              </motion.button>
              
              <div className="glass-badge">
                <div className="glass-badge-content flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/90">Live Preview</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => window.open(siteData.repoUrl, '_blank')}
                className="glass-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="glass-button-shadow" />
                <div className="glass-button-content py-2 px-4 text-sm flex items-center gap-2">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  View Source
                </div>
              </motion.button>

              <motion.button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="glass-button glass-shimmer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="glass-button-shadow" />
                <div className="glass-button-content py-2 px-6 text-sm">
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Deploy Site</span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="container mx-auto px-4 mt-4"
        >
          <GlassAlert type="error" message={error} />
        </motion.div>
      )}

      {/* Deployment Status */}
      <AnimatePresence>
        {deploymentStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 mt-4"
          >
            <GlassAlert
              type={deploymentStatus === 'success' ? 'success' : 'error'}
              message={
                deploymentStatus === 'success'
                  ? '🎉 Site deployed successfully! Your site is now live.'
                  : 'Deployment failed. Please try again.'
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Frame */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-grow relative overflow-hidden"
      >
        {/* Glass frame effect */}
        <div className="absolute inset-4 glass-container">
          <div className="relative h-full">
            <div className="absolute z-0 inset-0 backdrop-blur-sm glass-filter overflow-hidden isolate rounded-3xl" />
            <div className="z-10 absolute inset-0 bg-white bg-opacity-5 rounded-3xl" />
            <div className="glass-inner-shadow rounded-3xl" />
            
            {/* Browser chrome */}
            <div className="z-30 relative h-full flex flex-col">
              <div className="p-3 border-b border-white/10 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 glass-input py-1">
                  <div className="glass-input-shadow" />
                  <div className="flex items-center px-3 gap-2">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-white/50">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-white/60">
                      4site.pro/{siteData.repoUrl.split('/').pop()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Site content */}
              <div className="flex-1 overflow-auto glass-scrollbar">
                <div className="bg-white/95">
                  <TemplateComponent siteData={siteData} />
                  
                  {/* Made with badge */}
                  <div className="py-8 text-center bg-gray-50">
                    <a
                      href={PROJECT4SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm text-gray-700"
                    >
                      <span>{MADE_WITH_PROJECT4SITE_TEXT}</span>
                      <span className="text-xs text-gray-500">• Powered by aegntic.ai</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-container mx-4 mb-4"
      >
        <div className="relative">
          <div className="absolute z-0 inset-0 backdrop-blur-md glass-filter overflow-hidden isolate rounded-2xl" />
          <div className="z-10 absolute inset-0 bg-white bg-opacity-10 rounded-2xl" />
          <div className="glass-inner-shadow rounded-2xl" />
          
          <div className="z-30 relative p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-6">
                <button className="text-white/70 hover:text-white transition-colors flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Customize
                </button>
                <button className="text-white/70 hover:text-white transition-colors flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Content
                </button>
              </div>
              <div className="text-white/50">
                Template: {siteData.template.replace('Template', '')} • Tier: {siteData.tier}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
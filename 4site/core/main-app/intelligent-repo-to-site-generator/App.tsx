import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSiteContentFromUrl } from './services/geminiService';
import { SiteData, AppState } from './types';
import './index.css';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneration = useCallback(async () => {
    if (!repoUrl.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAppState('generating');
    
    try {
      const result = await generateSiteContentFromUrl(repoUrl);
      setSiteData(result);
      setAppState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setAppState('error');
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl]);

  return (
    <div className="min-h-screen">
      {/* Apple Dark Mode Hero */}
      <div className="apple-glass min-h-screen flex items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Logo */}
          <motion.div 
            className="tier-logo-container mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="tier-logo-glow"></div>
            <img 
              src="assets/optimized/svg/4site-logo-pro.svg" 
              alt="4site.pro" 
              className="h-20 mx-auto"
            />
          </motion.div>

          {/* Hero Text */}
          <motion.h1 
            className="text-display mb-6 apple-spring-in"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform GitHub Repositories
            <br />
            <span className="text-gradient-wu">Into Professional Websites</span>
          </motion.h1>

          <motion.p 
            className="text-title-2 text-secondary mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            AI-powered intelligent repository analysis that transforms entire codebases into stunning, professional websites with advanced viral growth mechanics.
          </motion.p>

          {/* Input Section */}
          <motion.div 
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="apple-glass p-8 apple-glass-hover">
              <div className="flex flex-col space-y-4">
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="input text-body"
                  disabled={isLoading}
                />
                
                <button
                  onClick={handleGeneration}
                  disabled={!repoUrl.trim() || isLoading}
                  className="btn-apple btn-primary"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="apple-spinner"></div>
                      <span>Analyzing Repository...</span>
                    </div>
                  ) : (
                    'Generate Professional Website'
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="apple-glass border-red-500/30 bg-red-500/10 p-6 mb-8"
              >
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="apple-glass apple-glass-hover p-6 text-left">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-title-3 mb-2">Intelligent Analysis</h3>
              <p className="text-body">Deep codebase analysis that understands your project's architecture, dependencies, and documentation.</p>
            </div>

            <div className="apple-glass apple-glass-hover p-6 text-left">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-title-3 mb-2">Viral Growth Engine</h3>
              <p className="text-body">Built-in viral mechanics with progressive commission tiers (20%→25%→30%→40%) for exponential reach.</p>
            </div>

            <div className="apple-glass apple-glass-hover p-6 text-left">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-title-3 mb-2">Professional Design</h3>
              <p className="text-body">Apple-esque dark mode with glassmorphism effects and enterprise-grade visual excellence.</p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Preview Section */}
      <AnimatePresence>
        {siteData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-8"
          >
            <div className="max-w-6xl mx-auto">
              <div className="apple-glass p-8 mb-8">
                <h2 className="text-headline mb-4">Generated Website Preview</h2>
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="ml-4 text-sm text-gray-400">{siteData.title}</div>
                    </div>
                  </div>
                  <div className="bg-white text-black p-8 min-h-96">
                    <h1 className="text-4xl font-bold mb-4">{siteData.title}</h1>
                    <p className="text-lg text-gray-600 mb-6">{siteData.description}</p>
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: siteData.content }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
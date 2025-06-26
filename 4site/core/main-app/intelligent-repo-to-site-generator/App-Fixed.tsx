import React, { useState, useCallback } from 'react';
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
              src="/4site-pro-logo.png" 
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

          {/* Professional Features - Clean Apple Style */}
          <motion.div 
            className="mt-24 space-y-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-title-1 mb-4">Enterprise-Grade Repository Intelligence</h2>
              <p className="text-body max-w-2xl mx-auto">Professional website generation with advanced AI analysis, strategic growth mechanics, and institutional-quality design systems.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 max-w-5xl mx-auto">
              <div className="professional-feature-card">
                <h3 className="feature-title">Intelligent Analysis</h3>
                <p className="feature-description">Deep codebase analysis with dependency mapping, architecture understanding, and comprehensive documentation extraction.</p>
              </div>

              <div className="professional-feature-card">
                <h3 className="feature-title">Growth Mechanics</h3>
                <p className="feature-description">Advanced viral distribution with progressive commission tiers and strategic network amplification protocols.</p>
              </div>

              <div className="professional-feature-card">
                <h3 className="feature-title">Enterprise Quality</h3>
                <p className="feature-description">Institutional-grade design systems with Apple-standard visual excellence and performance optimization.</p>
              </div>
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
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSiteContentFromUrl } from './services/geminiService';
import { SiteData, AppState } from './types';

const SimpleWorkingApp: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRepoUrl(value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    let processedUrl = repoUrl.trim();
    
    // Convert "owner/repo" format to full GitHub URL
    if (processedUrl.match(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/)) {
      processedUrl = `https://github.com/${processedUrl}`;
    }
    else if (processedUrl.match(/^github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/)) {
      processedUrl = `https://${processedUrl}`;
    }
    else if (processedUrl.startsWith('github.com/')) {
      processedUrl = `https://${processedUrl}`;
    }

    setLoading(true);
    setError(null);
    setAppState(AppState.Loading);

    try {
      console.log('Generating site for:', processedUrl);
      const data = await generateSiteContentFromUrl(processedUrl);
      
      if (!data || typeof data === 'string') {
        throw new Error('Invalid response from content generator');
      }
      
      setSiteData(data);
      setAppState(AppState.Success);
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate site';
      setError(errorMessage);
      setAppState(AppState.Error);
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  const handleReset = useCallback(() => {
    setAppState(AppState.Idle);
    setSiteData(null);
    setError(null);
    setRepoUrl('');
  }, []);

  if (appState === AppState.Loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Generating Your Site</h2>
          <p className="text-gray-300">Analyzing repository and creating professional website...</p>
        </div>
      </div>
    );
  }

  if (appState === AppState.Success && siteData) {
    return (
      <div className="min-h-screen" style={{ background: siteData.primaryColor || '#0f0f0f' }}>
        {/* Site Preview */}
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">{siteData.title}</h1>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Star ⭐
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Fork 🍴
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-5xl font-bold text-white mb-6">
                {siteData.title}
              </h2>
              <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
                {siteData.description}
              </p>
              
              {/* Tech Stack */}
              {siteData.techStack && siteData.techStack.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {siteData.techStack.map((tech, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm border border-blue-400/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Features */}
              {siteData.features && siteData.features.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {siteData.features.map((feature, index) => (
                    <div key={index} className="p-6 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature}
                      </h3>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  View on GitHub
                </button>
                <button className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur border border-white/20">
                  Live Demo
                </button>
              </div>
            </div>
          </section>

          {/* Content Sections */}
          {siteData.sections && siteData.sections.length > 0 && (
            <section className="py-16 px-6">
              <div className="max-w-4xl mx-auto space-y-12">
                {siteData.sections.map((section, index) => (
                  <div key={section.id} className="bg-white/5 backdrop-blur rounded-lg p-8 border border-white/10">
                    <h3 className="text-2xl font-bold text-white mb-4">{section.title}</h3>
                    <div 
                      className="text-gray-300 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Floating Action Bar */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex gap-4">
              <button 
                onClick={handleReset}
                className="px-6 py-3 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors backdrop-blur border border-white/20"
              >
                🔄 Generate Another
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                🚀 Deploy Site
              </button>
            </div>
          </div>
        </div>

        {/* Demo Mode Banner */}
        {siteData.generatedBy === 'demo-mode' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl px-6 py-3 text-center">
              <div className="flex items-center gap-2 text-yellow-300">
                <span className="text-lg">🎭</span>
                <span className="font-semibold">Demo Mode Active</span>
                <span className="text-lg">🎭</span>
              </div>
              <p className="text-xs text-yellow-200/80 mt-1">
                This is a preview. Add your API key for full AI generation!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Main Landing Page
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">4S</span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-blue-400">project</span>
                <span className="text-emerald-400">4site</span>
                <span className="text-yellow-400">.pro</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Living Websites That 
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 bg-clip-text text-transparent"> Update Themselves</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Transform any GitHub repository into a professional website in 30 seconds. 
            Your code deserves to shine.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={repoUrl}
                onChange={handleInputChange}
                placeholder="Enter GitHub URL or owner/repo (e.g. facebook/react)"
                className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || !repoUrl.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {loading ? 'Generating...' : 'Transform Now'}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                <span className="font-semibold">Error:</span> {error}
              </div>
            </motion.div>
          )}

          {/* Example URLs */}
          <div className="mt-8">
            <p className="text-gray-400 mb-4">Try these examples:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['facebook/react', 'microsoft/vscode', 'vercel/next.js'].map((repo) => (
                <button
                  key={repo}
                  onClick={() => setRepoUrl(repo)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  {repo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose project4site?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Generate professional websites in 30 seconds or less</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Design</h3>
              <p className="text-gray-400">Smart analysis creates custom designs for your project</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zero Setup</h3>
              <p className="text-gray-400">No signup required. Just paste your GitHub URL and go</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 4site.pro - Powered by aegntic ecosystems
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SimpleWorkingApp;
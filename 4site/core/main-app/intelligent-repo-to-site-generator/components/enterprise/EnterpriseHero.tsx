import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Database, Globe, Zap } from 'lucide-react';

interface EnterpriseHeroProps {
  onStartDemo: (repoUrl: string) => void;
  isLoading?: boolean;
}

export const EnterpriseHero: React.FC<EnterpriseHeroProps> = ({
  onStartDemo,
  isLoading = false
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickDemo = (repo: string) => {
    setRepoUrl(repo);
    onStartDemo(repo);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onStartDemo(repoUrl);
    }
  };

  // Logo opacity and scale based on scroll
  const logoOpacity = Math.max(0.1, 1 - scrollY / 400);
  const logoScale = Math.max(0.8, 1 - scrollY / 1000);
  const logoTranslateY = scrollY * 0.3;

  return (
    <>
      {/* 3D Animated Grid Background */}
      <div className="enterprise-grid-background">
        <div className="grid-canvas">
          <div className="grid-layer" style={{ '--rotate-start': '0deg', '--translate-z': '0px' } as any}></div>
          <div className="grid-layer" style={{ '--rotate-start': '15deg', '--translate-z': '-100px' } as any}></div>
          <div className="grid-layer" style={{ '--rotate-start': '30deg', '--translate-z': '-200px' } as any}></div>
        </div>
      </div>

      {/* Logo Hero Section */}
      <section className="enterprise-logo-hero">
        <motion.div 
          className="logo-container"
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) translateY(${logoTranslateY}px)`
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <img 
            src="/4sitepro-logo.png" 
            alt="4site.pro" 
            className="enterprise-logo"
          />
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="enterprise-section">
        <div className="enterprise-container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="enterprise-heading size-massive mb-6">
              Transform Any <span className="blue-glow">Repository</span>
              <br />
              Into a <span className="yellow-glow">Professional Website</span>
            </h1>
            
            <p className="enterprise-subheading size-large mb-8 max-w-4xl mx-auto">
              Complete <span className="orange-accent">repository analysis</span> and transformation. 
              Not just README files—we analyze your entire codebase, documentation, 
              structure, and dependencies to create comprehensive professional websites.
            </p>

            <div className="flex flex-wrap gap-6 justify-center items-center mb-12">
              <div className="flex items-center gap-2 enterprise-muted">
                <Code className="w-5 h-5 blue-accent" />
                <span>Full Codebase Analysis</span>
              </div>
              <div className="flex items-center gap-2 enterprise-muted">
                <Database className="w-5 h-5 blue-accent" />
                <span>Dependency Mapping</span>
              </div>
              <div className="flex items-center gap-2 enterprise-muted">
                <Globe className="w-5 h-5 blue-accent" />
                <span>Professional Deployment</span>
              </div>
              <div className="flex items-center gap-2 enterprise-muted">
                <Zap className="w-5 h-5 blue-accent" />
                <span>Enterprise Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Repository Input */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="enterprise-card p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="enterprise-subheading size-medium block mb-3">
                    Repository URL or Owner/Repo
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/facebook/react or facebook/react"
                      className="flex-1 px-6 py-4 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!repoUrl.trim() || isLoading}
                      className="enterprise-button primary"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Generate Site
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Quick Demo Examples */}
            <div className="text-center">
              <p className="enterprise-muted mb-4">
                Try our demo with popular repositories:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  { repo: 'facebook/react', label: 'React' },
                  { repo: 'microsoft/vscode', label: 'VS Code' },
                  { repo: 'vercel/next.js', label: 'Next.js' },
                  { repo: 'tailwindlabs/tailwindcss', label: 'Tailwind' }
                ].map(({ repo, label }) => (
                  <button
                    key={repo}
                    onClick={() => handleQuickDemo(repo)}
                    disabled={isLoading}
                    className="enterprise-button secondary"
                  >
                    Demo {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Value Proposition Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="enterprise-grid cols-3 mt-20"
          >
            <div className="enterprise-card p-8">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 blue-accent" />
              </div>
              <h3 className="enterprise-subheading size-medium mb-3">
                Complete Analysis
              </h3>
              <p className="enterprise-body text-sm leading-relaxed">
                We analyze your entire repository structure, not just the README. 
                Source code, documentation, dependencies, architecture patterns, and more.
              </p>
            </div>

            <div className="enterprise-card p-8 featured">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 yellow-accent" />
              </div>
              <h3 className="enterprise-subheading size-medium mb-3">
                Professional Output
              </h3>
              <p className="enterprise-body text-sm leading-relaxed">
                Enterprise-grade websites with proper documentation, API references, 
                deployment guides, and professional presentation.
              </p>
            </div>

            <div className="enterprise-card p-8">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 orange-accent" />
              </div>
              <h3 className="enterprise-subheading size-medium mb-3">
                Deploy Anywhere
              </h3>
              <p className="enterprise-body text-sm leading-relaxed">
                One-click deployment to GitHub Pages, Vercel, Netlify, or any static hosting. 
                Custom domains and CDN optimization included.
              </p>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="text-center mt-16"
          >
            <div className="enterprise-card p-12 max-w-2xl mx-auto">
              <h2 className="enterprise-heading size-medium mb-4">
                Ready to Transform Your Repository?
              </h2>
              <p className="enterprise-body mb-8">
                Join thousands of developers who trust 4site.pro for professional 
                repository presentation and documentation.
              </p>
              <div className="flex gap-4 justify-center">
                <button className="enterprise-button accent-yellow">
                  Start Free Trial
                </button>
                <button className="enterprise-button secondary">
                  View Examples
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default EnterpriseHero;
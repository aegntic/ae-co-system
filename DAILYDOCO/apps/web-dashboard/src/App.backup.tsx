// Backup of original App.tsx - DO NOT DELETE
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SimpleDashboard from './components/SimpleDashboard';
import TrustDashboard from './components/TrustDashboard';
import LiveActivityTicker from './components/LiveActivityTicker';
import VideoGenerator from './components/VideoGenerator';
import { detectGitHubUser, simulateMetrics } from './utils/analytics';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [metrics, setMetrics] = useState({
    docsCreatedToday: 12847,
    activeUsers: 3294,
    savedHours: 127,
    viralCoefficient: 2.3
  });
  const [githubUser, setGithubUser] = useState<{ username?: string; repoCount?: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Detect GitHub user
    const detected = detectGitHubUser();
    setGithubUser(detected);
    
    // Simulate live metrics
    const interval = setInterval(() => {
      setMetrics(prev => simulateMetrics(prev));
    }, 3000);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  if (currentView === 'dashboard') {
    return <SimpleDashboard />;
  }

  return (
    <div ref={containerRef} className="relative bg-black overflow-x-hidden">
      {/* AI Prediction Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900/90 via-purple-900/90 to-blue-900/90 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/90 text-sm font-medium">
            Our AI predicts you'll save {metrics.savedHours} hours/month 
            {githubUser?.username && ` based on your ${githubUser.repoCount || 'GitHub'} repositories`}
          </span>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="fixed top-12 left-0 right-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Enhanced Logo */}
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <text x="6" y="32" className="fill-white/80 font-mono text-2xl font-bold">{'<'}</text>
                  <text x="36" y="32" className="fill-white/80 font-mono text-2xl font-bold">{'>'}</text>
                  <path d="M 18 14 L 18 34 L 34 24 Z" fill="url(#logoGradient)" className="drop-shadow-lg" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold text-lg tracking-tight">DailyDoco Pro</div>
                <div className="text-white/60 text-xs tracking-wider uppercase">$100B Platform</div>
              </div>
            </motion.div>

            {/* Navigation items */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/70 hover:text-white transition-colors font-medium">Features</a>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                Live Dashboard
              </button>
              <a href="#pricing" className="text-white/70 hover:text-white transition-colors font-medium">Pricing</a>
              <a href="#viral" className="text-white/70 hover:text-white transition-colors font-medium">Earn $12K/mo</a>
            </div>

            {/* Smart CTA */}
            {githubUser?.username ? (
              <motion.button 
                className="relative px-6 py-2.5 rounded-lg font-medium text-white overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <span className="relative">Document {githubUser.repoCount || 'Your'} Repos</span>
              </motion.button>
            ) : (
              <motion.button 
                className="relative px-6 py-2.5 rounded-lg font-medium text-white overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <span className="relative">Start Free</span>
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      {/* Section 1: The Problem */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32">
        {/* Dynamic gradient background */}
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(245, 158, 11, 0.15), rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15), transparent 70%)`
          }}
        />
        
        {/* Animated gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-transparent blur-3xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-[40%] -left-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-amber-600/20 via-purple-600/20 to-transparent blur-3xl"
            animate={{ 
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div 
          className="relative z-10 text-center max-w-6xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h1 
            className="text-7xl md:text-8xl lg:text-9xl font-bold mb-8"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="block text-white mb-4">Your Team Ships</span>
            <span className="block">
              <span className="text-gradient bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Code Daily
              </span>
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-2xl md:text-3xl text-white/70 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            But Documentation Dies in Sprint Planning
          </motion.p>

          {/* Problem metrics */}
          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="text-center">
              <motion.div 
                className="text-5xl font-bold text-red-400 mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {metrics.activeUsers.toLocaleString()}
              </motion.div>
              <div className="text-sm text-white/60">Devs Struggling Now</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-2">73%</div>
              <div className="text-sm text-white/60">Code Undocumented</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-400 mb-2">∞</div>
              <div className="text-sm text-white/60">Hours Lost Weekly</div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
              <motion.div 
                className="w-1 h-3 bg-white/60 rounded-full"
                animate={{ y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: The Transformation */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <motion.div 
          className="relative z-10 text-center max-w-6xl w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span className="block text-white mb-4">What If Documentation</span>
            <span className="block text-gradient bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Created Itself?
            </span>
          </motion.h2>

          {/* Feature pills */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            {[
              "AI Watches Your Coding",
              "Predicts Important Moments", 
              "Generates Human Narration",
              "Creates Video Tutorials",
              "Syncs with Git Commits",
              "97% Detection Resistance"
            ].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                viewport={{ once: true }}
                className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <span className="text-white/90 font-medium">{feature}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Live demo video generator */}
          <motion.div 
            className="relative max-w-5xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <VideoGenerator />
          </motion.div>

          {/* CTA for GitHub users */}
          {githubUser?.username && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <button className="group relative px-12 py-6 rounded-2xl font-semibold text-lg text-white overflow-hidden hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300" />
                <span className="relative flex items-center">
                  Document Your {githubUser.repoCount || ''} Repos Now
                  <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Section 3: The Results */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <motion.div 
          className="relative z-10 text-center max-w-7xl w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-16"
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
          >
            <span className="block text-white mb-4">Join</span>
            <motion.span 
              className="block text-gradient bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              {metrics.docsCreatedToday.toLocaleString()}+ Teams
            </motion.span>
            <span className="block text-white text-3xl md:text-4xl mt-4">
              Who Never Write Docs Again
            </span>
          </motion.h2>

          {/* Trust Dashboard */}
          <TrustDashboard metrics={metrics} />

          {/* Live Activity Ticker */}
          <LiveActivityTicker />

          {/* Viral Commission Calculator */}
          <motion.div 
            className="max-w-4xl mx-auto mb-16 p-8 rounded-2xl bg-gradient-to-br from-amber-900/20 via-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Your Earning Potential</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="text-white/60 text-sm">Team members you'll refer</label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  defaultValue="10"
                  className="w-full mt-2"
                />
                <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent mt-4">
                  $12,450/month
                </div>
                <div className="text-white/60 text-sm">Passive income from 7-level commissions</div>
              </div>
              <div className="text-left space-y-2">
                <div className="flex justify-between text-white/80">
                  <span>Level 1 (Direct)</span>
                  <span className="text-green-400">$3,200</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Level 2</span>
                  <span className="text-green-400">$2,400</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Level 3</span>
                  <span className="text-green-400">$1,800</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Levels 4-7</span>
                  <span className="text-green-400">$5,050</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="max-w-xl mx-auto">
              {githubUser?.username ? (
                <div className="text-center">
                  <img 
                    src={`https://github.com/${githubUser.username}.png`} 
                    alt={githubUser.username}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20"
                  />
                  <button className="w-full group relative px-8 py-6 rounded-2xl font-semibold text-lg text-white overflow-hidden hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300" />
                    <span className="relative">
                      Start with GitHub - Document {githubUser.repoCount || 'All'} Repos
                    </span>
                  </button>
                  <p className="text-white/60 text-sm mt-4">No credit card • No install • Works instantly</p>
                </div>
              ) : (
                <div>
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    className="w-full px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <button className="w-full mt-4 group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300" />
                    <span className="relative">Start Free Trial</span>
                  </button>
                  <p className="text-white/60 text-sm mt-4 text-center">No credit card • No install • 30-day trial</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer trust signals */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 pb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-white/40 text-sm">Backed by Y Combinator</div>
            <div className="text-white/40 text-sm">•</div>
            <div className="text-white/40 text-sm">SOC2 Certified</div>
            <div className="text-white/40 text-sm">•</div>
            <div className="text-white/40 text-sm">GDPR Compliant</div>
            <div className="text-white/40 text-sm">•</div>
            <div className="text-white/40 text-sm">99.99% Uptime</div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

export default App;
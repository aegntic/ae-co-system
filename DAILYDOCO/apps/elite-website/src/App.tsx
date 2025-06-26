import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Navigation, 
  HeroSection, 
  FeatureShowcase, 
  SocialProof 
} from './components'

function App() {
  // Performance optimization: Smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    
    // Preload critical assets
    const preloadVideo = () => {
      const video = document.createElement('video')
      video.src = '/hero-background.mp4'
      video.load()
    }
    preloadVideo()

    // GPU acceleration hint
    document.body.classList.add('gpu-accelerated')
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-pure-black overflow-x-hidden"
      >
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="relative">
          {/* Hero Section */}
          <HeroSection />

          {/* Feature Showcase */}
          <FeatureShowcase />

          {/* Social Proof */}
          <SocialProof />

          {/* CTA Section */}
          <section className="py-24 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
              >
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-burnt-gold/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-royal-purple/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Ready to <span className="gradient-text">10x</span> your documentation?
                  </h2>
                  <p className="text-xl text-gray-300 mb-8">
                    Join thousands of developers who've transformed their workflow. 
                    Start free, upgrade when you're ready.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary text-lg px-8 py-4"
                    >
                      Start Free Trial - No Credit Card
                    </motion.button>
                    <motion.a
                      href="#pricing"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      View pricing →
                    </motion.a>
                  </div>

                  {/* Trust Badge */}
                  <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      14-day free trial
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      SOC2 compliant
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 border-t border-glass-border">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-burnt-gold to-amber-600 flex items-center justify-center">
                    <span className="text-pure-black font-bold">D</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    © 2025 DailyDoco Pro. All rights reserved.
                  </span>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#terms" className="hover:text-white transition-colors">Terms</a>
                  <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
                  <a href="https://github.com/dailydoco/pro" className="hover:text-white transition-colors">GitHub</a>
                </div>
              </div>
            </div>
          </footer>
        </main>

        {/* Performance Monitor (Dev Only) */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs font-mono">
            <span className="text-green-500">60fps</span> • <span className="text-burnt-gold">GPU Accel</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
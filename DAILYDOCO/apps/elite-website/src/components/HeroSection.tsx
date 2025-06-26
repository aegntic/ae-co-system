import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Play, Sparkles, ArrowRight } from 'lucide-react'

export function HeroSection() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  // Parallax effects
  const y = useTransform(scrollY, [0, 1000], [0, -200])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 1.1])

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Video Background with GPU Acceleration */}
      <motion.div 
        style={{ scale }}
        className="absolute inset-0 w-full h-full gpu-accelerated"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => {
            // Fallback: hide video if it fails to load
            setIsVideoLoaded(false)
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-20' : 'opacity-0'
          }`}
        >
          <source src="/hero-background.mp4" type="video/mp4" />
          {/* Fallback: No video available */}
        </video>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-pure-black/60 via-pure-black/40 to-pure-black" />
        
        {/* Animated Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full hero-gradient animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] rounded-full hero-gradient animate-pulse delay-1000" />
        </div>
      </motion.div>

      {/* Hero Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 container mx-auto px-6 min-h-screen flex items-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-burnt-gold" />
            <span className="text-sm font-medium">Powered by AI Test Audience</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="block">Build docs</span>
            <span className="gradient-text text-glow block">10x faster</span>
            <span className="block">with AI</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your development workflow into professional video documentation. 
            Automatic capture, AI narration, and instant publishing—all while you code.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button className="btn-primary group flex items-center gap-2 text-lg">
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button className="btn-secondary group flex items-center gap-2 text-lg">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-wrap gap-8 justify-center items-center text-gray-400"
          >
            <div className="flex items-center gap-2">
              <span className="text-burnt-gold font-bold text-2xl">500K+</span>
              <span className="text-sm">Docs Created</span>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-royal-purple font-bold text-2xl">99.9%</span>
              <span className="text-sm">Uptime</span>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-electric-blue font-bold text-2xl">&lt; 100ms</span>
              <span className="text-sm">Response Time</span>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-3 bg-white/60 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
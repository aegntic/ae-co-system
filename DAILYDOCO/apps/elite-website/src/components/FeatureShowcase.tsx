import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { 
  Zap, Shield, Code2, Sparkles, 
  Video, Brain, Lock, Globe,
  Play, Pause, CheckCircle
} from 'lucide-react'

interface Feature {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  demo: string
  stats?: {
    label: string
    value: string
  }
}

const features: Feature[] = [
  {
    id: 'ai-capture',
    icon: <Brain className="w-6 h-6" />,
    title: 'AI-Powered Capture',
    description: 'Predictive intelligence captures important moments before they happen. Never miss a critical debugging session.',
    demo: '/demos/ai-capture.mp4',
    stats: { label: 'Accuracy', value: '99.9%' }
  },
  {
    id: 'instant-docs',
    icon: <Zap className="w-6 h-6" />,
    title: 'Instant Documentation',
    description: 'Generate professional video docs with AI narration in real-time. No editing required.',
    demo: '/demos/instant-docs.mp4',
    stats: { label: 'Processing', value: '< 2x realtime' }
  },
  {
    id: 'privacy-first',
    icon: <Shield className="w-6 h-6" />,
    title: 'Privacy-First Design',
    description: 'All processing happens locally. Your code never leaves your machine unless you choose to share.',
    demo: '/demos/privacy.mp4',
    stats: { label: 'Local Processing', value: '100%' }
  },
  {
    id: 'code-aware',
    icon: <Code2 className="w-6 h-6" />,
    title: 'Code-Aware Intelligence',
    description: 'Understands your codebase, frameworks, and workflow patterns for contextual documentation.',
    demo: '/demos/code-aware.mp4',
    stats: { label: 'Languages', value: '50+' }
  }
]

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<string>(features[0].id)
  const [isPlaying, setIsPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const activeFeatureData = features.find(f => f.id === activeFeature)!

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 hero-gradient opacity-20" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] hero-gradient opacity-20" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-burnt-gold" />
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to{' '}
            <span className="gradient-text">document faster</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Professional documentation tools designed for modern development workflows
          </p>
        </motion.div>

        {/* Interactive Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeFeature === feature.id
                    ? 'glass bg-glass-border shadow-glow'
                    : 'hover:bg-glass'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    activeFeature === feature.id
                      ? 'bg-gradient-to-br from-burnt-gold to-amber-600 text-pure-black'
                      : 'glass text-burnt-gold'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {feature.title}
                      {activeFeature === feature.id && (
                        <CheckCircle className="w-5 h-5 text-burnt-gold" />
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                    {feature.stats && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{feature.stats.label}:</span>
                        <span className="text-sm font-semibold text-burnt-gold">
                          {feature.stats.value}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-1 overflow-hidden">
              {/* Demo Header */}
              <div className="glass bg-pure-black/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-gray-400">{activeFeatureData.title} Demo</span>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 hover:bg-glass-border rounded transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>

              {/* Demo Content */}
              <div className="relative aspect-video bg-pure-black/30">
                <video
                  key={activeFeatureData.demo}
                  autoPlay={isPlaying}
                  loop
                  muted
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback: Hide video element if it fails to load
                    const target = e.target as HTMLVideoElement
                    target.style.display = 'none'
                  }}
                >
                  <source src={activeFeatureData.demo} type="video/mp4" />
                </video>
                
                {/* Fallback Content */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-burnt-gold/20 to-royal-purple/20">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass flex items-center justify-center">
                      <Play className="w-8 h-8 text-burnt-gold" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{activeFeatureData.title}</h3>
                    <p className="text-sm text-gray-400 max-w-xs">{activeFeatureData.description}</p>
                  </div>
                </div>
                
                {/* Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-pure-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pure-black/20 to-transparent" />
                </div>
              </div>

              {/* Feature Badges */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-3 py-1.5 glass rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Cross-Platform
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="px-3 py-1.5 glass rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  Encrypted
                </motion.div>
              </div>
            </div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-6 grid grid-cols-3 gap-4"
            >
              <div className="glass rounded-xl p-4 text-center">
                <Video className="w-5 h-5 text-burnt-gold mx-auto mb-2" />
                <div className="text-2xl font-bold text-burnt-gold">4K</div>
                <div className="text-xs text-gray-400">Support</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <Zap className="w-5 h-5 text-royal-purple mx-auto mb-2" />
                <div className="text-2xl font-bold text-royal-purple">60fps</div>
                <div className="text-xs text-gray-400">Capture</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <Shield className="w-5 h-5 text-electric-blue mx-auto mb-2" />
                <div className="text-2xl font-bold text-electric-blue">AES-256</div>
                <div className="text-xs text-gray-400">Encryption</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
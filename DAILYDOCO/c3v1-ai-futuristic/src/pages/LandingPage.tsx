import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, LightningBoltIcon, CubeIcon, MagicWandIcon } from '@radix-ui/react-icons';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { cn } from '@/utils/cn';

const features = [
  {
    title: 'Neural Documentation',
    description: 'AI that understands context like a senior engineer',
    icon: '🧠',
    gradient: 'from-neural-blue to-neural-purple',
  },
  {
    title: 'Quantum Processing',
    description: 'Process terabytes of code in milliseconds',
    icon: '⚛️',
    gradient: 'from-neural-purple to-neural-pink',
  },
  {
    title: 'Predictive Capture',
    description: 'Knows what to document before you do',
    icon: '🔮',
    gradient: 'from-neural-pink to-neural-blue',
  },
  {
    title: 'Holographic Export',
    description: '3D interactive documentation experiences',
    icon: '🎭',
    gradient: 'from-neural-cyan to-neural-green',
  },
];

export default function LandingPage() {
  const { metrics } = useWebSocket();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 neural-bg opacity-30"></div>
      <div className="absolute inset-0 cyber-grid opacity-10"></div>

      {/* Header */}
      <header className="relative z-20 p-6 lg:p-8">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neural-blue to-neural-purple blur-xl opacity-50 animate-pulse"></div>
            </div>
            <div>
              <span className="font-bold text-xl text-white">DailyDoco Pro</span>
              <span className="ml-2 text-xs text-neural-cyan">AI-First</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#technology" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Technology
            </a>
            <a href="#future" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Future
            </a>
            <Link
              to="/dashboard"
              className="ai-button text-sm font-medium text-white"
            >
              Enter Neural Network
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm mb-8">
              <div className="w-2 h-2 bg-neural-green rounded-full animate-pulse"></div>
              <span className="text-neural-cyan">Neural Networks Online</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="holographic-text">Documentation</span>
              <br />
              <span className="text-white">from the Future</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Powered by advanced AI that predicts, captures, and transforms your development 
              workflow into immersive documentation experiences.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="group relative px-8 py-4 bg-gradient-to-r from-neural-blue to-neural-purple rounded-xl font-medium text-white overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Initialize Neural Interface
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neural-purple to-neural-pink opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <button className="px-8 py-4 glass rounded-xl font-medium text-white hover:bg-white/10 transition-colors">
                View Hologram Demo
              </button>
            </div>
          </motion.div>

          {/* Live Neural Metrics */}
          {metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-4xl font-bold holographic-text mb-2">
                  {(metrics.docsCreatedToday * 2.7).toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">
                  Neural Processes/sec
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold holographic-text mb-2">
                  {metrics.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Connected Minds
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold holographic-text mb-2">
                  ∞
                </div>
                <div className="text-sm text-gray-400">
                  Knowledge Dimensions
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Neural Capabilities
            </h2>
            <p className="text-lg text-gray-400">
              Experience documentation enhanced by artificial intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="ai-card h-full">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {feature.description}
                  </p>
                  <div className={cn(
                    'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity',
                    feature.gradient
                  )}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="relative z-10 px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Powered by Tomorrow's Technology
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center flex-shrink-0">
                    <LightningBoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Quantum Neural Processing
                    </h3>
                    <p className="text-sm text-gray-400">
                      Process millions of documentation patterns simultaneously using quantum-inspired algorithms
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neural-purple to-neural-pink flex items-center justify-center flex-shrink-0">
                    <CubeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      4D Holographic Rendering
                    </h3>
                    <p className="text-sm text-gray-400">
                      Transform flat documentation into interactive 3D experiences with temporal navigation
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neural-pink to-neural-cyan flex items-center justify-center flex-shrink-0">
                    <MagicWandIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Predictive Documentation AI
                    </h3>
                    <p className="text-sm text-gray-400">
                      Anticipates documentation needs before code is written using advanced pattern recognition
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square relative">
                {/* 3D Neural Network Visualization */}
                <div className="absolute inset-0 glass rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      {/* Central Core */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-neural-blue to-neural-purple animate-pulse"></div>
                      
                      {/* Orbiting Elements */}
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute w-full h-full"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 10 + i * 2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <div
                            className="absolute w-8 h-8 rounded-full bg-neural-cyan"
                            style={{
                              top: '10%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </motion.div>
                      ))}
                      
                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full">
                        <motion.path
                          d="M 128 32 Q 196 128 128 224 Q 60 128 128 32"
                          stroke="url(#neural-gradient)"
                          strokeWidth="2"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                          }}
                        />
                        <defs>
                          <linearGradient id="neural-gradient">
                            <stop offset="0%" stopColor="#0c9ae5" />
                            <stop offset="50%" stopColor="#9945ff" />
                            <stop offset="100%" stopColor="#ff45a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neural-blue/20 to-neural-purple/20 blur-3xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Experience the Future?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join the neural network and transform how you create documentation forever
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neural-blue via-neural-purple to-neural-pink rounded-xl font-medium text-white ai-button"
            >
              Initialize Neural Interface
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="font-semibold text-white">DailyDoco Pro</span>
            <span className="text-xs text-neural-cyan">AI-First</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 DailyDoco Pro. Pioneering the future of documentation.
          </p>
        </div>
      </footer>
    </div>
  );
}
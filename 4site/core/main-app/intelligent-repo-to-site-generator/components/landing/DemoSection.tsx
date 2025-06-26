
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

export const DemoSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-transparent relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/3 left-1/6 w-20 h-20 bg-wu-gold-subtle rounded-full filter blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/5 w-24 h-24 bg-white/5 rounded-full filter blur-xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-gradient-wu">
              See It In Action
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gh-text-secondary max-w-3xl mx-auto font-mono leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Experience the <span className="text-wu-gold font-semibold">magic</span>. 
            Watch your repository transform into a{' '}
            <span className="text-wu-gold-muted font-semibold">professional presentation</span> in seconds.
          </motion.p>
        </motion.div>

        <motion.div
          className="relative bg-gh-bg-secondary/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-gh-border-default p-6 md:p-12 max-w-5xl mx-auto aspect-video flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.02)_1px,transparent_1px)] bg-[size:25px_25px] opacity-30" />
          
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-wu-gold/30 rounded-full"
              style={{
                left: `${10 + (i * 8)}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}

          {/* Subtle gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-wu-gold-subtle via-transparent to-white/5"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            style={{ backgroundSize: '200% 200%' }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              className="mb-8"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className="relative inline-block"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-wu-gold-subtle rounded-full filter blur-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />
                <Icon name="PlayCircle" size={120} className="relative z-10 text-wu-gold" />
              </motion.div>
            </motion.div>
            
            <motion.h3
              className="text-2xl md:text-3xl font-bold text-gh-text-primary mb-4 font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-wu-gold">Interactive Demo</span>{' '}
              <span className="text-text-muted">/</span>{' '}
              <span className="text-wu-gold-muted">Video</span>{' '}
              <span className="text-text-secondary">Coming Soon!</span>
            </motion.h3>
            
            <motion.p
              className="text-gh-text-secondary text-lg md:text-xl mb-6 font-mono"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Imagine your README transforming into a{' '}
              <span className="text-wu-gold">professional site</span> right here.
            </motion.p>

            {/* Feature preview cards */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { icon: 'Zap', label: 'Instant', accent: true },
                { icon: 'Sparkles', label: 'AI-Powered', accent: true },
                { icon: 'Palette', label: 'Professional', accent: false },
                { icon: 'Share2', label: 'Shareable', accent: false },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono text-sm transition-all duration-200 ${
                    feature.accent
                      ? 'bg-wu-gold-subtle border-wu-gold/30 text-wu-gold border'
                      : 'bg-bg-tertiary border-border-default text-text-secondary border'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    ...(feature.accent && { boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)' }),
                  }}
                >
                  <Icon name={feature.icon} size={16} />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Coming soon countdown effect */}
            <motion.div
              className="mt-8 text-xs text-gh-text-muted font-mono"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="text-wu-gold">▶</span> Full demo experience in development{' '}
              <span className="text-wu-gold-muted">▶</span>
            </motion.div>
          </div>

          {/* Minimal corner accent */}
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 bg-wu-gold rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Stats preview */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { number: '<30s', label: 'Generation Time', accent: true },
            { number: '100%', label: 'AI Powered', accent: true },
            { number: '∞', label: 'Possibilities', accent: false },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.2 }}
            >
              <motion.div
                className={`text-4xl md:text-5xl font-bold mb-2 font-mono ${
                  stat.accent ? 'text-wu-gold' : 'text-text-secondary'
                }`}
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.8,
                }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gh-text-secondary font-mono text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};


import React from 'react';
import { URLInputForm } from '../generator/URLInputForm';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface HeroSectionProps {
  onGenerateSite: (url: string) => void;
  onShowModeSelection?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGenerateSite, onShowModeSelection }) => {
  return (
    <section className="py-16 md:py-24 bg-transparent text-center relative overflow-hidden min-h-screen flex items-center">
      {/* Futuristic background elements */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-wu-gold-subtle rounded-full filter blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full filter blur-xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_50%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          {/* Animated rocket icon with glow effect */}
          <motion.div
            className="mx-auto mb-8 relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 bg-wu-gold-subtle rounded-full filter blur-lg"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <Icon name="Rocket" size={80} className="relative z-10 text-wu-gold" strokeWidth={1.5}/>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <motion.span
              className="text-gradient-wu animate-subtle-gradient"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Transform Your GitHub README
            </motion.span>
            <br />
            <motion.span
              className="text-gradient-monochrome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              into a Professional Site
            </motion.span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl text-gh-text-secondary max-w-3xl mx-auto mb-12 font-mono leading-relaxed"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Instantly generate a <span className="text-wu-gold font-semibold">professional</span>, <span className="text-wu-gold-muted font-semibold">shareable</span> presentation website from any GitHub repository.
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-wu-gold font-semibold"
          >
            No signup required, AI-powered, and blazing fast.
          </motion.span>
          <br />
          <motion.strong
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-text-secondary"
          >
            Your code already tells an amazing story. Let's make it shine.
          </motion.strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <URLInputForm onSubmit={onGenerateSite} />
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-sm text-gh-text-muted font-mono mb-8"
        >
          <span className="text-wu-gold">$</span> Enter a public GitHub repository <span className="text-wu-gold-muted">(e.g., aegntic/4site-pro)</span>
        </motion.p>
        
        {onShowModeSelection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-12"
          >
            <motion.button
              onClick={onShowModeSelection}
              className="group relative inline-flex items-center space-x-2 text-wu-gold hover:text-wu-gold-muted font-medium transition-all duration-200 transform hover:scale-105"
              whileHover={{ x: 3 }}
            >
              <span className="font-mono">Want more features? Explore our advanced modes</span>
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-wu-gold-muted"
              >
                →
              </motion.span>
              <div className="absolute inset-0 -z-10 bg-wu-gold-subtle rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-200" />
            </motion.button>
          </motion.div>
        )}

        {/* Minimal floating tech icons */}
        <motion.div
          className="absolute top-20 left-10 text-wu-gold/20"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 0 }}
        >
          <Icon name="Code2" size={20} />
        </motion.div>
        <motion.div
          className="absolute top-32 right-16 text-text-muted/30"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
        >
          <Icon name="GitBranch" size={22} />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-20 text-wu-gold/25"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 4 }}
        >
          <Icon name="Zap" size={18} />
        </motion.div>
      </div>
    </section>
  );
};

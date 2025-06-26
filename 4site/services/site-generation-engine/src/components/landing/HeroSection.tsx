
import React from 'react';
import { URLInputForm } from '../generator/URLInputForm'; // Adjusted path
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon'; // Adjusted path

interface HeroSectionProps {
  onGenerateSite: (url: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGenerateSite }) => {
  return (
    <section className="py-16 md:py-24 bg-transparent text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {/* Decorative background elements */}
        <span className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-full filter blur-2xl"></span>
        <span className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-secondary rounded-full filter blur-2xl"></span>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Icon name="Rocket" size={64} className="mx-auto mb-6 text-accent" strokeWidth={1.5}/>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-teal-300 to-emerald-400 mb-6">
            Transform Your GitHub README into a Stunning Site
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10"
        >
          Instantly generate a professional, shareable presentation website from any GitHub repository. No signup required, AI-powered, and blazing fast.
          <br/><strong>Your code already tells an amazing story. Let's make it shine!</strong>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <URLInputForm onSubmit={onGenerateSite} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 text-sm text-slate-400"
        >
          Enter a public GitHub repository URL (e.g., https://github.com/facebook/react)
        </motion.p>
      </div>
    </section>
  );
};

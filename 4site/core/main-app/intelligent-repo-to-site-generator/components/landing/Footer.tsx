
import React from 'react';
import { motion } from 'framer-motion';
import { MADE_WITH_PROJECT4SITE_TEXT, PROJECT4SITE_URL } from '../../constants';
import { Icon } from '../ui/Icon';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 bg-gh-bg-secondary/80 backdrop-blur-sm border-t border-gh-border-default overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute -top-10 -left-10 w-32 h-32 bg-wu-gold-subtle rounded-full filter blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-10 -right-10 w-28 h-28 bg-white/5 rounded-full filter blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Copyright and branding */}
          <motion.div
            className="flex flex-col items-center md:items-start space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-gh-text-secondary font-mono">
              &copy; {currentYear} <span className="text-wu-gold font-semibold">Project 4site</span>. All rights reserved.
            </p>
            <motion.div
              className="flex items-center space-x-2 text-xs text-gh-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span>Powered by</span>
              <a href="https://aegntic.ai" target="_blank" rel="noopener noreferrer" className="text-wu-gold hover:text-wu-gold-muted transition-colors">aegntic.ai</a>
              <span>•</span>
              <a href="https://aegntic.foundation" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-wu-gold transition-colors">aegntic.foundation</a>
              <span>•</span>
              <a href="mailto:enquiries@aegntic.ai" className="text-wu-gold-muted hover:text-wu-gold transition-colors">Contact</a>
            </motion.div>
          </motion.div>

          {/* Social links and navigation */}
          <motion.div
            className="flex items-center space-x-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.a 
              href={PROJECT4SITE_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-gh-text-secondary hover:text-wu-gold transition-all duration-200 font-mono group relative"
              whileHover={{ scale: 1.05 }}
            >
              <span className="relative z-10">{MADE_WITH_PROJECT4SITE_TEXT}</span>
              <div className="absolute inset-0 bg-wu-gold-subtle rounded px-2 py-1 transform scale-0 group-hover:scale-100 transition-transform duration-200 -z-10" />
            </motion.a>
            
            <div className="w-px h-6 bg-gh-border-default" />
            
            <motion.a 
              href="https://github.com/aegntic/project-4site" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gh-text-secondary hover:text-wu-gold transition-all duration-200 group relative p-2 rounded-lg"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Github" size={24} />
              <div className="absolute inset-0 bg-wu-gold-subtle rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-200" />
            </motion.a>
            
            <motion.a
              href="#"
              className="text-gh-text-secondary hover:text-wu-gold-muted transition-all duration-200 group relative p-2 rounded-lg"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 10px rgba(255, 193, 7, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Heart" size={24} />
              <div className="absolute inset-0 bg-wu-gold-subtle rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-200" />
            </motion.a>
          </motion.div>
        </motion.div>

        {/* MVP disclaimer with futuristic styling */}
        <motion.div
          className="mt-8 pt-6 border-t border-gh-border-default text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.p 
            className="text-xs text-gh-text-muted font-mono leading-relaxed max-w-2xl mx-auto"
            animate={{
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            This is an MVP demonstration. Features and design are subject to change.
            <br />
            Generated content is for illustrative purposes. <span className="text-wu-gold">A Project 4site initiative</span>
          </motion.p>
        </motion.div>

        {/* Tech stack badges */}
        <motion.div
          className="mt-6 flex justify-center items-center space-x-4 flex-wrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { name: 'React', accent: true },
            { name: 'TypeScript', accent: false },
            { name: 'Tailwind', accent: true },
            { name: 'Framer Motion', accent: false },
            { name: 'aegntic.ai', accent: true }
          ].map((tech, index) => (
            <motion.span
              key={tech.name}
              className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 font-mono ${
                tech.accent 
                  ? 'border-wu-gold/30 text-wu-gold bg-wu-gold-subtle'
                  : 'border-border-default text-text-muted bg-bg-tertiary'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                ...(tech.accent && { boxShadow: '0 0 8px rgba(255, 215, 0, 0.2)' }),
              }}
            >
              {tech.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </footer>
  );
};

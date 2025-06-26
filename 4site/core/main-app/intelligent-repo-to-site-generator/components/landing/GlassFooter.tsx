import React from 'react';
import { motion } from 'framer-motion';
import { MADE_WITH_4SITE_TEXT, SITE_PRO_URL } from '../../constants';

export const GlassFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 mt-24">
      {/* Background glass effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 container mx-auto px-4"
      >
        <div className="glass-container max-w-6xl mx-auto">
          <div className="relative">
            {/* Glass layers */}
            <div className="absolute z-0 inset-0 backdrop-blur-sm glass-filter overflow-hidden isolate rounded-3xl" />
            <div className="z-10 absolute inset-0 bg-white bg-opacity-10 rounded-3xl" />
            <div className="glass-inner-shadow rounded-3xl" />
            
            {/* Content */}
            <div className="z-30 relative p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Brand */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Project 4site</h3>
                  <p className="text-sm text-white/70 mb-4">
                    Transform GitHub repositories into stunning self-updating websites powered by aegntic.ai technology.
                  </p>
                  <div className="flex gap-4">
                    <a href="https://github.com/aegntic/project-4site" className="text-white/50 hover:text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                    <a href="https://twitter.com/project4site" className="text-white/50 hover:text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Resources</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Documentation</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">API Reference</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Examples</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Blog</a>
                    </li>
                  </ul>
                </div>

                {/* Company */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Powered By</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="https://aegntic.ai" className="text-sm text-white/70 hover:text-white transition-colors">aegntic.ai</a>
                    </li>
                    <li>
                      <a href="https://aegntic.foundation" className="text-sm text-white/70 hover:text-white transition-colors">aegntic.foundation</a>
                    </li>
                    <li>
                      <a href="mailto:enquiries@aegntic.ai" className="text-sm text-white/70 hover:text-white transition-colors">Contact Us</a>
                    </li>
                    <li>
                      <a href="mailto:project@4site.pro" className="text-sm text-white/70 hover:text-white transition-colors">Project Inquiries</a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/20 mb-8" />

              {/* Bottom section */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-white/70">
                  © {currentYear} Project 4site. All rights reserved.
                </p>
                
                <div className="flex gap-6 text-sm text-white/70">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                </div>
              </div>

              {/* Made with badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-center"
              >
                <a 
                  href={PROJECT4SITE_URL} 
                  className="inline-flex items-center gap-2 px-4 py-2 glass-card text-sm text-white/80 hover:text-white transition-colors"
                >
                  <span>{MADE_WITH_PROJECT4SITE_TEXT}</span>
                  <span className="text-xs text-white/60">• Powered by aegntic.ai</span>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
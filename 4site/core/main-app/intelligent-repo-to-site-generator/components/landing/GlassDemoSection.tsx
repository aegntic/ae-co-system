import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const demoProjects = [
  {
    id: 'react',
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    url: 'https://github.com/facebook/react',
    preview: '/demos/react-preview.png',
    tech: ['JavaScript', 'TypeScript', 'Flow'],
    stars: '220k+',
    color: 'from-cyan-400/20 to-blue-400/20'
  },
  {
    id: 'vscode',
    name: 'VS Code',
    description: 'Code editing. Redefined.',
    url: 'https://github.com/microsoft/vscode',
    preview: '/demos/vscode-preview.png',
    tech: ['TypeScript', 'Electron', 'Node.js'],
    stars: '155k+',
    color: 'from-blue-400/20 to-purple-400/20'
  },
  {
    id: 'next',
    name: 'Next.js',
    description: 'The React Framework for Production',
    url: 'https://github.com/vercel/next.js',
    preview: '/demos/nextjs-preview.png',
    tech: ['TypeScript', 'React', 'Webpack'],
    stars: '115k+',
    color: 'from-gray-400/20 to-white/20'
  }
];

export const GlassDemoSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState(demoProjects[0]);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            See It In
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"> Action</span>
          </h2>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto px-4">
            Explore live examples of sites generated from popular GitHub repositories.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Project selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-6">
              Select a project
            </h3>
            
            {demoProjects.map((project) => (
              <motion.button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`w-full glass-card text-left transition-all ${
                  selectedProject.id === project.id ? 'ring-2 ring-white/30' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="glass-card-content p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {project.name}
                      </h4>
                      <p className="text-sm text-white/60 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400/80 text-sm ml-4">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>{project.stars}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {selectedProject.id === project.id && (
                    <motion.div
                      layoutId="selector"
                      className={`absolute inset-0 bg-gradient-to-br ${project.color} rounded-3xl`}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Preview window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-container h-full">
              <div className="relative h-full">
                {/* Glass layers */}
                <div className="absolute z-0 inset-0 backdrop-blur-md glass-filter overflow-hidden isolate rounded-3xl" />
                <div className="z-10 absolute inset-0 bg-white bg-opacity-10 rounded-3xl" />
                <div className="glass-inner-shadow rounded-3xl" />
                
                {/* Browser chrome */}
                <div className="z-30 relative h-full flex flex-col">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                      </div>
                      <div className="flex-1 glass-input py-2">
                        <div className="glass-input-shadow" />
                        <div className="flex items-center px-3 gap-2">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-white/50">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-sm text-white/70">
                            {selectedProject.url.replace('https://github.com/', '4site.pro/')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 p-8 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedProject.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        {/* Placeholder for actual preview */}
                        <div className="h-full glass-card overflow-hidden">
                          <div className="glass-card-content h-full p-0">
                            <div className="h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                              <div className="text-center">
                                <motion.div
                                  animate={{
                                    scale: isHovering ? 1.1 : 1,
                                    rotate: isHovering ? 5 : 0
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className="mb-6"
                                >
                                  <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${selectedProject.color} flex items-center justify-center`}>
                                    <span className="text-4xl font-bold text-white">4</span>
                                  </div>
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                  {selectedProject.name} Site Preview
                                </h3>
                                <p className="text-white/60 mb-6">
                                  AI-generated site with interactive visuals and auto-updates
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="glass-button mx-auto"
                                >
                                  <div className="glass-button-shadow" />
                                  <div className="glass-button-content">
                                    <span>View Live Demo</span>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Bottom toolbar */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <button className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.886 16.938 19 17.482 19 18c0 .482-.114.938-.316 1.342m0-2.684a3 3 0 110 2.684M5.316 8.342C5.114 8.938 5 9.482 5 10c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684" />
                          </svg>
                          Share
                        </button>
                        <button className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Deploy
                        </button>
                      </div>
                      <a
                        href={selectedProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
                      >
                        View on GitHub
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
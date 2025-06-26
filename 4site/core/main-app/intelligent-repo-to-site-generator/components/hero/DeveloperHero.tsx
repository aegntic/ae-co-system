/**
 * Strategic Hero Section - A++ Developer Psychology Design
 * Shows before/after transformation to build immediate value recognition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal,
  ArrowRight,
  Eye,
  Heart,
  Star,
  Users,
  Zap,
  Sparkles,
  GitBranch,
  ExternalLink,
  Play,
  Code,
  Globe
} from 'lucide-react';
import { TerminalWindow, TerminalLine, GitHubRepoDisplay, TerminalInput } from '../ui/TerminalInterface';

interface DeveloperHeroProps {
  onStartDemo?: (repoUrl: string) => void;
  isLoading?: boolean;
}

export const DeveloperHero: React.FC<DeveloperHeroProps> = ({
  onStartDemo,
  isLoading = false
}) => {
  const [currentExample, setCurrentExample] = useState(0);
  const [demoUrl, setDemoUrl] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  // Example repositories that showcase different project types
  const examples = [
    {
      repo: 'facebook/react',
      description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
      stars: 231000,
      language: 'JavaScript',
      transformation: 'React Documentation Hub'
    },
    {
      repo: 'microsoft/vscode',
      description: 'Visual Studio Code - Open source source code editor developed by Microsoft.',
      stars: 164000,
      language: 'TypeScript',
      transformation: 'VS Code Landing Page'
    },
    {
      repo: 'vercel/next.js',
      description: 'The React Framework for the Web - used by some of the world\'s largest companies.',
      stars: 128000,
      language: 'JavaScript',
      transformation: 'Next.js Showcase Site'
    }
  ];

  // Cycle through examples every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [examples.length]);

  // Show comparison after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowComparison(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDemoSubmit = () => {
    if (demoUrl.trim() && onStartDemo) {
      onStartDemo(demoUrl.trim());
    }
  };

  const currentRepo = examples[currentExample];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Main Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 font-mono">
          <span className="text-[var(--text-primary)]">Your </span>
          <span className="text-[var(--terminal-green)]">README</span>
          <span className="text-[var(--text-primary)]"> deserves</span>
          <br />
          <span className="text-[var(--vs-code-blue)]">a website as good</span>
          <br />
          <span className="text-[var(--text-primary)]">as your </span>
          <span className="text-[var(--syntax-keyword)]">code</span>
        </h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto font-mono"
        >
          <span className="text-[var(--terminal-green))]">$</span> transform-repo your-github-repo
          <br />
          <span className="text-[var(--syntax-comment)]"># Generates production-ready website in 30 seconds</span>
        </motion.p>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-[var(--text-muted)]"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--terminal-green)]" />
            <span>30 sec generation</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[var(--terminal-yellow)]" />
            <span>Production ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[var(--vs-code-blue)]" />
            <span>Zero configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--syntax-function)]" />
            <span>Deploy anywhere</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Before/After Split Screen Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid lg:grid-cols-2 gap-8 mb-16"
      >
        {/* BEFORE: Terminal/GitHub View */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-[var(--github-danger)]/20 text-[var(--github-danger)] text-xs font-mono rounded-full">
              BEFORE
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] font-mono">
              Just another GitHub repo
            </h3>
          </div>

          <TerminalWindow title="github.com" showControls={true}>
            <div className="space-y-3">
              <TerminalLine 
                user="visitor" 
                host="github.com" 
                path={`/${currentRepo.repo}`}
              >
                <span className="text-[var(--text-muted)]">Viewing repository...</span>
              </TerminalLine>
              
              <GitHubRepoDisplay
                owner={currentRepo.repo.split('/')[0]}
                repo={currentRepo.repo.split('/')[1]}
                description={currentRepo.description}
                stars={currentRepo.stars}
                language={currentRepo.language}
                url={`https://github.com/${currentRepo.repo}`}
              />
              
              <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded border-l-4 border-[var(--text-muted)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">README.md</div>
                <div className="text-sm text-[var(--text-secondary)] font-mono">
                  # {currentRepo.repo.split('/')[1]}
                  <br />
                  {currentRepo.description}
                  <br />
                  <span className="text-[var(--text-muted)]">## Installation...</span>
                </div>
              </div>

              <TerminalLine status="info" delay={0}>
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Visitors see: Wall of text, no visual appeal</span>
                </div>
              </TerminalLine>
            </div>
          </TerminalWindow>
        </div>

        {/* AFTER: Transformed Website */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-[var(--terminal-green)]/20 text-[var(--terminal-green)] text-xs font-mono rounded-full">
              AFTER
            </div>
            <h3 className="text-lg font-semibold text-[var(--terminal-green)] font-mono">
              Professional website
            </h3>
          </div>

          <TerminalWindow title={`${currentRepo.transformation} - 4site.pro`} showControls={true}>
            <div className="space-y-3">
              <TerminalLine 
                user="dev" 
                host="4site.pro" 
                command={`transform-repo ${currentRepo.repo}`}
                status="success"
              />
              
              {/* Mock website preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="bg-gradient-to-br from-[var(--vs-code-blue)]/10 to-[var(--terminal-green)]/10 rounded-lg p-4 border border-[var(--border-accent)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--vs-code-blue)] to-[var(--terminal-green)] rounded"></div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {currentRepo.transformation}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{currentRepo.repo}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="h-2 bg-[var(--vs-code-blue)]/30 rounded w-3/4"></div>
                  <div className="h-2 bg-[var(--terminal-green)]/30 rounded w-1/2"></div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="h-8 bg-[var(--bg-secondary)] rounded"></div>
                    <div className="h-8 bg-[var(--bg-secondary)] rounded"></div>
                    <div className="h-8 bg-[var(--bg-secondary)] rounded"></div>
                  </div>
                </div>
              </motion.div>

              <TerminalLine status="success" delay={0}>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-[var(--terminal-green)]">
                    <Heart className="w-3 h-3" />
                    <span>Beautiful</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--vs-code-blue)]">
                    <Users className="w-3 h-3" />
                    <span>Engaging</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--terminal-yellow)]">
                    <Sparkles className="w-3 h-3" />
                    <span>Professional</span>
                  </div>
                </div>
              </TerminalLine>
            </div>
          </TerminalWindow>
        </div>
      </motion.div>

      {/* Interactive Demo CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-mono">
            <span className="text-[var(--syntax-comment)]"># </span>
            Try it with your repository
          </h2>
          <p className="text-[var(--text-secondary)] font-mono">
            <span className="text-[var(--terminal-green)]">$</span> Enter any GitHub repo to see the magic happen
          </p>
        </div>

        {/* Terminal-style input */}
        <TerminalInput
          value={demoUrl}
          onChange={setDemoUrl}
          onSubmit={handleDemoSubmit}
          isLoading={isLoading}
          placeholder="owner/repo or full GitHub URL..."
          suggestions={[
            'facebook/react',
            'microsoft/vscode',
            'vercel/next.js',
            'django/django',
            'rails/rails'
          ]}
        />

        {/* Quick examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          <span className="text-sm text-[var(--text-muted)] font-mono">Quick try:</span>
          {examples.map((example, index) => (
            <button
              key={example.repo}
              onClick={() => setDemoUrl(example.repo)}
              className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                index === currentExample
                  ? 'bg-[var(--vs-code-blue)]/20 border-[var(--vs-code-blue)] text-[var(--vs-code-blue)]'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]'
              }`}
            >
              {example.repo}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Social Proof for Developers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-20 text-center"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { metric: '30s', label: 'Average generation time', icon: Zap },
            { metric: '95%', label: 'Developer satisfaction', icon: Heart },
            { metric: '100%', label: 'Mobile responsive', icon: Globe },
            { metric: '∞', label: 'Customization options', icon: Code }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + index * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-2">
                <stat.icon className="w-6 h-6 text-[var(--vs-code-blue)]" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                {stat.metric}
              </div>
              <div className="text-sm text-[var(--text-muted)] font-mono">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default DeveloperHero;
/**
 * Terminal-Inspired Interface Components
 * Developer-familiar CLI aesthetics that build trust and familiarity
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal,
  ChevronRight,
  Check,
  X,
  Loader2,
  Copy,
  ExternalLink,
  GitBranch,
  Star,
  Eye
} from 'lucide-react';

// ============================================================================
// TERMINAL WINDOW COMPONENT
// ============================================================================

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title = "4site.pro",
  children,
  className = "",
  showControls = true
}) => {
  return (
    <div className={`bg-glass rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--vs-code-sidebar)] border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          {showControls && (
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
            </div>
          )}
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
            <Terminal className="w-4 h-4" />
            <span className="font-mono">{title}</span>
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)] font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm bg-[var(--code-bg)] min-h-[200px]">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// TERMINAL COMMAND LINE
// ============================================================================

interface TerminalLineProps {
  user?: string;
  host?: string;
  path?: string;
  command?: string;
  children?: React.ReactNode;
  status?: 'pending' | 'success' | 'error' | 'info';
  delay?: number;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({
  user = "dev",
  host = "4site.pro",
  path = "~",
  command,
  children,
  status,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'var(--terminal-green)';
      case 'error': return 'var(--terminal-red)';
      case 'info': return 'var(--vs-code-blue)';
      default: return 'var(--text-primary)';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <Check className="w-4 h-4 text-[var(--terminal-green)]" />;
      case 'error': return <X className="w-4 h-4 text-[var(--terminal-red)]" />;
      case 'pending': return <Loader2 className="w-4 h-4 text-[var(--vs-code-blue)] animate-spin" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className="flex items-start gap-2 py-1"
    >
      {/* Status Icon */}
      {status && (
        <div className="mt-0.5">
          {getStatusIcon()}
        </div>
      )}
      
      {/* Command Line */}
      <div className="flex-1">
        {command ? (
          <div className="flex items-center gap-1">
            <span className="text-[var(--terminal-green)]">{user}@{host}</span>
            <span className="text-[var(--text-muted)]">:</span>
            <span className="text-[var(--vs-code-blue)]">{path}</span>
            <span className="text-[var(--text-muted)]">$</span>
            <span style={{ color: getStatusColor() }}>{command}</span>
          </div>
        ) : (
          <div style={{ color: getStatusColor() }}>
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// GITHUB REPOSITORY DISPLAY
// ============================================================================

interface GitHubRepoDisplayProps {
  owner: string;
  repo: string;
  stars?: number;
  language?: string;
  description?: string;
  url?: string;
  isAnalyzing?: boolean;
  analysisComplete?: boolean;
}

export const GitHubRepoDisplay: React.FC<GitHubRepoDisplayProps> = ({
  owner,
  repo,
  stars,
  language,
  description,
  url,
  isAnalyzing = false,
  analysisComplete = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 mt-2"
    >
      {/* Repository Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--vs-code-blue)] font-semibold">
            {owner}/{repo}
          </span>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        
        {/* Repository Stats */}
        {stars !== undefined && (
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{stars.toLocaleString()}</span>
            </div>
            {language && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[var(--terminal-green)]"></div>
                <span>{language}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {description}
        </p>
      )}
      
      {/* Analysis Status */}
      <div className="flex items-center gap-2 text-xs">
        {isAnalyzing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-[var(--vs-code-blue)]" />
            <span className="text-[var(--vs-code-blue)]">Analyzing repository...</span>
          </>
        ) : analysisComplete ? (
          <>
            <Check className="w-3 h-3 text-[var(--terminal-green)]" />
            <span className="text-[var(--terminal-green)]">Analysis complete</span>
          </>
        ) : (
          <>
            <Eye className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Ready to analyze</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// LIVE TRANSFORMATION DEMO
// ============================================================================

interface TransformationDemoProps {
  repoUrl: string;
  onStart?: () => void;
  isLoading?: boolean;
}

export const TransformationDemo: React.FC<TransformationDemoProps> = ({
  repoUrl,
  onStart,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const steps = [
    { command: `git clone ${repoUrl}`, status: 'success' as const, delay: 0 },
    { command: 'analyzing README.md...', status: 'pending' as const, delay: 1000 },
    { command: 'detecting tech stack...', status: 'pending' as const, delay: 2000 },
    { command: 'generating website structure...', status: 'pending' as const, delay: 3000 },
    { command: 'applying premium design...', status: 'pending' as const, delay: 4000 },
    { command: '✓ Website generated successfully!', status: 'success' as const, delay: 5000 }
  ];

  useEffect(() => {
    if (isLoading && !isActive) {
      setIsActive(true);
      setCurrentStep(0);
      
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(timer);
            setTimeout(() => {
              setIsActive(false);
              setCurrentStep(0);
            }, 2000);
            return prev;
          }
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isLoading, isActive, steps.length]);

  return (
    <TerminalWindow title="transform-repo" className="max-w-2xl">
      <div className="space-y-1">
        <TerminalLine 
          command={`transform-repo ${repoUrl}`}
          status="info"
        />
        
        <AnimatePresence>
          {isActive && steps.slice(0, currentStep + 1).map((step, index) => (
            <TerminalLine
              key={index}
              status={index === currentStep ? 'pending' : step.status}
              delay={0}
            >
              {step.command}
            </TerminalLine>
          ))}
        </AnimatePresence>
        
        {!isActive && (
          <TerminalLine delay={0}>
            <span className="text-[var(--text-muted)]">
              Ready to transform your repository
              <span className="terminal-cursor"></span>
            </span>
          </TerminalLine>
        )}
      </div>
    </TerminalWindow>
  );
};

// ============================================================================
// CODE SYNTAX HIGHLIGHTER
// ============================================================================

interface CodeBlockProps {
  language?: string;
  code: string;
  title?: string;
  showLineNumbers?: boolean;
  copyable?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = 'bash',
  code,
  title,
  showLineNumbers = false,
  copyable = true
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="code-block">
      {/* Code Header */}
      {(title || copyable) && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
          {title && (
            <span className="text-sm text-[var(--text-secondary)] font-mono">
              {title}
            </span>
          )}
          {copyable && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}
      
      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-code text-sm">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <span className="text-[var(--text-muted)] select-none mr-4 min-w-[2rem] text-right">
                  {index + 1}
                </span>
              )}
              <code className="flex-1">
                {highlightSyntax(line, language)}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

// Simple syntax highlighting function
const highlightSyntax = (line: string, language: string) => {
  if (language === 'bash' || language === 'shell') {
    return (
      <span>
        {line.replace(/^(\$|#)\s*/, (match) => (
          `<span class="text-syntax-comment">${match}</span>`
        ))}
      </span>
    );
  }
  
  // Default: no highlighting
  return <span>{line}</span>;
};

// ============================================================================
// TERMINAL INPUT COMPONENT
// ============================================================================

interface TerminalInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  suggestions?: string[];
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  placeholder = "Enter GitHub repository URL...",
  value,
  onChange,
  onSubmit,
  isLoading = false,
  suggestions = []
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSubmit?.();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="bg-[var(--code-bg)] border border-[var(--border-primary)] rounded-lg p-4 font-mono">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--terminal-green)]">dev@4site.pro</span>
          <span className="text-[var(--text-muted)]">:</span>
          <span className="text-[var(--vs-code-blue)]">~</span>
          <span className="text-[var(--text-muted)]">$</span>
          <span className="text-[var(--text-primary)]">transform-repo</span>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            
            {!value && (
              <span className="absolute top-0 left-0 text-[var(--text-muted)] pointer-events-none">
                <span className="terminal-cursor"></span>
              </span>
            )}
          </div>
          
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[var(--vs-code-blue)] animate-spin" />
          )}
        </div>
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-[var(--code-bg)] border border-[var(--border-primary)] rounded-lg shadow-xl z-10"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TerminalWindow;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GITHUB_URL_REGEX } from '../../constants';

interface GlassURLInputFormProps {
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export const GlassURLInputForm: React.FC<GlassURLInputFormProps> = ({ onSubmit, initialUrl = '' }) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("GitHub repository URL cannot be empty.");
      return;
    }
    if (!GITHUB_URL_REGEX.test(url)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Repository Input Field */}
      <div>
        <label htmlFor="repository" className="block text-sm font-medium text-white mb-2">
          Repository URL
        </label>
        <div className="glass-input">
          <div className="glass-input-shadow" />
          <div className="flex items-center px-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="text-white/50 mr-3 flex-shrink-0"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <input
              type="text"
              id="repository"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="https://github.com/username/repository"
              className="flex-1"
              required
            />
          </div>
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-300 mt-2 flex items-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </motion.p>
        )}
      </div>

      {/* Example repositories */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-white/50">Try:</span>
        {[
          'facebook/react',
          'microsoft/vscode',
          'vercel/next.js'
        ].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setUrl(`https://github.com/${example}`)}
            className="text-xs text-white/70 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Terms Checkbox */}
      <div className="flex gap-3 items-start">
        <input 
          type="checkbox" 
          id="terms"
          className="w-4 h-4 bg-white/20 border-white/30 rounded mt-0.5 focus:ring-0 focus:ring-offset-0" 
          required 
        />
        <label htmlFor="terms" className="text-sm font-normal text-white/70 leading-relaxed">
          I understand this will analyze public repository data. View our{' '}
          <a href="#" className="text-white hover:opacity-80 transition-opacity font-medium underline">
            Privacy Policy
          </a>
        </label>
      </div>

      {/* Submit Button */}
      <motion.div 
        className="pt-4"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button type="submit" className="glass-button w-full glass-shimmer">
          <div className="glass-button-shadow" />
          <div className="glass-button-content">
            <span>Generate Your Website</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </button>
      </motion.div>

      {/* Alternative: Circular button */}
      <div className="text-center pt-4">
        <p className="text-xs text-white/50 mb-4">or use our signature button</p>
        <div className="flex justify-center">
          <motion.button
            type="button"
            onClick={handleSubmit}
            className="glass-circle-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="glass-circle-shadow" />
            <div className="relative z-30 text-center text-white font-bold">
              <div className="text-xs opacity-90">Give Me</div>
              <div className="text-lg">4site!</div>
            </div>
            {/* Rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white/60 z-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>
        </div>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GITHUB_URL_REGEX } from '../../constants';
import { Icon } from '../ui/Icon';

interface URLInputFormProps {
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({ onSubmit, initialUrl = '' }) => {
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
      setError("Please enter a valid GitHub repository (e.g., yourgithub/yourgithubrepo)");
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4"
    >
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 items-center">
        <div className="relative flex-grow">
          <div>
            {/* URL prefix above the input box */}
            <label className="block text-xs text-text-muted font-mono mb-1">
              https://github.com/
            </label>
            
            <div className="relative">
              {/* GitHub icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Icon name="Github" size={20} />
              </div>
              
              {/* Black liquid glass input */}
              <input
                type="text"
                value={url.replace('https://github.com/', '')}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const fullUrl = newValue.startsWith('https://github.com/') 
                    ? newValue 
                    : `https://github.com/${newValue}`;
                  setUrl(fullUrl);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder=""
                className="w-full pl-12 pr-4 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-gray-100 placeholder-gray-500 font-mono focus:outline-none focus:border-white/20 focus:bg-black/70 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:bg-black/65"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 8px 24px -4px rgba(0,0,0,0.8)'
                }}
                aria-label="GitHub Repository URL"
              />
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <p className="text-xs text-error mt-2 font-mono flex items-center space-x-1">
              <Icon name="AlertTriangle" size={14} />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Circular Submit Button */}
        <div className="flex-shrink-0 lg:mt-6">
          <motion.button
            type="submit"
            className="relative w-20 h-20 lg:w-24 lg:h-24 bg-wu-gold hover:bg-wu-gold-muted text-text-on-emphasis font-bold text-sm rounded-full transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
            whileHover={{ 
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-wu-gold to-orange-500 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 text-center leading-tight">
              <div className="text-xs opacity-90">Give Me</div>
              <div className="text-lg font-black">4site!</div>
            </div>
            {/* Spinning outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>
        </div>
      </div>

      {/* Simple helpful hints */}
      <div className="flex items-center justify-center space-x-6 text-xs text-text-muted font-mono">
        <span>Public repos only</span>
        <span>•</span>
        <span>No signup needed</span>
        <span>•</span>
        <span>Instant generation</span>
      </div>
    </form>
  );
};

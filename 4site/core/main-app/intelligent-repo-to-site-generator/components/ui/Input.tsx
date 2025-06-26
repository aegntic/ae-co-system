
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'futuristic';
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  error, 
  className = '', 
  variant = 'default',
  icon,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseStyle = "block w-full px-4 py-3 rounded-lg bg-gh-bg-tertiary border-2 border-gh-border-default focus:border-wu-gold focus:ring-0 focus:outline-none transition-all duration-200 placeholder-gh-text-muted text-gh-text-primary disabled:opacity-50 font-mono text-sm";
  const errorStyle = error ? "border-error focus:border-error" : "";
  const futuristicStyle = variant === 'futuristic' ? "backdrop-blur-sm shadow-lg" : "";
  const iconPaddingStyle = icon ? "pl-12" : "";

  return (
    <div className="w-full">
      {label && (
        <motion.label 
          htmlFor={id} 
          className="block text-sm font-medium text-gh-text-secondary mb-2 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {label}
        </motion.label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gh-text-muted">
            {icon}
          </div>
        )}
        <motion.input
          id={id}
          className={`${baseStyle} ${errorStyle} ${futuristicStyle} ${iconPaddingStyle} ${className}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.02 }}
          {...props}
        />
        {isFocused && variant === 'futuristic' && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-wu-gold pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)',
            }}
          />
        )}
      </div>
      {error && (
        <motion.p 
          className="mt-2 text-xs text-error font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

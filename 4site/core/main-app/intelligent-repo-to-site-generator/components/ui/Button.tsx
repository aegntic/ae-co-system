
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gh-bg-primary disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

  const variantStyles = {
    primary: "bg-wu-gold text-text-on-emphasis hover:bg-wu-gold-muted hover:shadow-lg hover:shadow-wu-gold/20 focus:ring-wu-gold transform hover:-translate-y-0.5",
    secondary: "bg-gh-bg-secondary border-2 border-gh-border-default text-gh-text-primary hover:border-wu-gold hover:bg-gh-bg-tertiary focus:ring-wu-gold transform hover:-translate-y-0.5",
    outline: "border-2 border-wu-gold text-wu-gold hover:bg-wu-gold-subtle focus:ring-wu-gold transform hover:-translate-y-0.5",
    ghost: "text-wu-gold hover:bg-wu-gold-subtle focus:ring-wu-gold transform hover:-translate-y-0.5",
    destructive: "bg-error text-text-on-emphasis hover:shadow-lg hover:shadow-error/30 focus:ring-error transform hover:-translate-y-0.5",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <motion.button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      {...props}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
      )}
      <div className="relative z-10 flex items-center">
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : icon}
        {children}
      </div>
    </motion.button>
  );
};

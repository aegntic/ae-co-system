
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'futuristic' | 'glow';
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  animate = true,
  ...props 
}) => {
  const variantStyles = {
    default: "bg-gh-bg-secondary border-gh-border-default hover:border-wu-gold/50",
    futuristic: "bg-gradient-to-br from-gh-bg-secondary to-gh-bg-tertiary border-gh-border-default hover:border-wu-gold backdrop-blur-sm",
    glow: "bg-gh-bg-secondary border-wu-gold shadow-lg shadow-wu-gold/20 hover:shadow-wu-gold/30"
  };

  const baseStyles = "text-gh-text-primary rounded-xl border transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-xl relative overflow-hidden";

  const CardComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
    whileHover: { scale: 1.01 }
  } : {};

  return (
    <CardComponent
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...(animate && animationProps)}
      {...props}
    >
      {variant === 'futuristic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-wu-gold-subtle to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </CardComponent>
  );
};

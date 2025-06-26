import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Bot, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Cpu,
  Network,
  FileText
} from 'lucide-react';

interface LoadingStateProps {
  isLoading: boolean;
  stage?: string;
  progress?: number;
  message?: string;
  substeps?: string[];
  error?: string | null;
  success?: boolean;
  estimatedTime?: number;
  startTime?: number;
}

/**
 * Enhanced AI Generation Loading Indicator
 */
export const AIGenerationLoader: React.FC<LoadingStateProps> = ({
  isLoading,
  stage = 'processing',
  progress = 0,
  message = 'Generating your site...',
  substeps = [],
  error,
  success,
  estimatedTime = 30000, // 30 seconds default
  startTime
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSubstep, setCurrentSubstep] = useState(0);

  useEffect(() => {
    if (!isLoading || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  useEffect(() => {
    if (!isLoading || substeps.length === 0) return;

    const stepDuration = estimatedTime / substeps.length;
    const expectedStep = Math.floor(elapsedTime / stepDuration);
    setCurrentSubstep(Math.min(expectedStep, substeps.length - 1));
  }, [elapsedTime, estimatedTime, substeps.length, isLoading]);

  const getStageIcon = () => {
    if (error) return <AlertCircle className="text-red-400" />;
    if (success) return <CheckCircle className="text-green-400" />;
    
    switch (stage) {
      case 'analyzing':
        return <Bot className="text-blue-400" />;
      case 'generating':
        return <Sparkles className="text-purple-400" />;
      case 'optimizing':
        return <Zap className="text-yellow-400" />;
      case 'finalizing':
        return <FileText className="text-green-400" />;
      default:
        return <Cpu className="text-blue-400" />;
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const getProgressColor = () => {
    if (error) return 'from-red-500 to-red-600';
    if (success) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-purple-600';
  };

  return (
    <AnimatePresence>
      {(isLoading || error || success) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md mx-auto"
        >
          {/* Main Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center"
            >
              <div className="w-8 h-8">
                {getStageIcon()}
              </div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, error ? 100 : success ? 100 : 0)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between items-center mt-2 text-sm text-white/60">
              <span>{Math.round(progress)}%</span>
              {startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(elapsedTime)}
                  {estimatedTime > 0 && ` / ${formatTime(estimatedTime)}`}
                </span>
              )}
            </div>
          </div>

          {/* Main Message */}
          <h3 className="text-lg font-semibold text-white text-center mb-2">
            {error ? 'Generation Failed' : success ? 'Site Generated!' : message}
          </h3>

          {/* Stage Indicator */}
          {!error && !success && (
            <p className="text-white/60 text-center mb-4 capitalize">
              {stage.replace(/([A-Z])/g, ' $1').toLowerCase()}...
            </p>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-400/20 rounded-lg mb-4"
            >
              <p className="text-red-300 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Substeps */}
          {substeps.length > 0 && !error && !success && (
            <div className="space-y-2">
              {substeps.map((step, index) => {
                const isActive = index === currentSubstep;
                const isCompleted = index < currentSubstep;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: isActive ? 1 : isCompleted ? 0.7 : 0.3,
                      scale: isActive ? 1.02 : 1
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isActive ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-green-400' : 
                      isActive ? 'bg-blue-400' : 'bg-white/30'
                    }`} />
                    <span className={`text-sm ${
                      isActive ? 'text-white' : 'text-white/60'
                    }`}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-green-300 text-sm">
                Your site has been generated successfully!
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Skeleton Loader for Content
 */
export const SkeletonLoader: React.FC<{
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}> = ({ 
  className = '', 
  variant = 'rectangular', 
  width = '100%', 
  height = 20,
  lines = 1
}) => {
  const baseClasses = "bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse";
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4`}
            style={{ 
              width: index === lines - 1 ? '70%' : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * Inline Loading Spinner
 */
export const InlineLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}> = ({ 
  size = 'md', 
  color = 'text-blue-400', 
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} ${color} animate-spin`} />
      {text && <span className="text-white/80 text-sm">{text}</span>}
    </div>
  );
};

/**
 * Button Loading State
 */
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}> = ({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  disabled,
  onClick,
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    outline: 'border border-white/20 text-white hover:bg-white/10'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        px-4 py-2 rounded-lg font-semibold transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Progress Ring/Circle
 */
export const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Network Status Indicator
 */
export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection speed
    const testConnection = async () => {
      const startTime = Date.now();
      try {
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
        const endTime = Date.now();
        const speed = endTime - startTime < 500 ? 'fast' : 'slow';
        setConnectionSpeed(speed);
      } catch {
        setConnectionSpeed('slow');
      }
    };

    if (isOnline) {
      testConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
        <div className="w-2 h-2 bg-red-400 rounded-full" />
        Offline
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
      connectionSpeed === 'fast' 
        ? 'bg-green-500/20 border border-green-400/30 text-green-300'
        : 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300'
    }`}>
      <Network className="w-3 h-3" />
      {connectionSpeed === 'fast' ? 'Fast Connection' : 'Slow Connection'}
    </div>
  );
};

export default {
  AIGenerationLoader,
  SkeletonLoader,
  InlineLoader,
  LoadingButton,
  ProgressRing,
  NetworkStatusIndicator
};
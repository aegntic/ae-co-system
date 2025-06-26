import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '../../hooks/useGSAP';
import { useMicroInteractions } from '../../hooks/useMicroInteractions';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ChevronRight, 
  WifiOff, 
  Server, 
  Clock, 
  Bug,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ErrorDetails {
  code?: string;
  message: string;
  type: 'network' | 'timeout' | 'server' | 'validation' | 'permission' | 'unknown';
  retryable?: boolean;
  suggestions?: string[];
  technicalDetails?: string;
  timestamp?: number;
}

interface RetryConfig {
  maxAttempts: number;
  currentAttempt: number;
  isRetrying: boolean;
  nextRetryIn?: number;
  onRetry: () => void;
  onCancel?: () => void;
}

interface EnhancedErrorProps {
  error: ErrorDetails;
  retry?: RetryConfig;
  onDismiss?: () => void;
  onHome?: () => void;
  onReportBug?: (error: ErrorDetails) => void;
  showTechnicalDetails?: boolean;
  enableHaptics?: boolean;
  theme?: 'minimal' | 'detailed' | 'premium';
}

const ERROR_TYPES = {
  network: {
    icon: WifiOff,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    title: 'Connection Issue'
  },
  timeout: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    title: 'Request Timeout'
  },
  server: {
    icon: Server,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    title: 'Server Error'
  },
  validation: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    title: 'Validation Error'
  },
  permission: {
    icon: AlertTriangle,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    title: 'Permission Denied'
  },
  unknown: {
    icon: Bug,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    title: 'Unexpected Error'
  }
};

export const EnhancedErrorSystem: React.FC<EnhancedErrorProps> = ({
  error,
  retry,
  onDismiss,
  onHome,
  onReportBug,
  showTechnicalDetails = false,
  enableHaptics = true,
  theme = 'detailed'
}) => {
  // State
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const errorIconRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { animateTo, animateFrom, createTimeline } = useGSAP();
  const { executeInteraction, triggerHaptic } = useMicroInteractions();

  // Error type configuration
  const errorConfig = ERROR_TYPES[error.type] || ERROR_TYPES.unknown;
  const IconComponent = errorConfig.icon;

  // Retry countdown effect
  useEffect(() => {
    if (retry?.nextRetryIn && retry.nextRetryIn > 0) {
      setRetryCountdown(retry.nextRetryIn);
      
      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retry?.nextRetryIn]);

  // Error entrance animation
  useEffect(() => {
    if (containerRef.current) {
      // Shake animation for error
      const timeline = createTimeline();
      
      timeline
        .from(containerRef.current, {
          scale: 0.8,
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: 'back.out(1.7)'
        })
        .to(errorIconRef.current, {
          x: [-5, 5, -3, 3, 0],
          duration: 0.6,
          ease: 'power2.inOut'
        }, 0.2);

      // Haptic feedback
      if (enableHaptics) {
        triggerHaptic('medium');
      }
    }
  }, [createTimeline, enableHaptics, triggerHaptic]);

  // Copy error details
  const handleCopyError = useCallback(async () => {
    const errorText = `
Error: ${error.message}
Type: ${error.type}
Code: ${error.code || 'N/A'}
Time: ${error.timestamp ? new Date(error.timestamp).toISOString() : new Date().toISOString()}
Technical Details: ${error.technicalDetails || 'N/A'}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      
      if (enableHaptics) {
        triggerHaptic('light');
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  }, [error, enableHaptics, triggerHaptic]);

  // Handle retry with animation
  const handleRetry = useCallback(() => {
    if (!retry || retry.isRetrying) return;

    // Button animation
    if (containerRef.current) {
      const retryButton = containerRef.current.querySelector('.retry-button') as HTMLElement;
      if (retryButton) {
        executeInteraction(retryButton, {
          type: 'click',
          intensity: 'medium',
          enableHaptics: enableHaptics
        });
      }
    }

    retry.onRetry();
  }, [retry, executeInteraction, enableHaptics]);

  // Get theme classes
  const getThemeClasses = () => {
    const themes = {
      minimal: 'bg-gray-900/95 border-gray-700',
      detailed: 'glass-primary border-white/10',
      premium: 'bg-gradient-to-br from-gray-900/95 to-black/95 border-red-400/30'
    };
    return themes[theme];
  };

  // Format error message for user-friendly display
  const formatErrorMessage = (message: string) => {
    // Common error message improvements
    const improvements: Record<string, string> = {
      'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
      'NetworkError': 'Network connection failed. Please try again.',
      'TimeoutError': 'The request took too long to complete. Please try again.',
      'AbortError': 'The request was cancelled. Please try again.'
    };

    return improvements[message] || message;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative max-w-lg w-full rounded-2xl border ${getThemeClasses()} p-6 ${errorConfig.bgColor} ${errorConfig.borderColor}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start space-x-4 mb-6">
            <motion.div
              ref={errorIconRef}
              className={`flex-shrink-0 w-12 h-12 rounded-full ${errorConfig.bgColor} flex items-center justify-center`}
            >
              <IconComponent className={`w-6 h-6 ${errorConfig.color}`} />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                {errorConfig.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {formatErrorMessage(error.message)}
              </p>
              
              {error.code && (
                <p className="text-gray-500 text-xs mt-2 font-mono">
                  Error Code: {error.code}
                </p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {error.suggestions && error.suggestions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6"
            >
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                💡 Suggestions:
              </h4>
              <ul className="space-y-2">
                {error.suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-2 text-sm text-gray-400"
                  >
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <span>{suggestion}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Retry Information */}
          {retry && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6 p-4 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">
                  Retry Attempt {retry.currentAttempt} of {retry.maxAttempts}
                </span>
                {retryCountdown > 0 && (
                  <span className="text-xs text-gray-500 font-mono">
                    Next retry in {retryCountdown}s
                  </span>
                )}
              </div>
              
              {/* Retry Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(retry.currentAttempt / retry.maxAttempts) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {/* Technical Details */}
          {showTechnicalDetails && error.technicalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: showDetails ? 'auto' : 0, 
                opacity: showDetails ? 1 : 0 
              }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">
                    Technical Details
                  </h4>
                  <button
                    onClick={handleCopyError}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-words">
                  {error.technicalDetails}
                </pre>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary Action */}
            {retry && error.retryable && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetry}
                disabled={retry.isRetrying || retryCountdown > 0}
                className={`retry-button flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  retry.isRetrying || retryCountdown > 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {retry.isRetrying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>
                  {retry.isRetrying 
                    ? 'Retrying...' 
                    : retryCountdown > 0 
                    ? `Retry (${retryCountdown}s)`
                    : 'Retry'
                  }
                </span>
              </motion.button>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-2">
              {onHome && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onHome}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </motion.button>
              )}

              {onReportBug && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onReportBug(error)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <Bug className="w-4 h-4" />
                  <span>Report</span>
                </motion.button>
              )}

              {showTechnicalDetails && error.technicalDetails && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Details</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Error Timestamp */}
          {error.timestamp && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-600">
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Error boundary component with enhanced error handling
 */
export class EnhancedErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    onError?: (error: ErrorDetails) => void;
    fallback?: React.ComponentType<{ error: ErrorDetails; retry: () => void }>;
  },
  { hasError: boolean; error: ErrorDetails | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): any {
    const errorDetails: ErrorDetails = {
      message: error.message,
      type: 'unknown',
      technicalDetails: error.stack,
      timestamp: Date.now(),
      retryable: true
    };

    return {
      hasError: true,
      error: errorDetails
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <EnhancedErrorSystem
          error={this.state.error}
          retry={{
            maxAttempts: 3,
            currentAttempt: 1,
            isRetrying: false,
            onRetry: this.retry
          }}
          showTechnicalDetails={true}
        />
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorSystem;
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Send } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
  reportSent: boolean;
}

/**
 * Enhanced Error Boundary with automatic error reporting and user-friendly fallbacks
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Automatically report critical errors
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    if (this.state.isReporting || this.state.reportSent) return;

    this.setState({ isReporting: true });

    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.NODE_ENV,
        severity: this.getErrorSeverity(error)
      };

      // Report to error tracking service (implement your preferred service)
      await this.sendErrorReport(errorReport);

      this.setState({ reportSent: true });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private sendErrorReport = async (errorReport: any): Promise<void> => {
    // For now, just log to console. In production, send to Sentry, LogRocket, etc.
    console.log('Error Report:', errorReport);
    
    // Example implementation for future integration:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
  };

  private getUserId = (): string | null => {
    // Get user ID from auth context or localStorage
    try {
      const userData = localStorage.getItem('supabase.auth.token');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.user?.id || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  private getSessionId = (): string => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = `SES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    if (message.includes('auth') || message.includes('permission')) {
      return 'high';
    }
    return 'critical';
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        isReporting: false,
        reportSent: false
      });
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:

`);
    
    window.open(`mailto:support@4site.pro?subject=${subject}&body=${body}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            {/* Glass Container */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </motion.div>

              {/* Error Message */}
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                Something went wrong
              </h2>
              
              <p className="text-white/60 mb-6">
                We're sorry for the inconvenience. An unexpected error occurred while processing your request.
              </p>

              {/* Error ID */}
              <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/40 mb-1">Error ID</p>
                <p className="font-mono text-sm text-white/80">{this.state.errorId}</p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80">
                    Show Technical Details
                  </summary>
                  <div className="mt-4 p-4 bg-black/20 rounded-lg overflow-auto">
                    <p className="text-xs text-red-300 mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs text-white/60 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Retry Button */}
                {this.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                )}

                {/* Go Home Button */}
                <button
                  onClick={this.handleGoHome}
                  className="w-full px-4 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                {/* Report Bug Button */}
                <button
                  onClick={this.handleReportBug}
                  className="w-full px-4 py-3 bg-transparent border border-white/20 text-white/70 font-medium rounded-lg hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
              </div>

              {/* Auto-Report Status */}
              {this.state.isReporting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60"
                >
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Reporting error automatically...
                </motion.div>
              )}

              {this.state.reportSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400"
                >
                  <Send className="w-4 h-4" />
                  Error reported successfully
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook for manually reporting errors
 */
export const useErrorReporter = () => {
  const reportError = (error: Error, context?: string) => {
    const errorReport = {
      errorId: `MAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      type: 'manual'
    };

    console.error('Manual Error Report:', errorReport);
    
    // Send to error tracking service
    // Implementation depends on your chosen service
  };

  return { reportError };
};

export default ErrorBoundary;
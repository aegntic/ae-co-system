/**
 * Advanced Lazy Loading Components with Performance Monitoring
 * Implements intelligent preloading, error boundaries, and performance tracking
 */

import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Performance monitoring for lazy components
interface LazyLoadMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  cacheHit: boolean;
  error?: string;
}

// Global lazy load cache
const lazyLoadCache = new Map<string, Promise<any>>();
const metricsCache = new Map<string, LazyLoadMetrics>();

// Performance reporter
const reportLazyLoadMetrics = (metrics: LazyLoadMetrics) => {
  console.log(`[LazyLoad Performance] ${metrics.componentName}:`, {
    loadTime: `${metrics.loadTime.toFixed(2)}ms`,
    renderTime: `${metrics.renderTime.toFixed(2)}ms`,
    cacheHit: metrics.cacheHit,
    error: metrics.error
  });

  // Report to analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'lazy_component_load', {
      component_name: metrics.componentName,
      load_time: Math.round(metrics.loadTime),
      cache_hit: metrics.cacheHit
    });
  }
};

// Advanced lazy loader with caching and performance monitoring
const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) => {
  const cacheKey = componentName;
  
  // Check cache first
  if (lazyLoadCache.has(cacheKey)) {
    return lazy(() => lazyLoadCache.get(cacheKey)!);
  }

  // Create cached promise
  const loadPromise = (async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      reportLazyLoadMetrics({
        componentName,
        loadTime,
        renderTime: 0,
        cacheHit: false
      });
      
      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      reportLazyLoadMetrics({
        componentName,
        loadTime,
        renderTime: 0,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  })();

  lazyLoadCache.set(cacheKey, loadPromise);
  return lazy(() => loadPromise);
};

// Intelligent loading state with animations
const LoadingSkeleton: React.FC<{ 
  type?: 'card' | 'form' | 'dashboard' | 'template' | 'premium';
  delay?: number;
}> = ({ type = 'card', delay = 0 }) => {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!show) return null;

  const skeletonClass = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse";
  
  const variants = {
    card: (
      <div className="p-6 border border-gray-200 rounded-lg space-y-4">
        <div className={`h-4 ${skeletonClass} rounded w-3/4`}></div>
        <div className={`h-3 ${skeletonClass} rounded w-1/2`}></div>
        <div className={`h-32 ${skeletonClass} rounded`}></div>
      </div>
    ),
    form: (
      <div className="space-y-4">
        <div className={`h-10 ${skeletonClass} rounded`}></div>
        <div className={`h-10 ${skeletonClass} rounded`}></div>
        <div className={`h-10 ${skeletonClass} rounded w-1/3`}></div>
      </div>
    ),
    dashboard: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className={`h-3 ${skeletonClass} rounded w-1/2`}></div>
            <div className={`h-8 ${skeletonClass} rounded`}></div>
          </div>
        ))}
      </div>
    ),
    template: (
      <div className="space-y-6">
        <div className={`h-12 ${skeletonClass} rounded w-1/2`}></div>
        <div className={`h-64 ${skeletonClass} rounded`}></div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`h-8 ${skeletonClass} rounded`}></div>
          <div className={`h-8 ${skeletonClass} rounded`}></div>
        </div>
      </div>
    ),
    premium: (
      <div className="relative">
        <div className={`h-96 ${skeletonClass} rounded-lg`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-600/20 rounded-lg animate-pulse"></div>
      </div>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {variants[type]}
    </motion.div>
  );
};

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyComponent Error]:', error, errorInfo);
    
    // Report to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'lazy_component_error', {
        error_message: error.message,
        component_stack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      return Fallback ? <Fallback /> : (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-semibold">Component Loading Error</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'Failed to load component'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper for lazy components with performance monitoring
const LazyWrapper: React.FC<{
  children: React.ReactNode;
  componentName: string;
  loadingType?: 'card' | 'form' | 'dashboard' | 'template' | 'premium';
  fallback?: React.ComponentType<any>;
  preload?: boolean;
}> = ({ 
  children, 
  componentName, 
  loadingType = 'card', 
  fallback,
  preload = false 
}) => {
  const renderStartTime = React.useRef<number>(0);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const cached = metricsCache.get(componentName);
      
      if (cached) {
        cached.renderTime = renderTime;
        reportLazyLoadMetrics(cached);
      }
    };
  }, [componentName]);

  return (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={<LoadingSkeleton type={loadingType} delay={100} />}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Preload manager for intelligent resource loading
export const preloadComponents = {
  // Core components (high priority)
  preloadCritical: () => {
    const criticalComponents = [
      'SimplePreviewTemplate',
      'LoginModal',
      'ErrorBoundary'
    ];
    
    criticalComponents.forEach(name => {
      if (lazyLoadCache.has(name)) {
        lazyLoadCache.get(name);
      }
    });
  },

  // Secondary components (medium priority)
  preloadSecondary: () => {
    const secondaryComponents = [
      'ConversionPrompt',
      'FloatingFeedbackButton',
      'AIGenerationLoader'
    ];
    
    setTimeout(() => {
      secondaryComponents.forEach(name => {
        if (lazyLoadCache.has(name)) {
          lazyLoadCache.get(name);
        }
      });
    }, 1000);
  },

  // Heavy components (low priority)
  preloadHeavy: () => {
    const heavyComponents = [
      'PremiumGeneratorModal',
      'AnalyticsDashboard',
      'CommissionDashboard'
    ];
    
    setTimeout(() => {
      heavyComponents.forEach(name => {
        if (lazyLoadCache.has(name)) {
          lazyLoadCache.get(name);
        }
      });
    }, 3000);
  }
};

// Lazy component definitions with intelligent loading
export const SimplePreviewTemplate = createLazyComponent(
  () => import('./templates/SimplePreviewTemplate'),
  'SimplePreviewTemplate'
);

export const CreativeProjectTemplate = createLazyComponent(
  () => import('./templates/CreativeProjectTemplate'),
  'CreativeProjectTemplate'
);

export const TechProjectTemplate = createLazyComponent(
  () => import('./templates/TechProjectTemplate'),
  'TechProjectTemplate'
);

export const LoginModal = createLazyComponent(
  () => import('./auth/LoginModal'),
  'LoginModal'
);

export const ConversionPrompt = createLazyComponent(
  () => import('./conversion/ConversionPrompt'),
  'ConversionPrompt'
);

export const ErrorBoundary = createLazyComponent(
  () => import('./error/ErrorBoundary'),
  'ErrorBoundary'
);

export const FloatingFeedbackButton = createLazyComponent(
  () => import('./feedback/FloatingFeedbackButton'),
  'FloatingFeedbackButton'
);

export const AIGenerationLoader = createLazyComponent(
  () => import('./loading/AIGenerationLoader'),
  'AIGenerationLoader'
);

export const PremiumGeneratorModal = createLazyComponent(
  () => import('./premium/PremiumGeneratorModal'),
  'PremiumGeneratorModal'
);

export const AnalyticsDashboard = createLazyComponent(
  () => import('./dashboard/AnalyticsDashboard'),
  'AnalyticsDashboard'
);

export const CommissionDashboard = createLazyComponent(
  () => import('./admin/CommissionDashboard'),
  'CommissionDashboard'
);

// Initialize preloading on component mount
React.useEffect(() => {
  // Preload critical components immediately
  preloadComponents.preloadCritical();
  
  // Preload secondary components after a delay
  preloadComponents.preloadSecondary();
  
  // Preload heavy components when idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponents.preloadHeavy();
    });
  } else {
    preloadComponents.preloadHeavy();
  }
}, []);

export { LazyWrapper, LoadingSkeleton, LazyErrorBoundary };
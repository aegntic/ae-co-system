import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Performance monitoring and optimization hooks
 */

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentSize?: number;
  reRenderCount: number;
  lastRenderTime: number;
}

/**
 * Hook for monitoring component performance
 */
export const useComponentPerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    reRenderCount: 0,
    lastRenderTime: 0
  });
  
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        reRenderCount: renderCount.current,
        lastRenderTime: Date.now()
      }));

      // Log slow renders
      if (renderTime > 16) { // 60fps threshold
        console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }

      // Report to analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'component_performance', {
          component_name: componentName,
          render_time: Math.round(renderTime),
          render_count: renderCount.current
        });
      }
    };
  }, []); // Add empty dependency array to prevent infinite loop

  // Memory usage monitoring (if available)
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize
      }));
    }
  }, []);

  return metrics;
};

/**
 * Advanced memoization hook with performance tracking
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
) => {
  const startTime = useRef<number>(0);
  
  return useMemo(() => {
    startTime.current = performance.now();
    const result = factory();
    const computeTime = performance.now() - startTime.current;
    
    if (debugName && computeTime > 5) {
      console.log(`[Memoization] ${debugName} computed in ${computeTime.toFixed(2)}ms`);
    }
    
    return result;
  }, deps);
};

/**
 * Debounced state hook for expensive operations
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, setValue, value];
};

/**
 * Optimized API call hook with caching and deduplication
 */
export const useOptimizedAPI = <T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  options: {
    cacheTTL?: number;
    retryCount?: number;
    deduplicate?: boolean;
  } = {}
) => {
  const { cacheTTL = 300000, retryCount = 3, deduplicate = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // In-memory cache
  const cache = useMemo(() => new Map<string, { data: T; timestamp: number }>(), []);
  
  // Deduplication map
  const pendingRequests = useMemo(() => new Map<string, Promise<T>>(), []);

  const execute = useCallback(async () => {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setData(cached.data);
      return cached.data;
    }

    // Check for pending request (deduplication)
    if (deduplicate && pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey)!;
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('API call failed'));
        throw err;
      }
    }

    setLoading(true);
    setError(null);

    // Create new request with retry logic
    const requestPromise = async (): Promise<T> => {
      let lastError: Error;
      
      for (let attempt = 0; attempt < retryCount; attempt++) {
        try {
          const startTime = performance.now();
          const result = await apiCall();
          const apiTime = performance.now() - startTime;
          
          console.log(`[API Performance] ${cacheKey} completed in ${apiTime.toFixed(2)}ms`);
          
          // Cache successful result
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
          
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('API call failed');
          
          if (attempt < retryCount - 1) {
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError!;
    };

    const promise = requestPromise();
    
    if (deduplicate) {
      pendingRequests.set(cacheKey, promise);
    }

    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('API call failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      if (deduplicate) {
        pendingRequests.delete(cacheKey);
      }
    }
  }, [apiCall, cacheKey, cacheTTL, retryCount, deduplicate, cache, pendingRequests]);

  // Clear cache method
  const clearCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cache, cacheKey]);

  return {
    data,
    loading,
    error,
    execute,
    clearCache
  };
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => 
    items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    })), 
    [items, visibleRange]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

/**
 * Image lazy loading with intersection observer
 */
export const useLazyImage = (src: string, options: IntersectionObserverInit = {}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, options]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src]);

  return {
    imageSrc,
    imageRef: setImageRef,
    isLoaded,
    isInView
  };
};

/**
 * Bundle size monitoring
 */
export const useBundleMonitoring = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    size: number;
    gzipSize: number;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    // Monitor bundle performance
    if (typeof window !== 'undefined') {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const entry = navEntries[0];
        const loadTime = entry.loadEventEnd - entry.navigationStart;
        
        setBundleInfo({
          size: 0, // Would need build-time injection
          gzipSize: 0, // Would need build-time injection
          loadTime
        });

        console.log(`[Bundle Performance] Page loaded in ${loadTime.toFixed(2)}ms`);
      }
    }
  }, []);

  return bundleInfo;
};

/**
 * Performance budget monitoring
 */
export const usePerformanceBudget = (budgets: {
  renderTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
}) => {
  const [violations, setViolations] = useState<string[]>([]);

  const checkBudget = useCallback((metric: string, value: number, budget: number) => {
    if (value > budget) {
      setViolations(prev => {
        const newViolation = `${metric}: ${value} exceeds budget of ${budget}`;
        if (!prev.includes(newViolation)) {
          console.warn(`[Performance Budget] ${newViolation}`);
          return [...prev, newViolation];
        }
        return prev;
      });
    }
  }, []);

  return {
    violations,
    checkBudget
  };
};

/**
 * Generic intersection observer hook
 */
export const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting] as const;
};

export default {
  useComponentPerformance,
  useMemoizedValue,
  useDebouncedState,
  useOptimizedAPI,
  useVirtualScroll,
  useLazyImage,
  useBundleMonitoring,
  usePerformanceBudget,
  useIntersectionObserver
};
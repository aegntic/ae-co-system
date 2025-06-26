
import { useEffect, useCallback, useRef } from 'react';

// Advanced performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStart = useRef<number>(0);
  const mountTime = useRef<number>(0);
  
  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;
      
      // Track component lifecycle performance
      if (totalLifetime > 5000) { // Component lived for >5s
        console.log(`Long-lived component: ${componentName} (${totalLifetime.toFixed(2)}ms)`);
      }
    };
  }, [componentName]);
  
  const measureRender = useCallback(() => {
    renderStart.current = performance.now();
    
    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart.current;
      
      // Log performance data
      if (renderTime > 16) { // >16ms indicates frame drop
        console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
      
      // Send to analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'performance_render', {
          component_name: componentName,
          render_time: Math.round(renderTime),
          custom_parameter: renderTime > 16 ? 'slow' : 'fast'
        });
      }
    });
  }, [componentName]);
  
  return { measureRender };
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const lastMemoryCheck = useRef<number>(0);
  
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const currentUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      // Warn if memory usage increased significantly
      if (lastMemoryCheck.current > 0) {
        const memoryIncrease = currentUsage - lastMemoryCheck.current;
        if (memoryIncrease > 5) { // >5MB increase
          console.warn(`Memory increase detected: +${memoryIncrease.toFixed(2)}MB`);
        }
      }
      
      lastMemoryCheck.current = currentUsage;
      
      return {
        used: currentUsage,
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024
      };
    }
    
    return null;
  }, []);
  
  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);
  
  return { checkMemoryUsage };
};

// Network performance monitoring
export const useNetworkMonitoring = () => {
  const trackNetworkRequest = useCallback((url: string, method: string = 'GET') => {
    const startTime = performance.now();
    
    return {
      complete: (success: boolean, size?: number) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log slow requests
        if (duration > 1000) {
          console.warn(`Slow network request: ${method} ${url} took ${duration.toFixed(2)}ms`);
        }
        
        // Track in analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'network_request', {
            url: url.replace(/\/api\//, '/api/***'), // Sanitize URL
            method,
            duration: Math.round(duration),
            success,
            size: size || 0,
            custom_parameter: duration > 1000 ? 'slow' : 'fast'
          });
        }
        
        return duration;
      }
    };
  }, []);
  
  return { trackNetworkRequest };
};

// Core Web Vitals monitoring
export const useCoreWebVitals = () => {
  useEffect(() => {
    // Monitor LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      console.log('LCP:', lastEntry.startTime);
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'core_web_vital', {
          metric_name: 'LCP',
          value: Math.round(lastEntry.startTime),
          custom_parameter: lastEntry.startTime < 1800 ? 'good' : lastEntry.startTime < 2500 ? 'needs_improvement' : 'poor'
        });
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Monitor CLS (Cumulative Layout Shift)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'core_web_vital', {
          metric_name: 'CLS',
          value: Math.round(clsScore * 1000) / 1000,
          custom_parameter: clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'needs_improvement' : 'poor'
        });
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    return () => {
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
};
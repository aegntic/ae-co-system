
import React, { Suspense, lazy } from 'react';

// High-performance lazy loading with preloading
const createLazyComponent = (importFunc, preload = false) => {
  const LazyComponent = lazy(importFunc);
  
  // Preload on hover for instant loading
  if (preload) {
    LazyComponent.preload = importFunc;
  }
  
  return LazyComponent;
};

// Premium features - load on demand
export const PremiumDashboard = createLazyComponent(
  () => import('./premium/PremiumDashboard'),
  true
);

export const AdminPanel = createLazyComponent(
  () => import('./admin/AdminPanel'),
  true
);

export const AnalyticsDashboard = createLazyComponent(
  () => import('./dashboard/AnalyticsDashboard'),
  true
);

// Template components - critical for site generation
export const TechProjectTemplate = createLazyComponent(
  () => import('./templates/TechProjectTemplate')
);

export const CreativeProjectTemplate = createLazyComponent(
  () => import('./templates/CreativeProjectTemplate')
);

// Advanced loading with intersection observer
export const LazySection = ({ children, threshold = 0.1, rootMargin = '50px' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef();
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold, rootMargin]);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '200px' }} />}
    </div>
  );
};

// Performance monitoring wrapper
export const PerformanceWrapper = ({ children, componentName }) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Send performance metrics to service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PERFORMANCE_METRICS',
          metrics: {
            component: componentName,
            renderTime,
            timestamp: Date.now()
          }
        });
      }
      
      // Log slow components
      if (renderTime > 16) { // >16ms indicates potential performance issue
        console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
  
  return children;
};

// Memory-efficient component memoization
export const MemoizedComponent = React.memo(({ data, onAction }) => {
  const memoizedData = React.useMemo(() => {
    return processExpensiveData(data);
  }, [data]);
  
  const handleAction = React.useCallback((actionType) => {
    onAction(actionType);
  }, [onAction]);
  
  return (
    <PerformanceWrapper componentName="MemoizedComponent">
      {/* Component content */}
    </PerformanceWrapper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return prevProps.data.id === nextProps.data.id &&
         prevProps.data.version === nextProps.data.version;
});

function processExpensiveData(data) {
  // Expensive computation with memoization
  return data.items.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
}
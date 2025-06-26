import { useRef, useCallback, useEffect, useState } from 'react';
import { useComponentPerformance } from './usePerformance';

interface InteractionEvent {
  id: string;
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'swipe' | 'pinch' | 'long_press' | 'voice' | 'keyboard';
  element: string;
  elementType: 'button' | 'input' | 'link' | 'card' | 'modal' | 'dropdown' | 'slider' | 'toggle';
  timestamp: number;
  duration?: number;
  position?: { x: number; y: number };
  viewport: { width: number; height: number };
  device: 'mobile' | 'tablet' | 'desktop';
  metadata?: Record<string, any>;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

interface UserFlow {
  sessionId: string;
  startTime: number;
  events: InteractionEvent[];
  currentPath: string[];
  engagementScore: number;
  conversionEvents: string[];
  dropoffPoints: string[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  performance: {
    avgResponseTime: number;
    totalInteractions: number;
    errorRate: number;
    completionRate: number;
  };
}

interface HeatmapData {
  element: string;
  position: { x: number; y: number };
  interactions: number;
  avgDuration: number;
  conversionRate: number;
  lastInteraction: number;
}

interface A11yMetrics {
  keyboardNavigation: number;
  screenReaderUsage: number;
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeTextMode: boolean;
  focusIndicatorUsage: number;
}

interface PerformanceMetrics {
  interactionToNextFrame: number[];
  scrollPerformance: number[];
  animationFrames: number[];
  memoryUsage: number[];
  cpuUsage: number[];
}

/**
 * Comprehensive interaction analytics and user behavior tracking
 */
export const useInteractionAnalytics = (config: {
  enableHeatmap?: boolean;
  enableA11yTracking?: boolean;
  enablePerformanceTracking?: boolean;
  enableRealTimeAnalytics?: boolean;
  sessionTimeout?: number;
  samplingRate?: number;
} = {}) => {
  const {
    enableHeatmap = true,
    enableA11yTracking = true,
    enablePerformanceTracking = true,
    enableRealTimeAnalytics = false,
    sessionTimeout = 30 * 60 * 1000, // 30 minutes
    samplingRate = 1.0 // 100% sampling by default
  } = config;

  // State
  const [currentFlow, setCurrentFlow] = useState<UserFlow | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [a11yMetrics, setA11yMetrics] = useState<A11yMetrics>({
    keyboardNavigation: 0,
    screenReaderUsage: 0,
    highContrastMode: false,
    reducedMotion: false,
    largeTextMode: false,
    focusIndicatorUsage: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    interactionToNextFrame: [],
    scrollPerformance: [],
    animationFrames: [],
    memoryUsage: [],
    cpuUsage: []
  });

  // Refs
  const sessionId = useRef<string>(generateSessionId());
  const eventQueue = useRef<InteractionEvent[]>([]);
  const observerRefs = useRef<{
    intersection?: IntersectionObserver;
    mutation?: MutationObserver;
    performance?: PerformanceObserver;
    resize?: ResizeObserver;
  }>({});
  const analyticsBuffer = useRef<InteractionEvent[]>([]);
  const lastFlushTime = useRef<number>(Date.now());

  // Performance monitoring
  const metrics = useComponentPerformance('InteractionAnalytics');

  // Device detection
  const getDeviceType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }, []);

  // Session management
  const initializeSession = useCallback(() => {
    const flow: UserFlow = {
      sessionId: sessionId.current,
      startTime: Date.now(),
      events: [],
      currentPath: [window.location.pathname],
      engagementScore: 0,
      conversionEvents: [],
      dropoffPoints: [],
      deviceType: getDeviceType(),
      performance: {
        avgResponseTime: 0,
        totalInteractions: 0,
        errorRate: 0,
        completionRate: 0
      }
    };

    setCurrentFlow(flow);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('4site_analytics_session', JSON.stringify({
        sessionId: sessionId.current,
        startTime: flow.startTime,
        deviceType: flow.deviceType
      }));
    } catch (error) {
      console.warn('Failed to store analytics session:', error);
    }
  }, [getDeviceType]);

  // Event creation
  const createEvent = useCallback((
    type: InteractionEvent['type'],
    element: string,
    elementType: InteractionEvent['elementType'],
    metadata?: Record<string, any>,
    position?: { x: number; y: number },
    duration?: number
  ): InteractionEvent => {
    return {
      id: generateEventId(),
      type,
      element,
      elementType,
      timestamp: Date.now(),
      duration,
      position,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: getDeviceType(),
      metadata,
      userAgent: navigator.userAgent,
      sessionId: sessionId.current
    };
  }, [getDeviceType]);

  // Event tracking
  const trackInteraction = useCallback((
    type: InteractionEvent['type'],
    element: string,
    elementType: InteractionEvent['elementType'],
    metadata?: Record<string, any>,
    position?: { x: number; y: number },
    duration?: number
  ) => {
    // Sampling check
    if (Math.random() > samplingRate) return;

    const event = createEvent(type, element, elementType, metadata, position, duration);
    
    // Add to queue
    eventQueue.current.push(event);
    analyticsBuffer.current.push(event);

    // Update current flow
    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        events: [...currentFlow.events, event],
        performance: {
          ...currentFlow.performance,
          totalInteractions: currentFlow.performance.totalInteractions + 1
        }
      };

      // Calculate engagement score
      updatedFlow.engagementScore = calculateEngagementScore(updatedFlow.events);

      setCurrentFlow(updatedFlow);
    }

    // Update heatmap data
    if (enableHeatmap && position) {
      updateHeatmapData(element, position, duration);
    }

    // Track accessibility usage
    if (enableA11yTracking) {
      updateA11yMetrics(type, metadata);
    }

    // Performance tracking
    if (enablePerformanceTracking) {
      measureInteractionPerformance(event);
    }

    // Real-time analytics
    if (enableRealTimeAnalytics) {
      sendRealTimeEvent(event);
    }

    // Flush buffer if needed
    if (analyticsBuffer.current.length >= 50 || Date.now() - lastFlushTime.current > 30000) {
      flushAnalyticsBuffer();
    }
  }, [samplingRate, currentFlow, enableHeatmap, enableA11yTracking, enablePerformanceTracking, enableRealTimeAnalytics, createEvent]);

  // Heatmap data management
  const updateHeatmapData = useCallback((element: string, position: { x: number; y: number }, duration?: number) => {
    setHeatmapData(prev => {
      const existingIndex = prev.findIndex(item => item.element === element);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          interactions: existing.interactions + 1,
          avgDuration: duration ? (existing.avgDuration + duration) / 2 : existing.avgDuration,
          lastInteraction: Date.now()
        };
        return updated;
      } else {
        return [...prev, {
          element,
          position,
          interactions: 1,
          avgDuration: duration || 0,
          conversionRate: 0,
          lastInteraction: Date.now()
        }];
      }
    });
  }, []);

  // Accessibility metrics
  const updateA11yMetrics = useCallback((type: InteractionEvent['type'], metadata?: Record<string, any>) => {
    setA11yMetrics(prev => {
      const updated = { ...prev };

      switch (type) {
        case 'keyboard':
          updated.keyboardNavigation += 1;
          break;
        case 'focus':
          updated.focusIndicatorUsage += 1;
          break;
      }

      // Check for accessibility features
      if (metadata?.screenReader) {
        updated.screenReaderUsage += 1;
      }

      // Detect system preferences
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updated.reducedMotion = true;
      }
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updated.highContrastMode = true;
      }

      return updated;
    });
  }, []);

  // Performance measurement
  const measureInteractionPerformance = useCallback((event: InteractionEvent) => {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const frameTime = performance.now() - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        interactionToNextFrame: [...prev.interactionToNextFrame.slice(-99), frameTime],
        animationFrames: [...prev.animationFrames.slice(-99), frameTime]
      }));
    });

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: [...prev.memoryUsage.slice(-99), memory.usedJSHeapSize]
      }));
    }
  }, []);

  // Engagement score calculation
  const calculateEngagementScore = useCallback((events: InteractionEvent[]): number => {
    if (events.length === 0) return 0;

    const weights = {
      click: 2,
      hover: 1,
      focus: 1.5,
      scroll: 0.5,
      swipe: 2,
      pinch: 3,
      long_press: 3,
      voice: 4,
      keyboard: 2
    };

    const timeSpent = events.length > 1 
      ? events[events.length - 1].timestamp - events[0].timestamp 
      : 0;

    const weightedInteractions = events.reduce((sum, event) => {
      return sum + (weights[event.type] || 1);
    }, 0);

    const timeBonus = Math.min(timeSpent / 60000, 2); // Max 2 points for time
    const diversityBonus = new Set(events.map(e => e.type)).size * 0.5;

    return Math.min(weightedInteractions + timeBonus + diversityBonus, 100);
  }, []);

  // Real-time analytics
  const sendRealTimeEvent = useCallback((event: InteractionEvent) => {
    // Send to analytics service (placeholder)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'user_interaction', {
        event_category: 'interaction',
        event_label: event.element,
        custom_parameter_type: event.type,
        custom_parameter_device: event.device,
        custom_parameter_session: event.sessionId
      });
    }
  }, []);

  // Buffer management
  const flushAnalyticsBuffer = useCallback(() => {
    if (analyticsBuffer.current.length === 0) return;

    const events = [...analyticsBuffer.current];
    analyticsBuffer.current = [];
    lastFlushTime.current = Date.now();

    // Send batch to analytics service
    console.log(`[Analytics] Flushing ${events.length} events`, events);

    // Store in IndexedDB for offline support
    try {
      const request = indexedDB.open('4site_analytics', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['events'], 'readwrite');
        const store = transaction.objectStore('events');
        
        events.forEach(event => {
          store.add(event);
        });
      };
    } catch (error) {
      console.warn('Failed to store events in IndexedDB:', error);
    }
  }, []);

  // Conversion tracking
  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: Record<string, any>) => {
    const conversionEvent = createEvent('click', `conversion_${conversionType}`, 'button', {
      ...metadata,
      conversionType,
      value,
      isConversion: true
    });

    trackInteraction('click', `conversion_${conversionType}`, 'button', {
      ...metadata,
      conversionType,
      value,
      isConversion: true
    });

    if (currentFlow) {
      setCurrentFlow(prev => prev ? {
        ...prev,
        conversionEvents: [...prev.conversionEvents, conversionType]
      } : null);
    }
  }, [trackInteraction, currentFlow, createEvent]);

  // Error tracking
  const trackError = useCallback((error: Error, context?: string) => {
    trackInteraction('click', `error_${error.name}`, 'button', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      isError: true
    });

    if (currentFlow) {
      setCurrentFlow(prev => prev ? {
        ...prev,
        performance: {
          ...prev.performance,
          errorRate: (prev.performance.errorRate + 1) / prev.performance.totalInteractions
        }
      } : null);
    }
  }, [trackInteraction, currentFlow]);

  // Page navigation tracking
  const trackPageView = useCallback((path: string, metadata?: Record<string, any>) => {
    trackInteraction('click', `page_${path}`, 'link', {
      ...metadata,
      path,
      isPageView: true
    });

    if (currentFlow) {
      setCurrentFlow(prev => prev ? {
        ...prev,
        currentPath: [...prev.currentPath, path]
      } : null);
    }
  }, [trackInteraction, currentFlow]);

  // Setup observers
  useEffect(() => {
    if (!currentFlow) {
      initializeSession();
    }

    // Intersection Observer for visibility tracking
    observerRefs.current.intersection = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            trackInteraction('scroll', entry.target.className || 'unknown', 'card', {
              visibility: entry.intersectionRatio
            });
          }
        });
      },
      { threshold: [0.25, 0.5, 0.75, 1.0] }
    );

    // Performance Observer
    if (enablePerformanceTracking && 'PerformanceObserver' in window) {
      observerRefs.current.performance = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'measure') {
            setPerformanceMetrics(prev => ({
              ...prev,
              cpuUsage: [...prev.cpuUsage.slice(-99), entry.duration]
            }));
          }
        });
      });

      try {
        observerRefs.current.performance.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Cleanup
    return () => {
      Object.values(observerRefs.current).forEach(observer => {
        observer?.disconnect();
      });
      flushAnalyticsBuffer();
    };
  }, [initializeSession, trackInteraction, enablePerformanceTracking, flushAnalyticsBuffer, currentFlow]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAnalyticsBuffer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [flushAnalyticsBuffer]);

  // Auto-flush on interval
  useEffect(() => {
    const interval = setInterval(flushAnalyticsBuffer, 60000); // Flush every minute
    return () => clearInterval(interval);
  }, [flushAnalyticsBuffer]);

  // Export data
  const exportAnalyticsData = useCallback(() => {
    return {
      session: currentFlow,
      heatmap: heatmapData,
      accessibility: a11yMetrics,
      performance: performanceMetrics,
      events: eventQueue.current
    };
  }, [currentFlow, heatmapData, a11yMetrics, performanceMetrics]);

  return {
    // Core tracking
    trackInteraction,
    trackConversion,
    trackError,
    trackPageView,

    // Data access
    currentFlow,
    heatmapData,
    a11yMetrics,
    performanceMetrics,
    sessionId: sessionId.current,

    // Utilities
    exportAnalyticsData,
    flushAnalyticsBuffer,
    
    // Observers
    intersectionObserver: observerRefs.current.intersection,
    
    // Metrics
    engagementScore: currentFlow?.engagementScore || 0,
    totalInteractions: currentFlow?.performance.totalInteractions || 0,
    errorRate: currentFlow?.performance.errorRate || 0
  };
};

// Utility functions
function generateSessionId(): string {
  return `4site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export default useInteractionAnalytics;
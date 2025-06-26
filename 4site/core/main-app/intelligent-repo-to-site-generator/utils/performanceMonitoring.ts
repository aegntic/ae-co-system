/**
 * Advanced Performance Monitoring and Alerting System
 * Implements real-time metrics collection, analysis, and automated alerting
 */

// Performance thresholds and budgets
interface PerformanceBudgets {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  bundleSize: number;
  memoryUsage: number;
  cpuUsage: number;
}

const PERFORMANCE_BUDGETS: PerformanceBudgets = {
  pageLoadTime: 3000,        // 3 seconds
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500, // 2.5 seconds (Core Web Vital)
  firstInputDelay: 100,      // 100ms (Core Web Vital)
  cumulativeLayoutShift: 0.1, // 0.1 (Core Web Vital)
  totalBlockingTime: 300,    // 300ms
  bundleSize: 1024 * 1024,   // 1MB
  memoryUsage: 50 * 1024 * 1024, // 50MB
  cpuUsage: 50               // 50% CPU usage
};

// Alert severity levels
enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  context?: Record<string, any>;
}

interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null;
  resources: PerformanceResourceTiming[];
  memory: any;
  connection: any;
  vitals: {
    fcp: number | null;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    tbt: number | null;
  };
  custom: Record<string, number>;
}

/**
 * Core Web Vitals measurement
 */
class WebVitalsMonitor {
  private metrics: PerformanceMetrics['vitals'] = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    tbt: null
  };

  private observers: PerformanceObserver[] = [];

  constructor(private alertCallback: (alert: PerformanceAlert) => void) {
    this.initializeObservers();
  }

  private initializeObservers() {
    // First Contentful Paint
    this.observePerformanceEntries('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
        this.checkThreshold('firstContentfulPaint', fcpEntry.startTime, PERFORMANCE_BUDGETS.firstContentfulPaint);
      }
    });

    // Largest Contentful Paint
    this.observePerformanceEntries('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1];
      if (lcpEntry) {
        this.metrics.lcp = lcpEntry.startTime;
        this.checkThreshold('largestContentfulPaint', lcpEntry.startTime, PERFORMANCE_BUDGETS.largestContentfulPaint);
      }
    });

    // First Input Delay
    this.observePerformanceEntries('first-input', (entries) => {
      const fidEntry = entries[0];
      if (fidEntry) {
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        this.checkThreshold('firstInputDelay', this.metrics.fid, PERFORMANCE_BUDGETS.firstInputDelay);
      }
    });

    // Cumulative Layout Shift
    this.observePerformanceEntries('layout-shift', (entries) => {
      let cls = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
      this.metrics.cls = cls;
      this.checkThreshold('cumulativeLayoutShift', cls, PERFORMANCE_BUDGETS.cumulativeLayoutShift);
    });

    // Long Tasks (for Total Blocking Time)
    this.observePerformanceEntries('longtask', (entries) => {
      let tbt = 0;
      for (const entry of entries) {
        const blockingTime = Math.max(0, entry.duration - 50);
        tbt += blockingTime;
      }
      this.metrics.tbt = tbt;
      this.checkThreshold('totalBlockingTime', tbt, PERFORMANCE_BUDGETS.totalBlockingTime);
    });
  }

  private observePerformanceEntries(
    entryType: string, 
    callback: (entries: PerformanceEntry[]) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`[WebVitals] Could not observe ${entryType}:`, error);
    }
  }

  private checkThreshold(metric: string, value: number, threshold: number) {
    if (value > threshold) {
      const severity = value > threshold * 1.5 ? AlertSeverity.ERROR : AlertSeverity.WARNING;
      
      this.alertCallback({
        id: `webvital_${metric}_${Date.now()}`,
        timestamp: Date.now(),
        severity,
        metric,
        value,
        threshold,
        message: `${metric} (${value.toFixed(2)}ms) exceeds budget (${threshold}ms)`,
        context: { type: 'web-vital' }
      });
    }
  }

  getMetrics(): PerformanceMetrics['vitals'] {
    return { ...this.metrics };
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Resource monitoring for bundle size and loading performance
 */
class ResourceMonitor {
  private totalBundleSize = 0;
  private resourceTimings: PerformanceResourceTiming[] = [];

  constructor(private alertCallback: (alert: PerformanceAlert) => void) {
    this.monitorResources();
  }

  private monitorResources() {
    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      entries.forEach(entry => {
        this.resourceTimings.push(entry);
        
        // Track bundle size
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const size = entry.transferSize || entry.encodedBodySize || 0;
          this.totalBundleSize += size;
          
          if (this.totalBundleSize > PERFORMANCE_BUDGETS.bundleSize) {
            this.alertCallback({
              id: `bundle_size_${Date.now()}`,
              timestamp: Date.now(),
              severity: AlertSeverity.WARNING,
              metric: 'bundleSize',
              value: this.totalBundleSize,
              threshold: PERFORMANCE_BUDGETS.bundleSize,
              message: `Bundle size (${(this.totalBundleSize / 1024 / 1024).toFixed(2)}MB) exceeds budget`,
              context: { resource: entry.name }
            });
          }
        }
        
        // Check resource loading time
        const loadTime = entry.responseEnd - entry.startTime;
        if (loadTime > 2000) { // 2 seconds threshold for individual resources
          this.alertCallback({
            id: `slow_resource_${Date.now()}`,
            timestamp: Date.now(),
            severity: AlertSeverity.WARNING,
            metric: 'resourceLoadTime',
            value: loadTime,
            threshold: 2000,
            message: `Slow resource loading: ${entry.name} (${loadTime.toFixed(2)}ms)`,
            context: { resource: entry.name, type: entry.initiatorType }
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  getBundleSize(): number {
    return this.totalBundleSize;
  }

  getResourceTimings(): PerformanceResourceTiming[] {
    return [...this.resourceTimings];
  }
}

/**
 * Memory monitoring and leak detection
 */
class MemoryMonitor {
  private memoryUsage: number[] = [];
  private intervalId: number | null = null;

  constructor(private alertCallback: (alert: PerformanceAlert) => void) {
    this.startMonitoring();
  }

  private startMonitoring() {
    this.intervalId = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 5000); // Check every 5 seconds
  }

  private checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const currentUsage = memory.usedJSHeapSize;
      
      this.memoryUsage.push(currentUsage);
      
      // Keep only last 20 measurements (100 seconds)
      if (this.memoryUsage.length > 20) {
        this.memoryUsage.shift();
      }
      
      // Check for memory threshold
      if (currentUsage > PERFORMANCE_BUDGETS.memoryUsage) {
        this.alertCallback({
          id: `memory_usage_${Date.now()}`,
          timestamp: Date.now(),
          severity: AlertSeverity.WARNING,
          metric: 'memoryUsage',
          value: currentUsage,
          threshold: PERFORMANCE_BUDGETS.memoryUsage,
          message: `High memory usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB`,
          context: { 
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        });
      }
      
      // Check for memory leaks (consistent growth)
      if (this.memoryUsage.length >= 10) {
        const recent = this.memoryUsage.slice(-5);
        const older = this.memoryUsage.slice(-10, -5);
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;
        
        const growthRate = (recentAvg - olderAvg) / olderAvg;
        
        if (growthRate > 0.1) { // 10% growth in 25 seconds
          this.alertCallback({
            id: `memory_leak_${Date.now()}`,
            timestamp: Date.now(),
            severity: AlertSeverity.ERROR,
            metric: 'memoryLeak',
            value: growthRate * 100,
            threshold: 10,
            message: `Potential memory leak detected (${(growthRate * 100).toFixed(1)}% growth)`,
            context: { recentAvg, olderAvg }
          });
        }
      }
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

/**
 * User experience monitoring
 */
class UserExperienceMonitor {
  private interactions: Array<{
    timestamp: number;
    type: string;
    delay: number;
  }> = [];

  constructor(private alertCallback: (alert: PerformanceAlert) => void) {
    this.monitorInteractions();
  }

  private monitorInteractions() {
    // Monitor click responsiveness
    document.addEventListener('click', this.handleInteraction.bind(this, 'click'));
    document.addEventListener('keydown', this.handleInteraction.bind(this, 'keydown'));
    document.addEventListener('scroll', this.handleInteraction.bind(this, 'scroll'));
  }

  private handleInteraction(type: string, event: Event) {
    const startTime = performance.now();
    
    // Measure time to next frame
    requestAnimationFrame(() => {
      const delay = performance.now() - startTime;
      
      this.interactions.push({
        timestamp: Date.now(),
        type,
        delay
      });
      
      // Keep only recent interactions
      const cutoff = Date.now() - 60000; // Last minute
      this.interactions = this.interactions.filter(i => i.timestamp > cutoff);
      
      // Check for unresponsive interactions
      if (delay > 100) { // 100ms threshold
        this.alertCallback({
          id: `unresponsive_${type}_${Date.now()}`,
          timestamp: Date.now(),
          severity: delay > 300 ? AlertSeverity.ERROR : AlertSeverity.WARNING,
          metric: 'interactionDelay',
          value: delay,
          threshold: 100,
          message: `Unresponsive ${type} interaction (${delay.toFixed(2)}ms delay)`,
          context: { interactionType: type }
        });
      }
    });
  }

  getInteractionMetrics() {
    const recent = this.interactions.filter(i => i.timestamp > Date.now() - 10000);
    const avgDelay = recent.length > 0 
      ? recent.reduce((sum, i) => sum + i.delay, 0) / recent.length 
      : 0;
      
    return {
      totalInteractions: this.interactions.length,
      recentInteractions: recent.length,
      averageDelay: avgDelay
    };
  }
}

/**
 * Alert management and notification system
 */
class AlertManager {
  private alerts: PerformanceAlert[] = [];
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  addAlert(alert: PerformanceAlert) {
    this.alerts.push(alert);
    
    // Keep only recent alerts (last hour)
    const cutoff = Date.now() - 3600000;
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[AlertManager] Callback error:', error);
      }
    });
    
    // Built-in console logging
    this.logAlert(alert);
    
    // Send to analytics
    this.sendToAnalytics(alert);
  }

  private logAlert(alert: PerformanceAlert) {
    const emoji = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.ERROR]: '❌',
      [AlertSeverity.CRITICAL]: '🚨'
    };
    
    console.warn(
      `${emoji[alert.severity]} [Performance ${alert.severity.toUpperCase()}] ${alert.message}`,
      alert
    );
  }

  private sendToAnalytics(alert: PerformanceAlert) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_alert', {
        alert_id: alert.id,
        severity: alert.severity,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold
      });
    }
  }

  onAlert(callback: (alert: PerformanceAlert) => void) {
    this.alertCallbacks.push(callback);
  }

  getAlerts(severity?: AlertSeverity): PerformanceAlert[] {
    return severity 
      ? this.alerts.filter(a => a.severity === severity)
      : [...this.alerts];
  }

  getAlertSummary() {
    const summary = {
      total: this.alerts.length,
      critical: 0,
      error: 0,
      warning: 0,
      info: 0
    };
    
    this.alerts.forEach(alert => {
      summary[alert.severity]++;
    });
    
    return summary;
  }
}

/**
 * Main performance monitoring system
 */
export class PerformanceMonitoringSystem {
  private webVitalsMonitor: WebVitalsMonitor;
  private resourceMonitor: ResourceMonitor;
  private memoryMonitor: MemoryMonitor;
  private uxMonitor: UserExperienceMonitor;
  private alertManager: AlertManager;
  private isRunning = false;

  constructor() {
    this.alertManager = new AlertManager();
    
    const alertCallback = (alert: PerformanceAlert) => {
      this.alertManager.addAlert(alert);
    };
    
    this.webVitalsMonitor = new WebVitalsMonitor(alertCallback);
    this.resourceMonitor = new ResourceMonitor(alertCallback);
    this.memoryMonitor = new MemoryMonitor(alertCallback);
    this.uxMonitor = new UserExperienceMonitor(alertCallback);
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[PerformanceMonitor] Performance monitoring started');
    
    // Initial page load metrics
    this.measurePageLoad();
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.webVitalsMonitor.disconnect();
    this.memoryMonitor.stopMonitoring();
    
    console.log('[PerformanceMonitor] Performance monitoring stopped');
  }

  private measurePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        
        if (loadTime > PERFORMANCE_BUDGETS.pageLoadTime) {
          this.alertManager.addAlert({
            id: `page_load_${Date.now()}`,
            timestamp: Date.now(),
            severity: AlertSeverity.WARNING,
            metric: 'pageLoadTime',
            value: loadTime,
            threshold: PERFORMANCE_BUDGETS.pageLoadTime,
            message: `Slow page load: ${loadTime.toFixed(2)}ms`,
            context: { navigation }
          });
        }
      }
    });
  }

  getMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming || null;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const memory = 'memory' in performance ? (performance as any).memory : null;
    const connection = 'connection' in navigator ? (navigator as any).connection : null;

    return {
      navigation,
      resources,
      memory,
      connection,
      vitals: this.webVitalsMonitor.getMetrics(),
      custom: {
        bundleSize: this.resourceMonitor.getBundleSize(),
        memoryUsage: this.memoryMonitor.getCurrentUsage(),
        ...this.uxMonitor.getInteractionMetrics()
      }
    };
  }

  onAlert(callback: (alert: PerformanceAlert) => void) {
    this.alertManager.onAlert(callback);
  }

  getAlerts(severity?: AlertSeverity) {
    return this.alertManager.getAlerts(severity);
  }

  getAlertSummary() {
    return this.alertManager.getAlertSummary();
  }

  // Static method for easy initialization
  static create(): PerformanceMonitoringSystem {
    const monitor = new PerformanceMonitoringSystem();
    monitor.start();
    return monitor;
  }
}

// Global instance for easy access
let globalMonitor: PerformanceMonitoringSystem | null = null;

export function initializePerformanceMonitoring(): PerformanceMonitoringSystem {
  if (!globalMonitor) {
    globalMonitor = PerformanceMonitoringSystem.create();
    
    // Add to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__performanceMonitor = globalMonitor;
    }
  }
  
  return globalMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitoringSystem | null {
  return globalMonitor;
}

export {
  PERFORMANCE_BUDGETS,
  AlertSeverity,
  type PerformanceAlert,
  type PerformanceMetrics,
  type PerformanceBudgets
};
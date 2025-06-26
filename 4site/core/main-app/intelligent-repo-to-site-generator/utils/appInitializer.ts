/**
 * Application Initializer with Advanced Performance Optimizations
 * Orchestrates all performance systems and optimization strategies
 */

import { initializeAssetOptimization } from './assetOptimization';
import { initializePerformanceMonitoring, AlertSeverity } from './performanceMonitoring';
import { cacheUtils } from './serviceWorker';

interface InitializationConfig {
  enablePerformanceMonitoring: boolean;
  enableAssetOptimization: boolean;
  enableServiceWorker: boolean;
  enablePreloading: boolean;
  developmentMode: boolean;
}

const DEFAULT_CONFIG: InitializationConfig = {
  enablePerformanceMonitoring: true,
  enableAssetOptimization: true,
  enableServiceWorker: true,
  enablePreloading: true,
  developmentMode: process.env.NODE_ENV === 'development'
};

/**
 * Initialize all performance and optimization systems
 */
export async function initializeApp(config: Partial<InitializationConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  console.log('[AppInitializer] Starting application initialization...');
  const initStartTime = performance.now();
  
  try {
    // Initialize systems in parallel for faster startup
    const initPromises: Promise<any>[] = [];
    
    // 1. Asset optimization (highest priority)
    if (finalConfig.enableAssetOptimization) {
      initPromises.push(
        initializeAssetOptimization().then(() => {
          console.log('[AppInitializer] ✅ Asset optimization initialized');
        })
      );
    }
    
    // 2. Performance monitoring
    if (finalConfig.enablePerformanceMonitoring) {
      initPromises.push(
        Promise.resolve().then(() => {
          const monitor = initializePerformanceMonitoring();
          
          // Set up critical alerts for immediate response
          monitor.onAlert((alert) => {
            if (alert.severity === AlertSeverity.CRITICAL) {
              handleCriticalAlert(alert);
            }
          });
          
          console.log('[AppInitializer] ✅ Performance monitoring initialized');
          return monitor;
        })
      );
    }
    
    // 3. Service worker registration
    if (finalConfig.enableServiceWorker && 'serviceWorker' in navigator) {
      initPromises.push(
        registerServiceWorker().then(() => {
          console.log('[AppInitializer] ✅ Service worker initialized');
        })
      );
    }
    
    // 4. Preloading strategies
    if (finalConfig.enablePreloading) {
      initPromises.push(
        initializePreloading().then(() => {
          console.log('[AppInitializer] ✅ Preloading strategies initialized');
        })
      );
    }
    
    // Wait for all systems to initialize
    await Promise.all(initPromises);
    
    const initTime = performance.now() - initStartTime;
    console.log(`[AppInitializer] 🚀 Application initialized in ${initTime.toFixed(2)}ms`);
    
    // Report successful initialization
    reportInitializationMetrics(initTime, finalConfig);
    
    return {
      success: true,
      initializationTime: initTime,
      config: finalConfig
    };
    
  } catch (error) {
    console.error('[AppInitializer] ❌ Initialization failed:', error);
    
    // Report initialization failure
    reportInitializationError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: finalConfig
    };
  }
}

/**
 * Register and configure service worker
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            showUpdateNotification();
          }
        });
      }
    });
    
    // Preload critical resources
    if (registration.active) {
      registration.active.postMessage({
        action: 'PRELOAD_CRITICAL'
      });
    }
    
    return registration;
    
  } catch (error) {
    console.warn('[AppInitializer] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Initialize intelligent preloading strategies
 */
async function initializePreloading() {
  // Preload critical API endpoints
  const criticalEndpoints = [
    'https://api.github.com', // For repository data
    'https://generativelanguage.googleapis.com' // For AI services
  ];
  
  // DNS prefetch and preconnect
  criticalEndpoints.forEach(endpoint => {
    addResourceHint('preconnect', endpoint);
  });
  
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-Medium.woff2'
  ];
  
  criticalFonts.forEach(font => {
    addResourceHint('preload', font, 'font', 'font/woff2');
  });
  
  // Intelligent component preloading based on route
  scheduleComponentPreloading();
}

/**
 * Add resource hints to document head
 */
function addResourceHint(
  rel: string, 
  href: string, 
  as?: string, 
  type?: string
) {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (as) link.setAttribute('as', as);
  if (type) link.type = type;
  if (rel === 'preload' || rel === 'preconnect') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Schedule component preloading based on user behavior
 */
function scheduleComponentPreloading() {
  // Preload components with delay based on priority
  const preloadSchedule = [
    { delay: 0, priority: 'critical' },
    { delay: 1000, priority: 'high' },
    { delay: 3000, priority: 'medium' },
    { delay: 5000, priority: 'low' }
  ];
  
  preloadSchedule.forEach(({ delay, priority }) => {
    setTimeout(() => {
      preloadComponentsByPriority(priority);
    }, delay);
  });
}

/**
 * Preload components based on priority level
 */
function preloadComponentsByPriority(priority: string) {
  const componentMap: Record<string, string[]> = {
    critical: [
      '/components/templates/SimplePreviewTemplate',
      '/components/auth/LoginModal'
    ],
    high: [
      '/components/conversion/ConversionPrompt',
      '/components/error/ErrorBoundary'
    ],
    medium: [
      '/components/dashboard/AnalyticsDashboard',
      '/components/premium/PremiumGeneratorModal'
    ],
    low: [
      '/components/admin/CommissionDashboard'
    ]
  };
  
  const components = componentMap[priority] || [];
  
  components.forEach(componentPath => {
    // Dynamic import to trigger preloading
    import(componentPath).catch(error => {
      console.warn(`[AppInitializer] Failed to preload ${componentPath}:`, error);
    });
  });
}

/**
 * Handle critical performance alerts
 */
function handleCriticalAlert(alert: any) {
  console.error('[AppInitializer] 🚨 CRITICAL ALERT:', alert);
  
  // Automated responses to critical alerts
  switch (alert.metric) {
    case 'memoryUsage':
      // Clear non-critical caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          const nonCritical = cacheNames.filter(name => 
            !name.includes('critical') && !name.includes('static')
          );
          nonCritical.forEach(name => caches.delete(name));
        });
      }
      break;
      
    case 'bundleSize':
      // Force garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
      break;
      
    case 'pageLoadTime':
      // Enable aggressive caching
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          action: 'OPTIMIZE_STORAGE'
        });
      }
      break;
  }
}

/**
 * Show update notification when new service worker is available
 */
function showUpdateNotification() {
  // Create a simple update notification
  const notification = document.createElement('div');
  notification.id = 'app-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4F46E5;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🚀 Update Available
      </div>
      <div style="margin-bottom: 12px; opacity: 0.9;">
        A new version of 4site.pro is available with performance improvements.
      </div>
      <button onclick="location.reload()" style="
        background: white;
        color: #4F46E5;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        margin-right: 8px;
      ">
        Update Now
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.5);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">
        Later
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 30000);
}

/**
 * Report initialization metrics to analytics
 */
function reportInitializationMetrics(initTime: number, config: InitializationConfig) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'app_initialization', {
      initialization_time: Math.round(initTime),
      performance_monitoring: config.enablePerformanceMonitoring,
      asset_optimization: config.enableAssetOptimization,
      service_worker: config.enableServiceWorker,
      preloading: config.enablePreloading
    });
  }
}

/**
 * Report initialization errors
 */
function reportInitializationError(error: unknown) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'app_initialization_error', {
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get initialization status and metrics
 */
export function getInitializationStatus() {
  return {
    serviceWorker: 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    performanceAPI: 'performance' in window && 'getEntriesByType' in performance,
    intersectionObserver: 'IntersectionObserver' in window,
    cacheAPI: 'caches' in window,
    webVitals: 'PerformanceObserver' in window
  };
}

/**
 * Cleanup function for application shutdown
 */
export function cleanupApp() {
  console.log('[AppInitializer] Cleaning up application...');
  
  // Disconnect performance observers
  const monitor = (window as any).__performanceMonitor;
  if (monitor && typeof monitor.stop === 'function') {
    monitor.stop();
  }
  
  // Clear any intervals or timeouts
  // Note: Specific cleanup would be implemented based on actual usage
  
  console.log('[AppInitializer] ✅ Application cleanup completed');
}

// Auto-initialize on import in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize with a small delay to ensure DOM is ready
  setTimeout(() => {
    initializeApp().then(result => {
      if (result.success) {
        console.log('[AppInitializer] 🎉 Production initialization completed successfully');
      }
    });
  }, 100);
}

export default {
  initializeApp,
  getInitializationStatus,
  cleanupApp
};
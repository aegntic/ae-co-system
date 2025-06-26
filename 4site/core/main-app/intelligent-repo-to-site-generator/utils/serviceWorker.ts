/**
 * Service Worker registration and management utilities
 */
import React from 'react';

interface ServiceWorkerAPI {
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  getCacheSize: () => Promise<number>;
  clearCache: (cacheNames?: string[]) => Promise<void>;
  prefetch: (urls: string[]) => Promise<void>;
  isSupported: () => boolean;
  getStatus: () => ServiceWorkerStatus;
}

interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  activated: boolean;
  controller: boolean;
  updateAvailable: boolean;
}

class ServiceWorkerManager implements ServiceWorkerAPI {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  constructor() {
    this.setupUpdateListener();
  }

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('[ServiceWorker] Service Workers are not supported');
      return null;
    }

    try {
      console.log('[ServiceWorker] Registering...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('[ServiceWorker] Registered successfully:', this.registration);

      // Setup update detection
      this.registration.addEventListener('updatefound', () => {
        console.log('[ServiceWorker] Update found');
        this.handleUpdateFound();
      });

      // Check for immediate updates
      await this.registration.update();

      return this.registration;
    } catch (error) {
      console.error('[ServiceWorker] Registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[ServiceWorker] Unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('[ServiceWorker] Unregistration failed:', error);
      return false;
    }
  }

  /**
   * Force update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('[ServiceWorker] Manual update triggered');
    } catch (error) {
      console.error('[ServiceWorker] Update failed:', error);
      throw error;
    }
  }

  /**
   * Get current service worker status
   */
  getStatus(): ServiceWorkerStatus {
    const supported = this.isSupported();
    const registered = !!this.registration;
    const activated = !!(this.registration?.active);
    const controller = !!navigator.serviceWorker.controller;

    return {
      supported,
      registered,
      activated,
      controller,
      updateAvailable: this.updateAvailable
    };
  }

  /**
   * Get total cache size
   */
  async getCacheSize(): Promise<number> {
    if (!navigator.serviceWorker.controller) {
      return 0;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { action: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(0), 5000);
    });
  }

  /**
   * Clear service worker caches
   */
  async clearCache(cacheNames?: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No service worker controller available');
    }

    navigator.serviceWorker.controller.postMessage({
      action: 'CLEAR_CACHE',
      data: { cacheNames: cacheNames || [] }
    });

    console.log('[ServiceWorker] Cache clear requested');
  }

  /**
   * Prefetch resources
   */
  async prefetch(urls: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No service worker controller available');
    }

    navigator.serviceWorker.controller.postMessage({
      action: 'PREFETCH',
      data: { urls }
    });

    console.log('[ServiceWorker] Prefetch requested for:', urls);
  }

  /**
   * Setup update listener
   */
  private setupUpdateListener(): void {
    if (!this.isSupported()) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorker] Controller changed');
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_UPDATED':
          console.log('[ServiceWorker] Cache updated:', payload);
          break;
        
        case 'OFFLINE_READY':
          console.log('[ServiceWorker] App ready for offline use');
          this.dispatchEvent('offline-ready');
          break;
          
        case 'UPDATE_AVAILABLE':
          console.log('[ServiceWorker] Update available');
          this.updateAvailable = true;
          this.dispatchEvent('update-available');
          break;
      }
    });
  }

  /**
   * Handle service worker update found
   */
  private handleUpdateFound(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      switch (newWorker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] New version available');
            this.updateAvailable = true;
            this.dispatchEvent('update-available');
          } else {
            console.log('[ServiceWorker] Content is cached for offline use');
            this.dispatchEvent('offline-ready');
          }
          break;

        case 'activated':
          console.log('[ServiceWorker] New version activated');
          this.updateAvailable = false;
          this.dispatchEvent('update-activated');
          break;
      }
    });
  }

  /**
   * Dispatch custom events
   */
  private dispatchEvent(type: string, detail?: any): void {
    window.dispatchEvent(new CustomEvent(`sw-${type}`, { detail }));
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      throw new Error('No waiting service worker');
    }

    this.registration.waiting.postMessage({ action: 'SKIP_WAITING' });
  }
}

// Singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

/**
 * React hook for service worker integration
 */
export const useServiceWorker = () => {
  const [status, setStatus] = React.useState<ServiceWorkerStatus>(
    serviceWorkerManager.getStatus()
  );
  const [cacheSize, setCacheSize] = React.useState<number>(0);

  React.useEffect(() => {
    // Register service worker
    serviceWorkerManager.register();

    // Update status periodically
    const updateStatus = () => {
      setStatus(serviceWorkerManager.getStatus());
    };

    const interval = setInterval(updateStatus, 1000);

    // Listen for service worker events
    const handleOfflineReady = () => updateStatus();
    const handleUpdateAvailable = () => updateStatus();
    const handleUpdateActivated = () => updateStatus();

    window.addEventListener('sw-offline-ready', handleOfflineReady);
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-update-activated', handleUpdateActivated);

    // Get initial cache size
    serviceWorkerManager.getCacheSize().then(setCacheSize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-update-activated', handleUpdateActivated);
    };
  }, []);

  const updateServiceWorker = React.useCallback(async () => {
    try {
      await serviceWorkerManager.skipWaiting();
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }, []);

  const clearCache = React.useCallback(async () => {
    try {
      await serviceWorkerManager.clearCache();
      const newSize = await serviceWorkerManager.getCacheSize();
      setCacheSize(newSize);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const prefetchUrls = React.useCallback(async (urls: string[]) => {
    try {
      await serviceWorkerManager.prefetch(urls);
    } catch (error) {
      console.error('Failed to prefetch URLs:', error);
    }
  }, []);

  return {
    status,
    cacheSize,
    updateServiceWorker,
    clearCache,
    prefetchUrls,
    isSupported: serviceWorkerManager.isSupported()
  };
};

/**
 * Utility functions for cache management
 */
export const cacheUtils = {
  /**
   * Preload critical resources
   */
  preloadCritical: async (urls: string[]) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('critical-resources');
        await Promise.all(
          urls.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch (error) {
              console.warn('Failed to preload:', url, error);
            }
          })
        );
      } catch (error) {
        console.error('Cache preload failed:', error);
      }
    }
  },

  /**
   * Check if resource is cached
   */
  isCached: async (url: string): Promise<boolean> => {
    if ('caches' in window) {
      try {
        const response = await caches.match(url);
        return !!response;
      } catch (error) {
        return false;
      }
    }
    return false;
  },

  /**
   * Get cache storage estimate
   */
  getStorageEstimate: async (): Promise<StorageEstimate | null> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.error('Storage estimate failed:', error);
      }
    }
    return null;
  }
};

/**
 * Performance metrics collection
 */
export const performanceUtils = {
  /**
   * Measure cache performance
   */
  measureCachePerformance: async (url: string): Promise<{
    cached: boolean;
    loadTime: number;
    fromCache: boolean;
  }> => {
    const start = performance.now();
    
    try {
      const cachedResponse = await caches.match(url);
      const cached = !!cachedResponse;
      
      if (cached) {
        const loadTime = performance.now() - start;
        return { cached: true, loadTime, fromCache: true };
      }
      
      const networkResponse = await fetch(url);
      const loadTime = performance.now() - start;
      
      return { cached: false, loadTime, fromCache: false };
    } catch (error) {
      const loadTime = performance.now() - start;
      return { cached: false, loadTime, fromCache: false };
    }
  },

  /**
   * Monitor cache hit rates
   */
  getCacheHitRate: (): { hits: number; misses: number; rate: number } => {
    const hits = parseInt(localStorage.getItem('cache-hits') || '0');
    const misses = parseInt(localStorage.getItem('cache-misses') || '0');
    const total = hits + misses;
    const rate = total > 0 ? (hits / total) * 100 : 0;
    
    return { hits, misses, rate };
  }
};

export default serviceWorkerManager;
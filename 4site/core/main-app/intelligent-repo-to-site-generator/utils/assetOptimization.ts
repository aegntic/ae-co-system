/**
 * Advanced Asset Optimization Pipeline
 * Implements intelligent asset loading, compression, and performance optimization
 */

// Asset optimization configuration
interface AssetOptimizationConfig {
  imageFormats: string[];
  compressionLevels: Record<string, number>;
  lazyLoadThreshold: number;
  prefetchPriority: Record<string, number>;
  webpFallback: boolean;
  criticalAssets: string[];
}

const OPTIMIZATION_CONFIG: AssetOptimizationConfig = {
  imageFormats: ['webp', 'avif', 'jpg', 'png'],
  compressionLevels: {
    'image': 0.85,
    'video': 0.75,
    'audio': 0.8
  },
  lazyLoadThreshold: 100, // pixels
  prefetchPriority: {
    'critical': 1,
    'high': 2,
    'medium': 3,
    'low': 4
  },
  webpFallback: true,
  criticalAssets: [
    '/4sitepro-logo.png',
    '/favicon.ico',
    '/manifest.json'
  ]
};

// Asset loading strategies
enum LoadingStrategy {
  EAGER = 'eager',
  LAZY = 'lazy',
  CRITICAL = 'critical',
  DEFERRED = 'deferred'
}

interface OptimizedAsset {
  src: string;
  fallbackSrc?: string;
  strategy: LoadingStrategy;
  priority: number;
  compressed: boolean;
  format: string;
  size?: number;
}

/**
 * Advanced image optimization with format detection and fallbacks
 */
export class ImageOptimizer {
  private static supportedFormats = new Set<string>();
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    // Test format support
    const formats = ['webp', 'avif', 'jpeg2000'];
    for (const format of formats) {
      if (await this.testFormatSupport(format)) {
        this.supportedFormats.add(format);
      }
    }
    
    this.initialized = true;
    console.log('[AssetOptimizer] Supported formats:', Array.from(this.supportedFormats));
  }

  private static async testFormatSupport(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      const testImages: Record<string, string> = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQ==',
        jpeg2000: 'data:image/jp2;base64,/w=='
      };
      
      img.src = testImages[format] || '';
      setTimeout(() => resolve(false), 100);
    });
  }

  static optimizeImageSrc(originalSrc: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}): OptimizedAsset {
    const { width, height, quality = 85, format } = options;
    
    // Determine best format
    let optimizedFormat = format;
    if (!optimizedFormat) {
      if (this.supportedFormats.has('avif')) {
        optimizedFormat = 'avif';
      } else if (this.supportedFormats.has('webp')) {
        optimizedFormat = 'webp';
      } else {
        optimizedFormat = 'jpg';
      }
    }

    // Generate optimized URL (would integrate with image CDN in production)
    let optimizedSrc = originalSrc;
    
    // For demonstration, create a query-based optimization URL
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 85) params.set('q', quality.toString());
    if (optimizedFormat !== 'jpg') params.set('f', optimizedFormat);
    
    if (params.toString()) {
      optimizedSrc = `${originalSrc}?${params.toString()}`;
    }

    // Determine loading strategy
    const isCritical = OPTIMIZATION_CONFIG.criticalAssets.some(asset => 
      originalSrc.includes(asset)
    );
    
    const strategy = isCritical ? LoadingStrategy.CRITICAL : LoadingStrategy.LAZY;
    const priority = isCritical ? 1 : 3;

    return {
      src: optimizedSrc,
      fallbackSrc: originalSrc,
      strategy,
      priority,
      compressed: quality < 100,
      format: optimizedFormat
    };
  }
}

/**
 * Intelligent lazy loading with intersection observer and priority
 */
export class LazyLoader {
  private static observers = new Map<string, IntersectionObserver>();
  private static loadQueue: Array<{
    element: HTMLElement;
    asset: OptimizedAsset;
    callback?: () => void;
  }> = [];

  static initialize() {
    // Create observers for different priority levels
    Object.keys(OPTIMIZATION_CONFIG.prefetchPriority).forEach(priority => {
      const threshold = priority === 'critical' ? 0.1 : 0.25;
      const rootMargin = priority === 'critical' ? '200px' : '50px';
      
      const observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          threshold,
          rootMargin
        }
      );
      
      this.observers.set(priority, observer);
    });

    // Process load queue on idle
    this.scheduleQueueProcessing();
  }

  private static handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const asset = this.getAssetFromElement(element);
        
        if (asset) {
          this.loadAsset(element, asset);
        }
      }
    });
  }

  private static getAssetFromElement(element: HTMLElement): OptimizedAsset | null {
    const src = element.getAttribute('data-src');
    const strategy = element.getAttribute('data-strategy') as LoadingStrategy;
    const priority = parseInt(element.getAttribute('data-priority') || '3');
    
    if (!src) return null;
    
    return {
      src,
      strategy: strategy || LoadingStrategy.LAZY,
      priority,
      compressed: false,
      format: 'unknown'
    };
  }

  static observeElement(element: HTMLElement, asset: OptimizedAsset) {
    // Determine priority level
    const priorityLevel = Object.keys(OPTIMIZATION_CONFIG.prefetchPriority).find(
      level => OPTIMIZATION_CONFIG.prefetchPriority[level] === asset.priority
    ) || 'medium';
    
    const observer = this.observers.get(priorityLevel);
    if (observer) {
      // Set data attributes for intersection handling
      element.setAttribute('data-src', asset.src);
      element.setAttribute('data-strategy', asset.strategy);
      element.setAttribute('data-priority', asset.priority.toString());
      
      observer.observe(element);
    }
  }

  private static async loadAsset(element: HTMLElement, asset: OptimizedAsset) {
    const startTime = performance.now();
    
    try {
      if (element.tagName === 'IMG') {
        await this.loadImage(element as HTMLImageElement, asset);
      } else if (element.tagName === 'VIDEO') {
        await this.loadVideo(element as HTMLVideoElement, asset);
      } else {
        await this.loadGenericAsset(element, asset);
      }
      
      const loadTime = performance.now() - startTime;
      console.log(`[LazyLoader] Loaded ${asset.src} in ${loadTime.toFixed(2)}ms`);
      
      // Report metrics
      this.reportLoadMetrics(asset, loadTime);
      
    } catch (error) {
      console.error('[LazyLoader] Failed to load asset:', asset.src, error);
      this.handleLoadError(element, asset);
    }
  }

  private static async loadImage(img: HTMLImageElement, asset: OptimizedAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = asset.src;
        img.classList.add('loaded');
        resolve();
      };
      
      tempImg.onerror = () => {
        if (asset.fallbackSrc && asset.fallbackSrc !== asset.src) {
          // Try fallback
          tempImg.src = asset.fallbackSrc;
        } else {
          reject(new Error('Failed to load image'));
        }
      };
      
      tempImg.src = asset.src;
    });
  }

  private static async loadVideo(video: HTMLVideoElement, asset: OptimizedAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      video.oncanplaythrough = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = asset.src;
      video.load();
    });
  }

  private static async loadGenericAsset(element: HTMLElement, asset: OptimizedAsset): Promise<void> {
    // Generic asset loading (CSS, fonts, etc.)
    const response = await fetch(asset.src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Apply loaded asset based on element type
    if (element.tagName === 'LINK') {
      (element as HTMLLinkElement).href = asset.src;
    } else {
      element.setAttribute('src', asset.src);
    }
  }

  private static handleLoadError(element: HTMLElement, asset: OptimizedAsset) {
    if (asset.fallbackSrc && element.tagName === 'IMG') {
      (element as HTMLImageElement).src = asset.fallbackSrc;
    } else {
      element.classList.add('load-error');
    }
  }

  private static reportLoadMetrics(asset: OptimizedAsset, loadTime: number) {
    // Report to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'asset_load', {
        asset_type: asset.format,
        load_time: Math.round(loadTime),
        strategy: asset.strategy,
        priority: asset.priority
      });
    }
  }

  private static scheduleQueueProcessing() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.processLoadQueue();
        this.scheduleQueueProcessing();
      });
    } else {
      setTimeout(() => {
        this.processLoadQueue();
        this.scheduleQueueProcessing();
      }, 1000);
    }
  }

  private static processLoadQueue() {
    // Process pending loads in priority order
    this.loadQueue.sort((a, b) => a.asset.priority - b.asset.priority);
    
    const toProcess = this.loadQueue.splice(0, 5); // Process 5 at a time
    toProcess.forEach(({ element, asset, callback }) => {
      this.loadAsset(element, asset).then(callback).catch(console.error);
    });
  }
}

/**
 * Font optimization and loading strategy
 */
export class FontOptimizer {
  private static loadedFonts = new Set<string>();
  
  static optimizeFontLoading() {
    // Preload critical fonts
    const criticalFonts = [
      'Inter-Regular.woff2',
      'Inter-Medium.woff2',
      'Inter-SemiBold.woff2'
    ];
    
    criticalFonts.forEach(font => {
      this.preloadFont(`/fonts/${font}`);
    });
    
    // Load non-critical fonts with delay
    setTimeout(() => {
      this.loadNonCriticalFonts();
    }, 2000);
  }
  
  private static preloadFont(fontUrl: string) {
    if (this.loadedFonts.has(fontUrl)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = fontUrl;
    
    document.head.appendChild(link);
    this.loadedFonts.add(fontUrl);
  }
  
  private static loadNonCriticalFonts() {
    // Load additional font weights and styles
    const nonCriticalFonts = [
      'Inter-Light.woff2',
      'Inter-Bold.woff2',
      'Inter-ExtraBold.woff2'
    ];
    
    nonCriticalFonts.forEach(font => {
      this.preloadFont(`/fonts/${font}`);
    });
  }
}

/**
 * Resource hints and preloading manager
 */
export class ResourceHintsManager {
  static addResourceHints() {
    // DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'api.github.com',
      'cdn.jsdelivr.net'
    ];
    
    externalDomains.forEach(domain => {
      this.addDnsPrefetch(domain);
    });
    
    // Preconnect to critical services
    const criticalServices = [
      'https://generativelanguage.googleapis.com',
      'https://api.github.com'
    ];
    
    criticalServices.forEach(url => {
      this.addPreconnect(url);
    });
  }
  
  private static addDnsPrefetch(domain: string) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  }
  
  private static addPreconnect(url: string) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

/**
 * Initialize all asset optimizations
 */
export async function initializeAssetOptimization() {
  console.log('[AssetOptimizer] Initializing asset optimization pipeline...');
  
  // Initialize image optimization
  await ImageOptimizer.initialize();
  
  // Initialize lazy loading
  LazyLoader.initialize();
  
  // Optimize font loading
  FontOptimizer.optimizeFontLoading();
  
  // Add resource hints
  ResourceHintsManager.addResourceHints();
  
  console.log('[AssetOptimizer] Asset optimization pipeline initialized');
}

/**
 * Create optimized image component
 */
export function createOptimizedImage(src: string, options: {
  width?: number;
  height?: number;
  alt: string;
  className?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
} = { alt: '' }): HTMLImageElement {
  const { width, height, alt, className, priority = 'medium' } = options;
  
  const img = document.createElement('img');
  img.alt = alt;
  if (className) img.className = className;
  
  const optimizedAsset = ImageOptimizer.optimizeImageSrc(src, {
    width,
    height,
    quality: priority === 'critical' ? 95 : 85
  });
  
  if (optimizedAsset.strategy === LoadingStrategy.CRITICAL) {
    img.src = optimizedAsset.src;
  } else {
    img.setAttribute('data-src', optimizedAsset.src);
    LazyLoader.observeElement(img, optimizedAsset);
  }
  
  return img;
}

export {
  OPTIMIZATION_CONFIG,
  LoadingStrategy,
  OptimizedAsset,
  ImageOptimizer,
  LazyLoader,
  FontOptimizer,
  ResourceHintsManager
};
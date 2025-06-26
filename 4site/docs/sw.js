
// 4site.pro Service Worker - Ultra Elite Performance
// Aggressive caching strategy for sub-200ms repeat visits

const CACHE_NAME = '4site-pro-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Critical assets for immediate caching
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/4site-pro-logo.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Immutable vendor chunks - cache forever
  VENDOR_CHUNKS: /\/js\/(react-vendor|animation-vendor|vendor)-.*\.js$/,
  
  // App chunks - cache with revalidation  
  APP_CHUNKS: /\/js\/(index|ai-services|utils|contexts)-.*\.js$/,
  
  // CSS - cache with revalidation
  STYLES: /\/css\/.*\.css$/,
  
  // API responses - short cache with background update
  API: /\/api\//,
  
  // Images - long cache
  IMAGES: /\.(png|jpg|jpeg|gif|webp|svg)$/
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;
  
  // Apply appropriate caching strategy
  if (CACHE_STRATEGIES.VENDOR_CHUNKS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, 365 * 24 * 60 * 60)); // 1 year
  } else if (CACHE_STRATEGIES.APP_CHUNKS.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, 24 * 60 * 60)); // 1 day
  } else if (CACHE_STRATEGIES.STYLES.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, 24 * 60 * 60)); // 1 day
  } else if (CACHE_STRATEGIES.API.test(url.pathname)) {
    event.respondWith(networkFirst(request, 5 * 60)); // 5 minutes
  } else if (CACHE_STRATEGIES.IMAGES.test(url.pathname)) {
    event.respondWith(cacheFirst(request, 30 * 24 * 60 * 60)); // 30 days
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, 60)); // 1 minute for HTML
  }
});

// Cache-first strategy (for immutable assets)
async function cacheFirst(request, maxAge = 3600) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const ageInSeconds = (now - cacheDate) / 1000;
      
      if (ageInSeconds < maxAge) {
        return cachedResponse;
      }
    }
    
    // Fetch from network and update cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy (for app assets)
async function staleWhileRevalidate(request, maxAge = 3600) {
  try {
    const cachedResponse = await caches.match(request);
    
    // Always try to fetch in background
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    });
    
    // Return cached response if available and fresh
    if (cachedResponse) {
      const cacheDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const ageInSeconds = (now - cacheDate) / 1000;
      
      if (ageInSeconds < maxAge) {
        fetchPromise.catch(() => {}); // Background update, ignore errors
        return cachedResponse;
      }
    }
    
    // Wait for network response
    return await fetchPromise;
  } catch (error) {
    console.log('[SW] Stale-while-revalidate failed:', error);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy (for API and HTML)
async function networkFirst(request, maxAge = 60) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    // Log performance metrics for monitoring
    console.log('[SW] Performance metrics:', event.data.metrics);
  }
});
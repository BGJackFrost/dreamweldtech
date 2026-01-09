/**
 * DreamWeldTech Service Worker
 * Advanced caching strategies for optimal performance
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `dreamweldtech-${CACHE_VERSION}`;
const RUNTIME_CACHE = `dreamweldtech-runtime-${CACHE_VERSION}`;
const ASSETS_CACHE = `dreamweldtech-assets-${CACHE_VERSION}`;
const IMAGE_CACHE = `dreamweldtech-images-${CACHE_VERSION}`;
const API_CACHE = `dreamweldtech-api-${CACHE_VERSION}`;

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000,        // 5 minutes for API responses
  images: 7 * 24 * 60 * 60 * 1000, // 7 days for images
  assets: 30 * 24 * 60 * 60 * 1000, // 30 days for static assets
};

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  images: 100,  // Max 100 images
  api: 50,      // Max 50 API responses
  runtime: 100, // Max 100 runtime entries
};

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

/**
 * Check if cached response is expired
 */
function isExpired(response, maxAge) {
  if (!response) return true;
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  const date = new Date(dateHeader).getTime();
  return Date.now() - date > maxAge;
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v2...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v2...');
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, ASSETS_CACHE, IMAGE_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and dev tools
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // API requests - Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // JavaScript and CSS - Cache First with Network Fallback
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(handleAssetRequest(request, ASSETS_CACHE));
    return;
  }

  // Fonts - Cache First (long-term)
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(handleAssetRequest(request, ASSETS_CACHE));
    return;
  }

  // Images - Cache First with Size Limit
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // HTML pages - Network First with Cache Fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }

  // Default - Network First
  event.respondWith(handleDefaultRequest(request));
});

/**
 * Handle API requests with Stale-While-Revalidate strategy
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // Return cached response immediately if available
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        await cache.put(request, responseToCache);
        await limitCacheSize(API_CACHE, MAX_CACHE_SIZE.api);
      }
      return response;
    })
    .catch(() => {
      // Return cached response on network failure
      return cachedResponse || new Response(
        JSON.stringify({ error: 'Offline - API unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    });

  // Return cached response immediately, update in background
  if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRATION.api)) {
    fetchPromise; // Fire and forget - update cache in background
    return cachedResponse;
  }

  return fetchPromise;
}

/**
 * Handle static asset requests with Cache First strategy
 */
async function handleAssetRequest(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    return new Response('Offline - Asset unavailable', { status: 503 });
  }
}

/**
 * Handle image requests with Cache First and size limit
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      await limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE.images);
    }
    return response;
  } catch (error) {
    // Return placeholder image on failure
    return caches.match('/images/placeholder.jpg') || 
           new Response('Image unavailable', { status: 503 });
  }
}

/**
 * Handle HTML requests with Network First strategy
 */
async function handleHtmlRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Fallback to index.html for SPA routing
    return cache.match('/') || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle default requests with Network First strategy
 */
async function handleDefaultRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      await limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE.runtime);
    }
    return response;
  } catch (error) {
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-contact-form') {
    event.waitUntil(syncContactForms());
  }
  
  if (event.tag === 'sync-quote-request') {
    event.waitUntil(syncQuoteRequests());
  }
});

/**
 * Sync pending contact form submissions
 */
async function syncContactForms() {
  // Implementation for syncing contact forms when back online
  console.log('[Service Worker] Syncing contact forms...');
}

/**
 * Sync pending quote requests
 */
async function syncQuoteRequests() {
  // Implementation for syncing quote requests when back online
  console.log('[Service Worker] Syncing quote requests...');
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'DreamWeldTech', body: 'New notification' };
  
  try {
    data = event.data?.json() || data;
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  const options = {
    body: data.body,
    icon: '/images/icon-192.png',
    badge: '/images/icon-96.png',
    tag: data.tag || 'dreamweldtech-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      })
    );
  }
});

/**
 * Get total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

console.log('[Service Worker] Loaded v2');

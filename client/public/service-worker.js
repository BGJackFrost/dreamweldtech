const CACHE_NAME = 'dreamweldtech-v1';
const RUNTIME_CACHE = 'dreamweldtech-runtime-v1';
const ASSETS_CACHE = 'dreamweldtech-assets-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== ASSETS_CACHE) {
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

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline - API unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - Cache first, fall back to network
  if (url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(ASSETS_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          return new Response('Offline - Asset unavailable', { status: 503 });
        });
      })
    );
    return;
  }

  // Images - Cache first, fall back to network
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(ASSETS_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          return new Response('Offline - Image unavailable', { status: 503 });
        });
      })
    );
    return;
  }

  // HTML pages - Network first, fall back to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Default - Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contact-form') {
    event.waitUntil(
      // Retry failed contact form submissions
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match('/api/trpc/contacts.create');
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification from Dreamweldtech',
    icon: '/images/icon-192.png',
    badge: '/images/icon-96.png',
    tag: 'dreamweldtech-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('Dreamweldtech', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

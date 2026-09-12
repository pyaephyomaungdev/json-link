const CACHE_NAME = 'json-link-v1.1.0';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './og-image.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-512.svg',
  './apple-touch-icon.png',
];

// Install event: Pre-cache shell assets and skip waiting immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up previous cache versions and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for navigation requests to ensure fresh deployments;
// Stale-while-revalidate for local static assets; network-first for external APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or external API calls (e.g. OpenRouter)
  if (event.request.method !== 'GET' || url.origin.includes('openrouter.ai')) {
    return;
  }

  // Navigation requests (HTML documents): Network-first with cache fallback
  // This ensures deployments and fresh HTML/JS hashes are loaded immediately without stale version traps
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate for assets)
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Offline, ignore network fetch failure
        });
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});

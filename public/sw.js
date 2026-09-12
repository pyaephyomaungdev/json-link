const CACHE_NAME = 'json-link-v1.0.0';

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

// Install event: Pre-cache shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up previous cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Stale-while-revalidate for local assets, network-first for external APIs
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or external API calls (e.g. OpenRouter)
  if (event.request.method !== 'GET' || url.origin.includes('openrouter.ai')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
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
        // If offline and requesting navigation, return cached index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});

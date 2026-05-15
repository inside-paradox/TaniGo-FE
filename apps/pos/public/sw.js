const CACHE_NAME = 'tanigo-pos-v1';

const SHELL_ASSETS = [
  '/',
  '/transaksi',
  '/shift',
  '/login',
  '/manifest.webmanifest',
];

// Install: cache shell assets and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback for navigation and same-origin requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pass through cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Pass through API requests — handled by the server / axios interceptor
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful GET responses
        if (request.method === 'GET' && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

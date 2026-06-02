const CACHE_NAME = 'tanigo-pos-v4';

const SHELL_URLS = [
  '/',
  '/transaksi',
  '/shift',
  '/retur',
  '/login',
  '/manifest.webmanifest',
];

// Install: cache shell HTML and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll is best-effort — individual failures don't abort the install
      Promise.allSettled(SHELL_URLS.map((url) =>
        cache.add(url).catch(() => {})
      ))
    )
  );
  self.skipWaiting();
});

// Activate: clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   /_next/static/* → cache-first (content-hashed assets; cached as they are fetched online)
//   /api/*          → network-only (never cache)
//   everything else → network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for versioned static chunks — once fetched online they are always served offline
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            // waitUntil keeps the SW alive until the cache write completes.
            // Without it the write is a dangling promise that the browser may
            // drop when it terminates the worker right after respondWith settles.
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages; serve cached version when offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.method === 'GET' && response.ok) {
          // See note above — the runtime cache write must be wrapped in waitUntil.
          const clone = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

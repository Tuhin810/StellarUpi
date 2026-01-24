const CACHE_NAME = 'stellarpay-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Network first strategy for better PWA reliability
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

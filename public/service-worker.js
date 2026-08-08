const CACHE_NAME = 'controltech-assist-v1-5';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest?v=3.0.4',
  '/favicon.ico?v=3.0.4',
  '/favicon-16x16.png?v=3.0.4',
  '/favicon-32x32.png?v=3.0.4',
  '/app-icon-192.png?v=3.0.4',
  '/app-icon-512.png?v=3.0.4',
  '/apple-touch-icon.png?v=3.0.4',
  '/apple-touch-icon-120.png?v=3.0.4',
  '/apple-touch-icon-152.png?v=3.0.4',
  '/apple-touch-icon-167.png?v=3.0.4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('/index.html')))
  );
});

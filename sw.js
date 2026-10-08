const CACHE_NAME = 'mghb-pwa-v33';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './faviconmghb.png',
  './favicon.ico',
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './bni-logo.svg',
  './jarin-pattern-light.svg',
  './jarin-pattern.svg',
  './berita_maganghub.json'
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate / Network-First with Offline Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and chrome-extension / external cross-origin analytics
  if (req.method !== 'GET') return;

  // Handle same-origin static requests
  if (url.origin === self.location.origin) {
    const isHtml = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';
    if (isHtml) {
      // Network-First untuk dokumen HTML agar update terbaru langsung masuk di HP
      event.respondWith(
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        }).catch(() => {
          return caches.match(req).then((cached) => cached || caches.match('./index.html'));
        })
      );
      return;
    }

    // Aset statis lainnya (gambar, json): Stale-While-Revalidate
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // External resources (fonts, cdn, unpkg): Cache-first fallback
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});

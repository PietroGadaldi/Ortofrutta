// Service Worker per Ortofrutta PWA
const CACHE_NAME = 'ortofrutta-v3';

// Solo asset veramente statici e immutabili (no HTML!)
const STATIC_ASSETS = [
  '/Ortofrutta.png',
  '/icons.svg',
  '/manifest.json',
];

// Event: Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Event: Activate - pulisce tutte le vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Event: Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // HTML (navigazione): SEMPRE network-first, mai cache-first.
  // Questo è fondamentale: l'index.html referenzia bundle JS con hash,
  // se serviamo una versione vecchia il JS non esiste più → schermata bianca.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((res) => res || caches.match('/'))
      )
    );
    return;
  }

  // Bundle JS/CSS di Vite (hanno hash nel nome → immutabili): cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Immagini e manifest: cache-first con fallback di rete
  if (STATIC_ASSETS.some((asset) => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Tutto il resto (API, Supabase, Netlify functions): solo rete
});

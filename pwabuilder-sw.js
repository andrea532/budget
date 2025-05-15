// Service worker per Progressive Web App
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "budget-app-cache-v1";
const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Installa e precache la pagina offline
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

// Attiva il navigation preload se supportato
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Gestione delle richieste di navigazione
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        // Se offline, mostra la pagina di fallback
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// Cache delle risorse statiche
workbox.routing.registerRoute(
  ({request}) => request.destination === 'style' || 
                request.destination === 'script' ||
                request.destination === 'font' ||
                request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 giorni
      }),
    ],
  })
);
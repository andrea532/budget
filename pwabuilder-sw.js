// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE_NAME = 'budget-app-v2';
const CACHE_VERSION = 'v2.0.0';

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const HTML_CACHE = 'html';
const JS_CACHE = 'javascript';
const STYLE_CACHE = 'stylesheets';
const IMAGE_CACHE = 'images';
const FONT_CACHE = 'fonts';

// Replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = '/offline.html';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching offline page');
        return cache.addAll([
          offlineFallbackPage,
          '/',
          '/index.html',
          '/manifest.json',
          // Aggiungi qui altri file critici se necessario
        ]);
      })
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache strategies
workbox.routing.registerRoute(
  ({event}) => event.request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: HTML_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 giorni
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({event}) => event.request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: JS_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 giorni
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({event}) => event.request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: STYLE_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 giorni
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({event}) => event.request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 giorni
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com' || 
             url.origin === 'https://fonts.gstatic.com',
  new workbox.strategies.CacheFirst({
    cacheName: FONT_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 anno per i font
      }),
    ],
  })
);

// Navigazione offline
workbox.routing.setCatchHandler(async ({event}) => {
  if (event.request.destination === 'document') {
    try {
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse) {
        return preloadResponse;
      }

      const networkResp = await fetch(event.request);
      return networkResp;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResp = await cache.match(offlineFallbackPage);
      return cachedResp;
    }
  }

  return Response.error();
});

// Pulizia delle cache vecchie
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  const cacheWhitelist = [
    CACHE_NAME,
    HTML_CACHE,
    JS_CACHE,
    STYLE_CACHE,
    IMAGE_CACHE,
    FONT_CACHE
  ];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

console.log('[Service Worker] Loaded');

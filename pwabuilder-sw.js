// Service worker ottimizzato per Progressive Web App
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "budget-app-cache-v2"; // Incrementato il numero di versione
const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Installa e precache la pagina offline
self.addEventListener('install', async (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching offline page');
        return cache.add(offlineFallbackPage);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Attiva il service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Attiva il navigation preload se supportato
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Gestione migliorata delle richieste di navigazione
self.addEventListener('fetch', (event) => {
  // Ignora le richieste che non sono GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Gestione speciale per la navigazione
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
        console.log('Service Worker: Network failed, serving offline page');
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
  
  // Per tutte le altre richieste, usa la strategia cache-first per le risorse statiche
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' ||
      event.request.destination === 'font' ||
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Controlla se la risposta è valida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clona la risposta
          const responseToCache = response.clone();
          
          caches.open(CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
  }
});

// Cache delle risorse statiche con strategia ottimizzata
workbox.routing.registerRoute(
  ({request}) => request.destination === 'style' || 
                request.destination === 'script' ||
                request.destination === 'font' ||
                request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources-v2',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Aumentato il numero di voci cache
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 giorni invece di 30
      }),
    ],
  })
);

// Cache per le richieste API/database (se necessario)
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minuti per le API
      }),
    ],
  })
);

// Gestione eventi di sincronizzazione in background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'budget-data-sync') {
    event.waitUntil(
      // Qui potresti implementare la sincronizzazione dei dati
      console.log('Service Worker: Syncing budget data...')
    );
  }
});

// Gestione notifiche push (per future implementazioni)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  // Implementa la logica delle notifiche push se necessario
});

console.log('Service Worker: Loaded and ready');

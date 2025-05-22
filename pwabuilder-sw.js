// Service worker ottimizzato per massima persistenza PWA
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "budget-app-cache-v3"; // Incrementato per forzare aggiornamento
const offlineFallbackPage = "offline.html";

// Aggiungi listener per messaggi dal client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  // Nuovo: gestione salvataggio dati
  if (event.data && event.data.type === "SAVE_DATA") {
    console.log('Service Worker: Ricevuto comando di salvataggio dati');
    // Qui potresti implementare logica aggiuntiva per il salvataggio
  }
});

// Installa e precache
self.addEventListener('install', async (event) => {
  console.log('Service Worker: Installing v3...');
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

// Attiva il service worker e pulisci cache vecchie
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v3...');
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

// Gestione avanzata della persistenza prima della chiusura
self.addEventListener('beforeunload', (event) => {
  console.log('Service Worker: App closing, forcing data persistence check');
  
  // Notifica ai client di salvare i dati
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FORCE_SAVE_DATA',
        message: 'App closing, save data now'
      });
    });
  });
});

// Gestione eventi di visibilità per PWA
self.addEventListener('visibilitychange', (event) => {
  if (document.visibilityState === 'hidden') {
    console.log('Service Worker: App going to background');
    // Forza il salvataggio quando l'app va in background
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'APP_BACKGROUNDED',
          message: 'Save data before background'
        });
      });
    });
  }
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
        
        // Se la risposta è buona, aggiorna la cache
        if (networkResp.status === 200) {
          const cache = await caches.open(CACHE);
          cache.put(event.request, networkResp.clone());
        }
        
        return networkResp;
      } catch (error) {
        console.log('Service Worker: Network failed, serving from cache or offline page');
        
        // Prima prova a servire dalla cache
        const cachedResp = await caches.match(event.request);
        if (cachedResp) {
          return cachedResp;
        }
        
        // Altrimenti mostra la pagina offline
        const cache = await caches.open(CACHE);
        const offlinePage = await cache.match(offlineFallbackPage);
        return offlinePage;
      }
    })());
    
    return; // Esci presto per le richieste di navigazione
  }
  
  // Per tutte le altre richieste, usa la strategia cache-first per le risorse statiche
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' ||
      event.request.destination === 'font' ||
      event.request.destination === 'image' ||
      event.request.destination === 'manifest') {
    
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // Trova dalla cache, ma prova anche la rete in background per aggiornamenti
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {
            // Ignora errori di rete in background
          });
          
          return response;
        }
        
        // Non in cache, prova la rete
        return fetch(event.request).then((response) => {
          // Controlla se la risposta è valida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clona la risposta per la cache
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
                request.destination === 'image' ||
                request.destination === 'manifest',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources-v3',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 150, // Aumentato per PWA
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 giorni per PWA
      }),
    ],
  })
);

// Cache per l'app shell
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'app-shell-v3',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 1 giorno
      }),
    ],
  })
);

// Gestione eventi di sincronizzazione in background per salvataggio dati
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'budget-data-sync') {
    event.waitUntil(
      // Notifica ai client di sincronizzare i dati
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_DATA',
            message: 'Background sync triggered'
          });
        });
      })
    );
  }
});

// Gestione eventi push per notifiche di sincronizzazione
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'data-sync-reminder') {
      // Mostra notifica per ricordare di sincronizzare i dati
      event.waitUntil(
        self.registration.showNotification('Budget App', {
          body: 'Sincronizza i tuoi dati per non perderli',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'data-sync',
          actions: [
            {
              action: 'sync',
              title: 'Sincronizza ora'
            }
          ]
        })
      );
    }
  }
});

// Gestione click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'sync') {
    // Apri l'app e forza la sincronizzazione
    event.waitUntil(
      clients.openWindow('/').then(client => {
        if (client) {
          client.postMessage({
            type: 'FORCE_SYNC',
            message: 'User requested sync from notification'
          });
        }
      })
    );
  }
});

// Periodicamente invia promemoria per salvare i dati (ogni 5 minuti se l'app è aperta)
setInterval(() => {
  self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      clients.forEach(client => {
        client.postMessage({
          type: 'PERIODIC_SAVE_REMINDER',
          message: 'Periodic data save check'
        });
      });
    }
  });
}, 5 * 60 * 1000); // 5 minuti

console.log('Service Worker v3: Loaded and ready with enhanced PWA persistence');

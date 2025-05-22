// Service worker ottimizzato per preservare i dati durante gli aggiornamenti PWA
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "budget-app-cache-v4"; // Incrementato per gli aggiornamenti
const offlineFallbackPage = "offline.html";
const DATA_BACKUP_KEY = 'pwa-data-preservation';

// Listener per messaggi dal client
self.addEventListener("message", (event) => {
  console.log('[SW] Messaggio ricevuto:', event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log('[SW] Skip waiting richiesto');
    self.skipWaiting();
  }
  
  // Gestione backup dati prima degli aggiornamenti
  if (event.data && event.data.type === "BACKUP_DATA") {
    console.log('[SW] Backup dati richiesto dal client');
    // Il client si occupa del backup, noi solo confermiamo
    event.ports?.[0]?.postMessage({ success: true });
  }
  
  // Salvataggio dati generale
  if (event.data && event.data.type === "SAVE_DATA") {
    console.log('[SW] Ricevuto comando di salvataggio dati');
    broadcastToClients({
      type: 'FORCE_SAVE_DATA',
      reason: 'service_worker_request'
    });
  }
});

// NUOVO: Funzione per comunicare con tutti i client
const broadcastToClients = async (message) => {
  try {
    const clients = await self.clients.matchAll();
    console.log(`[SW] Broadcasting a ${clients.length} client(s):`, message);
    
    clients.forEach(client => {
      client.postMessage(message);
    });
  } catch (error) {
    console.error('[SW] Errore nel broadcast:', error);
  }
};

// MIGLIORATO: Gestione dell'installazione con backup dei dati
self.addEventListener('install', async (event) => {
  console.log('[SW] Installing v4...');
  
  event.waitUntil(
    (async () => {
      try {
        // Prima notifica ai client di fare backup
        await broadcastToClients({
          type: 'PREPARE_FOR_UPDATE',
          message: 'Service Worker updating, backup your data'
        });
        
        // Piccola pausa per permettere il backup
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Apri la cache e aggiungi la pagina offline
        const cache = await caches.open(CACHE);
        console.log('[SW] Caching offline page');
        await cache.add(offlineFallbackPage);
        
        console.log('[SW] Installation completed, skip waiting');
        return self.skipWaiting();
      } catch (error) {
        console.error('[SW] Errore durante l\'installazione:', error);
      }
    })()
  );
});

// MIGLIORATO: Attivazione con gestione dati
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v4...');
  
  event.waitUntil(
    (async () => {
      try {
        // Pulisci cache vecchie
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletePromises);
        
        // Prendi controllo dei client
        await self.clients.claim();
        console.log('[SW] Claimed all clients');
        
        // Notifica ai client che l'aggiornamento è completato
        setTimeout(() => {
          broadcastToClients({
            type: 'SERVICE_WORKER_UPDATED',
            message: 'Service Worker updated successfully'
          });
        }, 1000);
        
      } catch (error) {
        console.error('[SW] Errore durante l\'attivazione:', error);
      }
    })()
  );
});

// NUOVO: Intercetta le richieste per forzare il controllo della cache dell'app
self.addEventListener('fetch', (event) => {
  // Ignora le richieste che non sono GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Gestione speciale per l'app principale
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Cerca prima la risposta preloaded
          const preloadResp = await event.preloadResponse;
          if (preloadResp) {
            return preloadResp;
          }

          // Prova la rete
          const networkResp = await fetch(event.request);
          
          // Se la risposta è buona, metti in cache
          if (networkResp.status === 200) {
            const cache = await caches.open(CACHE);
            cache.put(event.request, networkResp.clone());
          }
          
          return networkResp;
        } catch (error) {
          console.log('[SW] Network failed, trying cache or offline page');
          
          // Prima prova la cache
          const cachedResp = await caches.match(event.request);
          if (cachedResp) {
            return cachedResp;
          }
          
          // Altrimenti mostra la pagina offline
          const cache = await caches.open(CACHE);
          const offlinePage = await cache.match(offlineFallbackPage);
          return offlinePage || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }
  
  // Per le risorse statiche, usa cache-first ma con controllo di aggiornamento
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' ||
      event.request.destination === 'font' ||
      event.request.destination === 'image' ||
      event.request.destination === 'manifest') {
    
    event.respondWith(
      (async () => {
        try {
          // Prima controlla la cache
          const cachedResponse = await caches.match(event.request);
          
          if (cachedResponse) {
            // Trova in cache, ma controlla aggiornamenti in background
            fetch(event.request).then(async (networkResponse) => {
              if (networkResponse.status === 200) {
                const cache = await caches.open(CACHE);
                await cache.put(event.request, networkResponse);
              }
            }).catch(() => {
              // Ignora errori di rete in background
            });
            
            return cachedResponse;
          }
          
          // Non in cache, prova la rete
          const networkResponse = await fetch(event.request);
          
          if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE);
            await cache.put(event.request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          // Se tutto fallisce, restituisci un placeholder o errore
          console.error('[SW] Fetch failed:', error);
          return new Response('Resource unavailable', { status: 503 });
        }
      })()
    );
  }
});

// NUOVO: Gestione della sincronizzazione in background per i dati
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'budget-data-sync') {
    event.waitUntil(
      broadcastToClients({
        type: 'SYNC_DATA',
        message: 'Background sync triggered'
      })
    );
  }
  
  if (event.tag === 'budget-backup-sync') {
    event.waitUntil(
      broadcastToClients({
        type: 'CREATE_BACKUP',
        message: 'Background backup sync triggered'
      })
    );
  }
});

// NUOVO: Gestione eventi push per sincronizzazione
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'data-sync-reminder') {
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
            },
            {
              action: 'backup',
              title: 'Crea backup'
            }
          ]
        })
      );
    }
  }
});

// MIGLIORATO: Gestione click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'sync') {
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
  } else if (event.action === 'backup') {
    event.waitUntil(
      clients.openWindow('/').then(client => {
        if (client) {
          client.postMessage({
            type: 'CREATE_BACKUP',
            message: 'User requested backup from notification'
          });
        }
      })
    );
  }
});

// NUOVO: Controllo periodico dello stato dell'app
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minuti

const performHealthCheck = async () => {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return;
  }
  
  lastHealthCheck = now;
  console.log('[SW] Performing health check...');
  
  try {
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // App è attiva, controlla lo stato dei dati
      broadcastToClients({
        type: 'HEALTH_CHECK',
        message: 'Periodic health check'
      });
    }
  } catch (error) {
    console.error('[SW] Health check failed:', error);
  }
};

// Esegui controllo periodico
self.addEventListener('message', () => {
  performHealthCheck();
});

// NUOVO: Gestione dell'event beforeunload attraverso i client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'APP_CLOSING') {
    console.log('[SW] App is closing, ensuring data persistence');
    
    // Forza il salvataggio immediato
    broadcastToClients({
      type: 'EMERGENCY_SAVE',
      message: 'App closing, save all data immediately'
    });
  }
});

// Configurazione avanzata con Workbox
if (workbox) {
  // Abilita navigation preload se supportato
  if (workbox.navigationPreload?.isSupported()) {
    workbox.navigationPreload.enable();
  }
  
  // Cache delle API calls con strategia NetworkFirst
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache-v4',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 ora
        }),
      ],
    })
  );
  
  // Precache degli asset statici
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}

console.log('[SW] Service Worker v4 loaded with enhanced data persistence');

// NUOVO: Timer per backup automatico quando l'app è in uso
let appActiveTimer = null;

const scheduleBackupReminder = () => {
  if (appActiveTimer) {
    clearInterval(appActiveTimer);
  }
  
  // Ogni 30 minuti quando l'app è attiva
  appActiveTimer = setInterval(() => {
    broadcastToClients({
      type: 'PERIODIC_BACKUP_REMINDER',
      message: 'Periodic backup reminder'
    });
  }, 30 * 60 * 1000);
};

// Avvia il timer quando il service worker viene caricato
scheduleBackupReminder();

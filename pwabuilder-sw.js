// Service worker ottimizzato per preservare i dati durante gli aggiornamenti PWA
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "budget-app-cache-v5"; // Incrementato per miglioramenti
const offlineFallbackPage = "offline.html";
const DATA_PRESERVATION_KEY = 'pwa-data-preservation-v2';
const SETTINGS_PRESERVATION_KEY = 'pwa-settings-preservation-v2';

// NUOVO: Configurazione avanzata per la gestione dati
const DATA_CONFIG = {
  FORCE_SAVE_INTERVAL: 30000, // 30 secondi
  BACKUP_REMINDER_INTERVAL: 600000, // 10 minuti
  HEALTH_CHECK_INTERVAL: 300000, // 5 minuti
  EMERGENCY_SAVE_DELAY: 2000, // 2 secondi
};

// Tracciamento stato dell'app
let appState = {
  lastSaveRequest: 0,
  lastBackupRequest: 0,
  clientsCount: 0,
  dataPreservationActive: false
};

// NUOVO: Listener per messaggi dal client migliorato
self.addEventListener("message", (event) => {
  console.log('[SW] Messaggio ricevuto:', event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log('[SW] Skip waiting richiesto');
    self.skipWaiting();
    return;
  }
  
  // NUOVO: Gestione client ready
  if (event.data && event.data.type === "CLIENT_READY") {
    console.log('[SW] Client pronto, isPWA:', event.data.isPWA);
    appState.clientsCount++;
    
    // Invia health check dopo che il client è pronto
    setTimeout(() => {
      broadcastToClients({
        type: 'HEALTH_CHECK',
        reason: 'client_ready_check'
      });
    }, 5000);
    return;
  }
  
  // Gestione backup dati prima degli aggiornamenti
  if (event.data && event.data.type === "BACKUP_DATA") {
    console.log('[SW] Backup dati richiesto dal client');
    handleDataPreservation();
    event.ports?.[0]?.postMessage({ success: true });
    return;
  }
  
  // NUOVO: Gestione preservazione dati critici
  if (event.data && event.data.type === "PRESERVE_CRITICAL_DATA") {
    console.log('[SW] Preservazione dati critici richiesta');
    handleCriticalDataPreservation(event.data.data);
    return;
  }
  
  // Salvataggio dati generale
  if (event.data && event.data.type === "SAVE_DATA") {
    console.log('[SW] Ricevuto comando di salvataggio dati');
    appState.lastSaveRequest = Date.now();
    broadcastToClients({
      type: 'FORCE_SAVE_DATA',
      reason: 'service_worker_request',
      urgent: true
    });
    return;
  }
  
  // NUOVO: Gestione chiusura app
  if (event.data && event.data.type === "APP_CLOSING") {
    console.log('[SW] App in chiusura, preservazione dati di emergenza');
    handleEmergencyDataPreservation();
    return;
  }
  
  // NUOVO: Gestione backgrounding app
  if (event.data && event.data.type === "APP_BACKGROUNDED") {
    console.log('[SW] App in background, salvataggio preventivo');
    broadcastToClients({
      type: 'FORCE_SAVE_DATA',
      reason: 'app_backgrounded',
      urgent: true
    });
    return;
  }
});

// NUOVO: Funzione per gestire la preservazione dati critici
const handleCriticalDataPreservation = async (data) => {
  try {
    console.log('[SW] Preservazione dati critici in corso...');
    
    if (data && data.settings) {
      // Salva le impostazioni critiche
      await caches.open(CACHE).then(cache => {
        const settingsBlob = new Response(JSON.stringify(data.settings));
        cache.put('/critical-settings-backup', settingsBlob);
      });
      console.log('[SW] Settings critici preservati');
    }
    
    if (data && data.transactions) {
      // Salva le transazioni critiche
      await caches.open(CACHE).then(cache => {
        const transactionsBlob = new Response(JSON.stringify(data.transactions));
        cache.put('/critical-transactions-backup', transactionsBlob);
      });
      console.log('[SW] Transazioni critiche preservate');
    }
    
    appState.dataPreservationActive = true;
    console.log('[SW] Preservazione dati critici completata');
    
  } catch (error) {
    console.error('[SW] Errore nella preservazione dati critici:', error);
  }
};

// NUOVO: Gestione preservazione dati di emergenza
const handleEmergencyDataPreservation = () => {
  console.log('[SW] Avvio preservazione dati di emergenza...');
  
  // Forza salvataggio immediato
  broadcastToClients({
    type: 'EMERGENCY_SAVE',
    reason: 'app_closing',
    urgent: true,
    immediate: true
  });
  
  // Backup reminder dopo breve delay
  setTimeout(() => {
    broadcastToClients({
      type: 'CREATE_BACKUP',
      reason: 'emergency_backup',
      urgent: true
    });
  }, DATA_CONFIG.EMERGENCY_SAVE_DELAY);
};

// NUOVO: Gestione avanzata della preservazione dati
const handleDataPreservation = async () => {
  try {
    console.log('[SW] Avvio procedura di preservazione dati...');
    
    // Step 1: Richiedi salvataggio immediato
    broadcastToClients({
      type: 'FORCE_SAVE_DATA',
      reason: 'data_preservation',
      urgent: true
    });
    
    // Step 2: Attendi e richiedi backup
    setTimeout(() => {
      broadcastToClients({
        type: 'CREATE_BACKUP',
        reason: 'data_preservation_backup',
        urgent: true
      });
    }, 1000);
    
    // Step 3: Preserva lo stato nell'IndexedDB del SW
    setTimeout(async () => {
      try {
        const preservationData = {
          timestamp: new Date().toISOString(),
          reason: 'update_preparation',
          clientsCount: appState.clientsCount
        };
        
        // Salva nei caches come fallback
        const cache = await caches.open(CACHE);
        const dataBlob = new Response(JSON.stringify(preservationData));
        await cache.put('/data-preservation-log', dataBlob);
        
        console.log('[SW] Log di preservazione salvato');
      } catch (error) {
        console.error('[SW] Errore nel salvataggio log preservazione:', error);
      }
    }, 2000);
    
    appState.dataPreservationActive = true;
    console.log('[SW] Procedura di preservazione dati completata');
    
  } catch (error) {
    console.error('[SW] Errore nella preservazione dati:', error);
  }
};

// Funzione per comunicare con tutti i client - MIGLIORATA
const broadcastToClients = async (message) => {
  try {
    const clients = await self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    });
    
    console.log(`[SW] Broadcasting a ${clients.length} client(s):`, message);
    
    if (clients.length === 0) {
      console.log('[SW] Nessun client attivo per il broadcast');
      return;
    }
    
    // Invia a tutti i client
    const promises = clients.map(client => {
      try {
        client.postMessage({
          ...message,
          timestamp: new Date().toISOString(),
          swVersion: CACHE
        });
        return Promise.resolve();
      } catch (clientError) {
        console.warn('[SW] Errore nell\'invio a client:', clientError);
        return Promise.resolve(); // Non bloccare per un singolo client
      }
    });
    
    await Promise.allSettled(promises);
    console.log('[SW] Broadcast completato');
    
  } catch (error) {
    console.error('[SW] Errore nel broadcast:', error);
  }
};

// NUOVO: Gestione dell'installazione ottimizzata con backup dei dati
self.addEventListener('install', async (event) => {
  console.log('[SW] Installing v5...');
  
  event.waitUntil(
    (async () => {
      try {
        // NUOVO: Notifica i client dell'imminente aggiornamento
        if (self.clients) {
          await broadcastToClients({
            type: 'PREPARE_FOR_UPDATE',
            message: 'Service Worker updating, backup your data',
            version: CACHE
          });
          
          // Attendi che i client abbiano tempo di salvare
          console.log('[SW] Attesa salvataggio dati client...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Apri la cache e aggiungi la pagina offline
        const cache = await caches.open(CACHE);
        console.log('[SW] Caching offline page');
        await cache.add(offlineFallbackPage);
        
        // NUOVO: Preserva dati critici durante l'aggiornamento
        try {
          await handleDataPreservation();
        } catch (preservationError) {
          console.warn('[SW] Errore nella preservazione durante install:', preservationError);
        }
        
        console.log('[SW] Installation completed, skip waiting');
        return self.skipWaiting();
      } catch (error) {
        console.error('[SW] Errore durante l\'installazione:', error);
      }
    })()
  );
});

// NUOVO: Attivazione ottimizzata con gestione dati
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v5...');
  
  event.waitUntil(
    (async () => {
      try {
        // Pulisci cache vecchie
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map((cacheName) => {
          if (cacheName !== CACHE && cacheName.startsWith('budget-app-cache-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        
        await Promise.all(deletePromises);
        
        // Prendi controllo dei client
        await self.clients.claim();
        console.log('[SW] Claimed all clients');
        
        // NUOVO: Verifica se ci sono dati preservati da ripristinare
        try {
          const cache = await caches.open(CACHE);
          const preservationLog = await cache.match('/data-preservation-log');
          
          if (preservationLog) {
            const logData = await preservationLog.json();
            console.log('[SW] Trovato log di preservazione:', logData);
            
            // Avvisa i client che i dati potrebbero essere stati preservati
            setTimeout(() => {
              broadcastToClients({
                type: 'DATA_PRESERVATION_RESTORED',
                preservationData: logData,
                message: 'Data preservation log found from previous session'
              });
            }, 2000);
          }
        } catch (preservationError) {
          console.warn('[SW] Errore nel controllo preservazione:', preservationError);
        }
        
        // Notifica ai client che l'aggiornamento è completato
        setTimeout(() => {
          broadcastToClients({
            type: 'SERVICE_WORKER_UPDATED',
            message: 'Service Worker updated successfully',
            version: CACHE
          });
        }, 1500);
        
        // NUOVO: Avvia monitoraggio periodico
        setTimeout(() => {
          startPeriodicMonitoring();
        }, 5000);
        
      } catch (error) {
        console.error('[SW] Errore durante l\'attivazione:', error);
      }
    })()
  );
});

// NUOVO: Sistema di monitoraggio periodico
const startPeriodicMonitoring = () => {
  console.log('[SW] Avvio monitoraggio periodico...');
  
  // Health check periodico
  setInterval(() => {
    broadcastToClients({
      type: 'HEALTH_CHECK',
      reason: 'periodic_health_check'
    });
  }, DATA_CONFIG.HEALTH_CHECK_INTERVAL);
  
  // Reminder di backup periodico
  setInterval(() => {
    const now = Date.now();
    if (now - appState.lastBackupRequest > DATA_CONFIG.BACKUP_REMINDER_INTERVAL) {
      broadcastToClients({
        type: 'PERIODIC_BACKUP_REMINDER',
        reason: 'periodic_backup_check'
      });
      appState.lastBackupRequest = now;
    }
  }, DATA_CONFIG.BACKUP_REMINDER_INTERVAL);
  
  // Salvataggio forzato periodico per sicurezza
  setInterval(() => {
    const now = Date.now();
    if (now - appState.lastSaveRequest > DATA_CONFIG.FORCE_SAVE_INTERVAL) {
      broadcastToClients({
        type: 'PERIODIC_SAVE_REMINDER',
        reason: 'periodic_save_check'
      });
      appState.lastSaveRequest = now;
    }
  }, DATA_CONFIG.FORCE_SAVE_INTERVAL);
  
  console.log('[SW] Monitoraggio periodico configurato');
};

// MIGLIORATO: Intercetta le richieste con gestione avanzata cache
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
            // Clone prima di cachare
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
          return offlinePage || new Response('App offline - Ricarica quando sei connesso', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
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
          return new Response('Risorsa non disponibile offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
      })()
    );
  }
});

// NUOVO: Gestione della sincronizzazione in background migliorata
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'budget-data-sync') {
    event.waitUntil(
      broadcastToClients({
        type: 'SYNC_DATA',
        reason: 'background_sync',
        tag: event.tag
      })
    );
  }
  
  if (event.tag === 'budget-backup-sync') {
    event.waitUntil(
      broadcastToClients({
        type: 'CREATE_BACKUP',
        reason: 'background_backup_sync',
        tag: event.tag
      })
    );
  }
  
  if (event.tag === 'emergency-save') {
    event.waitUntil(
      broadcastToClients({
        type: 'EMERGENCY_SAVE',
        reason: 'emergency_background_sync',
        tag: event.tag,
        urgent: true
      })
    );
  }
});

// NUOVO: Gestione eventi push per sincronizzazione avanzata
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  if (event.data) {
    try {
      const data = event.data.json();
      
      if (data.type === 'data-sync-reminder') {
        event.waitUntil(
          self.registration.showNotification('Budget App - Sincronizzazione', {
            body: 'Sincronizza i tuoi dati per non perderli',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'data-sync',
            requireInteraction: true,
            actions: [
              {
                action: 'sync-now',
                title: '💾 Sincronizza ora'
              },
              {
                action: 'backup-now',
                title: '🔒 Crea backup'
              }
            ],
            data: {
              url: '/',
              action: 'sync'
            }
          })
        );
      }
      
      if (data.type === 'critical-data-warning') {
        event.waitUntil(
          self.registration.showNotification('Budget App - Attenzione', {
            body: 'Potrebbero esserci problemi con i tuoi dati. Apri l\'app per verificare.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'critical-warning',
            requireInteraction: true,
            actions: [
              {
                action: 'open-app',
                title: '🔍 Verifica ora'  
              }
            ],
            data: {
              url: '/',
              action: 'verify'
            }
          })
        );
      }
    } catch (parseError) {
      console.error('[SW] Errore nel parsing push data:', parseError);
    }
  }
});

// MIGLIORATO: Gestione click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  console.log('[SW] Notification clicked:', action);
  
  event.waitUntil(
    (async () => {
      // Apri o focalizza l'app
      const clientList = await clients.matchAll({ type: 'window' });
      let client = null;
      
      // Cerca un client esistente
      for (const c of clientList) {
        if (c.url === self.registration.scope || c.url === notificationData.url) {
          client = c;
          break;
        }
      }
      
      // Se non c'è un client, aprilo
      if (!client) {
        client = await clients.openWindow(notificationData.url || '/');
      } else {
        // Altrimenti focalizzalo
        await client.focus();
      }
      
      // Invia messaggio basato sull'azione
      if (client) {
        switch (action) {
          case 'sync-now':
          case 'sync':
            client.postMessage({
              type: 'FORCE_SYNC',
              reason: 'notification_sync',
              urgent: true
            });
            break;
            
          case 'backup-now':
          case 'backup':
            client.postMessage({
              type: 'CREATE_BACKUP',
              reason: 'notification_backup',
              urgent: true
            });
            break;
            
          case 'open-app':
          case 'verify':
            client.postMessage({
              type: 'VERIFY_DATA_INTEGRITY',
              reason: 'notification_verify',
              urgent: true
            });
            break;
            
          default:
            // Click sulla notifica senza azione specifica
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              reason: 'general_notification',
              notificationTag: event.notification.tag
            });
        }
      }
    })()
  );
});

// NUOVO: Gestione eventi di controllo dei client
self.addEventListener('clientsready', () => {
  console.log('[SW] Clients ready event received');
  
  setTimeout(() => {
    broadcastToClients({
      type: 'SERVICE_WORKER_READY',
      message: 'Service Worker fully initialized',
      version: CACHE
    });
  }, 1000);
});

// NUOVO: Gestione controllo periodico dello stato dell'app
let appHealthTimer = null;

const performAdvancedHealthCheck = async () => {
  try {
    console.log('[SW] Performing advanced health check...');
    
    const clients = await self.clients.matchAll({ type: 'window' });
    appState.clientsCount = clients.length;
    
    if (clients.length > 0) {
      // App è attiva, controlla lo stato dei dati
      broadcastToClients({
        type: 'ADVANCED_HEALTH_CHECK',
        reason: 'periodic_advanced_check',
        clientsCount: clients.length,
        swUptime: Date.now() - (appState.startTime || Date.now())
      });
      
      // Se non abbiamo ricevuto richieste di salvataggio di recente, sollecita
      const timeSinceLastSave = Date.now() - appState.lastSaveRequest;
      if (timeSinceLastSave > DATA_CONFIG.FORCE_SAVE_INTERVAL * 2) {
        console.log('[SW] Nessun salvataggio recente, sollecito backup');
        broadcastToClients({
          type: 'PERIODIC_SAVE_REMINDER',
          reason: 'no_recent_saves_detected',
          timeSinceLastSave: timeSinceLastSave
        });
      }
    } else {
      console.log('[SW] Nessun client attivo');
    }
  } catch (error) {
    console.error('[SW] Advanced health check failed:', error);
  }
};

// Avvia health check avanzato
const startAdvancedHealthCheck = () => {
  if (appHealthTimer) {
    clearInterval(appHealthTimer);
  }
  
  appHealthTimer = setInterval(() => {
    performAdvancedHealthCheck();
  }, DATA_CONFIG.HEALTH_CHECK_INTERVAL);
  
  console.log('[SW] Advanced health check started');
};

// NUOVO: Gestione dell'evento beforeunload attraverso i client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'APP_WILL_CLOSE') {
    console.log('[SW] App will close, ensuring final data preservation');
    
    // Procedura di preservazione finale
    handleEmergencyDataPreservation();
    
    // Programma un sync di emergenza
    if (self.registration.sync) {
      self.registration.sync.register('emergency-save')
        .then(() => console.log('[SW] Emergency sync registered'))
        .catch(err => console.warn('[SW] Emergency sync registration failed:', err));
    }
  }
});

// Configurazione avanzata con Workbox
if (workbox) {
  console.log('[SW] Workbox available, configuring advanced features...');
  
  // Abilita navigation preload se supportato
  if (workbox.navigationPreload?.isSupported()) {
    workbox.navigationPreload.enable();
    console.log('[SW] Navigation preload enabled');
  }
  
  // Cache delle API calls con strategia NetworkFirst ottimizzata
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache-v5',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 30, // 30 minuti
        }),
        {
          cacheWillUpdate: async ({ response }) => {
            return response.status === 200 ? response : null;
          },
        }
      ],
    })
  );
  
  // Precache degli asset statici
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  console.log('[SW] Workbox configuration completed');
}

// Inizializzazione finale
appState.startTime = Date.now();
console.log('[SW] Service Worker v5 loaded with enhanced data persistence and advanced monitoring');

// Avvia il monitoraggio avanzato dopo un breve ritardo
setTimeout(() => {
  startAdvancedHealthCheck();
}, 10000);

// NUOVO: Gestione graceful shutdown
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('[SW] Before install prompt event');
  
  // Preserva i dati prima dell'installazione
  handleDataPreservation();
});

// Cleanup periodico delle cache obsolete
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('budget-app-cache-') && name !== CACHE
    );
    
    if (oldCaches.length > 0) {
      console.log(`[SW] Cleaning up ${oldCaches.length} old caches`);
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
  } catch (error) {
    console.warn('[SW] Cache cleanup error:', error);
  }
}, 3600000); // Ogni ora

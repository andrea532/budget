// Service Worker che funziona per PWA
const CACHE_NAME = 'budget-app-v1';

// Lista delle risorse da cacheare (solo quelle che esistono davvero)
const urlsToCache = [
  '/',
  '/index.html',
  // Non aggiungiamo altre risorse per evitare errori 404
];

// Installazione
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache addAll failed:', error);
        // Non bloccare l'installazione anche se il cache fallisce
      })
  );
  
  // Forza l'attivazione immediata
  self.skipWaiting();
});

// Attivazione
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendi il controllo immediatamente
  self.clients.claim();
});

// Gestione delle richieste
self.addEventListener('fetch', (event) => {
  // Solo per richieste GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Solo per richieste di navigazione (caricare la pagina)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se la rete funziona, restituisci la risposta
          return response;
        })
        .catch(() => {
          // Se la rete non funziona, restituisci la pagina cachata
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se non c'è neanche la cache, restituisci una pagina di base
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Budget App - Offline</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      background: #f5f5f5; 
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      background: white; 
                      padding: 30px; 
                      border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                    }
                    button { 
                      background: #4C6FFF; 
                      color: white; 
                      border: none; 
                      padding: 10px 20px; 
                      border-radius: 5px; 
                      cursor: pointer; 
                      margin-top: 20px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📱 Budget App</h1>
                    <p>Sei offline. Controlla la connessione internet.</p>
                    <button onclick="window.location.reload()">Ricarica</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        })
    );
  }
  
  // Per tutte le altre richieste, prova la rete prima poi la cache
  else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se la risposta è ok, mettila in cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se la rete fallisce, prova la cache
          return caches.match(event.request);
        })
    );
  }
});

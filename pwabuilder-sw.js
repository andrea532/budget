// Service Worker completo per funzionalità offline PWA
const CACHE_NAME = 'budget-app-offline-v1';
const DATA_CACHE_NAME = 'budget-app-data-v1';

// Risorse essenziali da cacheare per funzionamento offline
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  // I file JS e CSS vengono generati con hash, quindi li intercettiamo dinamicamente
];

// Installazione - cacha le risorse essenziali
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache delle risorse statiche
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES).catch((error) => {
          console.warn('[SW] Some resources failed to cache:', error);
          // Non bloccare l'installazione se alcune risorse falliscono
        });
      }),
      // Cache separata per dati dinamici
      caches.open(DATA_CACHE_NAME)
    ])
  );
  
  // Attiva immediatamente il nuovo Service Worker
  self.skipWaiting();
});

// Attivazione - pulisce le cache vecchie
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendi controllo di tutte le finestre immediatamente
  self.clients.claim();
});

// Gestione delle richieste - strategia completa per offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo per richieste GET
  if (request.method !== 'GET') {
    return;
  }

  // STRATEGIA 1: Navigazione (caricare pagine HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      handleNavigationRequest(request)
    );
    return;
  }
  
  // STRATEGIA 2: File JavaScript e CSS (cache-first)
  if (request.url.includes('.js') || request.url.includes('.css')) {
    event.respondWith(
      handleStaticAssets(request)
    );
    return;
  }
  
  // STRATEGIA 3: Immagini e icone (cache-first)
  if (request.destination === 'image' || request.url.includes('/icons/')) {
    event.respondWith(
      handleImages(request)
    );
    return;
  }
  
  // STRATEGIA 4: Manifest e altri file (cache-first)
  if (request.url.includes('manifest.json') || request.url.includes('.png') || request.url.includes('.ico')) {
    event.respondWith(
      handleManifestAndIcons(request)
    );
    return;
  }
  
  // STRATEGIA 5: Tutte le altre richieste (network-first con fallback)
  event.respondWith(
    handleOtherRequests(request)
  );
});

// Gestisce le richieste di navigazione
async function handleNavigationRequest(request) {
  try {
    // Prova prima la rete
    const networkResponse = await fetch(request);
    
    // Se la rete funziona, cacha la risposta e restituiscila
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving from cache');
  }
  
  // Se la rete fallisce, servi dalla cache
  const cachedResponse = await caches.match('/');
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Ultima risorsa: pagina offline generata dinamicamente
  return new Response(generateOfflinePage(), {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Gestisce JavaScript e CSS (cache-first per performance)
async function handleStaticAssets(request) {
  try {
    // Controlla prima la cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving JS/CSS from cache:', request.url);
      return cachedResponse;
    }
    
    // Se non in cache, scarica dalla rete
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cacha per il futuro
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new JS/CSS:', request.url);
      return networkResponse;
    }
  } catch (error) {
    console.error('[SW] Failed to load static asset:', request.url, error);
  }
  
  // Se tutto fallisce, restituisci una risposta vuota per non rompere l'app
  return new Response('/* Offline fallback */', {
    headers: { 'Content-Type': request.url.includes('.js') ? 'application/javascript' : 'text/css' }
  });
}

// Gestisce le immagini
async function handleImages(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Image failed to load:', request.url);
  }
  
  // Fallback: immagine placeholder SVG
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect width="192" height="192" fill="#4C6FFF"/><text x="96" y="96" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="16">Budget App</text></svg>',
    { headers: { 'Content-Type': 'image/svg+xml' } }
  );
}

// Gestisce manifest e icone
async function handleManifestAndIcons(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Manifest/Icon failed:', request.url);
  }
  
  // Fallback per manifest
  if (request.url.includes('manifest.json')) {
    const fallbackManifest = {
      name: 'Budget App',
      short_name: 'Budget',
      display: 'standalone',
      start_url: '/',
      theme_color: '#4C6FFF',
      background_color: '#ffffff',
      icons: []
    };
    return new Response(JSON.stringify(fallbackManifest), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Fallback per icone
  return handleImages(request);
}

// Gestisce altre richieste
async function handleOtherRequests(request) {
  try {
    // Network-first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Opzionalmente cacha la risposta
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
  }
  
  // Fallback alla cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Ultima risorsa: risposta generica
  return new Response('Offline', { status: 503 });
}

// Genera una pagina offline completa
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Budget App - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #4C6FFF 0%, #5A85FF 100%);
          color: white;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container { 
          max-width: 400px; 
          padding: 40px 20px;
        }
        .icon { 
          font-size: 64px; 
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        h1 { 
          font-size: 28px; 
          margin-bottom: 16px;
          font-weight: 700;
        }
        p { 
          font-size: 16px; 
          margin-bottom: 24px;
          opacity: 0.9;
          line-height: 1.5;
        }
        button { 
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .status {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>Budget App</h1>
        <p>L'app è pronta per funzionare offline!<br>
        Tutti i tuoi dati sono salvati localmente.</p>
        <button onclick="window.location.reload()">
          🔄 Ricarica App
        </button>
      </div>
      <div class="status">
        ✅ Modalità Offline Attiva
      </div>
      
      <script>
        // Ricarica automaticamente quando torna la connessione
        window.addEventListener('online', () => {
          window.location.reload();
        });
        
        // Mostra stato connessione
        function updateConnectionStatus() {
          const status = document.querySelector('.status');
          if (navigator.onLine) {
            status.textContent = '🌐 Connesso';
            status.style.color = '#4ade80';
          } else {
            status.textContent = '📱 Offline';
            status.style.color = '#f87171';
          }
        }
        
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        updateConnectionStatus();
      </script>
    </body>
    </html>
  `;
}

// Gestione messaggi (per comunicazione con l'app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

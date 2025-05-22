// Service Worker semplificato - Versione funzionante
const CACHE = "budget-app-v1";
const offlineFallbackPage = "offline.html";

// Installazione
self.addEventListener("install", function (event) {
  console.log("[SW] Install");
  
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[SW] Caching offline page");
      return cache.add(offlineFallbackPage);
    })
  );
});

// Attivazione
self.addEventListener("activate", function (event) {
  console.log("[SW] Activate");
  
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestione delle richieste
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async function () {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) {
            return preloadResp;
          }

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          console.log("[SW] Fetch failed, showing offline page");
          
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  }
});
    if (oldCaches.length > 0) {
      console.log(`[SW] Cleaning up ${oldCaches.length} old caches`);
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
  } catch (error) {
    console.warn('[SW] Cache cleanup error:', error);
  }
}, 3600000); // Ogni ora

// Service Worker ultra semplice - Solo per funzionalità offline di base
const CACHE = "budget-app-v1";

// Installazione - non crea cache per evitare errori 404
self.addEventListener("install", function (event) {
  console.log("[SW] Install");
  self.skipWaiting();
});

// Attivazione
self.addEventListener("activate", function (event) {
  console.log("[SW] Activate");
  self.clients.claim();
});

// Gestione fetch - molto semplice
self.addEventListener("fetch", function (event) {
  // Non intercettare le richieste per evitare problemi
  return;
});

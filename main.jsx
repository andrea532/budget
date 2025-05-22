import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB, isPWA } from './services/db';

// Registra il service worker prima di tutto
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwabuilder-sw.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration);
      })
      .catch(error => {
        console.error('Errore durante la registrazione del Service Worker:', error);
      });
  });
}

// Funzione per inizializzare l'app
const initApp = async () => {
  console.log("Inizializzazione app...");
  
  // Verifica se siamo in modalità PWA
  const isPwaMode = isPWA();
  console.log(`Applicazione in modalità PWA: ${isPwaMode}`);
  
  if (isPwaMode) {
    // Solo per PWA su iOS, try to add something to localStorage as a workaround
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("Applicando workaround per iOS PWA");
      localStorage.setItem('pwa-init', Date.now().toString());
    }
    
    // Gestisci eventi di chiusura app per PWA
    window.addEventListener('beforeunload', (event) => {
      console.log("Applicazione in chiusura, sincronizzazione dati...");
      // Rimuovi preventDefault per permettere la chiusura normale
      // event.preventDefault();
      // event.returnValue = '';
    });
  }
  
  // Inizializza il database con un ritardo per dispositivi iOS
  try {
    // Piccolo ritardo per iOS
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Inizializza DB
    await initDB();
    console.log("Database inizializzato con successo");
    
    // Verifica accesso su iOS
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Su iOS, forza un doppio init per sicurezza
      await new Promise(resolve => setTimeout(resolve, 500));
      await initDB(); // Secondo tentativo
    }
  } catch (err) {
    console.error("Errore durante inizializzazione DB:", err);
  }
  
  // IMPORTANTE: Renderizza l'app React dopo l'inizializzazione
  console.log("Rendering dell'app React...");
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App React renderizzata con successo");
};

// Avvia inizializzazione app e rendering
initApp().then(() => {
  console.log("Inizializzazione e rendering completati");
}).catch((error) => {
  console.error("Errore durante l'inizializzazione:", error);
  
  // Fallback: renderizza l'app anche in caso di errore del database
  console.log("Rendering fallback dell'app...");
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

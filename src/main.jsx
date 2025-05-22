import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB } from './services/db';

// Registra il service worker (semplificato)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwabuilder-sw.js')
      .then(registration => {
        console.log('Service Worker registrato:', registration);
      })
      .catch(error => {
        console.error('Errore Service Worker:', error);
      });
  });
}

// Inizializzazione semplice dell'app
const initApp = async () => {
  console.log("Inizializzazione app...");
  
  try {
    // Inizializza il database
    await initDB();
    console.log("Database inizializzato");
  } catch (err) {
    console.error("Errore inizializzazione database:", err);
  }
  
  // Renderizza l'app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("App renderizzata");
};

// Avvia l'app
initApp().catch((error) => {
  console.error("Errore durante l'inizializzazione:", error);
  
  // Fallback: renderizza comunque l'app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

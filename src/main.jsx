import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB } from './services/db';

// Rimuovo completamente il service worker per evitare errori 404
console.log("App Budget - Versione semplificata senza Service Worker");

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

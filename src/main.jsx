import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB, isPWA } from './services/db';

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
      event.preventDefault();
      event.returnValue = '';
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
};

// Avvia inizializzazione app
initApp().then(() => {
  console.log("Inizializzazione completata");
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

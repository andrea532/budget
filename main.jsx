import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB, isPWA } from './services/db';

// Variabile globale per salvare i dati dall'AppContext
let globalSaveFunction = null;

// Registra la funzione di salvataggio globale (chiamata dall'AppContext)
window.registerGlobalSaveFunction = (saveFunction) => {
  globalSaveFunction = saveFunction;
  console.log("Funzione di salvataggio globale registrata");
};

// Funzione per forzare il salvataggio dei dati
const forceSaveData = () => {
  if (globalSaveFunction) {
    console.log("Forzando salvataggio dati...");
    globalSaveFunction();
  } else {
    console.warn("Funzione di salvataggio non disponibile");
  }
};

// Registra il service worker con gestione messaggi migliorata
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwabuilder-sw.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration);
        
        // Listener per messaggi dal service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Messaggio ricevuto dal Service Worker:', event.data);
          
          switch (event.data.type) {
            case 'FORCE_SAVE_DATA':
            case 'APP_BACKGROUNDED':
            case 'PERIODIC_SAVE_REMINDER':
            case 'SYNC_DATA':
            case 'FORCE_SYNC':
              forceSaveData();
              break;
            default:
              console.log('Messaggio Service Worker non gestito:', event.data.type);
          }
        });
      })
      .catch(error => {
        console.error('Errore durante la registrazione del Service Worker:', error);
      });
  });
}

// Gestione eventi di chiusura/background per PWA
if (isPWA()) {
  // Salva i dati quando l'app va in background (PWA)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('PWA: App going to background, saving data...');
      forceSaveData();
    }
  });
  
  // Salva i dati prima della chiusura
  window.addEventListener('beforeunload', (event) => {
    console.log('PWA: App closing, forcing data save...');
    forceSaveData();
    
    // Su PWA non mostrare dialogo di conferma, ma forza il salvataggio
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_DATA',
        message: 'App closing'
      });
    }
  });
  
  // Gestione eventi specifici PWA
  window.addEventListener('pagehide', () => {
    console.log('PWA: Page hide event, saving data...');
    forceSaveData();
  });
  
  // Per iOS PWA
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Salva ogni volta che l'utente tocca lo schermo (per iOS)
    let lastSave = 0;
    document.addEventListener('touchend', () => {
      const now = Date.now();
      if (now - lastSave > 30000) { // Ogni 30 secondi max
        forceSaveData();
        lastSave = now;
      }
    });
  }
}

// Funzione per inizializzare l'app
const initApp = async () => {
  console.log("Inizializzazione app...");
  
  // Verifica se siamo in modalità PWA
  const isPwaMode = isPWA();
  console.log(`Applicazione in modalità PWA: ${isPwaMode}`);
  
  if (isPwaMode) {
    // Solo per PWA su iOS, applica workaround
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("Applicando workaround per iOS PWA");
      localStorage.setItem('pwa-init', Date.now().toString());
      
      // Per iOS, forza il focus per mantenere l'app attiva
      window.addEventListener('focus', () => {
        console.log("iOS PWA: App focused, checking data consistency");
        // Verifica la consistenza dei dati quando l'app torna in focus
        setTimeout(() => {
          if (globalSaveFunction) {
            globalSaveFunction();
          }
        }, 1000);
      });
    }
    
    // Gestione eventi PWA generici
    window.addEventListener('appinstalled', () => {
      console.log('PWA installata con successo');
      forceSaveData();
    });
  }
  
  // Inizializza il database con gestione errori migliorata
  try {
    // Piccolo ritardo per iOS
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Inizializza DB
    await initDB();
    console.log("Database inizializzato con successo");
    
    // Verifica accesso su iOS con doppio init
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      await new Promise(resolve => setTimeout(resolve, 800));
      await initDB(); // Secondo tentativo per iOS
      console.log("Secondo init DB completato per iOS");
    }
  } catch (err) {
    console.error("Errore durante inizializzazione DB:", err);
    
    // Fallback: prova a re inizializzare dopo un ritardo
    setTimeout(async () => {
      try {
        await initDB();
        console.log("Inizializzazione DB riuscita al secondo tentativo");
      } catch (retryErr) {
        console.error("Anche il secondo tentativo di init DB è fallito:", retryErr);
      }
    }, 2000);
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

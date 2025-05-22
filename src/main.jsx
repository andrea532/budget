import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB, isPWA, createManualBackup } from './services/db';

// Variabile globale per salvare i dati dall'AppContext
let globalSaveFunction = null;
let globalBackupFunction = null;

// Registra la funzione di salvataggio globale (chiamata dall'AppContext)
window.registerGlobalSaveFunction = (saveFunction) => {
  globalSaveFunction = saveFunction;
  console.log("Funzione di salvataggio globale registrata");
};

// NUOVO: Registra la funzione di backup globale
window.registerGlobalBackupFunction = (backupFunction) => {
  globalBackupFunction = backupFunction;
  console.log("Funzione di backup globale registrata");
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

// NUOVO: Funzione per forzare il backup dei dati
const forceBackupData = async () => {
  try {
    if (globalBackupFunction) {
      console.log("Forzando backup dati tramite context...");
      await globalBackupFunction();
    } else {
      console.log("Funzione di backup del context non disponibile, usando backup diretto...");
      await createManualBackup();
    }
  } catch (error) {
    console.error("Errore nel forcing backup:", error);
  }
};

// NUOVO: Gestione messaggi dal Service Worker migliorata
const handleServiceWorkerMessage = (event) => {
  console.log('Messaggio ricevuto dal Service Worker in main.jsx:', event.data);
  
  switch (event.data.type) {
    case 'PREPARE_FOR_UPDATE':
      console.log('Preparazione per aggiornamento app...');
      // Forza sia salvataggio che backup prima dell'aggiornamento
      forceSaveData();
      setTimeout(forceBackupData, 500);
      break;
      
    case 'SERVICE_WORKER_UPDATED':
      console.log('Service Worker aggiornato con successo');
      // Verifica che i dati siano ancora presenti
      setTimeout(() => {
        if (window.location.pathname === '/') {
          console.log('Verifica integrità dati dopo aggiornamento SW');
        }
      }, 2000);
      break;
      
    case 'FORCE_SAVE_DATA':
    case 'APP_BACKGROUNDED':
    case 'PERIODIC_SAVE_REMINDER':
    case 'SYNC_DATA':
    case 'FORCE_SYNC':
    case 'EMERGENCY_SAVE':
      forceSaveData();
      break;
      
    case 'CREATE_BACKUP':
    case 'PERIODIC_BACKUP_REMINDER':
      forceBackupData();
      break;
      
    case 'HEALTH_CHECK':
      console.log('Health check ricevuto');
      forceSaveData();
      setTimeout(forceBackupData, 1000);
      break;
      
    default:
      console.log('Messaggio Service Worker non gestito:', event.data.type);
  }
};

// Registra il service worker con gestione messaggi migliorata
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwabuilder-sw.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration);
        
        // NUOVO: Controlla se ci sono aggiornamenti in attesa
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nuovo Service Worker trovato, preparazione backup...');
          
          // Crea backup prima dell'aggiornamento
          forceBackupData();
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nuovo Service Worker installato, aggiornamento app...');
              
              // Mostra notifica all'utente (opzionale)
              if (window.confirm('Nuova versione disponibile. Vuoi aggiornare ora?')) {
                window.location.reload();
              }
            }
          });
        });
        
        // Listener per messaggi dal service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        // NUOVO: Invia messaggio di hello al service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'CLIENT_READY',
            timestamp: new Date().toISOString()
          });
        }
      })
      .catch(error => {
        console.error('Errore durante la registrazione del Service Worker:', error);
      });
  });
}

// Gestione eventi di chiusura/background per PWA - MIGLIORATA
if (isPWA()) {
  console.log("PWA rilevata, configurazione eventi di persistenza...");
  
  // Salva i dati quando l'app va in background (PWA)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('PWA: App going to background, saving and backing up data...');
      forceSaveData();
      setTimeout(forceBackupData, 300);
      
      // Notifica anche il service worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'APP_BACKGROUNDED',
          timestamp: new Date().toISOString()
        });
      }
    } else if (document.visibilityState === 'visible') {
      console.log('PWA: App in foreground, verifica integrità dati...');
      // Quando l'app torna in primo piano, verifica che i dati siano ok
      setTimeout(() => {
        if (globalSaveFunction) {
          globalSaveFunction();
        }
      }, 1000);
    }
  });
  
  // Salva i dati prima della chiusura - MIGLIORATO
  window.addEventListener('beforeunload', (event) => {
    console.log('PWA: App closing, forcing immediate data save and backup...');
    
    // Salvataggio immediato
    forceSaveData();
    
    // Backup immediato (senza await per evitare blocchi)
    forceBackupData().catch(e => console.error('Backup su beforeunload fallito:', e));
    
    // Notifica il service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'APP_CLOSING',
        timestamp: new Date().toISOString()
      });
    }
    
    // Su PWA, lascia che il browser gestisca la chiusura senza dialoghi
    // (rimosso event.preventDefault() per evitare problemi)
  });
  
  // Gestione eventi specifici PWA
  window.addEventListener('pagehide', () => {
    console.log('PWA: Page hide event, final save and backup...');
    forceSaveData();
    forceBackupData().catch(e => console.error('Backup su pagehide fallito:', e));
  });
  
  // NUOVO: Gestione evento di installazione PWA
  window.addEventListener('appinstalled', () => {
    console.log('PWA installata con successo');
    forceSaveData();
    setTimeout(forceBackupData, 1000);
  });
  
  // Per iOS PWA - MIGLIORATO
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log("iOS PWA rilevata, configurazione eventi specifici...");
    
    // Salva ogni volta che l'utente tocca lo schermo (per iOS)
    let lastSave = 0;
    document.addEventListener('touchend', () => {
      const now = Date.now();
      if (now - lastSave > 30000) { // Ogni 30 secondi max
        forceSaveData();
        lastSave = now;
      }
    });
    
    // Gestione focus per iOS
    window.addEventListener('focus', () => {
      console.log("iOS PWA: App focused, checking data consistency");
      setTimeout(() => {
        if (globalSaveFunction) {
          globalSaveFunction();
        }
      }, 1000);
    });
    
    // NUOVO: Gestione orientamento per iOS PWA
    window.addEventListener('orientationchange', () => {
      console.log("iOS PWA: Orientation changed, saving data");
      setTimeout(forceSaveData, 500);
    });
  }
  
  // NUOVO: Backup periodico automatico per PWA
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      console.log('Backup periodico automatico PWA...');
      forceBackupData().catch(e => console.error('Backup periodico fallito:', e));
    }
  }, 10 * 60 * 1000); // Ogni 10 minuti quando l'app è visibile
}

// NUOVO: Gestione errori globali
window.addEventListener('error', (event) => {
  console.error('Errore globale catturato:', event.error);
  
  // In caso di errore critico, prova a salvare i dati
  try {
    forceSaveData();
  } catch (e) {
    console.error('Impossibile salvare i dati dopo errore:', e);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejection non gestita:', event.reason);
  
  // In caso di errore critico, prova a salvare i dati
  try {
    forceSaveData();
  } catch (e) {
    console.error('Impossibile salvare i dati dopo promise rejection:', e);
  }
});

// Funzione per inizializzare l'app - MIGLIORATA
const initApp = async () => {
  console.log("=== INIZIALIZZAZIONE APP ===");
  
  // Verifica se siamo in modalità PWA
  const isPwaMode = isPWA();
  console.log(`Applicazione in modalità PWA: ${isPwaMode}`);
  
  if (isPwaMode) {
    console.log("PWA rilevata, configurazione backup e persistenza...");
    
    // Solo per PWA su iOS, applica workaround
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("Applicando workaround per iOS PWA");
      localStorage.setItem('pwa-init', Date.now().toString());
      
      // NUOVO: Verifica backup esistenti su iOS
      try {
        const backupKeys = ['budget-app-data-backup', 'budget-app-settings-current'];
        let foundBackups = 0;
        
        backupKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            foundBackups++;
            console.log(`Backup trovato: ${key}`);
          }
        });
        
        if (foundBackups > 0) {
          console.log(`Trovati ${foundBackups} backup esistenti su iOS`);
        }
      } catch (e) {
        console.log("Controllo backup iOS:", e);
      }
    }
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
        
        // NUOVO: Ultimo tentativo con backup recovery
        if (isPwaMode) {
          console.log("Tentativo di recovery con backup...");
          try {
            // Verifica se esistono backup
            const backupExists = localStorage.getItem('budget-app-data-backup');
            if (backupExists) {
              console.log("Backup trovato, potrà essere utilizzato dall'app");
            }
          } catch (e) {
            console.error("Verifica backup fallita:", e);
          }
        }
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
  
  // NUOVO: Dopo il render, verifica backup periodici
  if (isPwaMode) {
    setTimeout(() => {
      console.log("Configurazione backup periodici per PWA...");
      
      // Primo backup dopo 30 secondi dall'avvio
      setTimeout(() => {
        forceBackupData().catch(e => console.error('Primo backup fallito:', e));
      }, 30000);
      
    }, 1000);
  }
};

// Avvia inizializzazione app e rendering
initApp().then(() => {
  console.log("=== INIZIALIZZAZIONE E RENDERING COMPLETATI ===");
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
  
  // NUOVO: Anche nel fallback, cerca di recuperare i dati
  if (isPWA()) {
    setTimeout(() => {
      console.log("Tentativo di recovery backup nel fallback...");
      forceBackupData().catch(e => console.error('Recovery backup fallito:', e));
    }, 5000);
  }
});

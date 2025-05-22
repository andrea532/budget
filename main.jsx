import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB, isPWA, createManualBackup } from './services/db';

// Variabili globali per salvare i dati dall'AppContext
let globalSaveFunction = null;
let globalBackupFunction = null;
let appInitialized = false;

// Registra la funzione di salvataggio globale (chiamata dall'AppContext)
window.registerGlobalSaveFunction = (saveFunction) => {
  globalSaveFunction = saveFunction;
  console.log("Funzione di salvataggio globale registrata");
  
  // Se l'app è già inizializzata e siamo in PWA, fai un salvataggio di verifica
  if (appInitialized && isPWA()) {
    setTimeout(() => {
      console.log("PWA: Salvataggio di verifica dopo registrazione funzione");
      forceSaveData();
    }, 1000);
  }
};

// Registra la funzione di backup globale
window.registerGlobalBackupFunction = (backupFunction) => {
  globalBackupFunction = backupFunction;
  console.log("Funzione di backup globale registrata");
};

// Funzione per forzare il salvataggio dei dati
const forceSaveData = () => {
  if (globalSaveFunction) {
    console.log("Forzando salvataggio dati...");
    try {
      globalSaveFunction();
      console.log("Salvataggio forzato completato");
    } catch (error) {
      console.error("Errore nel salvataggio forzato:", error);
    }
  } else {
    console.warn("Funzione di salvataggio non disponibile");
  }
};

// Funzione per forzare il backup dei dati
const forceBackupData = async () => {
  try {
    if (globalBackupFunction) {
      console.log("Forzando backup dati tramite context...");
      await globalBackupFunction();
    } else {
      console.log("Funzione di backup del context non disponibile, usando backup diretto...");
      await createManualBackup();
    }
    console.log("Backup forzato completato");
  } catch (error) {
    console.error("Errore nel forcing backup:", error);
  }
};

// NUOVO: Funzione per salvare con backup combinato
const forceSaveAndBackup = async () => {
  console.log("Esecuzione salvataggio e backup combinati...");
  
  // Prima il salvataggio
  forceSaveData();
  
  // Poi il backup dopo un breve ritardo
  setTimeout(async () => {
    await forceBackupData();
  }, 500);
};

// Gestione messaggi dal Service Worker migliorata
const handleServiceWorkerMessage = (event) => {
  console.log('Messaggio ricevuto dal Service Worker in main.jsx:', event.data);
  
  switch (event.data.type) {
    case 'PREPARE_FOR_UPDATE':
      console.log('Preparazione per aggiornamento app...');
      // Forza sia salvataggio che backup prima dell'aggiornamento
      forceSaveAndBackup();
      break;
      
    case 'SERVICE_WORKER_UPDATED':
      console.log('Service Worker aggiornato con successo');
      // Verifica che i dati siano ancora presenti dopo l'aggiornamento
      setTimeout(() => {
        if (globalSaveFunction && appInitialized) {
          console.log('Verifica integrità dati dopo aggiornamento SW');
          forceSaveData();
        }
      }, 2000);
      break;
      
    case 'FORCE_SAVE_DATA':
    case 'APP_BACKGROUNDED':
    case 'EMERGENCY_SAVE':
      console.log('Salvataggio di emergenza richiesto');
      forceSaveData();
      break;
      
    case 'PERIODIC_SAVE_REMINDER':
    case 'SYNC_DATA':
    case 'FORCE_SYNC':
      console.log('Sincronizzazione dati richiesta');
      forceSaveAndBackup();
      break;
      
    case 'CREATE_BACKUP':
    case 'PERIODIC_BACKUP_REMINDER':
      console.log('Backup richiesto');
      forceBackupData();
      break;
      
    case 'HEALTH_CHECK':
      console.log('Health check ricevuto');
      if (appInitialized) {
        forceSaveAndBackup();
      }
      break;
      
    default:
      console.log('Messaggio Service Worker non gestito:', event.data.type);
  }
};

// Registra il service worker con gestione messaggi ottimizzata
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwabuilder-sw.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration);
        
        // Controlla se ci sono aggiornamenti in attesa
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nuovo Service Worker trovato, preparazione backup...');
          
          // Crea backup prima dell'aggiornamento
          if (appInitialized) {
            forceSaveAndBackup();
          }
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nuovo Service Worker installato, aggiornamento app...');
              
              // PWA: Salvataggio di sicurezza prima dell'aggiornamento
              if (isPWA() && appInitialized) {
                forceSaveAndBackup();
                
                setTimeout(() => {
                  if (window.confirm('Nuova versione disponibile. Vuoi aggiornare ora?')) {
                    window.location.reload();
                  }
                }, 1000);
              } else {
                // Per non-PWA, aggiornamento diretto
                if (window.confirm('Nuova versione disponibile. Vuoi aggiornare ora?')) {
                  window.location.reload();
                }
              }
            }
          });
        });
        
        // Listener per messaggi dal service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        // Invia messaggio di hello al service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'CLIENT_READY',
            timestamp: new Date().toISOString(),
            isPWA: isPWA()
          });
        }
      })
      .catch(error => {
        console.error('Errore durante la registrazione del Service Worker:', error);
      });
  });
}

// CORREZIONE: Gestione eventi di chiusura/background per PWA migliorata
if (isPWA()) {
  console.log("PWA rilevata, configurazione eventi di persistenza avanzata...");
  
  // Contatore per evitare salvataggi eccessivi
  let lastSaveTimestamp = 0;
  let saveInProgress = false;
  
  const throttledSave = () => {
    const now = Date.now();
    if (saveInProgress || (now - lastSaveTimestamp) < 1000) {
      return; // Skip se troppo recente o già in corso
    }
    
    saveInProgress = true;
    lastSaveTimestamp = now;
    
    console.log('PWA: Esecuzione salvataggio throttled...');
    forceSaveData();
    
    setTimeout(() => {
      saveInProgress = false;
    }, 2000);
  };
  
  // Salva i dati quando l'app va in background (PWA)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('PWA: App going to background, saving and backing up data...');
      
      if (appInitialized) {
        // Salvataggio immediato
        forceSaveData();
        
        // Backup con delay
        setTimeout(() => {
          forceBackupData().catch(e => console.error('Background backup fallito:', e));
        }, 300);
        
        // Notifica anche il service worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'APP_BACKGROUNDED',
            timestamp: new Date().toISOString()
          });
        }
      }
    } else if (document.visibilityState === 'visible') {
      console.log('PWA: App in foreground, verifica integrità dati...');
      
      // Quando l'app torna in primo piano, verifica che i dati siano ok
      if (appInitialized) {
        setTimeout(() => {
          throttledSave();
        }, 1500);
      }
    }
  });
  
  // CORREZIONE: Gestione beforeunload ottimizzata per PWA
  window.addEventListener('beforeunload', (event) => {
    console.log('PWA: App closing, forcing immediate data save and backup...');
    
    if (appInitialized) {
      // Salvataggio immediato sincrono
      forceSaveData();
      
      // Notifica il service worker (senza await per evitare blocchi)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'APP_CLOSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Backup in background (non bloccante)
      forceBackupData().catch(e => console.error('Backup su beforeunload fallito:', e));
    }
    
    // Non preveniamo l'evento per non bloccare la chiusura
  });
  
  // Gestione eventi specifici PWA
  window.addEventListener('pagehide', () => {
    console.log('PWA: Page hide event, final save and backup...');
    if (appInitialized) {
      forceSaveData();
      forceBackupData().catch(e => console.error('Backup su pagehide fallito:', e));
    }
  });
  
  // Gestione evento di installazione PWA
  window.addEventListener('appinstalled', () => {
    console.log('PWA installata con successo');
    if (appInitialized) {
      setTimeout(() => {
        forceSaveData();
        setTimeout(() => {
          forceBackupData().catch(e => console.error('Backup post-install fallito:', e));
        }, 1000);
      }, 500);
    }
  });
  
  // CORREZIONE: Per iOS PWA - gestione ottimizzata
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log("iOS PWA rilevata, configurazione eventi specifici ottimizzata...");
    
    // Salva periodicamente quando l'utente interagisce (throttled)
    let lastTouchSave = 0;
    document.addEventListener('touchend', () => {
      if (!appInitialized) return;
      
      const now = Date.now();
      if (now - lastTouchSave > 60000) { // Ogni minuto max
        throttledSave();
        lastTouchSave = now;
      }
    });
    
    // Gestione focus per iOS
    window.addEventListener('focus', () => {
      console.log("iOS PWA: App focused, checking data consistency");
      if (appInitialized) {
        setTimeout(() => {
          throttledSave();
        }, 1000);
      }
    });
    
    // Gestione orientamento per iOS PWA
    window.addEventListener('orientationchange', () => {
      console.log("iOS PWA: Orientation changed, saving data");
      if (appInitialized) {
        setTimeout(throttledSave, 500);
      }
    });
    
    // NUOVO: Gestione memory warning per iOS
    if ('onmemorywarning' in window) {
      window.addEventListener('memorywarning', () => {
        console.log("iOS PWA: Memory warning, emergency save");
        if (appInitialized) {
          forceSaveData();
        }
      });
    }
  }
  
  // CORREZIONE: Backup periodico automatico ottimizzato per PWA
  let periodicBackupInterval;
  const startPeriodicBackup = () => {
    if (periodicBackupInterval) {
      clearInterval(periodicBackupInterval);
    }
    
    periodicBackupInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && appInitialized && !saveInProgress) {
        console.log('Backup periodico automatico PWA...');
        forceBackupData().catch(e => console.error('Backup periodico fallito:', e));
      }
    }, 15 * 60 * 1000); // Ogni 15 minuti quando l'app è visibile
  };
  
  // Avvia backup periodico dopo l'inizializzazione
  setTimeout(startPeriodicBackup, 30000); // Avvia dopo 30 secondi
}

// Gestione errori globali migliorata
window.addEventListener('error', (event) => {
  console.error('Errore globale catturato:', event.error);
  
  // In caso di errore critico, prova a salvare i dati
  if (appInitialized) {
    try {
      console.log('Tentativo di salvataggio di emergenza dopo errore...');
      forceSaveData();
    } catch (e) {
      console.error('Impossibile salvare i dati dopo errore:', e);
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejection non gestita:', event.reason);
  
  // In caso di errore critico, prova a salvare i dati
  if (appInitialized) {
    try {
      console.log('Tentativo di salvataggio di emergenza dopo promise rejection...');
      forceSaveData();
    } catch (e) {
      console.error('Impossibile salvare i dati dopo promise rejection:', e);
    }
  }
});

// CORREZIONE: Funzione per inizializzare l'app ottimizzata
const initApp = async () => {
  console.log("=== INIZIALIZZAZIONE APP ===");
  
  // Verifica se siamo in modalità PWA
  const isPwaMode = isPWA();
  console.log(`Applicazione in modalità PWA: ${isPwaMode}`);
  
  if (isPwaMode) {
    console.log("PWA rilevata, configurazione avanzata backup e persistenza...");
    
    // Solo per PWA su iOS, applica workaround
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("Applicando workaround per iOS PWA");
      localStorage.setItem('pwa-init', Date.now().toString());
      
      // Verifica backup esistenti su iOS
      try {
        const backupKeys = [
          'budget-app-data-backup', 
          'budget-app-settings-current',
          'budget-app-settings-backup',
          'budget-app-settings-immediate'
        ];
        let foundBackups = 0;
        
        backupKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            foundBackups++;
            console.log(`Backup trovato: ${key}`);
          }
        });
        
        if (foundBackups > 0) {
          console.log(`Trovati ${foundBackups} backup esistenti su iOS`);
        } else {
          console.log("Nessun backup esistente trovato su iOS");
        }
      } catch (e) {
        console.log("Controllo backup iOS:", e);
      }
    }
  }
  
  // CORREZIONE: Inizializza il database con gestione errori ottimizzata
  try {
    // Ritardo personalizzato per piattaforma
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("iOS PWA: Attesa inizializzazione...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (isPwaMode) {
      console.log("PWA: Attesa inizializzazione...");
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Inizializza DB
    console.log("Inizializzazione database...");
    await initDB();
    console.log("Database inizializzato con successo");
    
    // Verifica aggiuntiva per iOS PWA
    if (isPwaMode && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      console.log("iOS PWA: Secondo tentativo di inizializzazione...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      await initDB(); // Secondo tentativo per iOS
      console.log("Secondo init DB completato per iOS");
    }
    
  } catch (err) {
    console.error("Errore durante inizializzazione DB:", err);
    
    // CORREZIONE: Strategia di fallback migliorata
    let fallbackSuccess = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Tentativo di fallback ${attempt}/3...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        await initDB();
        console.log(`Inizializzazione DB riuscita al tentativo ${attempt}`);
        fallbackSuccess = true;
        break;
      } catch (retryErr) {
        console.error(`Tentativo ${attempt} fallito:`, retryErr);
      }
    }
    
    if (!fallbackSuccess) {
      console.error("Tutti i tentativi di inizializzazione DB sono falliti");
      
      // Ultimo tentativo di recovery per PWA
      if (isPwaMode) {
        console.log("PWA: Tentativo di recovery con backup...");
        try {
          // Verifica se esistono backup utilizzabili
          const hasSettingsBackup = localStorage.getItem('budget-app-settings-current');
          const hasDataBackup = localStorage.getItem('budget-app-data-backup');
          
          if (hasSettingsBackup || hasDataBackup) {
            console.log("PWA: Backup trovati, l'app potrebbe recuperare i dati");
          } else {
            console.log("PWA: Nessun backup trovato per il recovery");
          }
        } catch (e) {
          console.error("Verifica backup recovery fallita:", e);
        }
      }
    }
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
  
  // Marca l'app come inizializzata
  appInitialized = true;
  console.log("App marcata come inizializzata");
  
  // NUOVO: Post-inizializzazione per PWA
  if (isPwaMode) {
    setTimeout(() => {
      console.log("PWA: Configurazione post-inizializzazione...");
      
      // Primo backup dopo l'avvio (se ci sono dati)
      setTimeout(() => {
        if (appInitialized) {
          console.log("PWA: Primo backup post-inizializzazione...");
          forceBackupData().catch(e => console.error('Primo backup fallito:', e));
        }
      }, 45000); // Dopo 45 secondi dall'avvio
      
      // Salvataggio di verifica
      setTimeout(() => {
        if (appInitialized && globalSaveFunction) {
          console.log("PWA: Salvataggio di verifica post-inizializzazione...");
          forceSaveData();
        }
      }, 10000); // Dopo 10 secondi dall'avvio
      
    }, 2000);
  }
};

// Avvia inizializzazione app e rendering
initApp().then(() => {
  console.log("=== INIZIALIZZAZIONE E RENDERING COMPLETATI ===");
  
  // Notifica di successo per PWA
  if (isPWA()) {
    console.log("PWA: Inizializzazione completata con successo");
    
    // Verifica che le funzioni di salvataggio siano registrate
    setTimeout(() => {
      if (!globalSaveFunction) {
        console.warn("PWA: Funzione di salvataggio non ancora registrata");
      } else {
        console.log("PWA: Funzione di salvataggio confermata");
      }
    }, 5000);
  }
  
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
  
  // Anche nel fallback, marca l'app come inizializzata
  appInitialized = true;
  
  // Recovery con backup nel fallback
  if (isPWA()) {
    setTimeout(() => {
      console.log("PWA Fallback: Tentativo di recovery backup...");
      forceBackupData().catch(e => console.error('Recovery backup fallback fallito:', e));
    }, 10000);
  }
});

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initDB } from './services/db';

// Funzione per controllare se siamo online
const checkOnlineStatus = () => {
  return navigator.onLine;
};

// Registrazione Service Worker per funzionalità offline complete
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/pwabuilder-sw.js');
      console.log('[PWA] Service Worker registrato con successo:', registration);
      
      // Gestione aggiornamenti del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] Nuovo Service Worker trovato');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nuovo Service Worker pronto');
            
            // Opzionale: mostra notifica di aggiornamento
            if (confirm('Nuova versione dell\'app disponibile. Vuoi aggiornare?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
      
      // Quando il Service Worker è aggiornato
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.error('[PWA] Errore registrazione Service Worker:', error);
      // L'app continua a funzionare anche senza Service Worker
    }
  });
}

// Gestione stato online/offline
window.addEventListener('online', () => {
  console.log('[PWA] App online');
  document.body.classList.remove('offline');
  
  // Mostra notifica connessione ripristinata
  showConnectionStatus('🌐 Connessione ripristinata', 'success');
});

window.addEventListener('offline', () => {
  console.log('[PWA] App offline');
  document.body.classList.add('offline');
  
  // Mostra notifica modalità offline
  showConnectionStatus('📱 Modalità offline attiva', 'info');
});

// Funzione per mostrare lo stato della connessione
function showConnectionStatus(message, type = 'info') {
  // Rimuovi notifiche esistenti
  const existing = document.querySelector('.connection-status');
  if (existing) {
    existing.remove();
  }
  
  // Crea nuova notifica
  const notification = document.createElement('div');
  notification.className = `connection-status ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4ade80' : '#3b82f6'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Aggiungi animazione CSS
  if (!document.querySelector('#connection-status-style')) {
    const style = document.createElement('style');
    style.id = 'connection-status-style';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      .offline { filter: grayscale(0.3); }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Rimuovi dopo 3 secondi
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// Inizializzazione dell'app con supporto offline
const initApp = async () => {
  console.log("🚀 Inizializzazione Budget App...");
  
  // Mostra stato iniziale della connessione
  if (!checkOnlineStatus()) {
    document.body.classList.add('offline');
    console.log("📱 App avviata in modalità offline");
  } else {
    console.log("🌐 App avviata online");
  }
  
  try {
    // Inizializza il database (funziona sempre, anche offline)
    await initDB();
    console.log("✅ Database inizializzato (localStorage fallback)");
  } catch (err) {
    console.error("❌ Errore inizializzazione database:", err);
    // L'app può comunque funzionare
  }
  
  // Renderizza l'app React
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("✅ App renderizzata e pronta");
  
  // Mostra notifica se siamo offline
  if (!checkOnlineStatus()) {
    setTimeout(() => {
      showConnectionStatus('📱 App pronta - Modalità offline', 'info');
    }, 1000);
  }
};

// Avvia l'app
initApp().catch((error) => {
  console.error("❌ Errore critico durante l'inizializzazione:", error);
  
  // Fallback: renderizza comunque l'app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Mostra errore all'utente
  setTimeout(() => {
    showConnectionStatus('⚠️ App avviata con errori', 'warning');
  }, 1000);
});

// Debug: mostra info PWA in console
console.log(`
🏠 Budget App PWA
📱 PWA Mode: ${window.matchMedia('(display-mode: standalone)').matches ? 'Attiva' : 'Web'}
🌐 Online: ${navigator.onLine ? 'Sì' : 'No'}
💾 LocalStorage: ${typeof Storage !== 'undefined' ? 'Supportato' : 'Non supportato'}
🗂️ IndexedDB: ${typeof indexedDB !== 'undefined' ? 'Supportato' : 'Non supportato'}
`);

export { checkOnlineStatus, showConnectionStatus };

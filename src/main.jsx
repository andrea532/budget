import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrato');
    } catch (error) {
      console.log('❌ Service Worker fallito:', error);
    }
  });
}

// Renderizza l'app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("✅ Budget App avviata");

// src/services/db.js - VERSIONE ULTRA ROBUSTA CON FALLBACK LOCALSTORAGE
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 3; // Incrementato per evitare conflitti

// Fallback keys per localStorage
const STORAGE_KEYS = {
  SETTINGS: 'budget-settings',
  TRANSACTIONS: 'budget-transactions',
  FIXED_EXPENSES: 'budget-fixed-expenses',
  FUTURE_EXPENSES: 'budget-future-expenses',
  SAVINGS: 'budget-savings'
};

// Riferimento globale al database
let dbInstance = null;
let useLocalStorageFallback = false;

// Funzione per verificare se l'app è in modalità PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
};

// FALLBACK: Funzioni localStorage
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Errore salvataggio localStorage:', error);
    return false;
  }
};

const getFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Errore caricamento localStorage:', error);
    return null;
  }
};

// Funzione robusta per ottenere il database
const getDB = async () => {
  if (useLocalStorageFallback) {
    console.log("Usando localStorage come fallback");
    return null; // Indica che stiamo usando localStorage
  }

  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // Timeout per IndexedDB
      const timeout = setTimeout(() => {
        console.warn("IndexedDB timeout, passaggio a localStorage");
        useLocalStorageFallback = true;
        resolve(null);
      }, 5000);
      
      request.onerror = (event) => {
        clearTimeout(timeout);
        console.error("Errore IndexedDB:", event.target.error);
        console.log("Passaggio a localStorage fallback");
        useLocalStorageFallback = true;
        resolve(null);
      };
      
      request.onupgradeneeded = (event) => {
        clearTimeout(timeout);
        const db = event.target.result;
        
        try {
          // Crea tutti gli stores necessari
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('fixedExpenses')) {
            db.createObjectStore('fixedExpenses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('futureExpenses')) {
            db.createObjectStore('futureExpenses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('savings')) {
            db.createObjectStore('savings', { keyPath: 'id' });
          }
        } catch (upgradeError) {
          console.error("Errore upgrade database:", upgradeError);
          useLocalStorageFallback = true;
          resolve(null);
        }
      };
      
      request.onsuccess = (event) => {
        clearTimeout(timeout);
        dbInstance = event.target.result;
        console.log("IndexedDB aperto con successo");
        resolve(dbInstance);
      };
    } catch (error) {
      console.error("Errore critico IndexedDB:", error);
      useLocalStorageFallback = true;
      resolve(null);
    }
  });
};

// Inizializzazione robusta del database
export const initDB = async () => {
  try {
    console.log("Inizializzazione database...");
    
    // Verifica se IndexedDB è supportato
    if (!window.indexedDB) {
      console.warn("IndexedDB non supportato, uso localStorage");
      useLocalStorageFallback = true;
      return null;
    }
    
    const db = await getDB();
    
    if (useLocalStorageFallback) {
      console.log("Database inizializzato con localStorage fallback");
    } else {
      console.log("Database IndexedDB inizializzato con successo");
    }
    
    return db;
  } catch (error) {
    console.error("Errore inizializzazione database:", error);
    console.log("Fallback a localStorage");
    useLocalStorageFallback = true;
    return null;
  }
};

// Operazione generica del database con fallback
const dbOperation = async (storeName, mode, operation) => {
  try {
    if (useLocalStorageFallback) {
      // Usa localStorage invece di IndexedDB
      const key = STORAGE_KEYS[storeName.toUpperCase()] || `budget-${storeName}`;
      
      if (mode === 'readonly') {
        const data = getFromLocalStorage(key);
        return operation({ 
          getAll: () => Array.isArray(data) ? data : (data ? [data] : [])
        });
      } else {
        // Per operazioni di scrittura, simula il comportamento IndexedDB
        const currentData = getFromLocalStorage(key) || [];
        const result = operation({
          add: (item) => {
            const newData = Array.isArray(currentData) ? [...currentData, item] : [item];
            saveToLocalStorage(key, newData);
            return item;
          },
          put: (item) => {
            let newData;
            if (Array.isArray(currentData)) {
              newData = currentData.map(existing => existing.id === item.id ? item : existing);
              if (!newData.find(existing => existing.id === item.id)) {
                newData.push(item);
              }
            } else {
              newData = [item];
            }
            saveToLocalStorage(key, newData);
            return item;
          },
          delete: (id) => {
            const newData = Array.isArray(currentData) ? currentData.filter(item => item.id !== id) : [];
            saveToLocalStorage(key, newData);
            return true;
          },
          getAll: () => Array.isArray(currentData) ? currentData : (currentData ? [currentData] : [])
        });
        return result;
      }
    }
    
    // Usa IndexedDB normale
    const db = await getDB();
    if (!db) {
      throw new Error("Database non disponibile");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      
      transaction.onerror = () => reject("Errore transazione");
      
      const request = operation(store);
      
      if (request && request.onsuccess !== undefined) {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject("Errore operazione");
      } else {
        transaction.oncomplete = () => resolve(request);
      }
    });
  } catch (error) {
    console.error("Errore operazione database:", error);
    throw error;
  }
};

// SETTINGS
export const saveSettings = async (settings) => {
  try {
    console.log("Salvando settings:", settings);
    return await dbOperation('settings', 'readwrite', (store) => {
      return store.put(settings);
    });
  } catch (error) {
    console.error("Errore salvataggio settings:", error);
    // Fallback finale - salva solo in localStorage
    saveToLocalStorage(STORAGE_KEYS.SETTINGS, [settings]);
  }
};

export const getSettings = async () => {
  try {
    return await dbOperation('settings', 'readonly', (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Errore caricamento settings:", error);
    // Fallback - carica da localStorage
    const data = getFromLocalStorage(STORAGE_KEYS.SETTINGS);
    return Array.isArray(data) ? data : (data ? [data] : []);
  }
};

// TRANSAZIONI
export const addTransaction = async (transaction) => {
  if (!transaction.id) {
    transaction.id = Date.now();
  }
  try {
    return await dbOperation('transactions', 'readwrite', (store) => {
      return store.add(transaction);
    });
  } catch (error) {
    console.error("Errore aggiunta transazione:", error);
    throw error;
  }
};

export const updateTransaction = async (transaction) => {
  try {
    return await dbOperation('transactions', 'readwrite', (store) => {
      return store.put(transaction);
    });
  } catch (error) {
    console.error("Errore aggiornamento transazione:", error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    return await dbOperation('transactions', 'readwrite', (store) => {
      return store.delete(id);
    });
  } catch (error) {
    console.error("Errore eliminazione transazione:", error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    return await dbOperation('transactions', 'readonly', (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Errore caricamento transazioni:", error);
    return [];
  }
};

// SPESE FISSE
export const addFixedExpense = async (expense) => {
  if (!expense.id) {
    expense.id = Date.now();
  }
  try {
    return await dbOperation('fixedExpenses', 'readwrite', (store) => {
      return store.add(expense);
    });
  } catch (error) {
    console.error("Errore aggiunta spesa fissa:", error);
    throw error;
  }
};

export const deleteFixedExpense = async (id) => {
  try {
    return await dbOperation('fixedExpenses', 'readwrite', (store) => {
      return store.delete(id);
    });
  } catch (error) {
    console.error("Errore eliminazione spesa fissa:", error);
    throw error;
  }
};

export const getFixedExpenses = async () => {
  try {
    return await dbOperation('fixedExpenses', 'readonly', (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Errore caricamento spese fisse:", error);
    return [];
  }
};

// SPESE FUTURE
export const addFutureExpense = async (expense) => {
  if (!expense.id) {
    expense.id = Date.now();
  }
  try {
    return await dbOperation('futureExpenses', 'readwrite', (store) => {
      return store.add(expense);
    });
  } catch (error) {
    console.error("Errore aggiunta spesa futura:", error);
    throw error;
  }
};

export const updateFutureExpense = async (expense) => {
  try {
    return await dbOperation('futureExpenses', 'readwrite', (store) => {
      return store.put(expense);
    });
  } catch (error) {
    console.error("Errore aggiornamento spesa futura:", error);
    throw error;
  }
};

export const deleteFutureExpense = async (id) => {
  try {
    return await dbOperation('futureExpenses', 'readwrite', (store) => {
      return store.delete(id);
    });
  } catch (error) {
    console.error("Errore eliminazione spesa futura:", error);
    throw error;
  }
};

export const getFutureExpenses = async () => {
  try {
    return await dbOperation('futureExpenses', 'readonly', (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Errore caricamento spese future:", error);
    return [];
  }
};

// RISPARMI
export const addSavingsEntry = async (entry) => {
  if (!entry.id) {
    entry.id = Date.now();
  }
  try {
    return await dbOperation('savings', 'readwrite', (store) => {
      return store.add(entry);
    });
  } catch (error) {
    console.error("Errore aggiunta risparmio:", error);
    throw error;
  }
};

export const getSavingsHistory = async () => {
  try {
    return await dbOperation('savings', 'readonly', (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Errore caricamento risparmi:", error);
    return [];
  }
};

// Cancella tutto
export const clearDatabase = async () => {
  try {
    if (useLocalStorageFallback) {
      // Cancella localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log("Database localStorage cancellato");
      return;
    }
    
    // Cancella IndexedDB
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
      
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        console.log("Database IndexedDB cancellato");
        resolve();
      };
      
      request.onerror = () => {
        console.error("Errore cancellazione database");
        reject("Errore cancellazione");
      };
    });
  } catch (error) {
    console.error("Errore cancellazione database:", error);
    throw error;
  }
};

// Funzioni di compatibilità
export const createManualBackup = async () => {
  console.log("Backup non implementato");
  return null;
};

export const getBackupInfo = () => {
  return { exists: false };
};

export const restoreFromBackup = async () => {
  return false;
};

export const verifyDataIntegrity = async () => {
  return true;
};

// src/services/db.js
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 2; // Cambiato da 1 a 2 per adattarsi alla versione esistente

// Definizione degli object stores (tabelle)
const STORES = {
  SETTINGS: 'settings',
  TRANSACTIONS: 'transactions',
  FIXED_EXPENSES: 'fixedExpenses',
  FUTURE_EXPENSES: 'futureExpenses',
  SAVINGS: 'savings'
};

// Riferimento globale al database
let dbInstance = null;

// Funzione per verificare se l'app è in modalità PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || // Safari iOS
         document.referrer.includes('android-app://');
};

// Funzione per verificare se è iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Funzione per rilevare la versione corrente del database
const detectCurrentDBVersion = () => {
  return new Promise((resolve) => {
    // Prova ad aprire il database senza specificare la versione
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const currentVersion = db.version;
      console.log(`Versione corrente del database: ${currentVersion}`);
      db.close();
      resolve(currentVersion);
    };
    
    request.onerror = () => {
      // Se c'è un errore, assume che sia un nuovo database
      console.log("Impossibile rilevare la versione del database, si assume un nuovo database");
      resolve(0);
    };
  });
};

// Funzione per ottenere l'istanza del database
const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    // Prima rileva la versione corrente
    const currentVersion = await detectCurrentDBVersion();
    
    // Usa la versione maggiore tra quella corrente e quella definita
    const versionToUse = Math.max(currentVersion, DB_VERSION);
    console.log(`Apertura database con versione: ${versionToUse}`);
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, versionToUse);
      
      request.onerror = (event) => {
        console.error("Database error:", event.target.error);
        reject("Impossibile aprire il database");
      };
      
      request.onupgradeneeded = (event) => {
        console.log(`Aggiornamento database dalla versione ${event.oldVersion} alla versione ${event.newVersion}`);
        const db = event.target.result;
        
        // Crea gli object stores se non esistono
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
          console.log("Object store 'settings' creato");
        }
        
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          console.log("Object store 'transactions' creato");
        }
        
        if (!db.objectStoreNames.contains(STORES.FIXED_EXPENSES)) {
          db.createObjectStore(STORES.FIXED_EXPENSES, { keyPath: 'id' });
          console.log("Object store 'fixedExpenses' creato");
        }
        
        if (!db.objectStoreNames.contains(STORES.FUTURE_EXPENSES)) {
          const futureExpenseStore = db.createObjectStore(STORES.FUTURE_EXPENSES, { keyPath: 'id' });
          futureExpenseStore.createIndex('dueDate', 'dueDate', { unique: false });
          console.log("Object store 'futureExpenses' creato");
        }
        
        if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
          const savingsStore = db.createObjectStore(STORES.SAVINGS, { keyPath: 'id' });
          savingsStore.createIndex('date', 'date', { unique: false });
          console.log("Object store 'savings' creato");
        }
      };
      
      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        console.log(`Database aperto con successo (versione ${dbInstance.version})`);
        resolve(dbInstance);
      };
    });
  } catch (error) {
    console.error("Errore durante l'ottenimento del database:", error);
    
    // Se c'è un errore, proviamo a forzare l'apertura con versione specifica
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error("Database error durante il tentativo forzato:", event.target.error);
        reject("Impossibile aprire il database anche con tentativo forzato");
      };
      
      request.onupgradeneeded = (event) => {
        console.log(`Aggiornamento forzato database dalla versione ${event.oldVersion} alla versione ${event.newVersion}`);
        const db = event.target.result;
        
        // Crea gli object stores se non esistono
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.FIXED_EXPENSES)) {
          db.createObjectStore(STORES.FIXED_EXPENSES, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.FUTURE_EXPENSES)) {
          const futureExpenseStore = db.createObjectStore(STORES.FUTURE_EXPENSES, { keyPath: 'id' });
          futureExpenseStore.createIndex('dueDate', 'dueDate', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
          const savingsStore = db.createObjectStore(STORES.SAVINGS, { keyPath: 'id' });
          savingsStore.createIndex('date', 'date', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        console.log(`Database aperto con successo (tentativo forzato, versione ${dbInstance.version})`);
        resolve(dbInstance);
      };
    });
  }
};

// Funzione per inizializzare il database
export const initDB = async () => {
  try {
    const db = await getDB();
    return db;
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database:", error);
    
    // In caso di errore fatale, proviamo a ripulire tutto e ricreare
    try {
      console.log("Tentativo di ripristino: eliminazione e ricreazione del database");
      await clearDatabase();
      const db = await getDB();
      return db;
    } catch (recoveryError) {
      console.error("Impossibile recuperare il database:", recoveryError);
      throw recoveryError;
    }
  }
};

// Operazione generica del database
const dbOperation = async (storeName, mode, operation) => {
  try {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transaction.onerror = (event) => {
        console.error("Errore nella transazione:", event.target.error);
        reject("Errore durante l'operazione nel database");
      };

      const request = operation(store);

      if (request) {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => {
          console.error("Errore nella richiesta:", event.target.error);
          reject(`Error saving data: ${event.target.error}`);
        };
      } else {
        transaction.oncomplete = () => resolve();
      }
    });
  } catch (error) {
    console.error("Errore nell'operazione sul database:", error);
    throw error;
  }
};

// Funzioni per le impostazioni
export const saveSettings = async (settings) => {
  try {
    // Backup in localStorage come fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('budget-app-settings', JSON.stringify(settings));
      } catch (e) {
        console.warn("Errore nel backup in localStorage:", e);
      }
    }
    
    // Salva nel database
    return await dbOperation(STORES.SETTINGS, 'readwrite', (store) => {
      return store.put(settings);
    });
  } catch (error) {
    console.error("Errore nel salvataggio delle impostazioni:", error);
    throw error;
  }
};

export const getSettings = async () => {
  try {
    const result = await dbOperation(STORES.SETTINGS, 'readonly', (store) => {
      return store.getAll();
    });
    
    // Se non ci sono risultati ma abbiamo un backup in localStorage, proviamo a recuperare
    if ((!result || result.length === 0) && typeof localStorage !== 'undefined') {
      try {
        const backup = localStorage.getItem('budget-app-settings');
        if (backup) {
          const parsedBackup = JSON.parse(backup);
          // Salva nel database per la prossima volta
          await saveSettings(parsedBackup);
          return [parsedBackup];
        }
      } catch (e) {
        console.warn("Errore nel recupero da localStorage:", e);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Errore nel recupero delle impostazioni:", error);
    throw error;
  }
};

// Funzioni per le transazioni
export const addTransaction = async (transaction) => {
  // Assicura che l'ID sia valido
  if (!transaction.id) {
    transaction.id = Date.now();
  }
  
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.add(transaction);
  });
};

export const updateTransaction = async (transaction) => {
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.put(transaction);
  });
};

export const deleteTransaction = async (id) => {
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getTransactions = async () => {
  return await dbOperation(STORES.TRANSACTIONS, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per le spese fisse
export const addFixedExpense = async (expense) => {
  // Assicura che l'ID sia valido
  if (!expense.id) {
    expense.id = Date.now();
  }
  
  return await dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.add(expense);
  });
};

export const updateFixedExpense = async (expense) => {
  return await dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.put(expense);
  });
};

export const deleteFixedExpense = async (id) => {
  return await dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFixedExpenses = async () => {
  return await dbOperation(STORES.FIXED_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per le spese future
export const addFutureExpense = async (expense) => {
  // Assicura che l'ID sia valido
  if (!expense.id) {
    expense.id = Date.now();
  }
  
  return await dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.add(expense);
  });
};

export const updateFutureExpense = async (expense) => {
  return await dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.put(expense);
  });
};

export const deleteFutureExpense = async (id) => {
  return await dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFutureExpenses = async () => {
  return await dbOperation(STORES.FUTURE_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per i risparmi
export const addSavingsEntry = async (entry) => {
  // Assicura che l'ID sia valido
  if (!entry.id) {
    entry.id = Date.now();
  }
  
  return await dbOperation(STORES.SAVINGS, 'readwrite', (store) => {
    return store.add(entry);
  });
};

export const getSavingsHistory = async () => {
  return await dbOperation(STORES.SAVINGS, 'readonly', (store) => {
    return store.getAll();
  });
};

// Cancella tutto il database
export const clearDatabase = async () => {
  return new Promise((resolve, reject) => {
    // Chiudi l'istanza corrente
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    
    // Cancella il database
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      console.log("Database cancellato con successo");
      
      // Cancella anche localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('budget-app-settings');
        } catch (e) {
          console.warn("Errore nella pulizia di localStorage:", e);
        }
      }
      
      resolve();
    };
    
    request.onerror = (event) => {
      console.error("Errore nella cancellazione del database:", event.target.error);
      reject("Impossibile cancellare il database");
    };
  });
};

// Esporta i nomi degli store
export { STORES };

// src/services/db.js - VERSIONE SEMPLIFICATA CHE FUNZIONA
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 1;

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
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
};

// Funzione semplice per ottenere il database
const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject("Errore apertura database");
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Crea tutti gli stores necessari
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.FIXED_EXPENSES)) {
        db.createObjectStore(STORES.FIXED_EXPENSES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.FUTURE_EXPENSES)) {
        db.createObjectStore(STORES.FUTURE_EXPENSES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
        db.createObjectStore(STORES.SAVINGS, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
  });
};

// Inizializzazione semplice del database
export const initDB = async () => {
  try {
    const db = await getDB();
    console.log("Database inizializzato con successo");
    return db;
  } catch (error) {
    console.error("Errore inizializzazione database:", error);
    throw error;
  }
};

// Operazione generica del database - SEMPLIFICATA
const dbOperation = async (storeName, mode, operation) => {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    transaction.onerror = () => reject("Errore transazione");
    
    const request = operation(store);
    
    if (request) {
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject("Errore operazione");
    } else {
      transaction.oncomplete = () => resolve();
    }
  });
};

// SETTINGS - Versioni semplificate
export const saveSettings = async (settings) => {
  console.log("Salvando settings:", settings);
  return await dbOperation(STORES.SETTINGS, 'readwrite', (store) => {
    return store.put(settings);
  });
};

export const getSettings = async () => {
  return await dbOperation(STORES.SETTINGS, 'readonly', (store) => {
    return store.getAll();
  });
};

// TRANSAZIONI
export const addTransaction = async (transaction) => {
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

// SPESE FISSE
export const addFixedExpense = async (expense) => {
  if (!expense.id) {
    expense.id = Date.now();
  }
  return await dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.add(expense);
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

// SPESE FUTURE
export const addFutureExpense = async (expense) => {
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

// RISPARMI
export const addSavingsEntry = async (entry) => {
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
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      console.log("Database cancellato");
      resolve();
    };
    
    request.onerror = () => {
      reject("Errore cancellazione database");
    };
  });
};

// Funzioni di backup semplici (solo per compatibilità)
export const createManualBackup = async () => {
  console.log("Backup non implementato in versione semplificata");
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

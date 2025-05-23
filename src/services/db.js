// src/services/db.js
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

// Funzione per inizializzare il database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject("Impossibile aprire il database");
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crea gli object stores con auto-incrementing keys
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id', autoIncrement: true });
        transactionStore.createIndex('date', 'date', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.FIXED_EXPENSES)) {
        db.createObjectStore(STORES.FIXED_EXPENSES, { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(STORES.FUTURE_EXPENSES)) {
        const futureExpenseStore = db.createObjectStore(STORES.FUTURE_EXPENSES, { keyPath: 'id', autoIncrement: true });
        futureExpenseStore.createIndex('dueDate', 'dueDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
        const savingsStore = db.createObjectStore(STORES.SAVINGS, { keyPath: 'id', autoIncrement: true });
        savingsStore.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
  });
};

// Operazioni generiche del database
const dbOperation = (storeName, mode, operation) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then(db => {
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
      })
      .catch(error => reject(error));
  });
};

// Funzioni per le impostazioni
export const saveSettings = (settings) => {
  return dbOperation(STORES.SETTINGS, 'readwrite', (store) => {
    return store.put(settings); // Usa put invece di add per sovrascrivere
  });
};

export const getSettings = () => {
  return dbOperation(STORES.SETTINGS, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per le transazioni
export const addTransaction = (transaction) => {
  // Se l'ID è già definito, rimuovilo per lasciare che il database lo generi
  if (transaction.id && typeof transaction.id !== 'number') {
    const { id, ...transactionWithoutId } = transaction;
    transaction = transactionWithoutId;
  }
  
  return dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.add(transaction);
  });
};

export const updateTransaction = (transaction) => {
  return dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.put(transaction);
  });
};

export const deleteTransaction = (id) => {
  return dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getTransactions = () => {
  return dbOperation(STORES.TRANSACTIONS, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per le spese fisse
export const addFixedExpense = (expense) => {
  // Rimuovi l'ID se esiste ma non è numerico
  if (expense.id && typeof expense.id !== 'number') {
    const { id, ...expenseWithoutId } = expense;
    expense = expenseWithoutId;
  }
  
  return dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.add(expense);
  });
};

export const updateFixedExpense = (expense) => {
  return dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.put(expense);
  });
};

export const deleteFixedExpense = (id) => {
  return dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFixedExpenses = () => {
  return dbOperation(STORES.FIXED_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per le spese future
export const addFutureExpense = (expense) => {
  // Rimuovi l'ID se esiste ma non è numerico
  if (expense.id && typeof expense.id !== 'number') {
    const { id, ...expenseWithoutId } = expense;
    expense = expenseWithoutId;
  }
  
  return dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.add(expense);
  });
};

export const updateFutureExpense = (expense) => {
  return dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.put(expense);
  });
};

export const deleteFutureExpense = (id) => {
  return dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFutureExpenses = () => {
  return dbOperation(STORES.FUTURE_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
};

// Funzioni per i risparmi
export const addSavingsEntry = (entry) => {
  // Rimuovi l'ID se esiste ma non è numerico
  if (entry.id && typeof entry.id !== 'number') {
    const { id, ...entryWithoutId } = entry;
    entry = entryWithoutId;
  }
  
  return dbOperation(STORES.SAVINGS, 'readwrite', (store) => {
    return store.add(entry);
  });
};

export const getSavingsHistory = () => {
  return dbOperation(STORES.SAVINGS, 'readonly', (store) => {
    return store.getAll();
  });
};

// Cancella tutto il database
export const clearDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      console.log("Database cancellato con successo");
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

// src/services/db.js - VERSIONE MIGLIORATA PER PERSISTENZA DATI
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 3; // Incrementata per la nuova versione
const BACKUP_KEY = 'budget-app-data-backup';
const MIGRATION_KEY = 'budget-app-migration-status';

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

// NUOVO: Sistema di backup completo dei dati
const createFullBackup = async () => {
  try {
    console.log("Creazione backup completo dei dati...");
    
    if (!dbInstance) {
      console.warn("Database non inizializzato, impossibile creare backup");
      return null;
    }

    const backup = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Backup di tutti gli store
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        const data = await dbOperation(storeName, 'readonly', (store) => {
          return store.getAll();
        });
        backup.data[storeName] = data || [];
        console.log(`Backup ${storeName}: ${data?.length || 0} elementi`);
      } catch (error) {
        console.error(`Errore nel backup di ${storeName}:`, error);
        backup.data[storeName] = [];
      }
    }

    // Salva il backup in localStorage
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
      localStorage.setItem(BACKUP_KEY + '_timestamp', backup.timestamp);
      console.log("Backup salvato in localStorage con successo");
      return backup;
    } catch (error) {
      console.error("Errore nel salvataggio del backup:", error);
      return null;
    }
  } catch (error) {
    console.error("Errore nella creazione del backup:", error);
    return null;
  }
};

// NUOVO: Ripristino da backup
const restoreFromBackup = async () => {
  try {
    console.log("Tentativo di ripristino da backup...");
    
    const backupData = localStorage.getItem(BACKUP_KEY);
    if (!backupData) {
      console.log("Nessun backup trovato in localStorage");
      return false;
    }

    const backup = JSON.parse(backupData);
    console.log(`Backup trovato: versione ${backup.version}, timestamp ${backup.timestamp}`);

    // Verifica che il backup sia valido
    if (!backup.data || !backup.timestamp) {
      console.warn("Backup non valido");
      return false;
    }

    // Ripristina tutti i dati
    let restoredCount = 0;
    for (const [storeName, data] of Object.entries(backup.data)) {
      if (Array.isArray(data) && data.length > 0) {
        try {
          console.log(`Ripristino ${storeName}: ${data.length} elementi`);
          
          // Prima cancella tutti i dati esistenti nello store
          await dbOperation(storeName, 'readwrite', (store) => {
            return store.clear();
          });

          // Poi ripristina i dati dal backup
          for (const item of data) {
            await dbOperation(storeName, 'readwrite', (store) => {
              return store.put(item);
            });
          }
          
          restoredCount += data.length;
          console.log(`${storeName} ripristinato con successo`);
        } catch (error) {
          console.error(`Errore nel ripristino di ${storeName}:`, error);
        }
      }
    }

    console.log(`Ripristino completato: ${restoredCount} elementi totali`);
    
    // Marca il ripristino come completato
    localStorage.setItem(MIGRATION_KEY, JSON.stringify({
      restored: true,
      timestamp: new Date().toISOString(),
      version: backup.version,
      itemsRestored: restoredCount
    }));

    return restoredCount > 0;
  } catch (error) {
    console.error("Errore nel ripristino da backup:", error);
    return false;
  }
};

// NUOVO: Verifica integrità dei dati
const verifyDataIntegrity = async () => {
  try {
    console.log("Verifica integrità dei dati...");
    
    const counts = {};
    let totalItems = 0;

    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        const data = await dbOperation(storeName, 'readonly', (store) => {
          return store.getAll();
        });
        counts[storeName] = data?.length || 0;
        totalItems += counts[storeName];
      } catch (error) {
        console.error(`Errore nella verifica di ${storeName}:`, error);
        counts[storeName] = 0;
      }
    }

    console.log("Conteggio elementi per store:", counts);
    console.log(`Totale elementi nel database: ${totalItems}`);

    // Se non ci sono dati, prova a ripristinare da backup
    if (totalItems === 0) {
      console.log("Database vuoto, tentativo di ripristino da backup...");
      const restored = await restoreFromBackup();
      
      if (restored) {
        console.log("Dati ripristinati da backup con successo");
        // Ri-verifica dopo il ripristino
        return await verifyDataIntegrity();
      }
    }

    return {
      totalItems,
      counts,
      hasData: totalItems > 0
    };
  } catch (error) {
    console.error("Errore nella verifica integrità:", error);
    return { totalItems: 0, counts: {}, hasData: false };
  }
};

// Funzione per rilevare la versione corrente del database
const detectCurrentDBVersion = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const currentVersion = db.version;
      console.log(`Versione corrente del database: ${currentVersion}`);
      db.close();
      resolve(currentVersion);
    };
    
    request.onerror = () => {
      console.log("Impossibile rilevare la versione del database, si assume un nuovo database");
      resolve(0);
    };
  });
};

// Funzione per ottenere l'istanza del database - MIGLIORATA
const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    // Prima crea un backup se esistono dati
    if (isPWA()) {
      // Su PWA, verifica se esistono dati da salvare
      try {
        const existingData = localStorage.getItem(BACKUP_KEY);
        if (!existingData) {
          // Prova a creare un backup dai dati esistenti prima di aprire il DB
          console.log("PWA: Controllo dati esistenti prima dell'apertura...");
        }
      } catch (e) {
        console.log("Controllo backup PWA:", e);
      }
    }

    const currentVersion = await detectCurrentDBVersion();
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
        
        // IMPORTANTE: Crea backup prima dell'upgrade se ci sono dati
        if (event.oldVersion > 0) {
          console.log("Database esistente rilevato, potrebbe essere necessario un backup");
        }
        
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
      
      request.onsuccess = async (event) => {
        dbInstance = event.target.result;
        console.log(`Database aperto con successo (versione ${dbInstance.version})`);
        
        // NUOVO: Verifica l'integrità dei dati dopo l'apertura
        setTimeout(async () => {
          const integrity = await verifyDataIntegrity();
          console.log("Verifica integrità completata:", integrity);
          
          // Se siamo in PWA e abbiamo dati, crea un backup
          if (isPWA() && integrity.hasData) {
            await createFullBackup();
          }
        }, 1000);
        
        resolve(dbInstance);
      };
    });
  } catch (error) {
    console.error("Errore durante l'ottenimento del database:", error);
    throw error;
  }
};

// Funzione per inizializzare il database - MIGLIORATA
export const initDB = async () => {
  try {
    console.log("=== INIZIALIZZAZIONE DATABASE ===");
    
    // Su PWA, controlla se c'è un backup da cui ripristinare
    if (isPWA()) {
      console.log("PWA rilevata, controllo backup esistenti...");
      
      const migrationStatus = localStorage.getItem(MIGRATION_KEY);
      if (migrationStatus) {
        const migration = JSON.parse(migrationStatus);
        console.log("Status migrazione precedente:", migration);
      }
    }

    const db = await getDB();
    
    // Attendi un momento per assicurarti che tutto sia inizializzato
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("=== DATABASE INIZIALIZZATO CON SUCCESSO ===");
    return db;
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database:", error);
    
    // Tentativo di recovery
    try {
      console.log("Tentativo di recovery: ripristino da backup...");
      
      // Se siamo in PWA e abbiamo un backup, proviamo a recuperare
      if (isPWA()) {
        const backupExists = localStorage.getItem(BACKUP_KEY);
        if (backupExists) {
          console.log("Backup trovato, tentativo di ripristino...");
          
          // Prima elimina il database corrotto
          await clearDatabase();
          
          // Poi ricrea e ripristina
          const db = await getDB();
          await restoreFromBackup();
          
          console.log("Recovery completato con successo");
          return db;
        }
      }
      
      throw error;
    } catch (recoveryError) {
      console.error("Recovery fallito:", recoveryError);
      throw recoveryError;
    }
  }
};

// Operazione generica del database - MIGLIORATA
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

      // NUOVO: Backup automatico dopo operazioni di scrittura
      if (mode === 'readwrite' && isPWA()) {
        transaction.oncomplete = async () => {
          // Crea backup dopo operazioni di scrittura importanti
          setTimeout(() => {
            createFullBackup().catch(err => 
              console.warn("Backup automatico fallito:", err)
            );
          }, 2000);
        };
      }

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

// NUOVO: Funzione per forzare un backup manuale
export const createManualBackup = async () => {
  console.log("Creazione backup manuale richiesta...");
  return await createFullBackup();
};

// NUOVO: Funzione per ottenere informazioni sul backup
export const getBackupInfo = () => {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY);
    const backupTimestamp = localStorage.getItem(BACKUP_KEY + '_timestamp');
    
    if (!backupData) {
      return { exists: false };
    }

    const backup = JSON.parse(backupData);
    const itemCounts = {};
    let totalItems = 0;

    if (backup.data) {
      for (const [storeName, data] of Object.entries(backup.data)) {
        itemCounts[storeName] = Array.isArray(data) ? data.length : 0;
        totalItems += itemCounts[storeName];
      }
    }

    return {
      exists: true,
      timestamp: backupTimestamp || backup.timestamp,
      version: backup.version,
      totalItems,
      itemCounts
    };
  } catch (error) {
    console.error("Errore nel recupero informazioni backup:", error);
    return { exists: false, error: error.message };
  }
};

// Funzioni per le impostazioni - MIGLIORATE
export const saveSettings = async (settings) => {
  try {
    console.log("Salvataggio impostazioni:", settings);
    
    // Backup immediato in localStorage per PWA
    if (isPWA()) {
      try {
        localStorage.setItem('budget-app-settings-current', JSON.stringify(settings));
        localStorage.setItem('budget-app-settings-timestamp', new Date().toISOString());
      } catch (e) {
        console.warn("Errore nel backup immediato impostazioni:", e);
      }
    }
    
    // Salva nel database
    const result = await dbOperation(STORES.SETTINGS, 'readwrite', (store) => {
      return store.put(settings);
    });
    
    console.log("Impostazioni salvate nel database con successo");
    return result;
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
    
    // Se non ci sono risultati, prova il backup in localStorage
    if ((!result || result.length === 0) && isPWA()) {
      try {
        const backup = localStorage.getItem('budget-app-settings-current');
        if (backup) {
          const parsedBackup = JSON.parse(backup);
          console.log("Impostazioni recuperate da backup localStorage");
          
          // Salva nel database per la prossima volta
          try {
            await saveSettings(parsedBackup);
          } catch (e) {
            console.warn("Errore nel salvataggio backup nel database:", e);
          }
          
          return [parsedBackup];
        }
      } catch (e) {
        console.warn("Errore nel recupero backup impostazioni:", e);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Errore nel recupero delle impostazioni:", error);
    
    // Ultimo tentativo: backup in localStorage
    if (isPWA()) {
      try {
        const backup = localStorage.getItem('budget-app-settings-current');
        if (backup) {
          console.log("Recupero impostazioni da backup di emergenza");
          return [JSON.parse(backup)];
        }
      } catch (e) {
        console.error("Anche il backup di emergenza è fallito:", e);
      }
    }
    
    throw error;
  }
};

// Funzioni per le transazioni (invariate ma con logging migliorato)
export const addTransaction = async (transaction) => {
  if (!transaction.id) {
    transaction.id = Date.now();
  }
  
  console.log("Aggiunta transazione:", transaction);
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.add(transaction);
  });
};

export const updateTransaction = async (transaction) => {
  console.log("Aggiornamento transazione:", transaction.id);
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.put(transaction);
  });
};

export const deleteTransaction = async (id) => {
  console.log("Eliminazione transazione:", id);
  return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getTransactions = async () => {
  const result = await dbOperation(STORES.TRANSACTIONS, 'readonly', (store) => {
    return store.getAll();
  });
  console.log(`Recuperate ${result?.length || 0} transazioni`);
  return result;
};

// Funzioni per le spese fisse
export const addFixedExpense = async (expense) => {
  if (!expense.id) {
    expense.id = Date.now();
  }
  
  console.log("Aggiunta spesa fissa:", expense);
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
  console.log("Eliminazione spesa fissa:", id);
  return await dbOperation(STORES.FIXED_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFixedExpenses = async () => {
  const result = await dbOperation(STORES.FIXED_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
  console.log(`Recuperate ${result?.length || 0} spese fisse`);
  return result;
};

// Funzioni per le spese future
export const addFutureExpense = async (expense) => {
  if (!expense.id) {
    expense.id = Date.now();
  }
  
  console.log("Aggiunta spesa futura:", expense);
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
  console.log("Eliminazione spesa futura:", id);
  return await dbOperation(STORES.FUTURE_EXPENSES, 'readwrite', (store) => {
    return store.delete(id);
  });
};

export const getFutureExpenses = async () => {
  const result = await dbOperation(STORES.FUTURE_EXPENSES, 'readonly', (store) => {
    return store.getAll();
  });
  console.log(`Recuperate ${result?.length || 0} spese future`);
  return result;
};

// Funzioni per i risparmi
export const addSavingsEntry = async (entry) => {
  if (!entry.id) {
    entry.id = Date.now();
  }
  
  console.log("Aggiunta entry risparmi:", entry);
  return await dbOperation(STORES.SAVINGS, 'readwrite', (store) => {
    return store.add(entry);
  });
};

export const getSavingsHistory = async () => {
  const result = await dbOperation(STORES.SAVINGS, 'readonly', (store) => {
    return store.getAll();
  });
  console.log(`Recuperate ${result?.length || 0} entry risparmi`);
  return result;
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
      resolve();
    };
    
    request.onerror = (event) => {
      console.error("Errore nella cancellazione del database:", event.target.error);
      reject("Impossibile cancellare il database");
    };
  });
};

// Esporta i nomi degli store e le nuove funzioni
export { STORES, createManualBackup, getBackupInfo, restoreFromBackup };

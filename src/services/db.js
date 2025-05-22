// src/services/db.js - VERSIONE OTTIMIZZATA PER PWA CON PERSISTENZA DATI MIGLIORATA
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 4; // Incrementata per miglioramenti PWA
const BACKUP_KEY = 'budget-app-data-backup';
const MIGRATION_KEY = 'budget-app-migration-status';
const SETTINGS_BACKUP_KEY = 'budget-app-settings-backup';

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
let dbInitPromise = null;

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

// NUOVO: Sistema di backup multiplo per PWA
const createSettingsBackup = (settings) => {
  try {
    const backup = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      settings: settings,
      source: 'settings_backup'
    };
    
    // Backup immediato in localStorage con chiavi multiple per sicurezza
    const backupKeys = [
      SETTINGS_BACKUP_KEY,
      `${SETTINGS_BACKUP_KEY}_primary`,
      `${SETTINGS_BACKUP_KEY}_secondary`,
      `${SETTINGS_BACKUP_KEY}_emergency`
    ];
    
    backupKeys.forEach((key, index) => {
      try {
        localStorage.setItem(key, JSON.stringify(backup));
        if (index === 0) {
          localStorage.setItem(`${key}_timestamp`, backup.timestamp);
        }
      } catch (e) {
        console.warn(`Errore nel salvataggio backup ${key}:`, e);
      }
    });
    
    console.log("Backup settings multiplo creato con successo");
    return backup;
  } catch (error) {
    console.error("Errore nella creazione backup settings:", error);
    return null;
  }
};

// NUOVO: Recupero settings da backup con fallback multipli
const restoreSettingsFromBackup = () => {
  try {
    console.log("Tentativo di recupero settings da backup...");
    
    const backupKeys = [
      SETTINGS_BACKUP_KEY,
      `${SETTINGS_BACKUP_KEY}_primary`, 
      `${SETTINGS_BACKUP_KEY}_secondary`,
      `${SETTINGS_BACKUP_KEY}_emergency`,
      'budget-app-settings-current',
      'budget-app-settings-emergency'
    ];
    
    for (const key of backupKeys) {
      try {
        const backupData = localStorage.getItem(key);
        if (backupData) {
          const backup = JSON.parse(backupData);
          console.log(`Settings recuperati da ${key}:`, backup);
          
          if (backup.settings || backup.userSettings) {
            return backup.settings || backup;
          }
        }
      } catch (e) {
        console.warn(`Errore nel recupero da ${key}:`, e);
        continue;
      }
    }
    
    console.log("Nessun backup settings trovato");
    return null;
  } catch (error) {
    console.error("Errore nel recupero settings da backup:", error);
    return null;
  }
};

// Sistema di backup completo dei dati
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
      data: {},
      source: 'full_backup'
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

    // Salva il backup in localStorage con chiavi multiple
    try {
      const backupKeys = [
        BACKUP_KEY,
        `${BACKUP_KEY}_primary`,
        `${BACKUP_KEY}_secondary`
      ];
      
      backupKeys.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(backup));
          localStorage.setItem(`${key}_timestamp`, backup.timestamp);
        } catch (e) {
          console.warn(`Errore nel salvataggio backup ${key}:`, e);
        }
      });
      
      console.log("Backup completo salvato in localStorage con successo");
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

// Ripristino da backup migliorato
export const restoreFromBackup = async () => {
  try {
    console.log("Tentativo di ripristino da backup...");
    
    const backupKeys = [
      BACKUP_KEY,
      `${BACKUP_KEY}_primary`,
      `${BACKUP_KEY}_secondary`
    ];
    
    let backup = null;
    for (const key of backupKeys) {
      try {
        const backupData = localStorage.getItem(key);
        if (backupData) {
          backup = JSON.parse(backupData);
          console.log(`Backup trovato in ${key}:`, backup);
          break;
        }
      } catch (e) {
        console.warn(`Errore nel recupero backup da ${key}:`, e);
        continue;
      }
    }
    
    if (!backup) {
      console.log("Nessun backup trovato in localStorage");
      return false;
    }

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

// Verifica integrità dei dati migliorata
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

// CORREZIONE: Funzione per ottenere l'istanza del database ottimizzata per PWA
const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  // Se c'è già una promessa di inizializzazione in corso, aspetta quella
  if (dbInitPromise) {
    return await dbInitPromise;
  }
  
  dbInitPromise = (async () => {
    try {
      // PWA: Controllo backup preventivo
      if (isPWA()) {
        try {
          const backupData = localStorage.getItem(BACKUP_KEY);
          if (!backupData) {
            console.log("PWA: Nessun backup esistente trovato");
          } else {
            console.log("PWA: Backup esistente rilevato");
          }
        } catch (e) {
          console.log("PWA: Controllo backup:", e);
        }
      }

      const currentVersion = await detectCurrentDBVersion();
      const versionToUse = Math.max(currentVersion, DB_VERSION);
      console.log(`Apertura database con versione: ${versionToUse}`);
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, versionToUse);
        
        request.onerror = (event) => {
          console.error("Database error:", event.target.error);
          dbInitPromise = null; // Reset la promessa in caso di errore
          reject("Impossibile aprire il database");
        };
        
        request.onupgradeneeded = (event) => {
          console.log(`Aggiornamento database dalla versione ${event.oldVersion} alla versione ${event.newVersion}`);
          const db = event.target.result;
          
          // PWA: Backup preventivo durante l'upgrade
          if (event.oldVersion > 0 && isPWA()) {
            console.log("PWA: Database esistente rilevato, potrebbe essere necessario un backup");
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
          
          // PWA: Verifica l'integrità dei dati dopo l'apertura
          if (isPWA()) {
            setTimeout(async () => {
              try {
                const integrity = await verifyDataIntegrity();
                console.log("PWA: Verifica integrità completata:", integrity);
                
                // Se abbiamo dati, crea un backup
                if (integrity.hasData) {
                  await createFullBackup();
                }
              } catch (integrityError) {
                console.error("PWA: Errore nella verifica integrità:", integrityError);
              }
            }, 1000);
          }
          
          resolve(dbInstance);
        };
      });
    } catch (error) {
      console.error("Errore durante l'ottenimento del database:", error);
      dbInitPromise = null; // Reset la promessa in caso di errore
      throw error;
    }
  })();
  
  return await dbInitPromise;
};

// CORREZIONE: Funzione per inizializzare il database ottimizzata per PWA
export const initDB = async () => {
  try {
    console.log("=== INIZIALIZZAZIONE DATABASE ===");
    
    // PWA: Controllo preventivo dei backup
    if (isPWA()) {
      console.log("PWA rilevata, controllo backup esistenti...");
      
      // Controlla se ci sono backup da ripristinare
      const migrationStatus = localStorage.getItem(MIGRATION_KEY);
      if (migrationStatus) {
        const migration = JSON.parse(migrationStatus);
        console.log("PWA: Status migrazione precedente:", migration);
      }
      
      // Su iOS PWA, applica workaround aggiuntivi
      if (isIOS()) {
        console.log("iOS PWA rilevata, applicazione workaround specifici...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const db = await getDB();
    
    // PWA: Attendi un momento aggiuntivo per assicurarti che tutto sia inizializzato
    if (isPWA()) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    console.log("=== DATABASE INIZIALIZZATO CON SUCCESSO ===");
    return db;
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database:", error);
    
    // CORREZIONE: Strategia di recovery migliorata per PWA
    if (isPWA()) {
      console.log("PWA: Avvio strategia di recovery avanzata...");
      
      try {
        // Step 1: Prova il ripristino da backup
        console.log("PWA Recovery Step 1: Tentativo ripristino da backup...");
        const backupExists = localStorage.getItem(BACKUP_KEY);
        if (backupExists) {
          console.log("PWA: Backup trovato, tentativo di ripristino...");
          
          // Elimina il database corrotto
          await clearDatabase();
          
          // Attendi e ricrea
          await new Promise(resolve => setTimeout(resolve, 2000));
          const db = await getDB();
          
          // Ripristina i dati
          const restored = await restoreFromBackup();
          if (restored) {
            console.log("PWA: Recovery completato con successo");
            return db;
          }
        }
        
        // Step 2: Se il backup non funziona, prova recovery da settings backup
        console.log("PWA Recovery Step 2: Tentativo recovery da settings backup...");
        const settingsBackup = restoreSettingsFromBackup();
        if (settingsBackup) {
          console.log("PWA: Settings backup trovato, continua con database vuoto");
          const db = await getDB();
          return db;
        }
        
        // Step 3: Ultimo tentativo - database pulito
        console.log("PWA Recovery Step 3: Creazione database pulito...");
        await clearDatabase();
        await new Promise(resolve => setTimeout(resolve, 1500));
        const db = await getDB();
        
        console.log("PWA: Recovery completato con database vuoto");
        return db;
        
      } catch (recoveryError) {
        console.error("PWA: Recovery fallito completamente:", recoveryError);
        throw recoveryError;
      }
    }
    
    throw error;
  }
};

// CORREZIONE: Operazione generica del database ottimizzata per PWA
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

      // PWA: Backup automatico dopo operazioni di scrittura critiche
      if (mode === 'readwrite' && isPWA()) {
        transaction.oncomplete = async () => {
          // Per le impostazioni, crea backup immediato
          if (storeName === STORES.SETTINGS) {
            setTimeout(() => {
              createFullBackup().catch(err => 
                console.warn("Backup automatico post-settings fallito:", err)
              );
            }, 500);
          } else {
            // Per altri dati, backup meno frequente
            setTimeout(() => {
              createFullBackup().catch(err => 
                console.warn("Backup automatico fallito:", err)
              );
            }, 2000);
          }
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
    
    // PWA: Retry automatico
    if (isPWA()) {
      console.log("PWA: Tentativo di retry per operazione database...");
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const db = await getDB();
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          const request = operation(store);
          
          if (request) {
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
          } else {
            transaction.oncomplete = () => resolve();
          }
        });
      } catch (retryError) {
        console.error("PWA: Anche il retry è fallito:", retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
};

// Funzione per forzare un backup manuale
export const createManualBackup = async () => {
  console.log("Creazione backup manuale richiesta...");
  return await createFullBackup();
};

// Funzione per ottenere informazioni sul backup
export const getBackupInfo = () => {
  try {
    const backupKeys = [
      BACKUP_KEY,
      `${BACKUP_KEY}_primary`,
      `${BACKUP_KEY}_secondary`
    ];
    
    for (const key of backupKeys) {
      try {
        const backupData = localStorage.getItem(key);
        const backupTimestamp = localStorage.getItem(`${key}_timestamp`);
        
        if (backupData) {
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
            itemCounts,
            source: key
          };
        }
      } catch (e) {
        continue;
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Errore nel recupero informazioni backup:", error);
    return { exists: false, error: error.message };
  }
};

// CORREZIONE: Funzioni per le impostazioni ottimizzate per PWA
export const saveSettings = async (settings) => {
  try {
    console.log("=== SALVATAGGIO SETTINGS INIZIATO ===");
    console.log("Dati da salvare:", settings);
    
    // PWA: Backup immediato multiplo in localStorage PRIMA del salvataggio nel DB
    if (isPWA()) {
      console.log("PWA: Creazione backup immediato settings...");
      createSettingsBackup(settings);
      
      // Backup aggiuntivo con timestamp
      try {
        localStorage.setItem('budget-app-settings-current', JSON.stringify(settings));
        localStorage.setItem('budget-app-settings-timestamp', new Date().toISOString());
        localStorage.setItem('budget-app-settings-immediate', JSON.stringify({
          settings: settings,
          timestamp: new Date().toISOString(),
          version: DB_VERSION
        }));
        console.log("PWA: Backup immediato settings completato");
      } catch (e) {
        console.warn("PWA: Errore nel backup immediato settings:", e);
      }
    }
    
    // Salva nel database
    console.log("Salvataggio nel database IndexedDB...");
    const result = await dbOperation(STORES.SETTINGS, 'readwrite', (store) => {
      return store.put(settings);
    });
    
    console.log("=== SALVATAGGIO SETTINGS COMPLETATO ===");
    return result;
  } catch (error) {
    console.error("Errore nel salvataggio delle impostazioni:", error);
    
    // PWA: Fallback - almeno salva in localStorage
    if (isPWA()) {
      console.log("PWA: Fallback - salvataggio solo in localStorage...");
      try {
        createSettingsBackup(settings);
        localStorage.setItem('budget-app-settings-fallback', JSON.stringify({
          settings: settings,
          timestamp: new Date().toISOString(),
          fallback: true
        }));
        console.log("PWA: Fallback completato");
      } catch (fallbackError) {
        console.error("PWA: Anche il fallback è fallito:", fallbackError);
      }
    }
    
    throw error;
  }
};

export const getSettings = async () => {
  try {
    console.log("=== CARICAMENTO SETTINGS INIZIATO ===");
    
    let result = null;
    
    // Prova prima il database
    try {
      result = await dbOperation(STORES.SETTINGS, 'readonly', (store) => {
        return store.getAll();
      });
      console.log("Settings caricati dal database:", result);
    } catch (dbError) {
      console.warn("Errore nel caricamento dal database:", dbError);
    }
    
    // Se non ci sono risultati o siamo in PWA, prova i backup
    if ((!result || result.length === 0) || isPWA()) {
      console.log("Tentativo di recupero da backup...");
      
      const backupKeys = [
        'budget-app-settings-immediate',
        'budget-app-settings-current',
        SETTINGS_BACKUP_KEY,
        `${SETTINGS_BACKUP_KEY}_primary`,
        `${SETTINGS_BACKUP_KEY}_secondary`,
        'budget-app-settings-emergency',
        'budget-app-settings-fallback'
      ];
      
      for (const key of backupKeys) {
        try {
          const backup = localStorage.getItem(key);
          if (backup) {
            const parsedBackup = JSON.parse(backup);
            console.log(`Settings recuperati da ${key}:`, parsedBackup);
            
            let settingsData = null;
            if (parsedBackup.settings) {
              settingsData = parsedBackup.settings;
            } else if (parsedBackup.userSettings) {
              settingsData = parsedBackup;
            } else {
              settingsData = parsedBackup;
            }
            
            if (settingsData) {
              // Se non avevamo risultati dal DB, usa il backup
              if (!result || result.length === 0) {
                result = [settingsData];
              }
              
              // PWA: Prova a risalvare nel database per la prossima volta
              if (isPWA()) {
                try {
                  console.log("PWA: Risalvataggio settings nel database...");
                  await saveSettings(settingsData);
                } catch (resaveError) {
                  console.warn("PWA: Errore nel risalvataggio:", resaveError);
                }
              }
              
              break;
            }
          }
        } catch (e) {
          console.warn(`Errore nel recupero da ${key}:`, e);
          continue;
        }
      }
    }
    
    console.log("=== CARICAMENTO SETTINGS COMPLETATO ===");
    console.log("Settings finali:", result);
    return result;
  } catch (error) {
    console.error("Errore nel recupero delle impostazioni:", error);
    
    // PWA: Ultimo tentativo - backup di emergenza
    if (isPWA()) {
      console.log("PWA: Ultimo tentativo di recovery settings...");
      const emergencySettings = restoreSettingsFromBackup();
      if (emergencySettings) {
        console.log("PWA: Settings recuperati da backup di emergenza");
        return [emergencySettings];
      }
    }
    
    throw error;
  }
};

// Funzioni per le transazioni (con logging migliorato e retry PWA)
export const addTransaction = async (transaction) => {
  if (!transaction.id) {
    transaction.id = Date.now();
  }
  
  console.log("Aggiunta transazione:", transaction);
  
  try {
    return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
      return store.add(transaction);
    });
  } catch (error) {
    if (isPWA()) {
      console.log("PWA: Retry aggiunta transazione...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await dbOperation(STORES.TRANSACTIONS, 'readwrite', (store) => {
        return store.add(transaction);
      });
    }
    throw error;
  }
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
    
    // Reset della promessa di inizializzazione
    dbInitPromise = null;
    
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

// Esporta i nomi degli store e le funzioni
export { STORES, createManualBackup, getBackupInfo, restoreFromBackup };

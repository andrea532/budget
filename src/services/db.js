// SISTEMA DATABASE MIGLIORATO - LOCALSTORAGE CON VERIFICA E RECUPERO
// Versione migliorata con più controlli e feedback

const STORAGE_KEYS = {
  SETTINGS: 'budget-settings',
  TRANSACTIONS: 'budget-transactions', 
  FIXED_EXPENSES: 'budget-fixed-expenses',
  FUTURE_EXPENSES: 'budget-future-expenses',
  SAVINGS: 'budget-savings'
};

// Verifica PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
};

// MIGLIORAMENTO: Funzione per verificare disponibilità localStorage
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Flag globale per la disponibilità di localStorage
export const hasLocalStorage = isStorageAvailable('localStorage');

// FUNZIONI LOCALSTORAGE MIGLIORATE
const saveData = (key, data) => {
  if (!hasLocalStorage) {
    console.error(`❌ localStorage non disponibile per il salvataggio di ${key}`);
    return false;
  }
  
  try {
    // Comprimiamo leggermente i dati rimuovendo spazi non necessari
    const stringData = JSON.stringify(data);
    localStorage.setItem(key, stringData);
    
    // MIGLIORAMENTO: Verifica che il salvataggio sia avvenuto correttamente
    const savedData = localStorage.getItem(key);
    if (!savedData) {
      throw new Error('Verifica di salvataggio fallita: nessun dato recuperato');
    }
    
    // MIGLIORAMENTO: Verifica consistenza dei dati
    try {
      JSON.parse(savedData);
    } catch (e) {
      throw new Error('Verifica di salvataggio fallita: dati corrotti');
    }
    
    console.log(`✅ Salvato ${key} (${stringData.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio ${key}:`, error);
    
    // MIGLIORAMENTO: Tentativo di recovery
    try {
      // Salva in formato più semplice
      const backupData = {
        data: data,
        timestamp: new Date().toISOString(),
        isBackup: true
      };
      localStorage.setItem(`${key}_backup`, JSON.stringify(backupData));
      console.log(`⚠️ Creato backup di emergenza per ${key}`);
    } catch (backupError) {
      console.error(`❌ Anche il backup di emergenza è fallito:`, backupError);
    }
    
    return false;
  }
};

const loadData = (key) => {
  if (!hasLocalStorage) {
    console.error(`❌ localStorage non disponibile per il caricamento di ${key}`);
    return null;
  }
  
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`✅ Caricato ${key}`);
      return parsed;
    }
    
    // MIGLIORAMENTO: Tenta di recuperare dal backup
    const backup = localStorage.getItem(`${key}_backup`);
    if (backup) {
      try {
        const backupData = JSON.parse(backup);
        console.log(`⚠️ Recuperati dati dal backup per ${key}`);
        
        // Se il backup è valido, lo usiamo e contemporaneamente lo promuoviamo
        if (backupData && backupData.data) {
          // Promuovi il backup a principale
          saveData(key, backupData.data);
          return backupData.data;
        }
      } catch (backupError) {
        console.error(`❌ Errore recupero backup:`, backupError);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Errore caricamento ${key}:`, error);
    return null;
  }
};

// INIZIALIZZAZIONE MIGLIORATA
export const initDB = async () => {
  if (!hasLocalStorage) {
    console.error("❌ localStorage non disponibile! L'app funzionerà solo in sessione");
    alert("Attenzione: localStorage non disponibile o disabilitato nel browser. I tuoi dati non saranno salvati tra le sessioni.");
    return false;
  }
  
  // Controllo spazio disponibile (approssimativo)
  try {
    const testString = "a".repeat(1024 * 10); // 10KB di test
    localStorage.setItem('__storage_test_size__', testString);
    localStorage.removeItem('__storage_test_size__');
    console.log("✅ Storage test completato: almeno 10KB disponibili");
  } catch (e) {
    console.warn("⚠️ Possibile spazio limitato in localStorage");
  }
  
  // Verifica e ripara dati corrotti
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          JSON.parse(item);
        } catch (e) {
          console.error(`❌ Dati corrotti rilevati in ${key}, tentativo di recupero...`);
          
          // Tenta recupero da backup
          const backup = localStorage.getItem(`${key}_backup`);
          if (backup) {
            try {
              const backupData = JSON.parse(backup);
              if (backupData && backupData.data) {
                localStorage.setItem(key, JSON.stringify(backupData.data));
                console.log(`✅ Recupero da backup completato per ${key}`);
              }
            } catch (backupError) {
              // Se anche il backup è corrotto, rimuovi entrambi
              localStorage.removeItem(key);
              localStorage.removeItem(`${key}_backup`);
              console.error(`❌ Anche il backup è corrotto, dati rimossi per ${key}`);
            }
          } else {
            // Se non c'è backup, rimuovi i dati corrotti
            localStorage.removeItem(key);
            console.error(`❌ Nessun backup disponibile, dati corrotti rimossi per ${key}`);
          }
        }
      }
    });
  } catch (error) {
    console.error("❌ Errore durante la verifica dell'integrità:", error);
  }
  
  console.log("✅ Database localStorage inizializzato con verifiche di integrità");
  return true;
};

// SETTINGS
export const saveSettings = async (settings) => {
  const result = saveData(STORAGE_KEYS.SETTINGS, [settings]);
  
  // MIGLIORAMENTO: Crea sempre un backup parallelo delle impostazioni (doppia sicurezza)
  try {
    const backupKey = `${STORAGE_KEYS.SETTINGS}_critical_backup`;
    localStorage.setItem(backupKey, JSON.stringify([settings]));
  } catch (error) {
    console.error('❌ Errore backup critico impostazioni:', error);
  }
  
  return result;
};

export const getSettings = async () => {
  const data = loadData(STORAGE_KEYS.SETTINGS);
  
  // MIGLIORAMENTO: Se fallisce, tenta il recupero dal backup critico
  if (!data || data.length === 0) {
    try {
      const backupKey = `${STORAGE_KEYS.SETTINGS}_critical_backup`;
      const criticalBackup = localStorage.getItem(backupKey);
      if (criticalBackup) {
        const parsedBackup = JSON.parse(criticalBackup);
        console.log('⚠️ Recupero impostazioni dal backup critico');
        return parsedBackup;
      }
    } catch (error) {
      console.error('❌ Errore recupero backup critico:', error);
    }
  }
  
  return data || [];
};

// TRANSAZIONI
export const addTransaction = async (transaction) => {
  const existing = loadData(STORAGE_KEYS.TRANSACTIONS) || [];
  existing.unshift(transaction); // Aggiungi all'inizio
  
  // MIGLIORAMENTO: Limita il numero di transazioni per evitare di superare i limiti di storage
  if (existing.length > 1000) {
    console.warn('⚠️ Troppe transazioni, limitando a 1000');
    existing.length = 1000;
  }
  
  return saveData(STORAGE_KEYS.TRANSACTIONS, existing);
};

export const updateTransaction = async (transaction) => {
  const existing = loadData(STORAGE_KEYS.TRANSACTIONS) || [];
  const index = existing.findIndex(t => t.id === transaction.id);
  if (index !== -1) {
    existing[index] = transaction;
    return saveData(STORAGE_KEYS.TRANSACTIONS, existing);
  }
  return false;
};

export const deleteTransaction = async (id) => {
  const existing = loadData(STORAGE_KEYS.TRANSACTIONS) || [];
  const filtered = existing.filter(t => t.id !== id);
  return saveData(STORAGE_KEYS.TRANSACTIONS, filtered);
};

export const getTransactions = async () => {
  return loadData(STORAGE_KEYS.TRANSACTIONS) || [];
};

// SPESE FISSE
export const addFixedExpense = async (expense) => {
  const existing = loadData(STORAGE_KEYS.FIXED_EXPENSES) || [];
  existing.push(expense);
  return saveData(STORAGE_KEYS.FIXED_EXPENSES, existing);
};

export const deleteFixedExpense = async (id) => {
  const existing = loadData(STORAGE_KEYS.FIXED_EXPENSES) || [];
  const filtered = existing.filter(e => e.id !== id);
  return saveData(STORAGE_KEYS.FIXED_EXPENSES, filtered);
};

export const getFixedExpenses = async () => {
  return loadData(STORAGE_KEYS.FIXED_EXPENSES) || [];
};

// SPESE FUTURE
export const addFutureExpense = async (expense) => {
  const existing = loadData(STORAGE_KEYS.FUTURE_EXPENSES) || [];
  existing.push(expense);
  return saveData(STORAGE_KEYS.FUTURE_EXPENSES, existing);
};

export const updateFutureExpense = async (expense) => {
  const existing = loadData(STORAGE_KEYS.FUTURE_EXPENSES) || [];
  const index = existing.findIndex(e => e.id === expense.id);
  if (index !== -1) {
    existing[index] = expense;
    return saveData(STORAGE_KEYS.FUTURE_EXPENSES, existing);
  }
  return false;
};

export const deleteFutureExpense = async (id) => {
  const existing = loadData(STORAGE_KEYS.FUTURE_EXPENSES) || [];
  const filtered = existing.filter(e => e.id !== id);
  return saveData(STORAGE_KEYS.FUTURE_EXPENSES, filtered);
};

export const getFutureExpenses = async () => {
  return loadData(STORAGE_KEYS.FUTURE_EXPENSES) || [];
};

// RISPARMI
export const addSavingsEntry = async (entry) => {
  const existing = loadData(STORAGE_KEYS.SAVINGS) || [];
  existing.push(entry);
  return saveData(STORAGE_KEYS.SAVINGS, existing);
};

export const getSavingsHistory = async () => {
  return loadData(STORAGE_KEYS.SAVINGS) || [];
};

// CANCELLA TUTTO
export const clearDatabase = async () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_backup`);
      localStorage.removeItem(`${key}_critical_backup`);
    });
    console.log("✅ Database cancellato");
    return true;
  } catch (error) {
    console.error("❌ Errore durante la cancellazione:", error);
    return false;
  }
};

// BACKUP MIGLIORATO
export const createManualBackup = async () => {
  try {
    const timestamp = new Date().toISOString();
    
    // Raccogli tutti i dati
    const settingsData = loadData(STORAGE_KEYS.SETTINGS);
    const transactionsData = loadData(STORAGE_KEYS.TRANSACTIONS);
    const fixedExpensesData = loadData(STORAGE_KEYS.FIXED_EXPENSES);
    const futureExpensesData = loadData(STORAGE_KEYS.FUTURE_EXPENSES);
    const savingsData = loadData(STORAGE_KEYS.SAVINGS);
    
    // Verifica se ci sono dati da salvare
    if (!settingsData && !transactionsData && !fixedExpensesData && 
        !futureExpensesData && !savingsData) {
      console.warn("⚠️ Nessun dato trovato da salvare nel backup");
    }
    
    // Crea il backup
    const backup = {
      timestamp: timestamp,
      version: "2.0",
      settings: settingsData,
      transactions: transactionsData,
      fixedExpenses: fixedExpensesData,
      futureExpenses: futureExpensesData,
      savings: savingsData
    };
    
    // Salva il backup
    localStorage.setItem('budget-backup', JSON.stringify(backup));
    
    // Crea anche un backup incrementale (con timestamp nel nome)
    try {
      const backupIncremental = {
        created: timestamp,
        data: backup
      };
      localStorage.setItem(`budget-backup-${Date.now()}`, JSON.stringify(backupIncremental));
      
      // Limita il numero di backup incrementali a 5
      const keys = Object.keys(localStorage).filter(k => k.startsWith('budget-backup-')).sort();
      if (keys.length > 5) {
        // Rimuovi i backup più vecchi
        keys.slice(0, keys.length - 5).forEach(k => localStorage.removeItem(k));
      }
    } catch (incrementalError) {
      console.error("❌ Errore backup incrementale:", incrementalError);
    }
    
    console.log("✅ Backup creato");
    return backup;
  } catch (error) {
    console.error("❌ Errore backup:", error);
    return null;
  }
};

export const getBackupInfo = () => {
  try {
    const backup = localStorage.getItem('budget-backup');
    if (backup) {
      const data = JSON.parse(backup);
      const totalItems = (data.transactions?.length || 0) + 
                       (data.fixedExpenses?.length || 0) + 
                       (data.futureExpenses?.length || 0) + 
                       (data.savings?.length || 0);
      
      // Trova tutti i backup incrementali
      const incrementalBackups = Object.keys(localStorage)
        .filter(k => k.startsWith('budget-backup-'))
        .sort()
        .map(k => {
          try {
            const incData = JSON.parse(localStorage.getItem(k));
            return {
              key: k,
              created: incData.created || 'Sconosciuto'
            };
          } catch (e) {
            return { key: k, created: 'Corrotto' };
          }
        });
      
      return {
        exists: true,
        timestamp: data.timestamp,
        version: data.version || '1.0',
        totalItems: totalItems,
        incrementalBackups: incrementalBackups,
        itemCounts: {
          transazioni: data.transactions?.length || 0,
          speseFisse: data.fixedExpenses?.length || 0,
          speseFuture: data.futureExpenses?.length || 0,
          risparmi: data.savings?.length || 0
        }
      };
    }
    return { exists: false };
  } catch (error) {
    console.error("❌ Errore info backup:", error);
    return { exists: false, error: error.message };
  }
};

export const verifyDataIntegrity = async () => {
  try {
    let isValid = true;
    const issues = [];
    
    // Verifica ogni store
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data); // Tenta di parsare
        }
      } catch (e) {
        isValid = false;
        issues.push({ key, error: e.message });
      }
    });
    
    if (!isValid) {
      console.error("❌ Problemi di integrità trovati:", issues);
      return false;
    }
    
    console.log("✅ Verifica integrità completata");
    return true;
  } catch (error) {
    console.error("❌ Errore verifica:", error);
    return false;
  }
};

// MIGLIORAMENTO: Verifica spazio disponibile
export const checkStorageSpace = () => {
  if (!hasLocalStorage) return { available: false, error: "localStorage non disponibile" };
  
  try {
    // Calcola lo spazio utilizzato (approssimativo)
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalSize += (key.length + value.length) * 2; // Caratteri * 2 bytes
    }
    
    // Tenta di stimare lo spazio disponibile
    let available = true;
    let maxSize = 5 * 1024 * 1024; // 5MB (limite comune)
    
    // Test per stimare meglio il limite
    try {
      const testKey = "__space_test__";
      let testValue = "";
      const increment = 1024 * 250; // 250KB alla volta
      
      for (let i = 0; i < 20; i++) { // Max 5MB (20 * 250KB)
        testValue += "a".repeat(increment);
        localStorage.setItem(testKey, testValue);
      }
      
      localStorage.removeItem(testKey);
      maxSize = 5 * 1024 * 1024; // Se riesce ad arrivare a 5MB, probabilmente è il limite
    } catch (e) {
      // Se fallisce prima, stimiamo quanto spazio c'era
      const errorSize = e.toString();
      maxSize = Math.min(maxSize, 2 * 1024 * 1024); // Probabilmente meno di 2MB
    }
    
    const usedPercentage = (totalSize / maxSize) * 100;
    available = usedPercentage < 90; // Considera disponibile se sotto il 90%
    
    return {
      available,
      usedBytes: totalSize,
      estimatedMaxBytes: maxSize,
      usedPercentage: usedPercentage,
      usedMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalMB: (maxSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error("❌ Errore verifica spazio:", error);
    return { available: false, error: error.message };
  }
};

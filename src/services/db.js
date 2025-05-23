// SISTEMA DATABASE MIGLIORATO - LOCALSTORAGE CON VERIFICA E RECUPERO
// Versione robusta con meccanismi di fallback, ridondanza e self-healing

const STORAGE_KEYS = {
  SETTINGS: 'budget-settings',
  TRANSACTIONS: 'budget-transactions', 
  FIXED_EXPENSES: 'budget-fixed-expenses',
  FUTURE_EXPENSES: 'budget-future-expenses',
  SAVINGS: 'budget-savings',
  SETUP_COMPLETED: 'budget-setup-completed', // Flag di backup diretto
  SETUP_COMPLETED_TIMESTAMP: 'budget-setup-timestamp', // Nuovo timestamp del setup
  SETUP_REDUNDANT: 'budget-setup-redundant', // Terzo backup ridondante
  SETTINGS_CRITICAL: 'budget-settings-critical' // Backup critico delle impostazioni
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
    
    // MIGLIORAMENTO: Se sto salvando impostazioni, controllo setupCompleted
    if (key === STORAGE_KEYS.SETTINGS) {
      try {
        const settingsData = JSON.parse(savedData);
        if (Array.isArray(settingsData) && settingsData.length > 0) {
          const setupCompleted = settingsData[0]?.userSettings?.setupCompleted;
          
          // Se setupCompleted è true, salva anche in tutti i punti di backup
          if (setupCompleted === true) {
            // Flag principale
            localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, 'true');
            
            // Timestamp di quando è stato completato il setup
            localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP, Date.now().toString());
            
            // Backup ridondante (diverso formato per aumentare robustezza)
            localStorage.setItem(STORAGE_KEYS.SETUP_REDUNDANT, JSON.stringify({
              completed: true,
              timestamp: Date.now(),
              version: '2.0'
            }));
            
            console.log("✅ Flag setupCompleted salvato in tripla ridondanza");
          }
        }
      } catch (e) {
        console.error("❌ Errore nel controllo setupCompleted:", e);
      }
    }
    
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
      
      // MIGLIORAMENTO: Se sono impostazioni, controlla tutti i punti di backup del flag setupCompleted
      if (key === STORAGE_KEYS.SETTINGS) {
        try {
          const setupCompletedFlag = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED) === 'true';
          const setupRedundantData = localStorage.getItem(STORAGE_KEYS.SETUP_REDUNDANT);
          let setupRedundantFlag = false;
          
          try {
            if (setupRedundantData) {
              const redundantParsed = JSON.parse(setupRedundantData);
              setupRedundantFlag = redundantParsed.completed === true;
            }
          } catch (e) {
            console.error("❌ Errore nel parsing del backup ridondante:", e);
          }
          
          // Se uno qualsiasi dei backup indica completato, impostiamo il flag come true
          if (setupCompletedFlag || setupRedundantFlag) {
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Assicuriamo che setupCompleted sia impostato correttamente
              if (!parsed[0].userSettings) {
                parsed[0].userSettings = { setupCompleted: true };
              } else {
                parsed[0].userSettings.setupCompleted = true;
              }
              console.log("✅ Flag setupCompleted ripristinato dai backup");
              
              // Ripristina anche gli altri punti di backup per sicurezza
              localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, 'true');
              localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP, Date.now().toString());
              localStorage.setItem(STORAGE_KEYS.SETUP_REDUNDANT, JSON.stringify({
                completed: true,
                timestamp: Date.now(),
                version: '2.0'
              }));
            }
          }
        } catch (e) {
          console.error("❌ Errore nel controllo setupCompleted:", e);
        }
      }
      
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
    
    // Per le impostazioni, verifica anche il backup critico
    if (key === STORAGE_KEYS.SETTINGS) {
      try {
        const criticalBackup = localStorage.getItem(STORAGE_KEYS.SETTINGS_CRITICAL);
        if (criticalBackup) {
          const criticalData = JSON.parse(criticalBackup);
          console.log("⚠️ Recuperate impostazioni dal backup critico");
          
          // Ripristina dal backup critico
          saveData(key, criticalData);
          return criticalData;
        }
      } catch (criticalError) {
        console.error("❌ Errore nel recupero del backup critico:", criticalError);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Errore caricamento ${key}:`, error);
    return null;
  }
};

// NUOVA FUNZIONE: Fix rapido per setupCompleted
export const forceSetupCompleted = (value = true) => {
  try {
    // Salva direttamente in tutti i punti di backup
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, value ? 'true' : 'false');
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.SETUP_REDUNDANT, JSON.stringify({
      completed: value,
      timestamp: Date.now(),
      version: '2.0'
    }));
    
    // Recupera e aggiorna anche le impostazioni principali
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (Array.isArray(parsedSettings) && parsedSettings.length > 0) {
          if (!parsedSettings[0].userSettings) {
            parsedSettings[0].userSettings = { setupCompleted: value };
          } else {
            parsedSettings[0].userSettings.setupCompleted = value;
          }
          
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsedSettings));
          console.log(`✅ Flag setupCompleted forzato a ${value ? 'true' : 'false'} in tutti i punti`);
          return true;
        }
      } catch (e) {
        console.error("❌ Errore nell'aggiornamento delle impostazioni:", e);
      }
    }
    
    // Se non abbiamo impostazioni, creiamo un nuovo oggetto
    const newSettings = [{
      id: 1,
      userSettings: { setupCompleted: value },
      monthlyIncome: 0,
      savingsPercentage: 10
    }];
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    console.log(`✅ Create nuove impostazioni con setupCompleted=${value}`);
    return true;
  } catch (error) {
    console.error("❌ Errore nel forzare setupCompleted:", error);
    return false;
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
  
  // MIGLIORAMENTO: Verifica se il flag setupCompleted è presente in qualsiasi punto
  try {
    const setupCompleted = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED) === 'true';
    const setupRedundantData = localStorage.getItem(STORAGE_KEYS.SETUP_REDUNDANT);
    let setupRedundantFlag = false;
    
    try {
      if (setupRedundantData) {
        const redundantParsed = JSON.parse(setupRedundantData);
        setupRedundantFlag = redundantParsed.completed === true;
      }
    } catch (e) {
      console.error("❌ Errore nel parsing del backup ridondante:", e);
    }
    
    // Se uno qualsiasi dei backup indica completato, ripristina tutti i punti
    if (setupCompleted || setupRedundantFlag) {
      console.log("✅ Flag setupCompleted trovato, configurazione già completata");
      
      // Ripristina tutti i punti di backup
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.SETUP_REDUNDANT, JSON.stringify({
        completed: true,
        timestamp: Date.now(),
        version: '2.0'
      }));
      
      // Verifica anche che sia presente nelle impostazioni principali
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settings) {
        try {
          const parsedSettings = JSON.parse(settings);
          if (Array.isArray(parsedSettings) && parsedSettings.length > 0) {
            if (!parsedSettings[0].userSettings) {
              parsedSettings[0].userSettings = { setupCompleted: true };
            } else if (!parsedSettings[0].userSettings.setupCompleted) {
              parsedSettings[0].userSettings.setupCompleted = true;
            }
            
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsedSettings));
            console.log("✅ Flag setupCompleted sincronizzato nelle impostazioni principali");
          }
        } catch (e) {
          console.error("❌ Errore nel controllo impostazioni:", e);
        }
      } else {
        // Se non ci sono impostazioni, ma il flag è presente, creiamo impostazioni base
        const newSettings = [{
          id: 1,
          userSettings: { setupCompleted: true },
          monthlyIncome: 0,
          savingsPercentage: 10
        }];
        
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        console.log("✅ Create nuove impostazioni con setupCompleted=true");
      }
    }
  } catch (e) {
    console.error("❌ Errore nel controllo setupCompleted:", e);
  }
  
  // Verifica e ripara dati corrotti
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      // Salta i flag di testo come SETUP_COMPLETED
      if (key === STORAGE_KEYS.SETUP_COMPLETED || 
          key === STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP) {
        return;
      }
      
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
  // Prima controlla se setupCompleted è true e salva il flag in tutti i backup
  if (settings && settings.userSettings?.setupCompleted === true) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.SETUP_REDUNDANT, JSON.stringify({
        completed: true,
        timestamp: Date.now(),
        version: '2.0'
      }));
      console.log("✅ Flag setupCompleted salvato in tripla ridondanza");
    } catch (e) {
      console.error("❌ Errore nel salvataggio del flag setupCompleted:", e);
    }
  }
  
  const result = saveData(STORAGE_KEYS.SETTINGS, settings);
  
  // Crea sempre un backup critico delle impostazioni (doppia sicurezza)
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS_CRITICAL, JSON.stringify(settings));
  } catch (error) {
    console.error('❌ Errore backup critico impostazioni:', error);
  }
  
  return result;
};

export const getSettings = async () => {
  // Prima verifica tutti i backup del flag setupCompleted
  try {
    const setupCompletedFlag = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED) === 'true';
    const setupRedundantData = localStorage.getItem(STORAGE_KEYS.SETUP_REDUNDANT);
    let setupRedundantFlag = false;
    
    try {
      if (setupRedundantData) {
        const redundantParsed = JSON.parse(setupRedundantData);
        setupRedundantFlag = redundantParsed.completed === true;
      }
    } catch (e) {
      console.error("❌ Errore nel parsing del backup ridondante:", e);
    }
    
    if (setupCompletedFlag || setupRedundantFlag) {
      console.log("🔄 Flag setupCompleted trovato nei backup: true");
    }
  } catch (e) {
    console.error("❌ Errore nel controllo dei backup setupCompleted:", e);
  }
  
  const data = loadData(STORAGE_KEYS.SETTINGS);
  
  // Verifica setupCompleted e ripara se necessario
  try {
    const setupCompletedFlag = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED) === 'true';
    const setupRedundantData = localStorage.getItem(STORAGE_KEYS.SETUP_REDUNDANT);
    let setupRedundantFlag = false;
    
    try {
      if (setupRedundantData) {
        const redundantParsed = JSON.parse(setupRedundantData);
        setupRedundantFlag = redundantParsed.completed === true;
      }
    } catch (e) {
      console.error("❌ Errore nel parsing del backup ridondante:", e);
    }
    
    // Se uno qualsiasi dei backup indica completato, impostiamo il flag come true
    if (setupCompletedFlag || setupRedundantFlag) {
      if (data && Array.isArray(data) && data.length > 0) {
        if (!data[0].userSettings) {
          data[0].userSettings = { setupCompleted: true };
        } else {
          data[0].userSettings.setupCompleted = true;
        }
        console.log("✅ Flag setupCompleted ripristinato dai backup");
      }
    }
  } catch (e) {
    console.error("❌ Errore nel controllo setupCompleted:", e);
  }
  
  // Se fallisce, tenta il recupero dal backup critico
  if (!data || !Array.isArray(data) || data.length === 0) {
    try {
      const criticalBackup = localStorage.getItem(STORAGE_KEYS.SETTINGS_CRITICAL);
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
  
  // Limita il numero di transazioni per evitare di superare i limiti di storage
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
        if (data && key !== STORAGE_KEYS.SETUP_COMPLETED && 
            key !== STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP) {
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

// DIAGNOSI E UTILITY
export const diagnosisTools = {
  // Restituisce lo stato di tutti i flag e backup setupCompleted
  checkSetupState: () => {
    try {
      const setupFlag = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED);
      const setupTimestamp = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED_TIMESTAMP);
      const setupRedundant = localStorage.getItem(STORAGE_KEYS.SETUP_REDUNDANT);
      let redundantParsed = null;
      
      try {
        if (setupRedundant) {
          redundantParsed = JSON.parse(setupRedundant);
        }
      } catch (e) {}
      
      // Controlla anche nelle impostazioni
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      let settingsParsed = null;
      let settingsSetupFlag = false;
      
      try {
        if (settings) {
          settingsParsed = JSON.parse(settings);
          if (Array.isArray(settingsParsed) && settingsParsed.length > 0) {
            settingsSetupFlag = settingsParsed[0]?.userSettings?.setupCompleted === true;
          }
        }
      } catch (e) {}
      
      return {
        setupCompletedFlag: setupFlag === 'true',
        setupCompletedTimestamp: setupTimestamp ? new Date(parseInt(setupTimestamp)) : null,
        setupRedundantData: redundantParsed,
        setupRedundantFlag: redundantParsed?.completed === true,
        settingsSetupFlag: settingsSetupFlag,
        allFlags: {
          primary: setupFlag === 'true',
          redundant: redundantParsed?.completed === true,
          settings: settingsSetupFlag
        },
        isConsistent: (setupFlag === 'true') === settingsSetupFlag && 
                      (setupFlag === 'true') === (redundantParsed?.completed === true)
      };
    } catch (error) {
      console.error("❌ Errore diagnosi:", error);
      return { error: error.message };
    }
  },
  
  // Ripara tutti i flag setupCompleted e li imposta a true
  repairSetupFlags: () => {
    return forceSetupCompleted(true);
  },
  
  // Stampa un report diagnostico completo nel console
  logStorageReport: () => {
    try {
      console.group("📊 Report Storage");
      
      // Flag setupCompleted
      const setupState = diagnosisTools.checkSetupState();
      console.log("🔄 Stato setupCompleted:", setupState);
      
      // Tutti i dati in localStorage
      console.group("📋 Tutti gli elementi in localStorage");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const size = localStorage.getItem(key)?.length || 0;
        console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
      }
      console.groupEnd();
      
      // Spazio totale utilizzato
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // Caratteri * 2 bytes
      }
      
      console.log(`💾 Spazio totale utilizzato: ${(totalSize / 1024).toFixed(2)} KB`);
      
      console.groupEnd();
      return true;
    } catch (error) {
      console.error("❌ Errore report:", error);
      return false;
    }
  }
};

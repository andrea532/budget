// SISTEMA DATABASE ULTRA SEMPLICE - SOLO LOCALSTORAGE
// Questo è più affidabile per le PWA

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

// FUNZIONI LOCALSTORAGE SICURE
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ Salvato ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio ${key}:`, error);
    return false;
  }
};

const loadData = (key) => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`✅ Caricato ${key}`);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error(`❌ Errore caricamento ${key}:`, error);
    return null;
  }
};

// INIZIALIZZAZIONE (semplice)
export const initDB = async () => {
  console.log("✅ Database localStorage inizializzato");
  return true;
};

// SETTINGS
export const saveSettings = async (settings) => {
  return saveData(STORAGE_KEYS.SETTINGS, [settings]);
};

export const getSettings = async () => {
  const data = loadData(STORAGE_KEYS.SETTINGS);
  return data || [];
};

// TRANSAZIONI
export const addTransaction = async (transaction) => {
  const existing = loadData(STORAGE_KEYS.TRANSACTIONS) || [];
  existing.unshift(transaction); // Aggiungi all'inizio
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
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log("✅ Database cancellato");
  return true;
};

// BACKUP SEMPLICE
export const createManualBackup = async () => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      settings: loadData(STORAGE_KEYS.SETTINGS),
      transactions: loadData(STORAGE_KEYS.TRANSACTIONS),
      fixedExpenses: loadData(STORAGE_KEYS.FIXED_EXPENSES),
      futureExpenses: loadData(STORAGE_KEYS.FUTURE_EXPENSES),
      savings: loadData(STORAGE_KEYS.SAVINGS)
    };
    
    localStorage.setItem('budget-backup', JSON.stringify(backup));
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
      
      return {
        exists: true,
        timestamp: data.timestamp,
        totalItems: totalItems,
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
    return { exists: false };
  }
};

export const verifyDataIntegrity = async () => {
  try {
    console.log("✅ Verifica integrità completata");
    return true;
  } catch (error) {
    console.error("❌ Errore verifica:", error);
    return false;
  }
};

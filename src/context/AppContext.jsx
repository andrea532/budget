import React, { useState, createContext, useEffect } from 'react';
import {
  initDB,
  saveSettings,
  getSettings,
  getTransactions,
  addTransaction as dbAddTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
  getFixedExpenses,
  addFixedExpense as dbAddFixedExpense,
  deleteFixedExpense as dbDeleteFixedExpense,
  getFutureExpenses,
  addFutureExpense as dbAddFutureExpense,
  updateFutureExpense as dbUpdateFutureExpense,
  deleteFutureExpense as dbDeleteFutureExpense,
  getSavingsHistory,
  addSavingsEntry as dbAddSavingsEntry,
  clearDatabase,
  createManualBackup,
  getBackupInfo,
  verifyDataIntegrity,
  isPWA,
  hasLocalStorage
} from '../services/db';

import { emitStorageError, emitStorageSuccess } from '../components/StorageService';

export const AppContext = createContext(null);

// Temi disponibili
const THEMES = {
  'blue': {
    primary: '#4C6FFF',
    secondary: '#2ECC71',
    danger: '#FF5252',
    warning: '#FFB74D',
    background: '#ECF1FF',
    card: '#FFFFFF',
    darkBackground: '#1A1B21',
    darkCard: '#25262E',
  },
  'forest': {
    primary: '#2E7D32',
    secondary: '#388E3C',
    danger: '#D32F2F', 
    warning: '#FFB74D',
    background: '#EDFBEF',
    card: '#FFFFFF',
    darkBackground: '#1A2017',
    darkCard: '#252E25',
  },
  'purple': {
    primary: '#9C27B0',
    secondary: '#E91E63',
    danger: '#FF5252',
    warning: '#FFB74D',
    background: '#F3E5F5',
    card: '#FFFFFF',
    darkBackground: '#22162B',
    darkCard: '#341C42',
  }
};

export const AppProvider = ({ children }) => {
  // Stati principali
  const [currentView, setCurrentView] = useState('dashboard');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [lastPaydayDate, setLastPaydayDate] = useState('');
  const [nextPaydayDate, setNextPaydayDate] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [savingsHistory, setSavingsHistory] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [futureExpenses, setFutureExpenses] = useState([]);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    darkMode: false,
    currency: 'EUR',
    language: 'it',
    themeId: 'blue',
    setupCompleted: false,
    autoBackupEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState(THEMES['blue']);
  
  // Stati backup
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null,
    autoBackupEnabled: true
  });
  
  // NUOVO: Stato per la gestione dei salvataggi
  const [savingState, setSavingState] = useState({
    isSaving: false,
    lastSaveAttempt: null,
    lastSaveSuccess: null,
    saveErrors: [],
    retryCount: 0
  });

  // Categorie
  const [categories] = useState([
    // Categorie Spese (1-20)
    { id: 1, name: 'Cibo e Bevande', color: '#FF5252', icon: '🍕' },
    { id: 2, name: 'Trasporti', color: '#448AFF', icon: '🚌' },
    { id: 3, name: 'Divertimento', color: '#7C4DFF', icon: '🎬' },
    { id: 4, name: 'Shopping', color: '#FF4081', icon: '🛍️' },
    { id: 5, name: 'Casa', color: '#4CAF50', icon: '🏠' },
    { id: 6, name: 'Salute', color: '#E91E63', icon: '💊' },
    { id: 7, name: 'Istruzione', color: '#3F51B5', icon: '📚' },
    { id: 8, name: 'Abbigliamento', color: '#9C27B0', icon: '👗' },
    { id: 9, name: 'Sport', color: '#FF9800', icon: '⚽' },
    { id: 10, name: 'Viaggi', color: '#00BCD4', icon: '✈️' },
    { id: 11, name: 'Tecnologia', color: '#795548', icon: '💻' },
    { id: 12, name: 'Libri', color: '#607D8B', icon: '📖' },
    { id: 13, name: 'Animali', color: '#8BC34A', icon: '🐾' },
    { id: 14, name: 'Bellezza', color: '#FFC107', icon: '💄' },
    { id: 15, name: 'Caffè', color: '#6F4E37', icon: '☕' },
    { id: 16, name: 'Alcol', color: '#B71C1C', icon: '🍷' },
    { id: 17, name: 'Sigarette', color: '#757575', icon: '🚬' },
    { id: 18, name: 'Hobby', color: '#FF6F00', icon: '🎨' },
    { id: 19, name: 'Musica', color: '#1B5E20', icon: '🎵' },
    { id: 20, name: 'Altro', color: '#546E7A', icon: '📦' },
    
    // Categorie Entrate (21-30)
    { id: 21, name: 'Stipendio', color: '#2ECC71', icon: '💰' },
    { id: 22, name: 'Bonus', color: '#9C27B0', icon: '🎯' },
    { id: 23, name: 'Regalo', color: '#00BCD4', icon: '🎁' },
    { id: 24, name: 'Vendita', color: '#FFA726', icon: '🏷️' },
    { id: 25, name: 'Investimenti', color: '#5C6BC0', icon: '📈' },
    { id: 26, name: 'Freelance', color: '#26A69A', icon: '💼' },
    { id: 27, name: 'Affitto', color: '#8D6E63', icon: '🏘️' },
    { id: 28, name: 'Dividendi', color: '#66BB6A', icon: '💵' },
    { id: 29, name: 'Rimborso', color: '#42A5F5', icon: '♻️' },
    { id: 30, name: 'Altro Entrata', color: '#78909C', icon: '➕' }
  ]);

  // Helper per garantire numeri
  const ensureNumber = (value, defaultValue = 0) => {
    if (value === 0) return 0;
    if (!value || isNaN(Number(value))) return defaultValue;
    return Number(value);
  };

  // MIGLIORATO: SALVATAGGIO CON RETRY E FEEDBACK
  const saveAllSettings = async () => {
    if (isLoading) return;
    
    // Imposta lo stato di salvataggio
    setSavingState(prev => ({
      ...prev,
      isSaving: true,
      lastSaveAttempt: new Date().toISOString()
    }));
    
    try {
      if (!hasLocalStorage) {
        throw new Error("localStorage non disponibile");
      }
      
      const settings = {
        id: 1,
        userSettings,
        monthlyIncome: ensureNumber(monthlyIncome, 0),
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage: ensureNumber(savingsPercentage, 10),
        streak: ensureNumber(streak, 0),
        achievements,
        backupStatus
      };

      // Esegui il salvataggio
      const saveResult = await saveSettings(settings);
      
      if (!saveResult) {
        throw new Error("Errore durante il salvataggio delle impostazioni");
      }
      
      // Aggiorna lo stato di salvataggio
      setSavingState(prev => ({
        ...prev,
        isSaving: false,
        lastSaveSuccess: new Date().toISOString(),
        retryCount: 0, // Reset del contatore dei tentativi
        saveErrors: [] // Reset degli errori
      }));
      
      console.log("✅ Impostazioni salvate correttamente");
      emitStorageSuccess("Dati salvati con successo");
      
      // Backup automatico se attivo
      if (backupStatus.autoBackupEnabled && isPWA()) {
        await createAutoBackup();
      }
      
    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
      
      // Aggiorna lo stato di salvataggio con l'errore
      setSavingState(prev => {
        const newRetryCount = prev.retryCount + 1;
        const newErrors = [...prev.saveErrors, { 
          timestamp: new Date().toISOString(), 
          message: error.message 
        }];
        
        // Limita il numero di errori memorizzati
        if (newErrors.length > 5) {
          newErrors.shift();
        }
        
        return {
          ...prev,
          isSaving: false,
          retryCount: newRetryCount,
          saveErrors: newErrors
        };
      });
      
      // Emetti l'errore per il componente StorageService
      emitStorageError("Errore durante il salvataggio dei dati. I tuoi dati potrebbero non essere persistenti.");
      
      // Tentativo di riprovare (max 3 volte con ritardo esponenziale)
      if (savingState.retryCount < 3) {
        const retryDelay = Math.pow(2, savingState.retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏱️ Riprovo salvataggio tra ${retryDelay/1000}s (tentativo ${savingState.retryCount + 1}/3)`);
        
        setTimeout(() => {
          saveAllSettings();
        }, retryDelay);
      }
    }
  };

  // Salvataggio immediato (versione più robusta)
  const saveAllSettingsImmediate = async () => {
    // Ignora se c'è già un salvataggio in corso
    if (savingState.isSaving) {
      console.log("⏱️ Salvataggio già in corso, richiesta ignorata");
      return;
    }
    
    // Esegui il salvataggio
    return await saveAllSettings();
  };

  // SOLUZIONE AL PROBLEMA DEL SETUP: Completa setup migliorato
  const completeSetup = () => {
    // Imposta il flag di setup completato
    setUserSettings(prev => ({
      ...prev,
      setupCompleted: true
    }));
    
    // IMPORTANTE: Salvataggio di backup DIRETTO per evitare problemi di persistenza
    // Questo garantisce che il flag viene salvato immediatamente in localStorage
    try {
      // Salva il flag direttamente in localStorage come backup
      localStorage.setItem('budget-setup-completed', 'true');
      console.log("✅ Flag setupCompleted salvato direttamente in localStorage");
      
      // Salva anche le impostazioni complete immediatamente
      const settings = {
        id: 1,
        userSettings: {
          ...userSettings,
          setupCompleted: true
        },
        monthlyIncome: ensureNumber(monthlyIncome, 0),
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage: ensureNumber(savingsPercentage, 10),
        streak: ensureNumber(streak, 0),
        achievements,
        backupStatus
      };
      
      // Salva subito in localStorage (metodo diretto)
      localStorage.setItem('budget-settings', JSON.stringify([settings]));
      console.log("✅ Impostazioni complete salvate con setupCompleted=true");
      
      // Utilizza anche il metodo normale di salvataggio (con promise)
      setTimeout(() => {
        saveAllSettingsImmediate();
        // Secondo tentativo dopo 1 secondo per maggiore sicurezza
        setTimeout(saveAllSettingsImmediate, 1000);
      }, 100);
      
    } catch (error) {
      console.error("❌ Errore nel salvataggio diretto del flag setupCompleted:", error);
    }
  };

  // Backup automatico
  const createAutoBackup = async () => {
    try {
      await createManualBackup();
      setBackupStatus(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));
      console.log("✅ Backup automatico creato");
    } catch (error) {
      console.error("❌ Errore backup automatico:", error);
    }
  };

  // Verifica integrità dati
  const verifyDataIntegrityFull = async () => {
    return await verifyDataIntegrity();
  };

  // Aggiorna tema
  const updateThemeColors = (themeId) => {
    if (THEMES[themeId]) {
      setActiveTheme(THEMES[themeId]);
    }
  };

  // Tema finale
  const theme = {
    primary: activeTheme.primary,
    secondary: activeTheme.secondary,
    danger: activeTheme.danger,
    warning: activeTheme.warning,
    background: userSettings.darkMode ? activeTheme.darkBackground : activeTheme.background,
    card: userSettings.darkMode ? activeTheme.darkCard : activeTheme.card,
    text: userSettings.darkMode ? '#FFFFFF' : '#1A2151',
    textSecondary: userSettings.darkMode ? '#A0A3BD' : '#757F8C',
    border: userSettings.darkMode ? '#3A3B43' : '#E3E8F1',
  };

  // CARICAMENTO DATI MIGLIORATO
  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Caricamento dati...");
      
      // MIGLIORATO: Verifiche prima di inizializzare
      if (!hasLocalStorage) {
        console.warn("⚠️ localStorage non disponibile, l'app funzionerà solo in sessione");
      }
      
      // AGGIUNTA: Verifica se esiste il flag di backup
      const setupCompletedBackup = localStorage.getItem('budget-setup-completed');
      let setupCompleted = setupCompletedBackup === 'true';
      console.log("🔄 Verifica flag setupCompleted:", setupCompleted ? "TROVATO" : "NON TROVATO");
      
      // Inizializza il DB con verifiche aggiuntive
      const dbInitResult = await initDB();
      if (!dbInitResult) {
        console.warn("⚠️ Inizializzazione DB non riuscita, utilizzo fallback in memoria");
      }
      
      // Carica impostazioni
      const settingsData = await getSettings();
      if (settingsData && settingsData.length > 0) {
        const settings = settingsData[0];
        
        // MODIFICA: usa il flag di backup se presente
        const mergedUserSettings = {
          ...(settings.userSettings || userSettings),
          // Se il flag di backup è true, sovrascrive il valore recuperato
          setupCompleted: setupCompleted || (settings.userSettings?.setupCompleted || false)
        };
        
        setUserSettings(mergedUserSettings);
        setMonthlyIncome(ensureNumber(settings.monthlyIncome, 0));
        setLastPaydayDate(settings.lastPaydayDate || '');
        setNextPaydayDate(settings.nextPaydayDate || '');
        setSavingsPercentage(ensureNumber(settings.savingsPercentage, 10));
        setStreak(ensureNumber(settings.streak, 0));
        setAchievements(settings.achievements || []);
        setBackupStatus(settings.backupStatus || backupStatus);
        
        if (settings.userSettings?.themeId) {
          updateThemeColors(settings.userSettings.themeId);
        }
      } else {
        console.log("🆕 Nessuna impostazione trovata, utilizzo valori predefiniti");
        
        // AGGIUNTA: Anche se non ci sono impostazioni, verifica il flag di backup
        if (setupCompleted) {
          console.log("🔄 Nessuna impostazione trovata, ma flag setupCompleted di backup trovato");
          setUserSettings(prev => ({
            ...prev,
            setupCompleted: true
          }));
        }
      }
      
      // Carica tutti gli altri dati con gestione errori migliorata
      try {
        const [transactionsData, fixedExpensesData, futureExpensesData, savingsData] = await Promise.all([
          getTransactions(),
          getFixedExpenses(),
          getFutureExpenses(),
          getSavingsHistory()
        ]);
        
        if (transactionsData) {
          setTransactions(transactionsData.map(t => ({
            ...t,
            amount: ensureNumber(t.amount, 0)
          })));
        }
        
        if (fixedExpensesData) {
          setFixedExpenses(fixedExpensesData.map(e => ({
            ...e,
            amount: ensureNumber(e.amount, 0)
          })));
        }
        
        if (futureExpensesData) {
          setFutureExpenses(futureExpensesData.map(e => ({
            ...e,
            amount: ensureNumber(e.amount, 0)
          })));
        }
        
        if (savingsData) {
          const processedSavings = savingsData.map(entry => ({
            ...entry,
            amount: ensureNumber(entry.amount, 0),
            total: ensureNumber(entry.total, 0)
          }));
          setSavingsHistory(processedSavings);
          
          if (processedSavings.length > 0) {
            const lastEntry = processedSavings[processedSavings.length - 1];
            setTotalSavings(ensureNumber(lastEntry.total, 0));
          }
        }
      } catch (dataError) {
        console.error('❌ Errore caricamento dati:', dataError);
        // Continua comunque per consentire l'uso dell'app
      }
      
      console.log("✅ Dati caricati");
      setIsLoading(false);
      
      // Crea un backup automatico appena i dati sono caricati (se in PWA)
      if (isPWA() && backupStatus.autoBackupEnabled) {
        setTimeout(createAutoBackup, 2000);
      }
    } catch (error) {
      console.error('❌ Errore caricamento:', error);
      setIsLoading(false);
      
      // Segnala l'errore
      emitStorageError("Errore di caricamento dati. L'app funzionerà con dati limitati.");
    }
  };

  // Carica all'avvio
  useEffect(() => {
    loadData();
  }, []);

  // Salva quando cambiano le impostazioni (RITARDATO per evitare salvataggi troppo frequenti)
  useEffect(() => {
    if (!isLoading) {
      // Usa un timer per ritardare il salvataggio di 500ms per evitare troppe scritture
      const saveTimer = setTimeout(() => {
        saveAllSettings();
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [userSettings, monthlyIncome, lastPaydayDate, nextPaydayDate, savingsPercentage, 
      streak, achievements, backupStatus, isLoading]);

  // Aggiorna tema
  useEffect(() => {
    if (!isLoading && userSettings.themeId) {
      updateThemeColors(userSettings.themeId);
    }
  }, [userSettings.themeId, isLoading]);

  // CALCOLI BUDGET
  const getDaysUntilPayday = () => {
    if (!nextPaydayDate) return 30;
    
    const today = new Date();
    const payday = new Date(nextPaydayDate);
    const diffTime = payday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  };

  const getDailyFutureExpenses = () => {
    if (!nextPaydayDate) return 0;
    
    const today = new Date();
    const payday = new Date(nextPaydayDate);
    
    return futureExpenses.reduce((total, expense) => {
      const dueDate = new Date(expense.dueDate);
      
      if (dueDate >= today && dueDate <= payday) {
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const dailyAmount = ensureNumber(expense.amount, 0) / Math.max(1, daysUntilDue);
        return total + dailyAmount;
      }
      
      return total;
    }, 0);
  };

  const calculateDailyBudget = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => 
      sum + ensureNumber(expense.amount, 0), 0);
    const savingsAmount = (ensureNumber(monthlyIncome, 0) * ensureNumber(savingsPercentage, 0)) / 100;
    const daysUntilPayday = getDaysUntilPayday();
    const totalBudget = ensureNumber(monthlyIncome, 0) - totalFixedExpenses - savingsAmount;
    const dailyBudget = totalBudget / daysUntilPayday;
    const dailyFutureExpenses = getDailyFutureExpenses();
    
    return Math.max(0, dailyBudget - dailyFutureExpenses);
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => new Date(t.date).toDateString() === today && t.type === 'expense')
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);
  };

  const getTodayIncome = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => new Date(t.date).toDateString() === today && t.type === 'income')
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);
  };

  const getBudgetSurplus = () => {
    const dailyBudget = calculateDailyBudget();
    const todayExpenses = getTodayExpenses();
    const todayIncome = getTodayIncome();
    return dailyBudget - todayExpenses + todayIncome;
  };

  // TRANSAZIONI (con salvataggio immediato e migliorato)
  const addTransaction = async (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      amount: ensureNumber(transaction.amount, 0),
      type: transaction.type || 'expense'
    };
    
    try {
      // Aggiorna lo stato locale immediatamente per UI reattiva
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Tenta di salvare nel database
      const result = await dbAddTransaction(newTransaction);
      
      if (!result) {
        throw new Error("Errore nel salvare la transazione");
      }
      
      // Salva tutto lo stato dopo l'aggiunta
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta transazione:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nel salvare la transazione. Ricarica l'app per verificare che sia stata salvata.");
      
      // Anche se fallisce il salvataggio, manteniamo la transazione nello stato locale
      // in modo che l'utente possa vedere il cambiamento e riproveremo a salvare in seguito
      return false;
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      const current = transactions.find(t => t.id === id);
      if (!current) return false;
      
      const updated = { 
        ...current, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, current.amount)
      };
      
      // Aggiorna lo stato locale immediatamente
      setTransactions(prev => 
        prev.map(t => t.id === id ? updated : t)
      );
      
      // Tenta di salvare nel database
      const result = await dbUpdateTransaction(updated);
      
      if (!result) {
        throw new Error("Errore nell'aggiornare la transazione");
      }
      
      // Salva tutto lo stato dopo l'aggiornamento
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento transazione:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nell'aggiornare la transazione. Ricarica l'app per verificare che sia stata aggiornata.");
      
      return false;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      // Aggiorna lo stato locale immediatamente
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      // Tenta di eliminare dal database
      const result = await dbDeleteTransaction(id);
      
      if (!result) {
        throw new Error("Errore nell'eliminare la transazione");
      }
      
      // Salva tutto lo stato dopo l'eliminazione
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione transazione:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nell'eliminare la transazione. Ricarica l'app per verificare che sia stata eliminata.");
      
      return false;
    }
  };

  // SPESE FISSE (con salvataggio immediato e migliorato)
  const addFixedExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      // Aggiorna lo stato locale immediatamente
      setFixedExpenses(prev => [...prev, newExpense]);
      
      // Tenta di salvare nel database
      const result = await dbAddFixedExpense(newExpense);
      
      if (!result) {
        throw new Error("Errore nel salvare la spesa fissa");
      }
      
      // Salva tutto lo stato dopo l'aggiunta
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta spesa fissa:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nel salvare la spesa fissa. Ricarica l'app per verificare che sia stata salvata.");
      
      return false;
    }
  };

  const deleteFixedExpense = async (id) => {
    try {
      // Aggiorna lo stato locale immediatamente
      setFixedExpenses(prev => prev.filter(e => e.id !== id));
      
      // Tenta di eliminare dal database
      const result = await dbDeleteFixedExpense(id);
      
      if (!result) {
        throw new Error("Errore nell'eliminare la spesa fissa");
      }
      
      // Salva tutto lo stato dopo l'eliminazione
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione spesa fissa:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nell'eliminare la spesa fissa. Ricarica l'app per verificare che sia stata eliminata.");
      
      return false;
    }
  };

  // SPESE FUTURE (con salvataggio immediato e migliorato)
  const addFutureExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      // Aggiorna lo stato locale immediatamente
      setFutureExpenses(prev => [...prev, newExpense]);
      
      // Tenta di salvare nel database
      const result = await dbAddFutureExpense(newExpense);
      
      if (!result) {
        throw new Error("Errore nel salvare la spesa futura");
      }
      
      // Salva tutto lo stato dopo l'aggiunta
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta spesa futura:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nel salvare la spesa futura. Ricarica l'app per verificare che sia stata salvata.");
      
      return false;
    }
  };

  const updateFutureExpense = async (id, updatedData) => {
    try {
      const current = futureExpenses.find(e => e.id === id);
      if (!current) return false;
      
      const updated = { 
        ...current, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, current.amount)
      };
      
      // Aggiorna lo stato locale immediatamente
      setFutureExpenses(prev => 
        prev.map(e => e.id === id ? updated : e)
      );
      
      // Tenta di salvare nel database
      const result = await dbUpdateFutureExpense(updated);
      
      if (!result) {
        throw new Error("Errore nell'aggiornare la spesa futura");
      }
      
      // Salva tutto lo stato dopo l'aggiornamento
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento spesa futura:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nell'aggiornare la spesa futura. Ricarica l'app per verificare che sia stata aggiornata.");
      
      return false;
    }
  };

  const deleteFutureExpense = async (id) => {
    try {
      // Aggiorna lo stato locale immediatamente
      setFutureExpenses(prev => prev.filter(e => e.id !== id));
      
      // Tenta di eliminare dal database
      const result = await dbDeleteFutureExpense(id);
      
      if (!result) {
        throw new Error("Errore nell'eliminare la spesa futura");
      }
      
      // Salva tutto lo stato dopo l'eliminazione
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione spesa futura:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nell'eliminare la spesa futura. Ricarica l'app per verificare che sia stata eliminata.");
      
      return false;
    }
  };

  // RISPARMI (con salvataggio immediato e migliorato)
  const addToSavings = async (amount, date = new Date().toISOString()) => {
    const parsedAmount = ensureNumber(amount, 0);
    const newTotal = ensureNumber(totalSavings, 0) + parsedAmount;
    
    const newEntry = {
      id: Date.now(),
      amount: parsedAmount,
      date,
      total: newTotal
    };
    
    try {
      // Aggiorna lo stato locale immediatamente
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      
      // Tenta di salvare nel database
      const result = await dbAddSavingsEntry(newEntry);
      
      if (!result) {
        throw new Error("Errore nel salvare l'aggiunta ai risparmi");
      }
      
      // Salva tutto lo stato dopo l'aggiunta
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta risparmio:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nel salvare l'aggiunta ai risparmi. Ricarica l'app per verificare che sia stata salvata.");
      
      return false;
    }
  };

  const withdrawFromSavings = async (amount, date = new Date().toISOString()) => {
    const parsedAmount = ensureNumber(amount, 0);
    const newTotal = ensureNumber(totalSavings, 0) - parsedAmount;
    
    const newEntry = {
      id: Date.now(),
      amount: -parsedAmount,
      date,
      total: newTotal
    };
    
    try {
      // Aggiorna lo stato locale immediatamente
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      
      // Tenta di salvare nel database
      const result = await dbAddSavingsEntry(newEntry);
      
      if (!result) {
        throw new Error("Errore nel salvare il prelievo dai risparmi");
      }
      
      // Salva tutto lo stato dopo l'aggiunta
      await saveAllSettingsImmediate();
      
      return true;
    } catch (error) {
      console.error('❌ Errore prelievo risparmio:', error);
      
      // Notifica l'errore
      emitStorageError("Errore nel salvare il prelievo dai risparmi. Ricarica l'app per verificare che sia stata salvato.");
      
      return false;
    }
  };

  // STATISTICHE
  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const income = monthlyTransactions.filter(t => t.type === 'income');

    return {
      totalExpenses: expenses.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0),
      totalIncome: income.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0),
      transactionCount: monthlyTransactions.length
    };
  };

  const getWeeklyComparison = () => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisWeekExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && tDate >= thisWeekStart;
      })
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);

    return { thisWeek: thisWeekExpenses };
  };

  // RESET (con migliore gestione errori)
  const resetApp = async () => {
    try {
      setIsLoading(true);
      
      // Prima di cancellare, tentiamo un backup finale
      try {
        const backup = await createManualBackup();
        console.log("✅ Backup finale creato prima del reset");
      } catch (backupError) {
        console.error("❌ Errore nel creare backup finale:", backupError);
      }
      
      // Cancella il database
      const clearResult = await clearDatabase();
      
      if (!clearResult) {
        throw new Error("Errore nella cancellazione del database");
      }
      
      // Reset tutti gli stati
      setCurrentView('dashboard');
      setMonthlyIncome(0);
      setLastPaydayDate('');
      setNextPaydayDate('');
      setFixedExpenses([]);
      setSavingsPercentage(10);
      setTransactions([]);
      setSavingsHistory([]);
      setTotalSavings(0);
      setFutureExpenses([]);
      setStreak(0);
      setAchievements([]);
      setUserSettings({
        ...userSettings,
        setupCompleted: false
      });
      setBackupStatus({
        lastBackup: null,
        autoBackupEnabled: true
      });
      
      setIsLoading(false);
      console.log("✅ App resettata");
      
      // Ricarica l'app dopo un breve ritardo
      setTimeout(() => window.location.reload(), 500);
      
      return true;
    } catch (error) {
      console.error('❌ Errore reset:', error);
      setIsLoading(false);
      
      // Notifica l'errore
      emitStorageError("Errore nel resettare l'app. Ricarica manualmente la pagina.");
      
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      // Stati
      isLoading,
      currentView, setCurrentView,
      monthlyIncome, setMonthlyIncome,
      lastPaydayDate, setLastPaydayDate,
      nextPaydayDate, setNextPaydayDate,
      fixedExpenses, setFixedExpenses,
      savingsPercentage, setSavingsPercentage,
      transactions, setTransactions,
      savingsHistory, setSavingsHistory,
      totalSavings, setTotalSavings,
      categories,
      futureExpenses, setFutureExpenses,
      theme,
      streak, 
      achievements, setAchievements,
      userSettings, setUserSettings,
      updateThemeColors,
      activeTheme,
      completeSetup,
      saveAllSettings,
      saveAllSettingsImmediate,
      backupStatus, setBackupStatus,
      createAutoBackup,
      verifyDataIntegrity: verifyDataIntegrityFull,
      savingState, // NUOVO: esporre lo stato di salvataggio

      // Funzioni principali
      addTransaction, 
      updateTransaction, 
      deleteTransaction,
      addFixedExpense, 
      deleteFixedExpense,
      addFutureExpense,
      updateFutureExpense,
      deleteFutureExpense,
      calculateDailyBudget,
      getTodayExpenses,
      getTodayIncome,
      getBudgetSurplus,
      getDaysUntilPayday,
      getDailyFutureExpenses,
      getMonthlyStats,
      getWeeklyComparison,
      addToSavings,
      withdrawFromSavings,
      resetApp
    }}>
      {children}
    </AppContext.Provider>
  );
};

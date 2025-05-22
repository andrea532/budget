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
  isPWA
} from '../services/db';

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

  // SALVATAGGIO IMMEDIATO E SEMPLICE
  const saveAllSettings = async () => {
    if (isLoading) return;
    
    try {
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

      await saveSettings(settings);
      console.log("✅ Impostazioni salvate immediatamente");
      
      // Backup automatico se attivo
      if (backupStatus.autoBackupEnabled && isPWA()) {
        await createAutoBackup();
      }
      
    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
    }
  };

  // Salvataggio immediato
  const saveAllSettingsImmediate = saveAllSettings;

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

  // Completamento setup
  const completeSetup = () => {
    setUserSettings(prev => ({
      ...prev,
      setupCompleted: true
    }));
    // Salva immediatamente
    setTimeout(saveAllSettings, 100);
  };

  // CARICAMENTO DATI
  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Caricamento dati...");
      
      await initDB();
      
      // Carica impostazioni
      const settingsData = await getSettings();
      if (settingsData && settingsData.length > 0) {
        const settings = settingsData[0];
        
        setUserSettings(settings.userSettings || userSettings);
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
      }
      
      // Carica tutti gli altri dati
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
      
      console.log("✅ Dati caricati");
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Errore caricamento:', error);
      setIsLoading(false);
    }
  };

  // Carica all'avvio
  useEffect(() => {
    loadData();
  }, []);

  // Salva quando cambiano le impostazioni (IMMEDIATO)
  useEffect(() => {
    if (!isLoading) {
      saveAllSettings();
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

  // TRANSAZIONI (con salvataggio immediato)
  const addTransaction = async (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      amount: ensureNumber(transaction.amount, 0),
      type: transaction.type || 'expense'
    };
    
    try {
      await dbAddTransaction(newTransaction);
      setTransactions(prev => [newTransaction, ...prev]);
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiunta transazione:', error);
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      const current = transactions.find(t => t.id === id);
      if (!current) return;
      
      const updated = { 
        ...current, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, current.amount)
      };
      
      await dbUpdateTransaction(updated);
      setTransactions(prev => 
        prev.map(t => t.id === id ? updated : t)
      );
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiornamento transazione:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await dbDeleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore eliminazione transazione:', error);
    }
  };

  // SPESE FISSE (con salvataggio immediato)
  const addFixedExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      await dbAddFixedExpense(newExpense);
      setFixedExpenses(prev => [...prev, newExpense]);
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiunta spesa fissa:', error);
    }
  };

  const deleteFixedExpense = async (id) => {
    try {
      await dbDeleteFixedExpense(id);
      setFixedExpenses(prev => prev.filter(e => e.id !== id));
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore eliminazione spesa fissa:', error);
    }
  };

  // SPESE FUTURE (con salvataggio immediato)
  const addFutureExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      await dbAddFutureExpense(newExpense);
      setFutureExpenses(prev => [...prev, newExpense]);
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiunta spesa futura:', error);
    }
  };

  const updateFutureExpense = async (id, updatedData) => {
    try {
      const current = futureExpenses.find(e => e.id === id);
      if (!current) return;
      
      const updated = { 
        ...current, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, current.amount)
      };
      
      await dbUpdateFutureExpense(updated);
      setFutureExpenses(prev => 
        prev.map(e => e.id === id ? updated : e)
      );
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiornamento spesa futura:', error);
    }
  };

  const deleteFutureExpense = async (id) => {
    try {
      await dbDeleteFutureExpense(id);
      setFutureExpenses(prev => prev.filter(e => e.id !== id));
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore eliminazione spesa futura:', error);
    }
  };

  // RISPARMI (con salvataggio immediato)
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
      await dbAddSavingsEntry(newEntry);
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore aggiunta risparmio:', error);
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
      await dbAddSavingsEntry(newEntry);
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      await saveAllSettings(); // Salva subito
    } catch (error) {
      console.error('❌ Errore prelievo risparmio:', error);
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

  // RESET
  const resetApp = async () => {
    try {
      setIsLoading(true);
      
      await clearDatabase();
      
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
      
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('❌ Errore reset:', error);
      setIsLoading(false);
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

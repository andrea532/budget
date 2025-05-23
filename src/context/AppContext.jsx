import React, { useState, createContext, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
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
  addSavingsEntry,
  clearDatabase
} from '../services/db';

export const AppContext = createContext(null);

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
  const [futureExpenses, setFutureExpenses] = useState([]);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    darkMode: true, // Dark mode è ora il default
    currency: 'EUR',
    language: 'it'
  });
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Tema (adesso è dark di default)
  const theme = {
    // Colori base
    primary: '#4C6FFF',
    secondary: '#2ECC71',
    danger: '#FF5252',
    warning: '#FFB74D',
    
    // Dark mode (di default)
    background: '#121218',
    card: '#1E1F25',
    text: '#FFFFFF',
    textSecondary: '#A0A3BD',
    border: '#2A2B36',
    
    // Estensioni per il tema dark moderno
    cardGradient: 'linear-gradient(145deg, #1a1b21, #21222a)',
    accent: 'rgba(76, 111, 255, 0.1)',
    glow: '0 0 15px rgba(76, 111, 255, 0.15)',
    shadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    
    // Se si desidera passare alla light mode
    ...(userSettings.darkMode === false && {
      background: '#F8FAFF',
      card: '#FFFFFF',
      text: '#1A2151',
      textSecondary: '#757F8C',
      border: '#E3E8F1',
      cardGradient: 'none',
      accent: 'rgba(76, 111, 255, 0.05)',
      glow: 'none',
      shadow: '0 8px 20px rgba(0, 0, 0, 0.06)'
    })
  };

  // Inizializza il database
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await Promise.all([
          import('../services/db').then(module => module.initDB())
        ]);
        setDatabaseInitialized(true);
      } catch (error) {
        console.error("Errore nell'inizializzazione del database:", error);
      }
    };

    initializeDatabase();
  }, []);

  // Carica i dati dal database dopo l'inizializzazione
  useEffect(() => {
    if (!databaseInitialized) return;

    const loadData = async () => {
      try {
        // Carica le impostazioni
        const settingsData = await getSettings();
        if (settingsData && settingsData.length > 0) {
          const settings = settingsData[0];
          if (settings.monthlyIncome) setMonthlyIncome(settings.monthlyIncome);
          if (settings.lastPaydayDate) setLastPaydayDate(settings.lastPaydayDate);
          if (settings.nextPaydayDate) setNextPaydayDate(settings.nextPaydayDate);
          if (settings.savingsPercentage) setSavingsPercentage(settings.savingsPercentage);
          if (settings.userSettings) setUserSettings(settings.userSettings);
          if (settings.streak) setStreak(settings.streak);
          if (settings.achievements) setAchievements(settings.achievements);
        }

        // Carica le transazioni
        const transactionsData = await getTransactions();
        if (transactionsData && transactionsData.length > 0) {
          setTransactions(transactionsData);
        }

        // Carica le spese fisse
        const fixedExpensesData = await getFixedExpenses();
        if (fixedExpensesData && fixedExpensesData.length > 0) {
          setFixedExpenses(fixedExpensesData);
        }

        // Carica le spese future
        const futureExpensesData = await getFutureExpenses();
        if (futureExpensesData && futureExpensesData.length > 0) {
          setFutureExpenses(futureExpensesData);
        }

        // Carica la cronologia dei risparmi
        const savingsHistoryData = await getSavingsHistory();
        if (savingsHistoryData && savingsHistoryData.length > 0) {
          setSavingsHistory(savingsHistoryData);
          // Calcola il totale dei risparmi
          const total = savingsHistoryData.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
          setTotalSavings(total);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        setDataLoaded(true); // Imposta comunque come caricato per non bloccare l'app
      }
    };

    loadData();
  }, [databaseInitialized]);

  // Salva le impostazioni quando cambiano
  useEffect(() => {
    if (!databaseInitialized || !dataLoaded) return;

    const saveSettingsData = async () => {
      try {
        await saveSettings({
          id: 'appSettings',
          monthlyIncome,
          lastPaydayDate,
          nextPaydayDate,
          savingsPercentage,
          userSettings,
          streak,
          achievements
        });
      } catch (error) {
        console.error("Errore nel salvataggio delle impostazioni:", error);
      }
    };

    saveSettingsData();
  }, [databaseInitialized, dataLoaded, monthlyIncome, lastPaydayDate, nextPaydayDate, savingsPercentage, userSettings, streak, achievements]);

  // Calcola il totale giornaliero delle spese future da sottrarre
  const getDailyFutureExpenses = () => {
    const today = new Date();
    return futureExpenses.reduce((total, expense) => {
      const dueDate = new Date(expense.dueDate);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        const dailyAmount = expense.amount / diffDays;
        return total + dailyAmount;
      }
      return total;
    }, 0);
  };

  // FUNZIONI IMPORTANTI
  const calculateDailyBudget = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const savingsAmount = (monthlyIncome * savingsPercentage) / 100;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyBudget = (monthlyIncome - totalFixedExpenses - savingsAmount) / daysInMonth;
    
    // Sottrai le spese future giornaliere
    const dailyFutureExpenses = getDailyFutureExpenses();
    const finalBudget = dailyBudget - dailyFutureExpenses;
    
    return finalBudget > 0 ? finalBudget : 0;
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today && transaction.type === 'expense')
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  };

  const getTodayIncome = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today && transaction.type === 'income')
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  };

  const getBudgetSurplus = () => {
    const dailyBudget = calculateDailyBudget();
    const todayExpenses = getTodayExpenses();
    const todayIncome = getTodayIncome();
    return dailyBudget - todayExpenses + todayIncome;
  };

  const getMonthlyAvailability = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const savingsAmount = (monthlyIncome * savingsPercentage) / 100;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return monthlyIncome - totalFixedExpenses - savingsAmount - monthlyExpenses;
  };

  const getDaysUntilPayday = () => {
    if (!nextPaydayDate) return null;
    const today = new Date();
    const nextPayday = new Date(nextPaydayDate);
    const diffTime = nextPayday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Metodi per le transazioni aggiornati per usare il database
  const addTransaction = async (transaction) => {
    try {
      // Assicurati che amount sia un numero
      const newTransaction = {
        ...transaction,
        amount: parseFloat(transaction.amount),
        type: transaction.type || 'expense'
      };
      delete newTransaction.id; // Rimuovi l'ID per generazione automatica
      
      const newTransactionId = await dbAddTransaction(newTransaction);
      
      setTransactions(prev => [
        { ...newTransaction, id: newTransactionId },
        ...prev
      ]);
      
      return newTransactionId;
    } catch (error) {
      console.error("Errore nell'aggiunta della transazione:", error);
      throw error;
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) throw new Error(`Transazione con id ${id} non trovata`);
      
      const updatedTransaction = { 
        ...transaction, 
        ...updatedData,
        amount: parseFloat(updatedData.amount || transaction.amount)
      };
      
      await dbUpdateTransaction(updatedTransaction);
      
      setTransactions(prev => 
        prev.map(t => t.id === id ? updatedTransaction : t)
      );
      
      return id;
    } catch (error) {
      console.error("Errore nell'aggiornamento della transazione:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await dbDeleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione della transazione:", error);
      throw error;
    }
  };

  // Metodi per le spese fisse
  const addFixedExpense = async (expense) => {
    try {
      const newExpense = {
        ...expense,
        amount: parseFloat(expense.amount)
      };
      delete newExpense.id; // Rimuovi l'ID per generazione automatica
      
      const newExpenseId = await dbAddFixedExpense(newExpense);
      
      setFixedExpenses(prev => [
        ...prev,
        { ...newExpense, id: newExpenseId }
      ]);
      
      return newExpenseId;
    } catch (error) {
      console.error("Errore nell'aggiunta della spesa fissa:", error);
      throw error;
    }
  };

  const deleteFixedExpense = async (id) => {
    try {
      await dbDeleteFixedExpense(id);
      setFixedExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione della spesa fissa:", error);
      throw error;
    }
  };

  // Metodi per le spese future
  const addFutureExpense = async (expense) => {
    try {
      const newExpense = {
        ...expense,
        amount: parseFloat(expense.amount),
        createdAt: new Date().toISOString()
      };
      delete newExpense.id; // Rimuovi l'ID per generazione automatica
      
      const newExpenseId = await dbAddFutureExpense(newExpense);
      
      setFutureExpenses(prev => [
        ...prev,
        { ...newExpense, id: newExpenseId }
      ]);
      
      return newExpenseId;
    } catch (error) {
      console.error("Errore nell'aggiunta della spesa futura:", error);
      throw error;
    }
  };

  const updateFutureExpense = async (id, updatedData) => {
    try {
      const expense = futureExpenses.find(e => e.id === id);
      if (!expense) throw new Error(`Spesa futura con id ${id} non trovata`);
      
      const updatedExpense = { 
        ...expense, 
        ...updatedData,
        amount: parseFloat(updatedData.amount || expense.amount)
      };
      
      await dbUpdateFutureExpense(updatedExpense);
      
      setFutureExpenses(prev => 
        prev.map(e => e.id === id ? updatedExpense : e)
      );
      
      return id;
    } catch (error) {
      console.error("Errore nell'aggiornamento della spesa futura:", error);
      throw error;
    }
  };

  const deleteFutureExpense = async (id) => {
    try {
      await dbDeleteFutureExpense(id);
      setFutureExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione della spesa futura:", error);
      throw error;
    }
  };

  // Funzione per aggiungere ai risparmi
  const addToSavings = async (amount, date = new Date().toISOString()) => {
    try {
      const parsedAmount = parseFloat(amount);
      const newEntry = {
        amount: parsedAmount,
        date,
        total: totalSavings + parsedAmount
      };
      
      const newEntryId = await addSavingsEntry(newEntry);
      
      setSavingsHistory(prev => [
        ...prev,
        { ...newEntry, id: newEntryId }
      ]);
      
      setTotalSavings(prev => prev + parsedAmount);
      
      return newEntryId;
    } catch (error) {
      console.error("Errore nell'aggiunta ai risparmi:", error);
      throw error;
    }
  };

  // Funzione per prelevare dai risparmi
  const withdrawFromSavings = async (amount, date = new Date().toISOString()) => {
    try {
      const parsedAmount = parseFloat(amount);
      const newEntry = {
        amount: -parsedAmount,
        date,
        total: totalSavings - parsedAmount
      };
      
      const newEntryId = await addSavingsEntry(newEntry);
      
      setSavingsHistory(prev => [
        ...prev,
        { ...newEntry, id: newEntryId }
      ]);
      
      setTotalSavings(prev => prev - parsedAmount);
      
      return newEntryId;
    } catch (error) {
      console.error("Errore nel prelievo dai risparmi:", error);
      throw error;
    }
  };

  // Funzione di pulizia del database (per problemi)
  const resetDatabase = async () => {
    try {
      await clearDatabase();
      window.location.reload();
    } catch (error) {
      console.error("Errore nella pulizia del database:", error);
    }
  };

  // Statistiche
  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const income = monthlyTransactions.filter(t => t.type === 'income');

    const categoryExpenses = {};
    expenses.forEach(t => {
      if (!categoryExpenses[t.categoryId]) {
        categoryExpenses[t.categoryId] = 0;
      }
      categoryExpenses[t.categoryId] += parseFloat(t.amount);
    });

    return {
      totalExpenses: expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalIncome: income.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      transactionCount: monthlyTransactions.length,
      averageExpense: expenses.length ? expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0) / expenses.length : 0,
      categoryBreakdown: categoryExpenses,
      dailyAverageExpense: expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0) / new Date().getDate()
    };
  };

  const getWeeklyComparison = () => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    const thisWeekExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && tDate >= thisWeekStart;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const lastWeekExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && tDate >= lastWeekStart && tDate <= lastWeekEnd;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      thisWeek: thisWeekExpenses,
      lastWeek: lastWeekExpenses,
      difference: thisWeekExpenses - lastWeekExpenses,
      percentageChange: lastWeekExpenses ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 : 0
    };
  };

  // Value del provider con TUTTE le funzioni
  return (
    <AppContext.Provider value={{
      // Stati
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
      streak, setStreak,
      achievements, setAchievements,
      userSettings, setUserSettings,
      databaseInitialized,
      dataLoaded,

      // FUNZIONI IMPORTANTI
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
      getMonthlyAvailability,
      getDailyFutureExpenses,
      getMonthlyStats,
      getWeeklyComparison,
      addToSavings,
      withdrawFromSavings,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

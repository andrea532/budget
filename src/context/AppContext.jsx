import React, { useState, createContext, useEffect } from 'react';

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
    darkMode: false,
    currency: 'EUR',
    language: 'it'
  });

  // Tema
  const theme = {
    primary: '#4C6FFF',
    secondary: '#2ECC71',
    danger: '#FF5252',
    warning: '#FFB74D',
    background: userSettings.darkMode ? '#1A1B21' : '#F8FAFF',
    card: userSettings.darkMode ? '#25262E' : '#FFFFFF',
    text: userSettings.darkMode ? '#FFFFFF' : '#1A2151',
    textSecondary: userSettings.darkMode ? '#A0A3BD' : '#757F8C',
    border: userSettings.darkMode ? '#3A3B43' : '#E3E8F1',
  };

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
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
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
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getTodayIncome = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today && transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getBudgetSurplus = () => {
    const dailyBudget = calculateDailyBudget();
    const todayExpenses = getTodayExpenses();
    const todayIncome = getTodayIncome();
    return dailyBudget - todayExpenses + todayIncome;
  };

  const getMonthlyAvailability = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
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
      .reduce((sum, t) => sum + t.amount, 0);

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

  // Metodi per le transazioni
  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      amount: parseFloat(transaction.amount),
      type: transaction.type || 'expense'
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id, updatedData) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id ? { ...transaction, ...updatedData } : transaction
      )
    );
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // Metodi per le spese fisse
  const addFixedExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount)
    };
    setFixedExpenses(prev => [...prev, newExpense]);
  };

  const deleteFixedExpense = (id) => {
    setFixedExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  // Metodi per le spese future
  const addFutureExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setFutureExpenses(prev => [...prev, newExpense]);
  };

  const updateFutureExpense = (id, updatedData) => {
    setFutureExpenses(prev => 
      prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedData } : expense
      )
    );
  };

  const deleteFutureExpense = (id) => {
    setFutureExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  // Funzione per aggiungere ai risparmi
  const addToSavings = (amount, date = new Date().toISOString()) => {
    const newEntry = {
      id: Date.now(),
      amount: parseFloat(amount),
      date,
      total: totalSavings + parseFloat(amount)
    };
    setSavingsHistory(prev => [...prev, newEntry]);
    setTotalSavings(prev => prev + parseFloat(amount));
  };

  // Funzione per prelevare dai risparmi
  const withdrawFromSavings = (amount, date = new Date().toISOString()) => {
    const newEntry = {
      id: Date.now(),
      amount: -parseFloat(amount),
      date,
      total: totalSavings - parseFloat(amount)
    };
    setSavingsHistory(prev => [...prev, newEntry]);
    setTotalSavings(prev => prev - parseFloat(amount));
  };

  // Sistema automatico per aggiungere risparmi mensili
  useEffect(() => {
    // Controlla se è il giorno di paga
    if (nextPaydayDate) {
      const today = new Date();
      const payday = new Date(nextPaydayDate);
      
      // Se oggi è il giorno di paga
      if (today.toDateString() === payday.toDateString()) {
        // Calcola e aggiungi automaticamente il risparmio mensile
        const monthlyAutomaticSavings = (monthlyIncome * savingsPercentage) / 100;
        if (monthlyAutomaticSavings > 0) {
          addToSavings(monthlyAutomaticSavings, new Date().toISOString());
        }
        
        // Aggiorna la data del prossimo stipendio
        const nextMonth = new Date(payday);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setNextPaydayDate(nextMonth.toISOString().split('T')[0]);
        setLastPaydayDate(today.toISOString().split('T')[0]);
      }
    }
  }, [nextPaydayDate, monthlyIncome, savingsPercentage, addToSavings, setNextPaydayDate, setLastPaydayDate]);

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
      categoryExpenses[t.categoryId] += t.amount;
    });

    return {
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
      totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: monthlyTransactions.length,
      averageExpense: expenses.length ? expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length : 0,
      categoryBreakdown: categoryExpenses,
      dailyAverageExpense: expenses.reduce((sum, t) => sum + t.amount, 0) / new Date().getDate()
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
      .reduce((sum, t) => sum + t.amount, 0);

    const lastWeekExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && tDate >= lastWeekStart && tDate <= lastWeekEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

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
      streak, 
      achievements, setAchievements,
      userSettings, setUserSettings,

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
      withdrawFromSavings
    }}>
      {children}
    </AppContext.Provider>
  );
};
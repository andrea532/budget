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
  clearDatabase
} from '../services/db';

export const AppContext = createContext(null);

// Definizione completa dei temi con colori di sfondo
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
  'dark': {
    primary: '#455A64',
    secondary: '#607D8B',
    danger: '#F44336',
    warning: '#FFB74D',
    background: '#ECEFF1',
    card: '#FFFFFF',
    darkBackground: '#1A1A1D',
    darkCard: '#282831',
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
  },
  'pink': {
    primary: '#E91E63',
    secondary: '#FF4081',
    danger: '#FF5252',
    warning: '#FFB74D',
    background: '#FCE4EC',
    card: '#FFFFFF',
    darkBackground: '#2A151E',
    darkCard: '#3D1F2D',
  },
  'teal': {
    primary: '#009688',
    secondary: '#26A69A',
    danger: '#F44336',
    warning: '#FFB74D',
    background: '#E0F2F1',
    card: '#FFFFFF',
    darkBackground: '#0F2A29',
    darkCard: '#1A3D3A',
  },
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
    language: 'it',
    themeId: 'blue', // Default theme
    setupCompleted: false // Aggiunta questa proprietà per tenere traccia se la configurazione iniziale è stata completata
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Stato dei colori del tema (con valori predefiniti)
  const [activeTheme, setActiveTheme] = useState(THEMES['blue']);

  // Aggiorna i colori del tema
  const updateThemeColors = (themeId) => {
    if (THEMES[themeId]) {
      setActiveTheme(THEMES[themeId]);
    }
  };

  // Tema
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

  // Funzione per salvare subito tutte le impostazioni
  const saveAllSettings = async () => {
    try {
      const settings = {
        id: 1, // ID fisso per le impostazioni
        userSettings,
        monthlyIncome,
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage,
        streak,
        achievements
      };
      
      await saveSettings(settings);
      console.log("Impostazioni salvate con successo:", settings);
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
    }
  };

  // Funzione per completare il setup iniziale
  const completeSetup = () => {
    setUserSettings(prev => ({
      ...prev,
      setupCompleted: true
    }));
    
    // Salva esplicitamente le impostazioni aggiornate
    setTimeout(() => {
      saveAllSettings();
    }, 200);
  };

  // Inizializzazione del database e caricamento dati
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Inizializza il database
        await initDB();
        
        // Carica le impostazioni salvate
        const settingsData = await getSettings();
        console.log("Impostazioni caricate:", settingsData);
        
        if (settingsData && settingsData.length > 0) {
          const settings = settingsData[0];
          setUserSettings(settings.userSettings || userSettings);
          setMonthlyIncome(settings.monthlyIncome || 0);
          setLastPaydayDate(settings.lastPaydayDate || '');
          setNextPaydayDate(settings.nextPaydayDate || '');
          setSavingsPercentage(settings.savingsPercentage || 10);
          setStreak(settings.streak || 0);
          setAchievements(settings.achievements || []);
          
          // Imposta i colori del tema in base al themeId
          if (settings.userSettings && settings.userSettings.themeId) {
            const themeId = settings.userSettings.themeId;
            if (THEMES[themeId]) {
              setActiveTheme(THEMES[themeId]);
            }
          }
        }
        
        // Carica le transazioni
        const transactionsData = await getTransactions();
        if (transactionsData) {
          setTransactions(transactionsData);
        }
        
        // Carica le spese fisse
        const fixedExpensesData = await getFixedExpenses();
        if (fixedExpensesData) {
          setFixedExpenses(fixedExpensesData);
        }
        
        // Carica le spese future
        const futureExpensesData = await getFutureExpenses();
        if (futureExpensesData) {
          setFutureExpenses(futureExpensesData);
        }
        
        // Carica la cronologia risparmi
        const savingsData = await getSavingsHistory();
        if (savingsData) {
          setSavingsHistory(savingsData);
          
          // Calcola il totale dei risparmi
          if (savingsData.length > 0) {
            const lastSavingsEntry = savingsData[savingsData.length - 1];
            setTotalSavings(lastSavingsEntry.total || 0);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Salva le impostazioni quando cambiano
  useEffect(() => {
    if (isLoading) return;
    
    console.log("Rilevate modifiche alle impostazioni, salvataggio in corso...", {
      monthlyIncome, 
      lastPaydayDate, 
      nextPaydayDate, 
      savingsPercentage, 
      userSettings: userSettings
    });
    
    const saveUserData = async () => {
      try {
        const settings = {
          id: 1, // ID fisso per le impostazioni
          userSettings,
          monthlyIncome,
          lastPaydayDate,
          nextPaydayDate,
          savingsPercentage,
          streak,
          achievements
        };
        
        await saveSettings(settings);
        console.log("Impostazioni salvate con successo:", settings);
      } catch (error) {
        console.error('Errore nel salvataggio delle impostazioni:', error);
      }
    };
    
    saveUserData();
  }, [userSettings, monthlyIncome, lastPaydayDate, nextPaydayDate, savingsPercentage, streak, achievements, isLoading]);

  // Aggiorna i colori del tema quando cambia themeId
  useEffect(() => {
    if (!isLoading && userSettings.themeId) {
      updateThemeColors(userSettings.themeId);
    }
  }, [userSettings.themeId, isLoading]);

  // FUNZIONI IMPORTANTI PER IL CALCOLO DEL BUDGET
  const getDaysUntilPayday = () => {
    if (!nextPaydayDate) return 30; // Valore di default se non esiste una data
    
    // Ottieni la data corrente e quella del prossimo pagamento
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Mezzogiorno per evitare problemi di fuso orario
    
    const payArray = nextPaydayDate.split('-').map(Number);
    const nextPayday = new Date(payArray[0], payArray[1]-1, payArray[2], 12, 0, 0);
    
    // Se oggi è uguale o successivo al nextPayday, restituisci 1
    if (today >= nextPayday) return 1;
    
    // Calcolo esplicito dei giorni con un ciclo
    let currentDate = new Date(today);
    let diffDays = 0;
    
    while (currentDate < nextPayday) {
      diffDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return diffDays;
  };

  // Calcola il totale giornaliero delle spese future da sottrarre
  const getDailyFutureExpenses = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    if (!nextPaydayDate) return 0;
    
    const payArray = nextPaydayDate.split('-').map(Number);
    const nextPayday = new Date(payArray[0], payArray[1]-1, payArray[2], 12, 0, 0);
    
    return futureExpenses.reduce((total, expense) => {
      const dueArray = expense.dueDate.split('-').map(Number);
      const dueDate = new Date(dueArray[0], dueArray[1]-1, dueArray[2], 12, 0, 0);
      
      // Se la scadenza è tra oggi e il prossimo pagamento
      if (dueDate >= today && dueDate <= nextPayday) {
        // Calcola quanti giorni mancano alla scadenza
        let currentDate = new Date(today);
        let daysUntilDue = 0;
        
        while (currentDate < dueDate) {
          daysUntilDue++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Minimo 1 giorno per evitare divisioni per zero
        daysUntilDue = Math.max(1, daysUntilDue);
        
        // Dividi l'importo per i giorni rimanenti
        const dailyAmount = expense.amount / daysUntilDue;
        
        return total + dailyAmount;
      }
      
      return total;
    }, 0);
  };

  const calculateDailyBudget = () => {
    // Ottieni i valori necessari
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const savingsAmount = (monthlyIncome * savingsPercentage) / 100;
    
    // Calcola i giorni rimanenti fino al prossimo pagamento
    const daysUntilNextPayday = getDaysUntilPayday();
    
    // Budget totale disponibile per il periodo rimanente
    const totalBudget = monthlyIncome - totalFixedExpenses - savingsAmount;
    
    // Budget giornaliero
    const dailyBudget = totalBudget / daysUntilNextPayday;
    
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

  // Sistema automatico per aggiungere risparmi mensili
  useEffect(() => {
    if (isLoading) return;
    
    // Controlla se è il giorno di paga
    if (nextPaydayDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const payday = new Date(nextPaydayDate);
      payday.setHours(0, 0, 0, 0);
      
      // Se oggi è il giorno di paga
      if (today.getTime() === payday.getTime()) {
        // Calcola e aggiungi automaticamente il risparmio mensile
        const monthlyAutomaticSavings = (monthlyIncome * savingsPercentage) / 100;
        if (monthlyAutomaticSavings > 0) {
          addToSavings(monthlyAutomaticSavings, new Date().toISOString());
        }
        
        // Calcola la durata del periodo
        const startDate = new Date(lastPaydayDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(payday);
        endDate.setHours(0, 0, 0, 0);
        
        // Calcolo esplicito dei giorni con un ciclo
        let currentDate = new Date(startDate);
        let diffDays = 0;
        
        while (currentDate <= endDate) {
          diffDays++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Aggiungi la stessa durata al periodo attuale
        const nextNextPayday = new Date(endDate);
        nextNextPayday.setDate(nextNextPayday.getDate() + diffDays);
        
        setLastPaydayDate(payday.toISOString().split('T')[0]);
        setNextPaydayDate(nextNextPayday.toISOString().split('T')[0]);
      }
    }
  }, [nextPaydayDate, monthlyIncome, savingsPercentage, isLoading, lastPaydayDate]);

  // Metodi per le transazioni
  const addTransaction = async (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      amount: parseFloat(transaction.amount),
      type: transaction.type || 'expense'
    };
    
    try {
      // Aggiungi la transazione al database
      await dbAddTransaction(newTransaction);
      
      // Aggiorna lo stato
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Aggiorna lo streak e gli achievements
      updateStreakAndAchievements();
      
    } catch (error) {
      console.error('Errore nell\'aggiunta della transazione:', error);
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      // Trova la transazione corrente
      const currentTransaction = transactions.find(t => t.id === id);
      
      if (!currentTransaction) return;
      
      // Crea la transazione aggiornata
      const updatedTransaction = { ...currentTransaction, ...updatedData };
      
      // Aggiorna nel database
      await dbUpdateTransaction(updatedTransaction);
      
      // Aggiorna lo stato
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
    } catch (error) {
      console.error('Errore nell\'aggiornamento della transazione:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      // Elimina dal database
      await dbDeleteTransaction(id);
      
      // Aggiorna lo stato
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      console.error('Errore nell\'eliminazione della transazione:', error);
    }
  };

  // Metodi per le spese fisse
  const addFixedExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount)
    };
    
    try {
      // Aggiungi al database
      await dbAddFixedExpense(newExpense);
      
      // Aggiorna lo stato
      setFixedExpenses(prev => [...prev, newExpense]);
      
      // Forza il salvataggio delle impostazioni aggiornate
      setTimeout(() => {
        saveAllSettings();
      }, 200);
    } catch (error) {
      console.error('Errore nell\'aggiunta della spesa fissa:', error);
    }
  };

  const deleteFixedExpense = async (id) => {
    try {
      // Elimina dal database
      await dbDeleteFixedExpense(id);
      
      // Aggiorna lo stato
      setFixedExpenses(prev => prev.filter(expense => expense.id !== id));
      
      // Forza il salvataggio delle impostazioni aggiornate
      setTimeout(() => {
        saveAllSettings();
      }, 200);
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa fissa:', error);
    }
  };

  // Metodi per le spese future
  const addFutureExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    try {
      // Aggiungi al database
      await dbAddFutureExpense(newExpense);
      
      // Aggiorna lo stato
      setFutureExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Errore nell\'aggiunta della spesa futura:', error);
    }
  };

  const updateFutureExpense = async (id, updatedData) => {
    try {
      // Trova la spesa corrente
      const currentExpense = futureExpenses.find(e => e.id === id);
      
      if (!currentExpense) return;
      
      // Crea la spesa aggiornata
      const updatedExpense = { ...currentExpense, ...updatedData };
      
      // Aggiorna nel database
      await dbUpdateFutureExpense(updatedExpense);
      
      // Aggiorna lo stato
      setFutureExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
    } catch (error) {
      console.error('Errore nell\'aggiornamento della spesa futura:', error);
    }
  };

  const deleteFutureExpense = async (id) => {
    try {
      // Elimina dal database
      await dbDeleteFutureExpense(id);
      
      // Aggiorna lo stato
      setFutureExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa futura:', error);
    }
  };

  // Funzione per aggiungere ai risparmi
  const addToSavings = async (amount, date = new Date().toISOString()) => {
    const newTotal = totalSavings + parseFloat(amount);
    
    const newEntry = {
      id: Date.now(),
      amount: parseFloat(amount),
      date,
      total: newTotal
    };
    
    try {
      // Aggiungi al database
      await dbAddSavingsEntry(newEntry);
      
      // Aggiorna lo stato
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      
      // Aggiungi un achievement se il risparmio totale supera una soglia
      checkSavingsAchievements(newTotal);
      
    } catch (error) {
      console.error('Errore nell\'aggiunta del risparmio:', error);
    }
  };

  // Funzione per prelevare dai risparmi
  const withdrawFromSavings = async (amount, date = new Date().toISOString()) => {
    const newTotal = totalSavings - parseFloat(amount);
    
    const newEntry = {
      id: Date.now(),
      amount: -parseFloat(amount),
      date,
      total: newTotal
    };
    
    try {
      // Aggiungi al database
      await dbAddSavingsEntry(newEntry);
      
      // Aggiorna lo stato
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
    } catch (error) {
      console.error('Errore nel prelievo dai risparmi:', error);
    }
  };

  // Funzione per verificare e aggiornare streak e achievement
  const updateStreakAndAchievements = () => {
    const surplus = getBudgetSurplus();
    
    if (surplus >= 0) {
      // Incrementa streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Aggiungi achievement per streak milestone
      if (newStreak === 7) {
        addAchievement('Streak di 7 giorni', 'Hai mantenuto il budget per una settimana!');
      } else if (newStreak === 30) {
        addAchievement('Streak di 30 giorni', 'Hai mantenuto il budget per un mese intero!');
      }
    } else {
      // Resetta streak
      setStreak(0);
    }
  };

  // Verifica achievement per risparmi
  const checkSavingsAchievements = (total) => {
    if (total >= 100 && !hasAchievement('Primo traguardo di risparmio')) {
      addAchievement('Primo traguardo di risparmio', 'Hai risparmiato i primi €100!');
    } else if (total >= 500 && !hasAchievement('Risparmio considerevole')) {
      addAchievement('Risparmio considerevole', 'Hai raggiunto €500 di risparmi!');
    } else if (total >= 1000 && !hasAchievement('Risparmiatore esperto')) {
      addAchievement('Risparmiatore esperto', 'Hai raggiunto €1000 di risparmi!');
    }
  };

  // Verifica se un achievement esiste già
  const hasAchievement = (title) => {
    return achievements.some(a => a.title === title);
  };

  // Aggiungi un nuovo achievement
  const addAchievement = (title, description) => {
    const newAchievement = {
      id: Date.now(),
      title,
      description,
      date: new Date().toISOString(),
      seen: false
    };
    
    setAchievements(prev => [...prev, newAchievement]);
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

  // Funzione per resettare completamente l'app
  const resetApp = async () => {
    try {
      setIsLoading(true);
      
      // Cancella il database
      await clearDatabase();
      
      // Reinizializza il database
      await initDB();
      
      // Resetta tutti gli stati
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
      
      // Resetta le impostazioni utente ma mantiene il tema e la lingua
      setUserSettings({
        ...userSettings,
        setupCompleted: false // Segna la configurazione come non completata
      });
      
      // Salva le impostazioni vuote
      await saveSettings({
        id: 1,
        userSettings: {
          ...userSettings,
          setupCompleted: false
        },
        monthlyIncome: 0,
        lastPaydayDate: '',
        nextPaydayDate: '',
        savingsPercentage: 10,
        streak: 0,
        achievements: []
      });
      
      setIsLoading(false);
      
      // Dopo il reset, ricarica la pagina per sicurezza
      window.location.reload();
    } catch (error) {
      console.error('Errore nel reset dell\'app:', error);
      setIsLoading(false);
    }
  };

  // Value del provider con TUTTE le funzioni
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
      completeSetup, // Funzione per completare il setup iniziale
      saveAllSettings, // Esposizione della funzione per salvare manualmente

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
      resetApp // Nuova funzione di reset
    }}>
      {children}
    </AppContext.Provider>
  );
};

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
  isPWA
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
  const [saveTimeout, setSaveTimeout] = useState(null);
  
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

  // Helper per garantire che i valori siano numeri
  const ensureNumber = (value, defaultValue = 0) => {
    // Converte esplicitamente in numero, gestendo null, undefined, stringa vuota, etc.
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper per garantire che le spese abbiano importi numerici
  const ensureNumberInExpenses = (expenses) => {
    if (!Array.isArray(expenses)) return [];
    
    return expenses.map(expense => ({
      ...expense,
      amount: ensureNumber(expense.amount, 0)
    }));
  };

  // FUNZIONI PWA PER BACKUP LOCALSTORAGE
  const saveToLocalStorageBackup = (data) => {
    if (isPWA()) {
      try {
        // Salva TUTTI i dati critici in localStorage
        localStorage.setItem('budget-app-full-backup', JSON.stringify({
          userSettings: data.userSettings || userSettings,
          monthlyIncome: Number(data.monthlyIncome || monthlyIncome),
          lastPaydayDate: data.lastPaydayDate || lastPaydayDate,
          nextPaydayDate: data.nextPaydayDate || nextPaydayDate,
          savingsPercentage: Number(data.savingsPercentage || savingsPercentage),
          streak: Number(data.streak || streak),
          achievements: data.achievements || achievements,
          timestamp: new Date().toISOString(),
          setupCompleted: data.userSettings?.setupCompleted || userSettings.setupCompleted
        }));
        
        // Backup separato solo per setupCompleted (extra sicurezza)
        localStorage.setItem('budget-setup-completed', String(data.userSettings?.setupCompleted || userSettings.setupCompleted));
        
        console.log("Backup completo salvato in localStorage per PWA");
      } catch (e) {
        console.error("Errore nel backup localStorage:", e);
      }
    }
  };

  // Funzione migliorata per caricare da localStorage
  const loadFromLocalStorageBackup = () => {
    if (isPWA()) {
      try {
        // Prima controlla se il setup è stato completato
        const setupCompleted = localStorage.getItem('budget-setup-completed');
        console.log("Setup completed da localStorage:", setupCompleted);
        
        if (setupCompleted === 'true') {
          // Carica il backup completo
          const fullBackup = localStorage.getItem('budget-app-full-backup');
          if (fullBackup) {
            const backupData = JSON.parse(fullBackup);
            console.log("Backup completo trovato:", backupData);
            
            // Applica i dati dal backup
            setUserSettings(backupData.userSettings || userSettings);
            setMonthlyIncome(ensureNumber(backupData.monthlyIncome, 0));
            setLastPaydayDate(backupData.lastPaydayDate || '');
            setNextPaydayDate(backupData.nextPaydayDate || '');
            setSavingsPercentage(ensureNumber(backupData.savingsPercentage, 10));
            setStreak(ensureNumber(backupData.streak, 0));
            setAchievements(backupData.achievements || []);
            
            return true; // Indica che i dati sono stati caricati
          }
        }
      } catch (e) {
        console.error("Errore nel caricamento da localStorage:", e);
      }
    }
    return false; // Nessun dato caricato
  };

  // Funzione ottimizzata per salvare subito tutte le impostazioni
  const saveAllSettings = async () => {
    try {
      console.log("Tentativo di salvataggio impostazioni:", {
        monthlyIncome,
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage,
        setupCompleted: userSettings.setupCompleted
      });

      const settings = {
        id: 1,
        userSettings,
        monthlyIncome: Number(monthlyIncome),
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage: Number(savingsPercentage),
        streak: Number(streak),
        achievements
      };

      // PRIMA salva in localStorage per PWA (più affidabile)
      saveToLocalStorageBackup(settings);
      
      // POI prova a salvare nel database
      await saveSettings(settings);
      console.log("Impostazioni salvate con successo nel database:", settings);
      
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
      
      // Se il database fallisce, assicurati che almeno localStorage funzioni
      saveToLocalStorageBackup({
        userSettings,
        monthlyIncome,
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage,
        streak,
        achievements
      });
      
      // Retry migliorato per PWA
      if (isPWA()) {
        console.log("Tentativo di recupero errore su PWA con triple retry");
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            await initDB();
            
            const settingsRetry = {
              id: 1,
              userSettings,
              monthlyIncome: Number(monthlyIncome),
              lastPaydayDate,
              nextPaydayDate,
              savingsPercentage: Number(savingsPercentage),
              streak: Number(streak),
              achievements
            };
            
            await saveSettings(settingsRetry);
            console.log(`Recupero salvataggio PWA riuscito al tentativo ${attempt}`);
            return;
          } catch (retryError) {
            console.error(`Tentativo ${attempt} fallito:`, retryError);
            if (attempt === 3) {
              console.error("Tutti i tentativi di recupero sono falliti, ma localStorage dovrebbe funzionare");
            }
          }
        }
      }
    }
  };

  // Funzione completeSetup MIGLIORATA
  const completeSetup = () => {
    console.log("Completamento setup iniziale...");
    
    const newUserSettings = {
      ...userSettings,
      setupCompleted: true
    };
    
    setUserSettings(newUserSettings);
    
    // SALVA IMMEDIATAMENTE in localStorage per PWA
    if (isPWA()) {
      try {
        localStorage.setItem('budget-setup-completed', 'true');
        saveToLocalStorageBackup({
          userSettings: newUserSettings,
          monthlyIncome,
          lastPaydayDate,
          nextPaydayDate,
          savingsPercentage,
          streak,
          achievements
        });
        console.log("Setup completion salvato immediatamente in localStorage");
      } catch (e) {
        console.error("Errore nel salvataggio immediato localStorage:", e);
      }
    }
    
    // Poi salva anche nel database
    setTimeout(() => {
      saveAllSettings();
      
      // Su PWA potrebbe essere necessario un secondo tentativo
      if (isPWA()) {
        setTimeout(() => {
          console.log("Secondo tentativo di salvataggio setup in PWA");
          saveAllSettings();
        }, 1500);
      }
    }, 200);
  };

  // Funzione migliorata per il caricamento con fallback su localStorage
  const loadDataWithFallback = async () => {
    try {
      setIsLoading(true);
      
      // Per PWA, prova PRIMA localStorage
      if (isPWA()) {
        console.log("PWA rilevata, controllo localStorage prima del database...");
        
        const loadedFromLocalStorage = loadFromLocalStorageBackup();
        if (loadedFromLocalStorage) {
          console.log("Dati caricati con successo da localStorage, continuo con il resto");
          // Continua con il caricamento del database ma i dati critici sono già caricati
        }
      }
      
      // Inizializza il database
      await initDB();
      
      // Su PWA, piccolo ritardo aggiuntivo
      if (isPWA()) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Carica le impostazioni dal database (se non già caricate da localStorage)
      let settingsData = await getSettings();
      console.log("Impostazioni caricate dal database:", settingsData);
      
      // Se non abbiamo dati dal database E non li abbiamo già da localStorage
      if ((!settingsData || settingsData.length === 0) && isPWA()) {
        console.log("Nessun dato nel database, controllo backup localStorage...");
        
        // Se non abbiamo già caricato da localStorage, proviamo ora
        const setupCompleted = localStorage.getItem('budget-setup-completed');
        if (setupCompleted === 'true') {
          try {
            const fullBackup = localStorage.getItem('budget-app-full-backup');
            if (fullBackup) {
              const backupData = JSON.parse(fullBackup);
              console.log("Backup trovato in localStorage:", backupData);
              
              // Se non abbiamo già impostato questi valori, fallo ora
              if (userSettings.setupCompleted !== true) {
                setUserSettings(backupData.userSettings || userSettings);
                setMonthlyIncome(ensureNumber(backupData.monthlyIncome, 0));
                setLastPaydayDate(backupData.lastPaydayDate || '');
                setNextPaydayDate(backupData.nextPaydayDate || '');
                setSavingsPercentage(ensureNumber(backupData.savingsPercentage, 10));
              }
              
              // Salva nel database per il futuro
              const settingsToSave = {
                id: 1,
                userSettings: backupData.userSettings || userSettings,
                monthlyIncome: Number(backupData.monthlyIncome || 0),
                lastPaydayDate: backupData.lastPaydayDate || '',
                nextPaydayDate: backupData.nextPaydayDate || '',
                savingsPercentage: Number(backupData.savingsPercentage || 10),
                streak: Number(backupData.streak || 0),
                achievements: backupData.achievements || []
              };
              
              try {
                await saveSettings(settingsToSave);
                console.log("Dati ripristinati dal backup e salvati nel database");
                settingsData = [settingsToSave];
              } catch (saveError) {
                console.error("Errore nel salvataggio nel database, ma localStorage funziona:", saveError);
              }
            }
          } catch (e) {
            console.error("Errore nel ripristino dal backup localStorage:", e);
          }
        }
      }
      
      // Processa i dati caricati (dal database o da localStorage)
      if (settingsData && settingsData.length > 0 && userSettings.setupCompleted !== true) {
        const settings = settingsData[0];
        
        setUserSettings(settings.userSettings || userSettings);
        setMonthlyIncome(ensureNumber(settings.monthlyIncome, 0));
        setLastPaydayDate(settings.lastPaydayDate || '');
        setNextPaydayDate(settings.nextPaydayDate || '');
        setSavingsPercentage(ensureNumber(settings.savingsPercentage, 10));
        setStreak(ensureNumber(settings.streak, 0));
        setAchievements(settings.achievements || []);
        
        console.log('Dati finali caricati:', {
          monthlyIncome: ensureNumber(settings.monthlyIncome, 0),
          savingsPercentage: ensureNumber(settings.savingsPercentage, 10),
          setupCompleted: settings.userSettings?.setupCompleted
        });
        
        // Imposta i colori del tema
        if (settings.userSettings && settings.userSettings.themeId) {
          const themeId = settings.userSettings.themeId;
          if (THEMES[themeId]) {
            setActiveTheme(THEMES[themeId]);
          }
        }
      }
      
      // Carica tutti gli altri dati in parallelo
      const [transactionsData, fixedExpensesData, futureExpensesData, savingsData] = await Promise.all([
        getTransactions(),
        getFixedExpenses(),
        getFutureExpenses(),
        getSavingsHistory()
      ]);
      
      // Processa i dati caricati
      if (transactionsData) {
        const processedTransactions = transactionsData.map(transaction => ({
          ...transaction,
          amount: ensureNumber(transaction.amount, 0)
        }));
        setTransactions(processedTransactions);
      }
      
      if (fixedExpensesData) {
        setFixedExpenses(ensureNumberInExpenses(fixedExpensesData));
      }
      
      if (futureExpensesData) {
        setFutureExpenses(ensureNumberInExpenses(futureExpensesData));
      }
      
      if (savingsData) {
        const processedSavings = savingsData.map(entry => ({
          ...entry,
          amount: ensureNumber(entry.amount, 0),
          total: ensureNumber(entry.total, 0)
        }));
        setSavingsHistory(processedSavings);
        
        if (processedSavings.length > 0) {
          const lastSavingsEntry = processedSavings[processedSavings.length - 1];
          setTotalSavings(ensureNumber(lastSavingsEntry.total, 0));
        }
      }
      
      setIsLoading(false);
      console.log("Caricamento dati completato con successo");
      
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      
      // Fallback finale per PWA - usa solo localStorage
      if (isPWA()) {
        console.log("Tentativo di fallback finale per PWA usando solo localStorage");
        try {
          const loadedFromFallback = loadFromLocalStorageBackup();
          if (!loadedFromFallback) {
            console.log("Nessun backup localStorage trovato, setup necessario");
          }
        } catch (e) {
          console.error("Fallback finale fallito completamente:", e);
        }
      }
      
      setIsLoading(false);
    }
  };

  // Inizializzazione del database e caricamento dati
  useEffect(() => {
    loadDataWithFallback();
  }, []);

  // Registra la funzione di salvataggio globale per PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && window.registerGlobalSaveFunction) {
      window.registerGlobalSaveFunction(saveAllSettings);
      console.log("Funzione di salvataggio registrata per PWA");
    }
  }, []);
  
  // Salva le impostazioni quando cambiano con debounce ottimizzato
  useEffect(() => {
    if (isLoading) return;
    
    console.log("Rilevate modifiche alle impostazioni...", {
      monthlyIncome: ensureNumber(monthlyIncome), 
      lastPaydayDate, 
      nextPaydayDate, 
      savingsPercentage: ensureNumber(savingsPercentage), 
      userSettings
    });
    
    // Debounce: aspetta 1 secondo prima di salvare per evitare salvataggi multipli
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      console.log("Esecuzione salvataggio dopo debounce...");
      saveAllSettings();
    }, 1000); // Aspetta 1 secondo
    
    setSaveTimeout(newTimeout);
    
    // Cleanup
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
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
        const dailyAmount = ensureNumber(expense.amount, 0) / daysUntilDue;
        
        return total + dailyAmount;
      }
      
      return total;
    }, 0);
  };

  const calculateDailyBudget = () => {
    // Forza la conversione esplicita di tutti i numeri
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + ensureNumber(expense.amount, 0), 0);
    const savingsAmount = (ensureNumber(monthlyIncome, 0) * ensureNumber(savingsPercentage, 0)) / 100;
    
    // Calcola i giorni rimanenti fino al prossimo pagamento
    const daysUntilNextPayday = getDaysUntilPayday();
    
    // Budget totale disponibile per il periodo rimanente
    const totalBudget = ensureNumber(monthlyIncome, 0) - totalFixedExpenses - savingsAmount;
    
    // Budget giornaliero
    const dailyBudget = totalBudget / daysUntilNextPayday;
    
    // Sottrai le spese future giornaliere
    const dailyFutureExpenses = getDailyFutureExpenses();
    const finalBudget = dailyBudget - dailyFutureExpenses;
    
    console.log('Calcolo budget: ', {
      monthlyIncome: ensureNumber(monthlyIncome, 0),
      savingsPercentage: ensureNumber(savingsPercentage, 0),
      totalFixedExpenses,
      savingsAmount,
      daysUntilNextPayday,
      totalBudget,
      dailyBudget,
      dailyFutureExpenses,
      finalBudget
    });
    
    return finalBudget > 0 ? finalBudget : 0;
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today && transaction.type === 'expense')
      .reduce((sum, transaction) => sum + ensureNumber(transaction.amount, 0), 0);
  };

  const getTodayIncome = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today && transaction.type === 'income')
      .reduce((sum, transaction) => sum + ensureNumber(transaction.amount, 0), 0);
  };

  const getBudgetSurplus = () => {
    const dailyBudget = calculateDailyBudget();
    const todayExpenses = getTodayExpenses();
    const todayIncome = getTodayIncome();
    return dailyBudget - todayExpenses + todayIncome;
  };

  const getMonthlyAvailability = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + ensureNumber(expense.amount, 0), 0);
    const savingsAmount = (ensureNumber(monthlyIncome, 0) * ensureNumber(savingsPercentage, 0)) / 100;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);

    return ensureNumber(monthlyIncome, 0) - totalFixedExpenses - savingsAmount - monthlyExpenses;
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
        const monthlyAutomaticSavings = (ensureNumber(monthlyIncome, 0) * ensureNumber(savingsPercentage, 0)) / 100;
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
      amount: ensureNumber(transaction.amount, 0),
      type: transaction.type || 'expense'
    };
    
    try {
      // Aggiungi la transazione al database
      await dbAddTransaction(newTransaction);
      
      // Aggiorna lo stato
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Aggiorna lo streak e gli achievements
      updateStreakAndAchievements();
      
      // Per PWA, forza salvataggio dopo aggiunta transazione
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta della transazione:', error);
      
      // Retry per PWA
      if (isPWA()) {
        try {
          console.log("Ritentativo aggiunta transazione in PWA");
          await initDB();
          await dbAddTransaction(newTransaction);
          setTransactions(prev => [newTransaction, ...prev]);
        } catch (retryError) {
          console.error('Anche il ritentativo è fallito:', retryError);
        }
      }
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      // Trova la transazione corrente
      const currentTransaction = transactions.find(t => t.id === id);
      
      if (!currentTransaction) return;
      
      // Crea la transazione aggiornata
      const updatedTransaction = { 
        ...currentTransaction, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, currentTransaction.amount)
      };
      
      // Aggiorna nel database
      await dbUpdateTransaction(updatedTransaction);
      
      // Aggiorna lo stato
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      
      // Per PWA, forza salvataggio dopo aggiornamento
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
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
      
      // Per PWA, forza salvataggio dopo eliminazione
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della transazione:', error);
    }
  };

  // Metodi per le spese fisse
  const addFixedExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      // Aggiungi al database
      await dbAddFixedExpense(newExpense);
      
      // Aggiorna lo stato
      setFixedExpenses(prev => [...prev, newExpense]);
      
      // Forza il salvataggio delle impostazioni aggiornate
      setTimeout(() => {
        saveAllSettings();
      }, isPWA() ? 800 : 200);
    } catch (error) {
      console.error('Errore nell\'aggiunta della spesa fissa:', error);
      
      // Retry per PWA
      if (isPWA()) {
        setTimeout(async () => {
          try {
            console.log("Ritentativo aggiunta spesa fissa in PWA");
            await initDB();
            await dbAddFixedExpense(newExpense);
            setFixedExpenses(prev => [...prev, newExpense]);
            saveAllSettings();
          } catch (e) {
            console.error("Ritentativo fallito:", e);
          }
        }, 1000);
      }
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
      }, isPWA() ? 800 : 200);
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa fissa:', error);
    }
  };

  // Metodi per le spese future
  const addFutureExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0),
      createdAt: new Date().toISOString()
    };
    
    try {
      // Aggiungi al database
      await dbAddFutureExpense(newExpense);
      
      // Aggiorna lo stato
      setFutureExpenses(prev => [...prev, newExpense]);
      
      // Per PWA, forza salvataggio
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
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
      const updatedExpense = { 
        ...currentExpense, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, currentExpense.amount) 
      };
      
      // Aggiorna nel database
      await dbUpdateFutureExpense(updatedExpense);
      
      // Aggiorna lo stato
      setFutureExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
      
      // Per PWA, forza salvataggio
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
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
      
      // Per PWA, forza salvataggio
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa futura:', error);
    }
  };

  // Funzione per aggiungere ai risparmi
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
      // Aggiungi al database
      await dbAddSavingsEntry(newEntry);
      
      // Aggiorna lo stato
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      
      // Aggiungi un achievement se il risparmio totale supera una soglia
      checkSavingsAchievements(newTotal);
      
      // Per PWA, forza salvataggio
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del risparmio:', error);
    }
  };

  // Funzione per prelevare dai risparmi
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
      // Aggiungi al database
      await dbAddSavingsEntry(newEntry);
      
      // Aggiorna lo stato
      setSavingsHistory(prev => [...prev, newEntry]);
      setTotalSavings(newTotal);
      
      // Per PWA, forza salvataggio
      if (isPWA()) {
        setTimeout(saveAllSettings, 500);
      }
    } catch (error) {
      console.error('Errore nel prelievo dai risparmi:', error);
    }
  };

  // Funzione per verificare e aggiornare streak e achievement
  const updateStreakAndAchievements = () => {
    const surplus = getBudgetSurplus();
    
    if (surplus >= 0) {
      // Incrementa streak
      const newStreak = ensureNumber(streak, 0) + 1;
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
    const parsedTotal = ensureNumber(total, 0);
    if (parsedTotal >= 100 && !hasAchievement('Primo traguardo di risparmio')) {
      addAchievement('Primo traguardo di risparmio', 'Hai risparmiato i primi €100!');
    } else if (parsedTotal >= 500 && !hasAchievement('Risparmio considerevole')) {
      addAchievement('Risparmio considerevole', 'Hai raggiunto €500 di risparmi!');
    } else if (parsedTotal >= 1000 && !hasAchievement('Risparmiatore esperto')) {
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
      categoryExpenses[t.categoryId] += ensureNumber(t.amount, 0);
    });

    return {
      totalExpenses: expenses.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0),
      totalIncome: income.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0),
      transactionCount: monthlyTransactions.length,
      averageExpense: expenses.length ? expenses.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0) / expenses.length : 0,
      categoryBreakdown: categoryExpenses,
      dailyAverageExpense: expenses.reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0) / new Date().getDate()
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
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);

    const lastWeekExpenses = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && tDate >= lastWeekStart && tDate <= lastWeekEnd;
      })
      .reduce((sum, t) => sum + ensureNumber(t.amount, 0), 0);

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
      
      // In PWA, cancella anche localStorage
      if (isPWA()) {
        localStorage.removeItem('budget-app-saved');
        localStorage.removeItem('budget-app-income');
        localStorage.removeItem('budget-app-savings-percentage');
        localStorage.removeItem('budget-app-backup');
        localStorage.removeItem('budget-setup-completed');
        localStorage.removeItem('budget-app-full-backup');
      }
      
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

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
  isPWA,
  createManualBackup,
  getBackupInfo,
  restoreFromBackup
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
    themeId: 'blue',
    setupCompleted: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  // Stati per il backup e recovery
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null,
    autoBackupEnabled: true,
    backupInProgress: false
  });
  
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

  // CORREZIONE PRINCIPALE: Funzione ensureNumber migliorata che gestisce correttamente lo 0
  const ensureNumber = (value, defaultValue = 0) => {
    // Se il valore è esattamente 0, ritorna 0
    if (value === 0) {
      return 0;
    }
    
    // Se è null, undefined o stringa vuota, usa il default
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Converti in numero
    const num = Number(value);
    
    // Se la conversione ha dato NaN, usa il default
    if (isNaN(num)) {
      return defaultValue;
    }
    
    // Altrimenti ritorna il numero convertito
    return num;
  };

  // Helper per garantire che le spese abbiano importi numerici
  const ensureNumberInExpenses = (expenses) => {
    if (!Array.isArray(expenses)) return [];
    
    return expenses.map(expense => ({
      ...expense,
      amount: ensureNumber(expense.amount, 0)
    }));
  };

  // Sistema di backup automatico migliorato
  const createAutoBackup = async () => {
    if (!backupStatus.autoBackupEnabled || backupStatus.backupInProgress) {
      return false;
    }

    try {
      setBackupStatus(prev => ({ ...prev, backupInProgress: true }));
      console.log("Creazione backup automatico...");
      
      const backup = await createManualBackup();
      
      if (backup) {
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: new Date().toISOString(),
          backupInProgress: false
        }));
        
        console.log("Backup automatico completato con successo");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Errore nel backup automatico:", error);
      return false;
    } finally {
      setBackupStatus(prev => ({ ...prev, backupInProgress: false }));
    }
  };

  // Funzione per gestire i messaggi del service worker
  const handleServiceWorkerMessage = (event) => {
    console.log("Messaggio ricevuto dal Service Worker:", event.data);
    
    switch (event.data.type) {
      case 'PREPARE_FOR_UPDATE':
        console.log("Preparazione per aggiornamento PWA...");
        createAutoBackup();
        break;
        
      case 'SERVICE_WORKER_UPDATED':
        console.log("Service Worker aggiornato, verifica integrità dati...");
        setTimeout(verifyDataIntegrity, 2000);
        break;
        
      case 'FORCE_SAVE_DATA':
      case 'EMERGENCY_SAVE':
        console.log("Salvataggio forzato richiesto dal SW");
        saveAllSettingsImmediate();
        break;
        
      case 'CREATE_BACKUP':
      case 'PERIODIC_BACKUP_REMINDER':
        if (backupStatus.autoBackupEnabled) {
          createAutoBackup();
        }
        break;
        
      case 'HEALTH_CHECK':
        console.log("Health check dal Service Worker");
        verifyDataIntegrity();
        break;
        
      case 'SYNC_DATA':
        console.log("Sincronizzazione dati richiesta");
        saveAllSettingsImmediate();
        break;
        
      default:
        console.log('Messaggio Service Worker non gestito:', event.data.type);
    }
  };

  // Verifica l'integrità dei dati
  const verifyDataIntegrity = async () => {
    try {
      console.log("Verifica integrità dati...");
      
      const hasTransactions = transactions && transactions.length > 0;
      const hasSettings = userSettings && userSettings.setupCompleted;
      const hasFixedExpenses = fixedExpenses && fixedExpenses.length > 0;
      
      // Se non abbiamo dati critici, prova a ripristinare da backup
      if (!hasSettings || (!hasTransactions && !hasFixedExpenses && monthlyIncome === 0)) {
        console.log("Possibile perdita di dati rilevata, tentativo di ripristino...");
        
        const backupInfo = getBackupInfo();
        if (backupInfo.exists && backupInfo.totalItems > 0) {
          console.log("Backup trovato:", backupInfo);
          
          // Chiedi all'utente se vuole ripristinare (o fallo automaticamente)
          const shouldRestore = window.confirm(
            `Rilevata possibile perdita di dati. Trovato backup del ${new Date(backupInfo.timestamp).toLocaleString()} con ${backupInfo.totalItems} elementi. Vuoi ripristinare?`
          );
          
          if (shouldRestore) {
            const restored = await restoreFromBackup();
            if (restored) {
              console.log("Dati ripristinati da backup");
              // Ricarica i dati
              await loadDataWithFallback();
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Errore nella verifica integrità:", error);
      return false;
    }
  };

  // Registrazione listener per Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && isPWA()) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Registra anche eventi di visibilità per PWA
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          console.log("App in background, salvataggio dati...");
          saveAllSettingsImmediate();
          
          // Notifica il service worker
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'APP_CLOSING',
              timestamp: new Date().toISOString()
            });
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // CORREZIONE PRINCIPALE: Funzione per salvare immediatamente con gestione PWA migliorata
  const saveAllSettingsImmediate = async () => {
    if (isLoading) {
      console.log("App ancora in caricamento, skip salvataggio");
      return;
    }
    
    try {
      console.log("=== SALVATAGGIO IMMEDIATO INIZIATO ===");
      console.log("Dati da salvare:", {
        savingsPercentage: savingsPercentage,
        monthlyIncome: monthlyIncome,
        userSettings: userSettings,
        typeof_savingsPercentage: typeof savingsPercentage
      });
      
      const settingsToSave = {
        id: 1,
        userSettings,
        monthlyIncome: ensureNumber(monthlyIncome, 0),
        lastPaydayDate: lastPaydayDate || '',
        nextPaydayDate: nextPaydayDate || '',
        savingsPercentage: ensureNumber(savingsPercentage, 10), // Assicura che sia numerico
        streak: ensureNumber(streak, 0),
        achievements: achievements || []
      };
      
      console.log("Settings processati per il salvataggio:", settingsToSave);
      
      // CORREZIONE: Backup immediato in localStorage per PWA prima del salvataggio nel DB
      if (isPWA()) {
        try {
          localStorage.setItem('budget-app-settings-emergency', JSON.stringify(settingsToSave));
          localStorage.setItem('budget-app-settings-emergency-timestamp', new Date().toISOString());
          console.log("Backup di emergenza creato in localStorage");
        } catch (localStorageError) {
          console.warn("Errore nel backup di emergenza:", localStorageError);
        }
      }
      
      // Salva nel database
      await saveSettings(settingsToSave);
      console.log("Salvataggio nel database completato");
      
      // CORREZIONE: Verifica immediata del salvataggio per PWA
      if (isPWA()) {
        setTimeout(async () => {
          try {
            const verificaSettings = await getSettings();
            if (verificaSettings && verificaSettings[0]) {
              console.log("VERIFICA - savingsPercentage salvato:", verificaSettings[0].savingsPercentage);
              console.log("VERIFICA - Tutti i settings salvati:", verificaSettings[0]);
              
              // Se la verifica non corrisponde, prova un altro salvataggio
              if (verificaSettings[0].savingsPercentage !== settingsToSave.savingsPercentage) {
                console.warn("Mismatch rilevato, nuovo tentativo di salvataggio...");
                await saveSettings(settingsToSave);
              }
            }
          } catch (e) {
            console.error("Errore nella verifica post-salvataggio:", e);
          }
        }, 500);
      }
      
      // Se siamo in PWA, crea anche un backup automatico
      if (isPWA() && backupStatus.autoBackupEnabled) {
        setTimeout(() => {
          createAutoBackup().catch(err => console.warn("Backup automatico fallito:", err));
        }, 1000);
      }
      
      console.log("=== SALVATAGGIO COMPLETATO CON SUCCESSO ===");
      
    } catch (error) {
      console.error('Errore nel salvataggio immediato:', error);
      
      // CORREZIONE: Strategia di recovery migliorata per PWA
      if (isPWA()) {
        console.log("Avvio strategia di recovery per PWA...");
        
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            console.log(`Tentativo di recovery ${attempt}/5`);
            
            // Attendi prima di riprovare
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            
            // Reinizializza il database
            await initDB();
            
            // Riprova il salvataggio
            const settingsRetry = {
              id: 1,
              userSettings,
              monthlyIncome: ensureNumber(monthlyIncome, 0),
              lastPaydayDate: lastPaydayDate || '',
              nextPaydayDate: nextPaydayDate || '',
              savingsPercentage: ensureNumber(savingsPercentage, 10),
              streak: ensureNumber(streak, 0),
              achievements: achievements || []
            };
            
            await saveSettings(settingsRetry);
            console.log(`Recovery PWA riuscito al tentativo ${attempt}`);
            return; // Uscita dalla funzione se il salvataggio è riuscito
            
          } catch (retryError) {
            console.error(`Tentativo ${attempt} fallito:`, retryError);
            if (attempt === 5) {
              console.error("Tutti i tentativi di recovery sono falliti");
              
              // Ultimo tentativo: salva solo in localStorage
              try {
                const emergencyBackup = {
                  settings: {
                    id: 1,
                    userSettings,
                    monthlyIncome: ensureNumber(monthlyIncome, 0),
                    lastPaydayDate: lastPaydayDate || '',
                    nextPaydayDate: nextPaydayDate || '',
                    savingsPercentage: ensureNumber(savingsPercentage, 10),
                    streak: ensureNumber(streak, 0),
                    achievements: achievements || []
                  },
                  timestamp: new Date().toISOString(),
                  emergency: true
                };
                localStorage.setItem('budget-app-emergency-save', JSON.stringify(emergencyBackup));
                console.log("Salvataggio di emergenza in localStorage completato");
              } catch (emergencyError) {
                console.error("Anche il salvataggio di emergenza è fallito:", emergencyError);
              }
            }
          }
        }
      }
    }
  };

  // Salva le impostazioni (con debounce)
  const saveAllSettings = async () => {
    if (isLoading) return;
    
    try {
      console.log("Salvataggio settings con debounce:", {
        monthlyIncome: ensureNumber(monthlyIncome), 
        savingsPercentage: ensureNumber(savingsPercentage), 
        userSettings
      });

      const settings = {
        id: 1,
        userSettings,
        monthlyIncome: ensureNumber(monthlyIncome, 0),
        lastPaydayDate,
        nextPaydayDate,
        savingsPercentage: ensureNumber(savingsPercentage, 10),
        streak: ensureNumber(streak, 0),
        achievements
      };

      await saveSettings(settings);
      console.log("Impostazioni salvate con successo");
      
      if (isPWA() && backupStatus.autoBackupEnabled) {
        setTimeout(() => {
          createAutoBackup().catch(err => console.warn("Backup automatico fallito:", err));
        }, 1000);
      }
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
    }
  };

  // Funzione completeSetup migliorata
  const completeSetup = () => {
    console.log("Completamento setup iniziale...");
    
    const newUserSettings = {
      ...userSettings,
      setupCompleted: true
    };
    
    setUserSettings(newUserSettings);
    
    // Salva immediatamente senza debounce
    setTimeout(() => {
      saveAllSettingsImmediate();
      
      // Crea backup dopo il setup
      if (isPWA()) {
        setTimeout(() => {
          createAutoBackup().catch(err => console.warn("Backup post-setup fallito:", err));
        }, 2000);
      }
    }, 500);
  };

  // CORREZIONE: Funzione migliorata per il caricamento con gestione recovery
  const loadDataWithFallback = async () => {
    try {
      setIsLoading(true);
      console.log("=== INIZIO CARICAMENTO DATI ===");
      
      // Inizializza il database
      await initDB();
      
      // Su PWA, piccolo ritardo aggiuntivo
      if (isPWA()) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // CORREZIONE: Prova prima il recovery da localStorage se PWA
      let settingsData = null;
      if (isPWA()) {
        try {
          // Controlla se c'è un salvataggio di emergenza
          const emergencySave = localStorage.getItem('budget-app-emergency-save');
          const emergencySettings = localStorage.getItem('budget-app-settings-emergency');
          
          if (emergencySave) {
            const emergency = JSON.parse(emergencySave);
            console.log("Trovato salvataggio di emergenza:", emergency);
            settingsData = [emergency.settings];
          } else if (emergencySettings) {
            console.log("Trovato backup di emergenza da localStorage");
            settingsData = [JSON.parse(emergencySettings)];
          }
        } catch (e) {
          console.warn("Errore nel controllo emergency save:", e);
        }
      }
      
      // Se non abbiamo trovato dati di emergency, carica dal database
      if (!settingsData) {
        settingsData = await getSettings();
        console.log("Impostazioni caricate dal database:", settingsData);
      }
      
      // Processa le impostazioni caricate
      if (settingsData && settingsData.length > 0) {
        const settings = settingsData[0];
        
        setUserSettings(settings.userSettings || userSettings);
        setMonthlyIncome(ensureNumber(settings.monthlyIncome, 0));
        setLastPaydayDate(settings.lastPaydayDate || '');
        setNextPaydayDate(settings.nextPaydayDate || '');
        
        // CORREZIONE CRITICA: Gestisce correttamente lo 0 per savingsPercentage
        const savedSavingsPercentage = settings.savingsPercentage;
        console.log("Valore savingsPercentage dal database:", savedSavingsPercentage, "tipo:", typeof savedSavingsPercentage);
        
        if (typeof savedSavingsPercentage === 'number') {
          setSavingsPercentage(savedSavingsPercentage); // Accetta anche 0
          console.log('SavingsPercentage caricato correttamente:', savedSavingsPercentage);
        } else {
          setSavingsPercentage(10); // Default solo se non è un numero
          console.log('SavingsPercentage impostato al default: 10');
        }
        
        setStreak(ensureNumber(settings.streak, 0));
        setAchievements(settings.achievements || []);
        
        console.log('Dati finali caricati:', {
          monthlyIncome: ensureNumber(settings.monthlyIncome, 0),
          savingsPercentage: typeof savedSavingsPercentage === 'number' ? savedSavingsPercentage : 10,
          setupCompleted: settings.userSettings?.setupCompleted
        });
        
        // Imposta i colori del tema
        if (settings.userSettings && settings.userSettings.themeId) {
          const themeId = settings.userSettings.themeId;
          if (THEMES[themeId]) {
            setActiveTheme(THEMES[themeId]);
          }
        }
        
        // Se abbiamo usato un emergency save, ripulisci il localStorage
        if (isPWA()) {
          try {
            localStorage.removeItem('budget-app-emergency-save');
            localStorage.removeItem('budget-app-settings-emergency');
            console.log("Emergency saves ripuliti");
          } catch (e) {
            console.warn("Errore nella pulizia emergency saves:", e);
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
        console.log(`Caricate ${processedTransactions.length} transazioni`);
      }
      
      if (fixedExpensesData) {
        const processedExpenses = ensureNumberInExpenses(fixedExpensesData);
        setFixedExpenses(processedExpenses);
        console.log(`Caricate ${processedExpenses.length} spese fisse`);
      }
      
      if (futureExpensesData) {
        const processedFutureExpenses = ensureNumberInExpenses(futureExpensesData);
        setFutureExpenses(processedFutureExpenses);
        console.log(`Caricate ${processedFutureExpenses.length} spese future`);
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
        console.log(`Caricata cronologia risparmi con ${processedSavings.length} voci`);
      }
      
      // Aggiorna info backup
      const backupInfo = getBackupInfo();
      if (backupInfo.exists) {
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: backupInfo.timestamp
        }));
      }
      
      setIsLoading(false);
      console.log("=== CARICAMENTO DATI COMPLETATO ===");
      
      // Verifica integrità dopo il caricamento
      setTimeout(() => {
        verifyDataIntegrity().catch(err => console.warn("Verifica integrità fallita:", err));
      }, 2000);
      
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
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
      window.registerGlobalSaveFunction(saveAllSettingsImmediate);
      console.log("Funzione di salvataggio immediato registrata per PWA");
    }
    
    // NUOVO: Registra anche la funzione di backup
    if (typeof window !== 'undefined' && window.registerGlobalBackupFunction) {
      window.registerGlobalBackupFunction(createAutoBackup);
      console.log("Funzione di backup registrata per PWA");
    }
  }, []);
  
  // CORREZIONE: Effect per il salvataggio con debounce migliorato
  useEffect(() => {
    if (isLoading) return;
    
    console.log("Rilevate modifiche alle impostazioni...", {
      monthlyIncome: ensureNumber(monthlyIncome), 
      lastPaydayDate, 
      nextPaydayDate, 
      savingsPercentage: ensureNumber(savingsPercentage), 
      userSettings
    });
    
    // Per PWA, usa salvataggio più aggressivo
    const saveDelay = isPWA() ? 500 : 1000;
    
    // Debounce: aspetta prima di salvare per evitare salvataggi multipli
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      console.log("Esecuzione salvataggio dopo debounce...");
      if (isPWA()) {
        // Per PWA usa salvataggio immediato
        saveAllSettingsImmediate();
      } else {
        saveAllSettings();
      }
    }, saveDelay);
    
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

  // Sistema automatico per aggiungere risparmi mensili
  useEffect(() => {
    if (isLoading) return;
    
    if (nextPaydayDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const payday = new Date(nextPaydayDate);
      payday.setHours(0, 0, 0, 0);
      
      if (today.getTime() === payday.getTime()) {
        const currentSavingsPercentage = ensureNumber(savingsPercentage, 0);
        if (currentSavingsPercentage > 0) {
          const monthlyAutomaticSavings = (ensureNumber(monthlyIncome, 0) * currentSavingsPercentage) / 100;
          if (monthlyAutomaticSavings > 0) {
            console.log(`Aggiunta automatica risparmi: €${monthlyAutomaticSavings} (${currentSavingsPercentage}%)`);
            addToSavings(monthlyAutomaticSavings, new Date().toISOString());
          }
        } else {
          console.log("Percentuale risparmio è 0%, nessun risparmio automatico aggiunto");
        }
        
        const startDate = new Date(lastPaydayDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(payday);
        endDate.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(startDate);
        let diffDays = 0;
        
        while (currentDate <= endDate) {
          diffDays++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const nextNextPayday = new Date(endDate);
        nextNextPayday.setDate(nextNextPayday.getDate() + diffDays);
        
        setLastPaydayDate(payday.toISOString().split('T')[0]);
        setNextPaydayDate(nextNextPayday.toISOString().split('T')[0]);
      }
    }
  }, [nextPaydayDate, monthlyIncome, savingsPercentage, isLoading, lastPaydayDate]);

  // FUNZIONI IMPORTANTI PER IL CALCOLO DEL BUDGET
  const getDaysUntilPayday = () => {
    if (!nextPaydayDate) return 30;
    
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const payArray = nextPaydayDate.split('-').map(Number);
    const nextPayday = new Date(payArray[0], payArray[1]-1, payArray[2], 12, 0, 0);
    
    if (today >= nextPayday) return 1;
    
    let currentDate = new Date(today);
    let diffDays = 0;
    
    while (currentDate < nextPayday) {
      diffDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return diffDays;
  };

  const getDailyFutureExpenses = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    if (!nextPaydayDate) return 0;
    
    const payArray = nextPaydayDate.split('-').map(Number);
    const nextPayday = new Date(payArray[0], payArray[1]-1, payArray[2], 12, 0, 0);
    
    return futureExpenses.reduce((total, expense) => {
      const dueArray = expense.dueDate.split('-').map(Number);
      const dueDate = new Date(dueArray[0], dueArray[1]-1, dueArray[2], 12, 0, 0);
      
      if (dueDate >= today && dueDate <= nextPayday) {
        let currentDate = new Date(today);
        let daysUntilDue = 0;
        
        while (currentDate < dueDate) {
          daysUntilDue++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        daysUntilDue = Math.max(1, daysUntilDue);
        const dailyAmount = ensureNumber(expense.amount, 0) / daysUntilDue;
        
        return total + dailyAmount;
      }
      
      return total;
    }, 0);
  };

  const calculateDailyBudget = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + ensureNumber(expense.amount, 0), 0);
    const savingsAmount = (ensureNumber(monthlyIncome, 0) * ensureNumber(savingsPercentage, 0)) / 100;
    const daysUntilNextPayday = getDaysUntilPayday();
    const totalBudget = ensureNumber(monthlyIncome, 0) - totalFixedExpenses - savingsAmount;
    const dailyBudget = totalBudget / daysUntilNextPayday;
    const dailyFutureExpenses = getDailyFutureExpenses();
    const finalBudget = dailyBudget - dailyFutureExpenses;
    
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

  // Metodi per le transazioni (con salvataggio automatico migliorato)
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
      updateStreakAndAchievements();
      
      // Salvataggio automatico per PWA
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
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
      const currentTransaction = transactions.find(t => t.id === id);
      if (!currentTransaction) return;
      
      const updatedTransaction = { 
        ...currentTransaction, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, currentTransaction.amount)
      };
      
      await dbUpdateTransaction(updatedTransaction);
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento della transazione:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await dbDeleteTransaction(id);
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della transazione:', error);
    }
  };

  // Metodi per le spese fisse (con salvataggio migliorato)
  const addFixedExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0)
    };
    
    try {
      await dbAddFixedExpense(newExpense);
      setFixedExpenses(prev => [...prev, newExpense]);
      
      setTimeout(() => {
        saveAllSettingsImmediate();
      }, isPWA() ? 500 : 200);
    } catch (error) {
      console.error('Errore nell\'aggiunta della spesa fissa:', error);
      
      if (isPWA()) {
        setTimeout(async () => {
          try {
            console.log("Ritentativo aggiunta spesa fissa in PWA");
            await initDB();
            await dbAddFixedExpense(newExpense);
            setFixedExpenses(prev => [...prev, newExpense]);
            saveAllSettingsImmediate();
          } catch (e) {
            console.error("Ritentativo fallito:", e);
          }
        }, 1000);
      }
    }
  };

  const deleteFixedExpense = async (id) => {
    try {
      await dbDeleteFixedExpense(id);
      setFixedExpenses(prev => prev.filter(expense => expense.id !== id));
      
      setTimeout(() => {
        saveAllSettingsImmediate();
      }, isPWA() ? 500 : 200);
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa fissa:', error);
    }
  };

  // Metodi per le spese future (con salvataggio migliorato)
  const addFutureExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: ensureNumber(expense.amount, 0),
      createdAt: new Date().toISOString()
    };
    
    try {
      await dbAddFutureExpense(newExpense);
      setFutureExpenses(prev => [...prev, newExpense]);
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta della spesa futura:', error);
    }
  };

  const updateFutureExpense = async (id, updatedData) => {
    try {
      const currentExpense = futureExpenses.find(e => e.id === id);
      if (!currentExpense) return;
      
      const updatedExpense = { 
        ...currentExpense, 
        ...updatedData,
        amount: ensureNumber(updatedData.amount, currentExpense.amount) 
      };
      
      await dbUpdateFutureExpense(updatedExpense);
      setFutureExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento della spesa futura:', error);
    }
  };

  const deleteFutureExpense = async (id) => {
    try {
      await dbDeleteFutureExpense(id);
      setFutureExpenses(prev => prev.filter(expense => expense.id !== id));
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della spesa futura:', error);
    }
  };

  // Funzione per aggiungere ai risparmi (con salvataggio migliorato)
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
      checkSavingsAchievements(newTotal);
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del risparmio:', error);
    }
  };

  // Funzione per prelevare dai risparmi (con salvataggio migliorato)
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
      
      if (isPWA()) {
        setTimeout(saveAllSettingsImmediate, 300);
      }
    } catch (error) {
      console.error('Errore nel prelievo dai risparmi:', error);
    }
  };

  // Funzioni per streak e achievement
  const updateStreakAndAchievements = () => {
    const surplus = getBudgetSurplus();
    
    if (surplus >= 0) {
      const newStreak = ensureNumber(streak, 0) + 1;
      setStreak(newStreak);
      
      if (newStreak === 7) {
        addAchievement('Streak di 7 giorni', 'Hai mantenuto il budget per una settimana!');
      } else if (newStreak === 30) {
        addAchievement('Streak di 30 giorni', 'Hai mantenuto il budget per un mese intero!');
      }
    } else {
      setStreak(0);
    }
  };

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

  const hasAchievement = (title) => {
    return achievements.some(a => a.title === title);
  };

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

  // Funzione per resettare completamente l'app (migliorata)
  const resetApp = async () => {
    try {
      setIsLoading(true);
      
      // Prima crea un backup finale se possibile
      if (isPWA()) {
        try {
          await createAutoBackup();
          console.log("Backup finale creato prima del reset");
        } catch (e) {
          console.warn("Impossibile creare backup finale:", e);
        }
      }
      
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
      
      // Resetta le impostazioni utente ma mantieni il tema e la lingua
      setUserSettings({
        ...userSettings,
        setupCompleted: false
      });
      
      // Resetta anche il backup status
      setBackupStatus({
        lastBackup: null,
        autoBackupEnabled: true,
        backupInProgress: false
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
      completeSetup,
      saveAllSettings,
      saveAllSettingsImmediate,
      
      // Stati e funzioni per backup
      backupStatus, 
      setBackupStatus,
      createAutoBackup,
      verifyDataIntegrity,

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

import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, Minus, Plus, Trash2, Calendar, Info } from 'lucide-react';
import { AppContext } from '../context/AppContext';

// Verifica se siamo in PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || // Safari iOS
         document.referrer.includes('android-app://');
};

const ExpensesSetup = ({ isInitialSetup, onComplete }) => {
  const {
    fixedExpenses,
    categories,
    theme,
    setCurrentView,
    addFixedExpense,
    deleteFixedExpense,
    // Importiamo le date di pagamento dal contesto
    lastPaydayDate,
    nextPaydayDate,
    monthlyIncome,
    getDaysUntilPayday,
    saveAllSettings, // Utilizziamo questa funzione per forzare il salvataggio
  } = useContext(AppContext);

  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    categoryId: 1,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [updatedExpenses, setUpdatedExpenses] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  
  // Determina il tipo di ciclo di pagamento basandosi sulle date
  const detectPaymentCycle = () => {
    if (!lastPaydayDate || !nextPaydayDate) return 'mensile';
    
    const lastDate = new Date(lastPaydayDate);
    const nextDate = new Date(nextPaydayDate);
    const diffDays = Math.round((nextDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'settimanale';
    if (diffDays <= 15) return 'bisettimanale';
    return 'mensile';
  };

  // Sincronizza lo stato locale con le spese fisse del contesto
  useEffect(() => {
    if (fixedExpenses.length > 0 && !updatedExpenses) {
      setLocalExpenses([...fixedExpenses]);
    }
  }, [fixedExpenses, updatedExpenses]);

  // Animazioni
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const handleAddExpense = () => {
    if (
      !newExpense.name ||
      !newExpense.amount ||
      isNaN(parseFloat(newExpense.amount)) ||
      parseFloat(newExpense.amount) <= 0
    ) {
      return;
    }

    // Prima creiamo una copia locale
    const newExpenseObj = {
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      categoryId: parseInt(newExpense.categoryId),
      // Aggiungi un ID temporaneo
      id: Date.now(),
    };

    // Aggiorna lo stato locale immediatamente
    setLocalExpenses(prev => [...prev, newExpenseObj]);
    setUpdatedExpenses(true);

    // Poi chiamiamo la funzione del contesto che salva nel DB
    addFixedExpense({
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      categoryId: parseInt(newExpense.categoryId),
    });

    // Forza un salvataggio
    setTimeout(() => {
      saveAllSettings();
      
      // Per PWA, effettua un secondo tentativo
      if (isPWA()) {
        setTimeout(() => {
          console.log("Secondo tentativo di salvataggio in PWA (ExpensesSetup)");
          saveAllSettings();
        }, 1000);
      }
    }, 300);

    // Backup in localStorage
    try {
      const expensesJson = JSON.stringify([...localExpenses, newExpenseObj]);
      localStorage.setItem('budget-fixed-expenses', expensesJson);
    } catch (e) {
      console.error("Errore nel backup localStorage delle spese fisse:", e);
    }

    setNewExpense({
      name: '',
      amount: '',
      categoryId: 1,
    });
    setShowAddForm(false);
    setSaveAttempted(true);
  };

  const handleDeleteExpense = (id) => {
    // Aggiorna lo stato locale immediatamente 
    setLocalExpenses(prev => prev.filter(expense => expense.id !== id));
    setUpdatedExpenses(true);

    // Poi chiamiamo la funzione del contesto che elimina dal DB
    deleteFixedExpense(id);

    // Forza un salvataggio
    setTimeout(() => {
      saveAllSettings();
      
      // Per PWA, effettua un secondo tentativo
      if (isPWA()) {
        setTimeout(() => {
          console.log("Secondo tentativo di salvataggio in PWA dopo eliminazione");
          saveAllSettings();
        }, 1000);
      }
    }, 300);

    // Backup in localStorage
    try {
      const updatedExpenses = localExpenses.filter(expense => expense.id !== id);
      const expensesJson = JSON.stringify(updatedExpenses);
      localStorage.setItem('budget-fixed-expenses', expensesJson);
    } catch (e) {
      console.error("Errore nel backup localStorage dopo eliminazione:", e);
    }
    
    setSaveAttempted(true);
  };

  const totalExpenses = localExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  
  // Calcola l'impatto delle spese fisse sul budget mensile
  const calculateExpenseImpact = () => {
    if (monthlyIncome <= 0) return 0;
    return (totalExpenses / monthlyIncome) * 100;
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Ottiene una descrizione del ciclo di pagamento attuale
  const getPaymentInfo = () => {
    if (!lastPaydayDate && !nextPaydayDate) {
      return 'Nessun ciclo di pagamento configurato. Vai su "Stipendio" per configurarlo.';
    }
    
    const cycleType = detectPaymentCycle();
    const daysUntil = getDaysUntilPayday();
    
    let info = `Ciclo ${cycleType}`;
    
    if (lastPaydayDate) {
      info += `\nUltimo pagamento: ${formatDate(lastPaydayDate)}`;
    }
    
    if (nextPaydayDate) {
      info += `\nProssimo pagamento: ${formatDate(nextPaydayDate)}`;
      if (daysUntil !== null) {
        info += ` (tra ${daysUntil} ${daysUntil === 1 ? 'giorno' : 'giorni'})`;
      }
    }
    
    return info;
  };

  // Gestisci il completamento del setup
  const handleContinue = () => {
    // Forza un salvataggio finale prima di continuare
    saveAllSettings();
    
    if (isInitialSetup && onComplete) {
      // Backup in localStorage
      try {
        const expensesJson = JSON.stringify(localExpenses);
        localStorage.setItem('budget-fixed-expenses', expensesJson);
      } catch (e) {
        console.error("Errore nel backup localStorage prima della continuazione:", e);
      }
      
      onComplete(localExpenses);
    } else {
      // Assicurati che i dati siano salvati prima di cambiare vista
      setTimeout(() => {
        saveAllSettings();
        
        // Breve ritardo prima di cambiare vista
        setTimeout(() => {
          setCurrentView('savings');
        }, 200);
      }, isPWA() ? 500 : 200);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="expenses-setup"
      style={{ paddingBottom: '100px' }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          textAlign: 'center',
          padding: '16px',
          marginBottom: '16px',
          marginTop: isInitialSetup ? '40px' : '0',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
          {isInitialSetup ? 'Aggiungi le tue spese fisse' : 'Spese fisse mensili'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Aggiungi le spese che paghi regolarmente
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Icon and Total */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.danger}30 0%, ${theme.danger}10 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={40} style={{ color: theme.danger }} />
          </motion.div>
        </motion.div>

        {/* Informazioni sul ciclo di pagamento */}
        <motion.div
          variants={itemVariants}
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: `${theme.primary}15`,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setShowPaymentInfo(!showPaymentInfo)}
        >
          <div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>
              Ciclo di pagamento
            </p>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
              Le spese fisse seguono il tuo ciclo stipendio
            </p>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: `${theme.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={18} style={{ color: theme.primary }} />
          </div>
        </motion.div>

        <AnimatePresence>
          {showPaymentInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                marginBottom: '24px',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: theme.background,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Info size={20} style={{ color: theme.primary }} />
                <p style={{ fontSize: '14px', color: theme.text, fontWeight: '500' }}>
                  Informazioni sul ciclo di pagamento
                </p>
              </div>
              {getPaymentInfo().split('\n').map((line, index) => (
                <p 
                  key={index} 
                  style={{
                    fontSize: '14px', 
                    color: theme.text,
                    marginBottom: index < getPaymentInfo().split('\n').length - 1 ? '8px' : '0'
                  }}
                >
                  {line}
                </p>
              ))}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginTop: '16px' 
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('income')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    backgroundColor: theme.primary,
                    color: 'white',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Modifica <Calendar size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total Summary */}
        <motion.div
          variants={itemVariants}
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: `${theme.danger}15`,
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: theme.textSecondary,
              marginBottom: '8px',
            }}
          >
            TOTALE SPESE FISSE
          </p>
          <motion.p
            key={totalExpenses}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: theme.danger,
            }}
          >
            € {totalExpenses.toFixed(2)}
          </motion.p>
          
          {monthlyIncome > 0 && (
            <p style={{ 
              fontSize: '14px', 
              color: theme.textSecondary,
              marginTop: '8px'
            }}>
              {calculateExpenseImpact().toFixed(1)}% del tuo reddito mensile
            </p>
          )}
        </motion.div>

        {/* Add Button */}
        <motion.div variants={itemVariants} style={{ marginBottom: '24' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <Plus size={20} />
            Aggiungi spesa fissa
          </motion.button>
        </motion.div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', marginBottom: '24px' }}
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme.background,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.textSecondary,
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Nome spesa
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={newExpense.name}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, name: e.target.value })
                      }
                      placeholder="Es. Affitto, Mutuo, Abbonamento"
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: 'white',
                        color: '#1A2151', // MODIFICATO: colore testo fisso
                        fontSize: '16px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.textSecondary,
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Importo (€)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: theme.textSecondary,
                        }}
                      >
                        €
                      </span>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        style={{
                          width: '100%',
                          padding: '16px 16px 16px 40px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: 'white',
                          color: '#1A2151', // MODIFICATO: colore testo fisso
                          fontSize: '16px',
                          outline: 'none',
                        }}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.textSecondary,
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Categoria
                    </label>
                    <select
                      value={newExpense.categoryId}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          categoryId: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: 'white',
                        color: '#1A2151', // MODIFICATO: colore testo fisso
                        fontSize: '16px',
                        outline: 'none',
                      }}
                    >
                      {categories
                        .filter(c => c.id <= 20) // Solo categorie di spesa
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddExpense}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: theme.secondary,
                        color: 'white',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Salva
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddForm(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: theme.background,
                        color: theme.textSecondary,
                        fontWeight: '600',
                        border: `1px solid ${theme.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      Annulla
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Expenses List */}
        <motion.div variants={itemVariants}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '16px',
            }}
          >
            Le tue spese fisse
          </h3>

          {localExpenses.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {localExpenses.map((expense) => {
                const category = categories.find(
                  (c) => c.id === expense.categoryId
                );
                return (
                  <motion.div
                    key={expense.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: theme.background,
                      border: `1px solid ${theme.border}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          backgroundColor: `${category?.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>
                          {category?.icon}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: '500', color: theme.text }}>
                          {expense.name}
                        </p>
                        <p
                          style={{
                            fontSize: '14px',
                            color: theme.textSecondary,
                          }}
                        >
                          {category?.name}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <p style={{ fontWeight: '700', color: theme.danger }}>
                        € {expense.amount.toFixed(2)}
                      </p>
                      <motion.button
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: theme.danger,
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteExpense(expense.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: `${theme.danger}15`,
                          color: theme.danger,
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                borderRadius: '16px',
                backgroundColor: theme.background,
                color: theme.textSecondary,
              }}
            >
              <Wallet
                size={48}
                style={{ margin: '0 auto 16px', opacity: 0.5 }}
              />
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                Nessuna spesa fissa
              </p>
              <p style={{ fontSize: '14px' }}>
                Aggiungi le tue spese ricorrenti mensili
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Continue Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: '32px',
          }}
        >
          {isInitialSetup ? 'Continua' : 'Salva e continua'}
        </motion.button>

        {/* Navigation - mostra solo se non è la configurazione iniziale */}
        {!isInitialSetup && (
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => {
                saveAllSettings(); // Salva prima di navigare
                setTimeout(() => setCurrentView('income'), 200);
              }}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.textSecondary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              Indietro
            </button>

            <button
              onClick={() => {
                // Salva prima di navigare
                saveAllSettings();
                setTimeout(() => setCurrentView('savings'), 200);
              }}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Risparmio
              <TrendingUp size={16} />
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ExpensesSetup;

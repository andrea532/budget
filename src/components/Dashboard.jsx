import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Plus, Minus } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import SavingsOverlay from './SavingsOverlay';

// Dashboard con visualizzazione minimalista ma funzionalità complete
const UltraMinimalistDashboard = () => {
  const { 
    theme, 
    categories, 
    calculateDailyBudget, 
    getBudgetSurplus,
    addTransaction,
    getDaysUntilPayday,
    monthlyIncome,
    fixedExpenses,
    savingsPercentage,
    transactions,
    totalSavings
  } = useContext(AppContext);

  // Stati per l'interfaccia
  const [isFlowing, setIsFlowing] = useState(false);
  const [animationType, setAnimationType] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [showSavingsOverlay, setShowSavingsOverlay] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [addTransactionStep, setAddTransactionStep] = useState('category'); // 'category' o 'details'
  
  // Stato per nuova transazione
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    categoryId: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  // Formattazione importo
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };
  
  // Calcola i budget
  const dailyBudget = calculateDailyBudget();
  const budgetSurplus = getBudgetSurplus();
  const tomorrowBudget = dailyBudget + budgetSurplus;
  const afterTomorrowBudget = tomorrowBudget + dailyBudget;
  const daysUntilPayday = getDaysUntilPayday();
  
  // Controlla se il budget è in negativo per colorare tutti i numeri negativi
  const isNegativeBudget = budgetSurplus < 0;

  // Ottiene il colore appropriato per visualizzare un valore numerico
  const getDisplayColor = (value) => {
    if (value < 0) {
      return theme.danger; // Sempre rosso per valori negativi
    } else {
      return theme.primary; // Default per valori positivi
    }
  };

  // Calcolo saldo mensile
  const calculateMonthlyBalance = () => {
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

    const monthlyIncome_ = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'income' && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return monthlyIncome + monthlyIncome_ - totalFixedExpenses - savingsAmount - monthlyExpenses;
  };

  const monthlyBalance = calculateMonthlyBalance();

  // Calcola i giorni corretti basati sulla data attuale
  const getDayName = (addDays = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + addDays);
    return date.toLocaleDateString('it-IT', { weekday: 'short' })
      .replace('.', '')
      .charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', { weekday: 'short' })
      .replace('.', '')
      .slice(1);
  };
  
  // Giorni della settimana
  const days = ["Oggi", getDayName(1), getDayName(2)];

  // Gestione transazioni
  const handleAddTransaction = () => {
    let amountValue = '';
    if (newTransaction.amount) {
      amountValue = (parseInt(newTransaction.amount, 10) / 100).toFixed(2);
    }
    
    if (!amountValue || parseFloat(amountValue) <= 0) {
      return;
    }

    let finalCategoryId = newTransaction.categoryId;
    if (transactionType === 'income' && newTransaction.categoryId < 21) {
      finalCategoryId = 21;
    }

    addTransaction({
      amount: parseFloat(amountValue),
      categoryId: finalCategoryId,
      description: newTransaction.description,
      date: newTransaction.date,
      type: transactionType
    });

    setNewTransaction({
      amount: '',
      categoryId: transactionType === 'expense' ? 1 : 21,
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: transactionType
    });

    setShowAddTransaction(false);
  };

  // Messaggio motivazionale
  const getMotivationalMessage = () => {
    if (budgetSurplus > dailyBudget) {
      return "Fantastico! Stai risparmiando molto! 🎉";
    } else if (budgetSurplus > 0) {
      return "Ottimo lavoro! Continua così! 👍";
    } else if (budgetSurplus === 0) {
      return "Perfetto equilibrio! ⚖️";
    } else {
      return "Attenzione al budget di oggi! ⚠️";
    }
  };

  // Determina lo sfondo in base al saldo
  const getDashboardBackground = () => {
    if (isNegativeBudget) {
      // Sfondo rosso quando il saldo è negativo
      return `linear-gradient(180deg, ${theme.danger}40 0%, ${theme.danger}20 50%, ${theme.danger}10 100%)`;
    } else {
      // Sfondo standard quando il saldo è positivo
      return `linear-gradient(180deg, ${theme.card} 0%, ${theme.background} 50%, ${theme.background} 100%)`;
    }
  };

  return (
    <div style={{ 
      background: getDashboardBackground(),
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      borderRadius: '12px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      touchAction: 'none',
      transition: 'background 0.5s ease' // Aggiunta animazione alla transizione
    }}>
      {/* Savings Overlay */}
      <SavingsOverlay isOpen={showSavingsOverlay} onClose={() => setShowSavingsOverlay(false)} />

      {/* Header con pulsante risparmi e saldo mensile */}
      <div 
        style={{
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '11px', color: theme.textSecondary }}>Saldo mensile</p>
          <p style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            color: monthlyBalance >= 0 ? theme.secondary : theme.danger 
          }}>
            € {monthlyBalance.toFixed(2).replace('.', ',')}
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '3px',
            marginTop: '4px'
          }}>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: theme.primary 
            }}></div>
            <p style={{ fontSize: '10px', color: theme.textSecondary }}>
              {daysUntilPayday} {daysUntilPayday === 1 ? 'giorno' : 'giorni'} allo stipendio
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSavingsOverlay(true)}
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            cursor: 'pointer'
          }}
        >
          <PiggyBank size={24} />
        </motion.button>
      </div>

      {/* Spazio vuoto prima dell'importo principale */}
      <div style={{ height: '60px' }}></div>
      
      {/* Titolo principale - importo grande */}
      <div
        style={{
          textAlign: 'center',
          padding: '0 16px',
          marginBottom: '80px'
        }}
      >
        <motion.p
          key={budgetSurplus}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: getDisplayColor(budgetSurplus),
            marginBottom: '8px'
          }}
        >
          {budgetSurplus >= 0 ? '' : '-'}€ {Math.abs(budgetSurplus).toFixed(2).replace('.', ',')}
        </motion.p>
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: getDisplayColor(budgetSurplus)
          }}
        >
          {getMotivationalMessage()}
        </motion.p>
      </div>

      {/* Spazio extra per abbassare ulteriormente le barre */}
      <div style={{ height: '40px' }}></div>
      
      {/* Budget Items in versione minimalista */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: '40px',
          marginBottom: '20px',
          backgroundColor: 'transparent'
        }}
      >
        {[budgetSurplus, tomorrowBudget, afterTomorrowBudget].map((amount, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              width: '120px'
            }}
          >
            {/* Giorno della settimana */}
            <p style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: isNegativeBudget && amount < 0 ? theme.danger : theme.primary,
              marginBottom: '6px',
              position: 'relative',
              zIndex: 1,
              opacity: 1
            }}>
              {days[index]}
            </p>
            
            {/* Importo - con virgola e decimali */}
            <p
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: isNegativeBudget && amount < 0 ? theme.danger : theme.primary,
                textAlign: 'center',
                marginBottom: '6px'
              }}
            >
              {amount < 0 ? '-' : ''}€ {Math.abs(amount).toFixed(2).replace('.', ',')}
            </p>
            
            {/* Elemento visivo: barre */}
            <div style={{
              display: 'flex',
              gap: '5px',
              height: '40px',
              alignItems: 'flex-end',
              position: 'relative',
              zIndex: 1
            }}>
              {Array.from({ length: 4 + index }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${6 + (i+1) * 4.5}px` }}
                  transition={{ 
                    delay: (index * 0.1) + (i * 0.05),
                    duration: 0.3,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25
                  }}
                  style={{
                    width: '6px',
                    backgroundColor: isNegativeBudget && amount < 0 
                      ? `${theme.danger}${85 - i*8}` 
                      : `${theme.primary}${85 - i*8}`,
                    borderRadius: '3px'
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fixed Action Button con menu */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: '110px',
          right: '30px',
          zIndex: 30
        }}
      >
        {/* Menu di azioni espanso */}
        <AnimatePresence>
          {showActionMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -60 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'flex-end',
                paddingBottom: '12px'
              }}
            >
              {/* Overlay trasparente per chiudere il menu */}
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: -1
                }}
                onClick={() => setShowActionMenu(false)}
              />
              
              {/* Pulsante Entrata */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <motion.div
                  style={{
                    backgroundColor: 'white',
                    color: theme.text,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  Entrata
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTransactionType('income');
                    setNewTransaction({...newTransaction, amount: '', categoryId: 21, type: 'income'});
                    setShowAddTransaction(true);
                    setAddTransactionStep('category');
                    setShowActionMenu(false);
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.secondary}CC 100%)`,
                    boxShadow: `0 4px 12px ${theme.secondary}40`,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={24} />
                </motion.button>
              </motion.div>
              
              {/* Pulsante Spesa */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <motion.div
                  style={{
                    backgroundColor: 'white',
                    color: theme.text,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  Spesa
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTransactionType('expense');
                    setNewTransaction({...newTransaction, amount: '', categoryId: 1, type: 'expense'});
                    setShowAddTransaction(true);
                    setAddTransactionStep('category');
                    setShowActionMenu(false);
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${theme.danger} 0%, ${theme.danger}CC 100%)`,
                    boxShadow: `0 4px 12px ${theme.danger}40`,
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={24} />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulsante principale */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={showActionMenu ? { rotate: 45 } : { rotate: 0 }}
          onClick={() => setShowActionMenu(!showActionMenu)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            border: 'none',
            background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
            boxShadow: '0 4px 15px rgba(76, 111, 255, 0.3)',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 31
          }}
        >
          <Plus size={30} />
        </motion.button>
      </motion.div>

      {/* Bottom Sheet per aggiungere transazione */}
      <AnimatePresence>
        {showAddTransaction && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                zIndex: 40
              }}
              onClick={() => setShowAddTransaction(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '20%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                maxWidth: '428px',
                margin: '0 auto',
                height: '80%'
              }}
            >
              <div style={{
                backgroundColor: theme.card,
                borderTopLeftRadius: '32px',
                borderTopRightRadius: '32px',
                height: '80%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '16px 20px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <div 
                      style={{ 
                        width: '48px',
                        height: '5px',
                        backgroundColor: theme.border,
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (addTransactionStep === 'details') {
                          setAddTransactionStep('category');
                        } else {
                          setShowAddTransaction(false);
                        }
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <button
                      onClick={() => {
                        if (addTransactionStep === 'details') {
                          setAddTransactionStep('category');
                        } else {
                          setShowAddTransaction(false);
                        }
                      }}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme.textSecondary,
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      {addTransactionStep === 'details' ? 'Indietro' : 'Annulla'}
                    </button>

                    <h2 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      color: theme.text
                    }}>
                      {addTransactionStep === 'category' 
                        ? `Seleziona categoria ${transactionType === 'expense' ? 'spesa' : 'entrata'}`
                        : `Inserisci i dettagli`
                      }
                    </h2>

                    {addTransactionStep === 'details' ? (
                      <button
                        onClick={handleAddTransaction}
                        disabled={!newTransaction.amount || parseFloat(newTransaction.amount) <= 0}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: newTransaction.amount && parseFloat(newTransaction.amount) > 0
                            ? (transactionType === 'expense' ? theme.danger : theme.secondary)
                            : theme.border,
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: newTransaction.amount && parseFloat(newTransaction.amount) > 0 ? 'pointer' : 'not-allowed',
                          opacity: newTransaction.amount && parseFloat(newTransaction.amount) > 0 ? 1 : 0.5,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Salva
                      </button>
                    ) : (
                      <div style={{ width: '64px' }}></div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    backgroundColor: theme.background,
                    borderRadius: '12px',
                    padding: '4px'
                  }}>
                    <button
                      onClick={() => {
                        setTransactionType('expense');
                        setNewTransaction({...newTransaction, categoryId: 1, type: 'expense'});
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: transactionType === 'expense' ? theme.card : 'transparent',
                        color: transactionType === 'expense' ? theme.danger : theme.textSecondary,
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Spesa
                    </button>
                    <button
                      onClick={() => {
                        setTransactionType('income');
                        setNewTransaction({...newTransaction, categoryId: 21, type: 'income'});
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: transactionType === 'income' ? theme.card : 'transparent',
                        color: transactionType === 'income' ? theme.secondary : theme.textSecondary,
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Entrata
                    </button>
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  paddingBottom: '32px'
                }}>
                  {addTransactionStep === 'category' && (
                    <div>
                      <div style={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '8px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${theme.textSecondary} ${theme.background}`
                      }}>
                        <style>{`
                          .categories-scroll::-webkit-scrollbar {
                            width: 6px;
                          }
                          .categories-scroll::-webkit-scrollbar-track {
                            background: ${theme.background};
                            border-radius: 3px;
                          }
                          .categories-scroll::-webkit-scrollbar-thumb {
                            background: ${theme.textSecondary};
                            border-radius: 3px;
                          }
                          .categories-scroll::-webkit-scrollbar-thumb:hover {
                            background: ${theme.text};
                          }
                        `}</style>
                        
                        <div 
                          className="categories-scroll"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px',
                            paddingBottom: '8px'
                          }}
                        >
                          {categories
                            .filter(cat => transactionType === 'expense' ? cat.id <= 20 : cat.id >= 21)
                            .map(category => (
                              <motion.button
                                key={category.id}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  setNewTransaction({...newTransaction, categoryId: category.id});
                                  setAddTransactionStep('details');
                                }}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '20px 10px',
                                  borderRadius: '16px',
                                  border: 'none',
                                  backgroundColor: theme.background,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                  gap: '10px',
                                  minHeight: '100px'
                                }}
                              >
                                <div style={{
                                  fontSize: '32px',
                                  width: '48px',
                                  height: '48px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: category.color,
                                  backgroundColor: `${category.color}15`,
                                  borderRadius: '12px',
                                  marginBottom: '6px'
                                }}>
                                  {category.icon}
                                </div>
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: theme.text,
                                  textAlign: 'center'
                                }}>
                                  {category.name}
                                </span>
                              </motion.button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {addTransactionStep === 'details' && (
                    <>
                      {newTransaction.categoryId && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          marginBottom: '24px'
                        }}>
                          {categories.filter(c => c.id === parseInt(newTransaction.categoryId)).map(category => (
                            <div key={category.id} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                fontSize: '36px',
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: category.color,
                                backgroundColor: `${category.color}15`,
                                borderRadius: '16px',
                                marginBottom: '4px'
                              }}>
                                {category.icon}
                              </div>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: theme.text
                              }}>
                                {category.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ 
                        marginBottom: '24px'
                      }}>
                        <div style={{
                          backgroundColor: theme.background,
                          borderRadius: '20px',
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: theme.textSecondary,
                            marginBottom: '12px'
                          }}>
                            Importo
                          </label>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            marginBottom: '12px'
                          }}>
                            <span style={{
                              fontSize: '36px',
                              fontWeight: '700',
                              color: transactionType === 'expense' ? theme.danger : theme.secondary
                            }}>
                              €
                            </span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={formatAmount(newTransaction.amount)}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                
                                if (value === '') {
                                  setNewTransaction({...newTransaction, amount: ''});
                                  return;
                                }
                                
                                if (value.length > 8) {
                                  value = value.slice(0, 8);
                                }
                                
                                setNewTransaction({...newTransaction, amount: value});
                              }}
                              placeholder="0,00"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '36px',
                                fontWeight: '700',
                                color: theme.text,
                                width: '180px',
                                textAlign: 'left',
                                caretColor: transactionType === 'expense' ? theme.danger : theme.secondary
                              }}
                              autoFocus
                            />
                          </div>

                          <input
                            type="text"
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                            placeholder={transactionType === 'expense' ? "Cosa hai comprato?" : "Da dove arriva?"}
                            style={{
                              width: '100%',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${theme.border}`,
                              outline: 'none',
                              textAlign: 'center',
                              fontSize: '16px',
                              color: theme.textSecondary,
                              padding: '8px',
                              caretColor: theme.primary
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UltraMinimalistDashboard;

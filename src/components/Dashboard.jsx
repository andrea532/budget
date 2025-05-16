import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, PiggyBank, Calendar, Receipt, X, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import SavingsOverlay from './SavingsOverlay';

// Dashboard con visualizzazione minimalista e funzionalità complete
const MinimalistDashboard = () => {
  // Usa il contesto dell'app per accedere ai dati e alle funzioni
  const { 
    theme, 
    categories,
    calculateDailyBudget, 
    getBudgetSurplus,
    addTransaction,
    setCurrentView,
    getDaysUntilPayday,
    nextPaydayDate,
    monthlyIncome,
    getDailyFutureExpenses,
    totalSavings,
    fixedExpenses,
    savingsPercentage,
    streak,
    transactions
  } = useContext(AppContext);

  // Stati interni per l'UI
  const [isFlowing, setIsFlowing] = useState(false);
  const [animationType, setAnimationType] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [showSavingsOverlay, setShowSavingsOverlay] = useState(false);
  
  // Stato per il form di nuova transazione
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    categoryId: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  // Calcoli budget
  const dailyBudget = calculateDailyBudget();
  const budgetSurplus = getBudgetSurplus();
  const tomorrowBudget = dailyBudget + budgetSurplus;
  const afterTomorrowBudget = tomorrowBudget + dailyBudget;
  const daysUntilPayday = getDaysUntilPayday();
  const dailyFutureExpenses = getDailyFutureExpenses();

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
      .replace('.', '') // Rimuove eventuali punti
      .charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', { weekday: 'short' })
      .replace('.', '')
      .slice(1);
  };
  
  // Giorni della settimana corretti
  const days = ["Oggi", getDayName(1), getDayName(2)];
  
  // Formattazione importo
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

  // Simula una spesa rapida
  const addExpense = (amount) => {
    if (isFlowing) return;
    
    setAnimationType('expense');
    setIsFlowing(true);
    
    // Aggiungi la transazione tramite il contesto
    addTransaction({
      amount: amount,
      categoryId: 1, // Categoria predefinita
      description: 'Spesa rapida',
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });
    
    // Disattiva l'animazione dopo un po'
    setTimeout(() => {
      setIsFlowing(false);
    }, 2000);
  };
  
  // Simula un'entrata rapida
  const addIncome = (amount) => {
    if (isFlowing) return;
    
    setAnimationType('income');
    setIsFlowing(true);
    
    // Aggiungi la transazione tramite il contesto
    addTransaction({
      amount: amount,
      categoryId: 21, // Categoria entrate predefinita
      description: 'Entrata rapida',
      date: new Date().toISOString().split('T')[0],
      type: 'income'
    });
    
    // Disattiva l'animazione dopo un po'
    setTimeout(() => {
      setIsFlowing(false);
    }, 2000);
  };

  // Gestione transazioni dettagliate
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

  return (
    <div style={{ 
      background: `linear-gradient(180deg, ${theme.card} 0%, ${theme.background} 50%, ${theme.background} 100%)`,
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      borderRadius: '12px',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Savings Overlay */}
      <SavingsOverlay isOpen={showSavingsOverlay} onClose={() => setShowSavingsOverlay(false)} />

      {/* Header con pulsante risparmi e saldo mensile */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSavingsOverlay(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            backgroundColor: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            cursor: 'pointer'
          }}
        >
          <PiggyBank size={20} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '12px', opacity: 0.9 }}>Risparmi</p>
            <p style={{ fontWeight: '600', fontSize: '16px' }}>€ {totalSavings.toFixed(2).replace('.', ',')}</p>
          </div>
        </motion.button>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {streak > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '12px'
              }}
            >
              <Flame size={16} style={{ color: theme.danger, marginRight: '4px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: theme.danger }}>
                {streak} giorni
              </span>
            </motion.div>
          )}
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>Saldo mensile</p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: monthlyBalance >= 0 ? theme.secondary : theme.danger 
            }}>
              € {monthlyBalance.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Titolo principale - importo grande */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          textAlign: 'center',
          padding: '0 16px',
          marginBottom: '16px'
        }}
      >
        <motion.p
          key={budgetSurplus}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: theme.primary,
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
            color: theme.primary
          }}
        >
          {getMotivationalMessage()}
        </motion.p>
      </motion.div>

      {/* Budget Items in versione minimalista */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: '10px',
          marginBottom: '20px',
          backgroundColor: 'transparent'
        }}
      >
        {[budgetSurplus, tomorrowBudget, afterTomorrowBudget].map((amount, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            width: '120px'
          }}>
            {/* Giorno della settimana */}
            <p style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: theme.primary,
              marginBottom: '6px',
              position: 'relative',
              zIndex: 1,
              opacity: 1
            }}>
              {days[index]}
            </p>
            
            {/* Importo - con virgola e decimali */}
            <motion.p
              key={amount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: theme.primary,
                textAlign: 'center',
                marginBottom: '6px'
              }}
            >
              {Math.abs(amount).toFixed(2).replace('.', ',')}
            </motion.p>
            
            {/* Elemento visivo: barre in crescita */}
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
                  animate={{ 
                    height: `${6 + (i+1) * 4.5}px`,
                    scaleY: [1, 1.1, 0.9, 1]
                  }}
                  transition={{ 
                    delay: (index * 0.3) + (i * 0.1),
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    scaleY: {
                      repeat: Infinity,
                      repeatType: 'reverse',
                      duration: 2 + Math.random(),
                      delay: i * 0.2
                    }
                  }}
                  style={{
                    width: '6px',
                    backgroundColor: `${theme.primary}${85 - i*8}`,
                    borderRadius: '3px'
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Info prossimo stipendio */}
      {nextPaydayDate && daysUntilPayday !== null && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            margin: '16px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: `${theme.primary}10`,
            border: `1px solid ${theme.primary}20`
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={20} style={{ color: theme.primary }} />
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>
                  Prossimo stipendio
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  {new Date(nextPaydayDate).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', color: theme.primary }}>
                {daysUntilPayday}
              </p>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                {daysUntilPayday === 1 ? 'giorno' : 'giorni'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Indicatore spese future */}
      {dailyFutureExpenses > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            margin: '16px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: `${theme.warning}10`,
            border: `1px solid ${theme.warning}20`
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Receipt size={20} style={{ color: theme.warning }} />
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>
                  Accantonamento spese future
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Sottratto automaticamente dal budget
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: theme.warning }}>
                € {dailyFutureExpenses.toFixed(2).replace('.', ',')}
              </p>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                al giorno
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fixed Action Buttons */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: '90px',
          left: '0',
          right: '0',
          padding: '0 16px',
          zIndex: 20,
          maxWidth: '428px',
          margin: '0 auto'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: '12px' 
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px',
              border: 'none',
              background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.secondary}CC 100%)`,
              boxShadow: `0 4px 12px ${theme.secondary}40`
            }}
            onClick={() => {
              setTransactionType('income');
              setNewTransaction({...newTransaction, amount: '', categoryId: 21, type: 'income'});
              setShowAddTransaction(true);
            }}
          >
            <Plus size={22} style={{ marginRight: '8px' }} />
            Entrata
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px',
              border: 'none',
              background: `linear-gradient(135deg, ${theme.danger} 0%, ${theme.danger}CC 100%)`,
              boxShadow: `0 4px 12px ${theme.danger}40`
            }}
            onClick={() => {
              setTransactionType('expense');
              setNewTransaction({...newTransaction, amount: '', categoryId: 1, type: 'expense'});
              setShowAddTransaction(true);
            }}
          >
            <Minus size={22} style={{ marginRight: '8px' }} />
            Spesa
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom Sheet per aggiungere transazione */}
      <AnimatePresence>
        {showAddTransaction && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
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
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                maxWidth: '428px',
                margin: '0 auto'
              }}
            >
              <div style={{
                backgroundColor: theme.card,
                borderTopLeftRadius: '32px',
                borderTopRightRadius: '32px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Header con pulsante Salva */}
                <div style={{ 
                  padding: '16px 20px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  {/* Handle bar */}
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
                      onClick={() => setShowAddTransaction(false)}
                    />
                  </div>

                  {/* Header con pulsanti */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <button
                      onClick={() => setShowAddTransaction(false)}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme.textSecondary,
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Annulla
                    </button>

                    <h2 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      color: theme.text
                    }}>
                      {transactionType === 'expense' ? 'Nuova Spesa' : 'Nuova Entrata'}
                    </h2>

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
                  </div>

                  {/* Tipo di transazione come tabs */}
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

                {/* Contenuto scrollabile */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  paddingBottom: '32px'
                }}>
                  {/* Importo Input con formattazione automatica */}
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
                          fontSize: '14px',
                          color: theme.textSecondary,
                          padding: '8px',
                          caretColor: theme.primary
                        }}
                      />
                    </div>
                  </div>

                  {/* Categorie */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.textSecondary,
                      marginBottom: '12px',
                      paddingLeft: '4px'
                    }}>
                      Seleziona categoria
                    </label>
                    
                    {/* Container scrollabile per le categorie */}
                    <div style={{
                      maxHeight: '300px',
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
                          gap: '12px',
                          paddingBottom: '8px'
                        }}
                      >
                        {categories
                          .filter(cat => transactionType === 'expense' ? cat.id <= 20 : cat.id >= 21)
                          .map(category => (
                            <motion.button
                              key={category.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setNewTransaction({...newTransaction, categoryId: category.id})}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                borderRadius: '16px',
                                border: 'none',
                                backgroundColor: parseInt(newTransaction.categoryId) === category.id 
                                  ? `${category.color}20` 
                                  : theme.background,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: parseInt(newTransaction.categoryId) === category.id 
                                  ? category.color 
                                  : 'transparent',
                                gap: '12px',
                                minHeight: '72px'
                              }}
                            >
                              <div style={{
                                fontSize: '28px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {category.icon}
                              </div>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                textAlign: 'left',
                                flex: 1,
                                lineHeight: '1.2'
                              }}>
                                {category.name}
                              </span>
                            </motion.button>
                          ))}
                      </div>
                    </div>
                    
                    {/* Indicatore di scroll */}
                    {categories.filter(cat => transactionType === 'expense' ? cat.id <= 20 : cat.id >= 21).length > 6 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                          textAlign: 'center',
                          marginTop: '8px',
                          fontSize: '12px',
                          color: theme.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <motion.div
                          animate={{ y: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ↓
                        </motion.div>
                        Scorri per vedere più categorie
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MinimalistDashboard;

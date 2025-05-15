import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Minus, X, TrendingUp, TrendingDown, Flame, Receipt, PiggyBank } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import SavingsOverlay from './SavingsOverlay';

// Componente Batteria Realistica (con colori del tema)
const RealisticBattery = ({ day, amount, maxAmount = 200, delay }) => {
  const { theme } = useContext(AppContext);
  const percentage = Math.max(0, Math.min(100, (amount / maxAmount) * 100));
  const isPositive = amount >= 0;
  
  // Usa i colori del tema
  const getBatteryColor = () => {
    if (!isPositive) return theme.danger;
    if (percentage >= 60) return theme.secondary;
    if (percentage >= 30) return theme.warning;
    return theme.danger;
  };
  
  const batteryColor = getBatteryColor();
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay * 0.2, type: 'spring', stiffness: 300, damping: 30 }}
      style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}
    >
      {/* Giorno */}
      <p style={{ 
        fontSize: '14px', 
        color: theme.textSecondary,
        marginBottom: '12px',
        fontWeight: '600'
      }}>
        {day}
      </p>
      
      {/* Container della batteria */}
      <div style={{ 
        position: 'relative', 
        width: '80px', 
        height: '160px', 
        margin: '0 auto',
        perspective: '1000px'
      }}>
        {/* Batteria 3D */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateY(10deg)'
        }}>
          {/* Corpo principale della batteria */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '16px',
            position: 'relative',
            background: theme.card,
            boxShadow: `
              0 10px 30px rgba(0,0,0,0.1),
              inset 0 2px 2px rgba(255,255,255,0.1),
              inset 0 -2px 2px rgba(0,0,0,0.05)
            `,
            border: `2px solid ${theme.border}`,
            overflow: 'hidden'
          }}>
            {/* Terminale superiore della batteria */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '12px',
              background: theme.textSecondary,
              borderRadius: '6px 6px 0 0',
              boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.border}`
            }}>
              {/* Dettaglio metallico sul terminale */}
              <div style={{
                position: 'absolute',
                top: '3px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2px',
                backgroundColor: theme.background,
                boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.2)'
              }} />
            </div>
            
            {/* Area di visualizzazione trasparente */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              borderRadius: '12px',
              backgroundColor: theme.background,
              overflow: 'hidden',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }}>
              {/* Livello di carica */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut", 
                  delay: delay * 0.3 
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: `linear-gradient(180deg, 
                    ${batteryColor} 0%, 
                    ${batteryColor}DD 50%,
                    ${batteryColor}99 100%)`,
                  borderRadius: '0 0 10px 10px',
                  boxShadow: `
                    0 0 20px ${batteryColor}66,
                    inset 0 0 10px ${batteryColor}AA
                  `
                }}
              >
                {/* Effetto luminoso animato */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    y: [-10, 0, -10]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '30px',
                    background: `linear-gradient(180deg, 
                      rgba(255,255,255,0.4) 0%, 
                      transparent 100%)`,
                    filter: 'blur(8px)'
                  }}
                />
                
                {/* Bolle animate (solo quando sta caricando) */}
                {percentage > 0 && percentage < 100 && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [-20, -140],
                          x: [0, Math.random() * 20 - 10],
                          scale: [0.5, 1, 0.3],
                          opacity: [0, 0.7, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.7,
                          ease: "easeOut"
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: `${30 + i * 20}%`,
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.6)',
                          boxShadow: '0 0 4px rgba(255,255,255,0.4)'
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.div>
              
              {/* Importo al centro della batteria */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay * 0.5 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: theme.text,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  backgroundColor: `${theme.card}ee`,
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                  minWidth: '60px',
                  textAlign: 'center',
                  border: `1px solid ${theme.border}`
                }}
              >
                € {Math.abs(amount).toFixed(0)}
              </motion.div>
              
              {/* Linee di livello */}
              {[25, 50, 75].map((level) => (
                <div
                  key={level}
                  style={{
                    position: 'absolute',
                    bottom: `${level}%`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: theme.border
                  }}
                />
              ))}
            </div>
            
            {/* Riflesso sulla batteria */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              width: '25px',
              height: '60px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
              borderRadius: '8px',
              transform: 'skewY(-20deg)',
              filter: 'blur(2px)'
            }} />
            
            {/* Indicatore di carica (fulmine) */}
            {percentage > 0 && percentage < 100 && (
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: theme.card,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 10px ${theme.primary}40`,
                  border: `1px solid ${theme.border}`
                }}
              >
                <span style={{ fontSize: '14px' }}>⚡</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { 
    theme, 
    categories, 
    calculateDailyBudget, 
    getBudgetSurplus,
    addTransaction,
    setCurrentView,
    getDaysUntilPayday,
    nextPaydayDate,
    getMonthlyAvailability,
    streak,
    transactions,
    monthlyIncome,
    fixedExpenses,
    savingsPercentage,
    getDailyFutureExpenses
  } = useContext(AppContext);

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    categoryId: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [showSavingsOverlay, setShowSavingsOverlay] = useState(false);

  // Formattazione importo
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

  // Calcoli budget
  const dailyBudget = calculateDailyBudget();
  const budgetSurplus = getBudgetSurplus();
  
  // Calcolo budget per i prossimi giorni
  const tomorrowBudget = dailyBudget + budgetSurplus;
  const afterTomorrowBudget = tomorrowBudget + dailyBudget;

  // Dati per le batterie
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);

  const batteryData = [
    {
      day: 'Oggi',
      amount: budgetSurplus
    },
    {
      day: tomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0).toUpperCase() + 
           tomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).slice(1),
      amount: tomorrowBudget
    },
    {
      day: afterTomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0).toUpperCase() + 
           afterTomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).slice(1),
      amount: afterTomorrowBudget
    }
  ];

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
  const daysUntilPayday = getDaysUntilPayday();

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

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ 
        paddingBottom: '120px',
        background: `linear-gradient(180deg, ${theme.card} 0%, ${theme.background} 50%, ${theme.background} 100%)`,
        minHeight: '100vh'
      }}
    >
      {/* Savings Overlay */}
      <SavingsOverlay isOpen={showSavingsOverlay} onClose={() => setShowSavingsOverlay(false)} />

      {/* Header con data, streak e saldo mensile */}
      <motion.div 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
            {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
          {streak > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '4px'
              }}
            >
              <Flame size={16} style={{ color: theme.danger, marginRight: '4px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: theme.danger }}>
                {streak} giorni di streak!
              </span>
            </motion.div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSavingsOverlay(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(76, 111, 255, 0.3)',
            }}
          >
            <PiggyBank size={22} color="white" />
          </motion.button>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>Saldo mensile</p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: monthlyBalance >= 0 ? theme.secondary : theme.danger 
            }}>
              € {monthlyBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Titolo principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          textAlign: 'center',
          padding: '0 16px',
          marginBottom: '32px'
        }}
      >
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: theme.textSecondary,
          marginBottom: '8px'
        }}>
          Budget di Oggi
        </h1>
        <motion.p
          key={budgetSurplus}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: budgetSurplus >= 0 ? theme.secondary : theme.danger,
            marginBottom: '8px'
          }}
        >
          {budgetSurplus >= 0 ? '' : '-'}€ {Math.abs(budgetSurplus).toFixed(2)}
        </motion.p>
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: budgetSurplus >= 0 ? theme.secondary : theme.warning
          }}
        >
          {getMotivationalMessage()}
        </motion.p>
      </motion.div>

      {/* Batterie realistiche */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '20px 16px',
          gap: '8px',
          marginBottom: '24px'
        }}
      >
        {batteryData.map((battery, index) => (
          <RealisticBattery
            key={battery.day}
            day={battery.day}
            amount={battery.amount}
            delay={index}
          />
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
      {getDailyFutureExpenses() > 0 && (
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
                € {getDailyFutureExpenses().toFixed(2)}
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
          zIndex: 20
        }}
      >
        <div style={{ 
          maxWidth: '428px',
          margin: '0 auto',
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
    </motion.div>
  );
};

export default Dashboard;
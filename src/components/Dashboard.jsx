import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Minus, X, TrendingUp, TrendingDown, Flame, Receipt, PiggyBank } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import SavingsOverlay from './SavingsOverlay';

// Dashboard con sfondo dinamico e luminoso
const Dashboard = () => {
  // Accedi al context dell'app
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

  // Stati per la UI
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
  
  // Stati per animazioni
  const [time, setTime] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  
  // Genera bolle animate casuali all'avvio
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 150 + 50,
      speed: Math.random() * 40 + 20,
      opacity: Math.random() * 0.3 + 0.1,
      startAngle: Math.random() * 360
    }));
    setBubbles(newBubbles);
    
    // Timer per animazioni
    const timer = setInterval(() => {
      setTime(prev => prev + 0.01);
    }, 10);
    
    return () => clearInterval(timer);
  }, []);
  
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
  const isNegativeBudget = budgetSurplus < 0;
  
  // Calcolo budget per i prossimi giorni
  const tomorrowBudget = dailyBudget + budgetSurplus;
  const afterTomorrowBudget = tomorrowBudget + dailyBudget;

  // Dati per la visualizzazione dei giorni
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);

  const days = [
    "Oggi", 
    tomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0).toUpperCase() + 
    tomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).slice(1),
    afterTomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0).toUpperCase() + 
    afterTomorrow.toLocaleDateString('it-IT', { weekday: 'short' }).slice(1)
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
  const dailyFutureExpenses = getDailyFutureExpenses();

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
    <div style={{ 
      background: isNegativeBudget 
        ? 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)' 
        : 'linear-gradient(135deg, #0EA5E9 0%, #047857 100%)', // Gradiente blu-verde più vivace
      fontFamily: '"Inter", system-ui, sans-serif',
      padding: '32px 24px',
      minHeight: '100vh',
      width: '100%',
      color: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Savings Overlay */}
      <SavingsOverlay isOpen={showSavingsOverlay} onClose={() => setShowSavingsOverlay(false)} />
      
      {/* Sfondo luminoso e dinamico */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        zIndex: 0
      }}>
        {/* Gradiente animato sovrapposto */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(circle at ${50 + Math.sin(time) * 10}% ${50 + Math.cos(time) * 10}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          opacity: 0.8 + Math.sin(time) * 0.2,
          transition: 'opacity 0.5s ease'
        }} />
        
        {/* Effetto di luce che si muove */}
        <div style={{
          position: 'absolute',
          top: `${30 + Math.sin(time * 0.5) * 15}%`,
          left: `${20 + Math.cos(time * 0.7) * 20}%`,
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(40px)',
          opacity: 0.5 + Math.sin(time) * 0.2
        }} />
        
        {/* Seconda luce che si muove */}
        <div style={{
          position: 'absolute',
          bottom: `${20 + Math.cos(time * 0.6) * 15}%`,
          right: `${25 + Math.sin(time * 0.5) * 20}%`,
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(50px)',
          opacity: 0.3 + Math.cos(time) * 0.15
        }} />
        
        {/* Bolle fluttuanti */}
        {bubbles.map((bubble, index) => (
          <div 
            key={index}
            style={{
              position: 'absolute',
              left: `${bubble.x}%`,
              top: `${bubble.y + Math.sin((time + bubble.startAngle) / (bubble.speed)) * 3}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              borderRadius: '50%',
              background: isNegativeBudget 
                ? 'radial-gradient(circle, rgba(254,226,226,0.15) 0%, transparent 70%)' 
                : 'radial-gradient(circle, rgba(209,250,229,0.15) 0%, transparent 70%)',
              opacity: bubble.opacity + Math.sin(time * 0.8) * 0.05,
              transition: 'all 1s ease-in-out',
              transform: `scale(${1 + Math.sin(time * 0.3) * 0.1})`,
              filter: 'blur(8px)'
            }}
          />
        ))}
        
        {/* Effetto particelle brillanti */}
        {Array.from({ length: 20 }).map((_, i) => {
          const speed = 0.3 + Math.random() * 0.7;
          const angle = Math.random() * Math.PI * 2;
          const radius = 30 + Math.random() * 40;
          const x = 50 + Math.cos(time * speed + angle) * radius;
          const y = 50 + Math.sin(time * speed + angle) * radius;
          
          return (
            <div 
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                opacity: 0.1 + Math.random() * 0.4,
                filter: 'blur(1px)'
              }}
            />
          );
        })}
      </div>
      
      {/* Onda animata superiore */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '120px',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: `${-20 + Math.sin(time) * 10}%`, 
            width: '140%', 
            height: '100%',
            opacity: 0.2
          }}
        >
          <path 
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
            fill="#FFFFFF" 
          />
        </svg>
      </div>

      {/* Header con data, streak e saldo mensile */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '14px' 
          }}>
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
              <Flame size={16} style={{ color: '#FCA5A5', marginRight: '4px' }} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#FCA5A5'
              }}>
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
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <PiggyBank size={22} color="white" />
          </motion.button>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Saldo mensile
            </p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#FFFFFF',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              € {monthlyBalance.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info prossimo stipendio - versione elegante */}
      {nextPaydayDate && daysUntilPayday !== null && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: 0.95,
            position: 'relative',
            zIndex: 1,
            padding: '10px 16px',
            borderRadius: '30px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
          }}
        >
          <Calendar size={16} color="#FFFFFF" style={{ opacity: 0.9 }} />
          <div>
            <p style={{ 
              fontWeight: '600', 
              color: '#FFFFFF',
              fontSize: '14px'
            }}>
              {daysUntilPayday} giorni al prossimo stipendio
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              {new Date(nextPaydayDate).toLocaleDateString('it-IT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
              })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Importo principale - ancora più brillante */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          marginBottom: '100px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{
          position: 'relative',
          display: 'inline-block',
        }}>
          <motion.p
            key={budgetSurplus}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              fontSize: '60px',
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0,0,0,0.15)',
              transform: `scale(${1 + Math.sin(time * 2) * 0.01})`,
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {isNegativeBudget ? '-' : ''}€&nbsp;{Math.abs(budgetSurplus).toFixed(2).replace('.', ',')}
          </motion.p>
          
          {/* Glow effect animato */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-20%',
            right: '-20%',
            bottom: '-50%',
            background: `radial-gradient(ellipse at center, ${isNegativeBudget ? '#FEE2E220' : '#A7F3D020'} 0%, transparent 70%)`,
            zIndex: -1,
            opacity: 0.5 + Math.sin(time * 2) * 0.2,
            transform: `scale(${1 + Math.sin(time) * 0.05})`,
            transition: 'all 0.5s ease'
          }}></div>
        </div>
        
        <div style={{
          height: '4px',
          width: '80px',
          background: `linear-gradient(90deg, transparent 0%, ${isNegativeBudget ? '#FEE2E2' : '#FFFFFF'} 50%, transparent 100%)`,
          boxShadow: `0 0 10px ${isNegativeBudget ? '#FECACA' : '#A7F3D0'}`,
          margin: '0 auto 16px auto',
          borderRadius: '2px',
          opacity: 0.7 + Math.sin(time * 2) * 0.3
        }}></div>
        
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: '16px',
            fontWeight: '500',
            color: isNegativeBudget ? '#FECACA' : '#ECFDF5',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {getMotivationalMessage()}
        </motion.p>
      </motion.div>

      {/* Indicatore spese future */}
      {dailyFutureExpenses > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            margin: '0 auto 30px auto',
            maxWidth: '90%',
            padding: '12px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(4px)',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Receipt size={18} style={{ color: '#FFFFFF' }} />
              <div>
                <p style={{ fontWeight: '600', color: '#FFFFFF', fontSize: '14px' }}>
                  Accantonamento spese future
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Sottratto automaticamente dal budget
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                € {dailyFutureExpenses.toFixed(2).replace('.', ',')}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                al giorno
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Budget per i prossimi giorni - senza box */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          position: 'absolute',
          bottom: '180px',
          left: '24px',
          right: '24px',
          zIndex: 1
        }}
      >
        {[budgetSurplus, tomorrowBudget, afterTomorrowBudget].map((amount, index) => {
          const isNegative = amount < 0;
          return (
            <motion.div 
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.7 + (index * 0.1),
                type: 'spring',
                stiffness: 200
              }}
              whileHover={{ y: -5 }}
              style={{
                flex: 1,
                textAlign: 'center',
                position: 'relative',
                transform: `translateY(${Math.sin(time * 2 + index) * 3}px)`,
                transition: 'transform 0.5s ease'
              }}
            >
              {/* Giorno */}
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isNegativeBudget ? '#FEE2E2' : '#D1FAE5',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                {days[index]}
              </p>
              
              {/* Importo */}
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}>
                {isNegative ? '-' : ''}€ {Math.abs(amount).toFixed(2).replace('.', ',')}
              </p>
              
              {/* Linea luminosa sotto il giorno corrente */}
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '25%', 
                  right: '25%',
                  height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${isNegativeBudget ? '#FECACA' : '#A7F3D0'} 50%, transparent 100%)`,
                  opacity: 0.5 + Math.sin(time * 3) * 0.3
                }}></div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Fixed Action Buttons */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '0',
          right: '0',
          padding: '0 24px',
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
              background: 'rgba(16, 185, 129, 0.8)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer'
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
              background: 'rgba(239, 68, 68, 0.8)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer'
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
                backgroundColor: '#FFFFFF',
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
                  borderBottom: `1px solid #E5E7EB`
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
                        backgroundColor: '#E5E7EB',
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
                        color: '#6B7280',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Annulla
                    </button>

                    <h2 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#1F2937'
                    }}>
                      {transactionType === 'expense' ? 'Nuova Spesa' : 'Nuova Entrata'}
                    </h2>

                    <button
                      onClick={handleAddTransaction}
                      disabled={!newTransaction.amount || parseFloat(newTransaction.amount) <= 0}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: newTransaction.amount && parseFloat(newTransaction.amount) > 0
                          ? (transactionType === 'expense' ? '#EF4444' : '#10B981')
                          : '#E5E7EB',
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
                    backgroundColor: '#F8FAFC',
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
                        backgroundColor: transactionType === 'expense' ? '#FFFFFF' : 'transparent',
                        color: transactionType === 'expense' ? '#EF4444' : '#6B7280',
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
                        backgroundColor: transactionType === 'income' ? '#FFFFFF' : 'transparent',
                        color: transactionType === 'income' ? '#10B981' : '#6B7280',
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
                      backgroundColor: '#F8FAFC',
                      borderRadius: '20px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#6B7280',
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
                          color: transactionType === 'expense' ? '#EF4444' : '#10B981'
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
                            color: '#1F2937',
                            width: '180px',
                            textAlign: 'left',
                            caretColor: transactionType === 'expense' ? '#EF4444' : '#10B981'
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
                          borderBottom: `1px solid #E5E7EB`,
                          outline: 'none',
                          textAlign: 'center',
                          fontSize: '14px',
                          color: '#6B7280',
                          padding: '8px',
                          caretColor: '#3B82F6'
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
                      color: '#6B7280',
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
                      scrollbarColor: `#6B7280 #F8FAFC`
                    }}>
                      <style>{`
                        .categories-scroll::-webkit-scrollbar {
                          width: 6px;
                        }
                        .categories-scroll::-webkit-scrollbar-track {
                          background: #F8FAFC;
                          border-radius: 3px;
                        }
                        .categories-scroll::-webkit-scrollbar-thumb {
                          background: #6B7280;
                          border-radius: 3px;
                        }
                        .categories-scroll::-webkit-scrollbar-thumb:hover {
                          background: #1F2937;
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
                                  : '#F8FAFC',
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
                                color: '#1F2937',
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
                          color: '#6B7280',
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

export default Dashboard;

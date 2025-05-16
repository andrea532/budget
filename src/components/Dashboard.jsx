import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, PiggyBank, Calendar, Receipt } from 'lucide-react';
import { AppContext } from '../context/AppContext';

// Dashboard con visualizzazione minimalista e dinamica
const UltraMinimalistDashboard = () => {
  // Usa il contesto dell'app per accedere ai dati e alle funzioni
  const { 
    theme, 
    calculateDailyBudget, 
    getBudgetSurplus,
    addTransaction,
    getDaysUntilPayday,
    nextPaydayDate,
    monthlyIncome,
    getDailyFutureExpenses,
    totalSavings
  } = useContext(AppContext);

  // Stati interni per l'animazione
  const [isFlowing, setIsFlowing] = useState(false);
  const [animationType, setAnimationType] = useState('');

  // Calcola i budget
  const dailyBudget = calculateDailyBudget();
  const budgetSurplus = getBudgetSurplus();
  const tomorrowBudget = dailyBudget + budgetSurplus;
  const afterTomorrowBudget = tomorrowBudget + dailyBudget;
  const daysUntilPayday = getDaysUntilPayday();
  const dailyFutureExpenses = getDailyFutureExpenses();
  const monthlyBalance = monthlyIncome - getDailyFutureExpenses() * 30; // Saldo mensile stimato

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

  // Simula una spesa
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
  
  // Simula un'entrata
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
            onClick={() => addIncome(20)}
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
            onClick={() => addExpense(15)}
          >
            <Minus size={22} style={{ marginRight: '8px' }} />
            Spesa
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default UltraMinimalistDashboard;

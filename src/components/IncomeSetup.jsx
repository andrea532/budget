import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  Check,
  RefreshCw
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const IncomeSetup = () => {
  const {
    monthlyIncome,
    setMonthlyIncome,
    lastPaydayDate,
    setLastPaydayDate,
    nextPaydayDate,
    setNextPaydayDate,
    theme,
    setCurrentView,
  } = useContext(AppContext);

  const [income, setIncome] = useState(monthlyIncome ? monthlyIncome.toString() : '');
  const [selectedCycle, setSelectedCycle] = useState('monthly');
  const [selectedDay, setSelectedDay] = useState(27);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cicli semplificati
  const cycles = [
    { id: 'monthly', label: 'Ogni mese', icon: '📅', description: 'Stesso giorno ogni mese' },
    { id: 'biweekly', label: 'Ogni 15 giorni', icon: '📆', description: 'Due volte al mese' },
    { id: 'weekly', label: 'Ogni settimana', icon: '🗓️', description: 'Stesso giorno ogni settimana' },
  ];

  // Giorni del mese (1-31)
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Calcolo automatico della prossima data di pagamento
  const calculateNextPayday = () => {
    const today = new Date();
    let nextDate = new Date();

    switch (selectedCycle) {
      case 'monthly':
        nextDate.setDate(selectedDay);
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'biweekly':
        // Ogni 15 giorni dall'ultimo pagamento
        if (lastPaydayDate) {
          nextDate = new Date(lastPaydayDate);
          nextDate.setDate(nextDate.getDate() + 15);
        } else {
          nextDate.setDate(selectedDay);
        }
        break;
      case 'weekly':
        // Prossimo venerdì (o giorno selezionato)
        const daysUntilNext = (5 - today.getDay() + 7) % 7 || 7;
        nextDate.setDate(today.getDate() + daysUntilNext);
        break;
    }

    return nextDate.toISOString().split('T')[0];
  };

  const handleSave = () => {
    const parsedIncome = parseFloat(income);
    if (!isNaN(parsedIncome) && parsedIncome >= 0) {
      setMonthlyIncome(parsedIncome);
      
      const nextPayday = calculateNextPayday();
      setNextPaydayDate(nextPayday);
      
      // Imposta l'ultimo pagamento come oggi o la data selezionata
      if (!lastPaydayDate) {
        const today = new Date();
        setLastPaydayDate(today.toISOString().split('T')[0]);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setCurrentView('expenses');
      }, 800);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="income-setup"
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
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
          Il tuo stipendio
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Quanto guadagni e quando ricevi lo stipendio
        </p>
      </motion.div>

      {/* Success Animation */}
      {showSuccess && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: theme.secondary,
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <Check size={40} color="white" />
        </motion.div>
      )}

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
        {/* Step 1: Importo */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: `${theme.secondary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>💰</span>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: theme.text }}>Quanto guadagni al mese?</p>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                Inserisci il tuo stipendio netto mensile
              </p>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.secondary,
                fontSize: '24px',
                fontWeight: '700'
              }}
            >
              €
            </div>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '20px 20px 20px 48px',
                borderRadius: '16px',
                border: `2px solid ${theme.border}`,
                backgroundColor: theme.background,
                color: theme.text,
                fontSize: '24px',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              step="0.01"
              min="0"
            />
          </div>
        </motion.div>

        {/* Step 2: Frequenza pagamento */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: `${theme.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>📅</span>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: theme.text }}>Quando ricevi lo stipendio?</p>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                Seleziona la frequenza del pagamento
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cycles.map(cycle => (
              <motion.button
                key={cycle.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedCycle(cycle.id)}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid ${selectedCycle === cycle.id ? theme.primary : theme.border}`,
                  backgroundColor: selectedCycle === cycle.id ? `${theme.primary}10` : theme.background,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>{cycle.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', color: theme.text, fontSize: '16px' }}>
                    {cycle.label}
                  </p>
                  <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                    {cycle.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Step 3: Giorno del pagamento (solo per mensile) */}
        {selectedCycle === 'monthly' && (
          <motion.div 
            variants={itemVariants} 
            style={{ marginBottom: '32px' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '20px' 
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: `${theme.warning}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px' }}>📆</span>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: theme.text }}>Che giorno del mese?</p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Seleziona il giorno di pagamento
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}>
              {daysOfMonth.map(day => (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: `2px solid ${selectedDay === day ? theme.primary : theme.border}`,
                    backgroundColor: selectedDay === day ? theme.primary : theme.background,
                    color: selectedDay === day ? 'white' : theme.text,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {day}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        <motion.div
          variants={itemVariants}
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: `${theme.secondary}10`,
            border: `1px solid ${theme.secondary}30`,
            marginBottom: '32px'
          }}
        >
          <p style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            Riepilogo
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: theme.secondary }}>
                € {income || '0.00'} al mese
              </p>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                {cycles.find(c => c.id === selectedCycle)?.label}
                {selectedCycle === 'monthly' && ` - giorno ${selectedDay}`}
              </p>
            </div>
            <RefreshCw size={24} style={{ color: theme.secondary }} />
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={!income || parseFloat(income) <= 0}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background:
              income && parseFloat(income) > 0
                ? `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`
                : theme.border,
            color:
              income && parseFloat(income) > 0 ? 'white' : theme.textSecondary,
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor:
              income && parseFloat(income) > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
          }}
        >
          Salva e continua
        </motion.button>

        {/* Navigation */}
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
            onClick={() => setCurrentView('dashboard')}
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
            onClick={() => setCurrentView('expenses')}
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
            Spese fisse
            <TrendingUp size={16} />
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default IncomeSetup;
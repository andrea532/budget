import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, TrendingUp, TrendingDown, Plus, Minus, Info, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';

// Verifica se siamo in PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || // Safari iOS
         document.referrer.includes('android-app://');
};

const SavingsSetup = ({ isInitialSetup, onComplete }) => {
  const {
    savingsPercentage,
    setSavingsPercentage,
    monthlyIncome,
    theme,
    setCurrentView,
    saveAllSettings,
    totalSavings,
    addToSavings,
    withdrawFromSavings,
    fixedExpenses,
  } = useContext(AppContext);

  const [localSavingsPercentage, setLocalSavingsPercentage] = useState(savingsPercentage);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsAction, setSavingsAction] = useState('add'); // 'add' o 'withdraw'
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  // Sincronizza lo stato locale con il context
  useEffect(() => {
    setLocalSavingsPercentage(savingsPercentage);
  }, [savingsPercentage]);

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

  // Calcola l'importo mensile del risparmio
  const calculateMonthlySavings = () => {
    return (monthlyIncome * localSavingsPercentage) / 100;
  };

  // Calcola l'importo disponibile dopo spese fisse e risparmi
  const calculateAvailableAmount = () => {
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlySavings = calculateMonthlySavings();
    return monthlyIncome - totalFixedExpenses - monthlySavings;
  };

  // Gestisce il salvataggio delle impostazioni
  const handleSave = () => {
    setSavingsPercentage(localSavingsPercentage);
    
    // Forza un salvataggio
    setTimeout(() => {
      saveAllSettings();
      
      // Per PWA, effettua un secondo tentativo
      if (isPWA()) {
        setTimeout(() => {
          console.log("Secondo tentativo di salvataggio in PWA (SavingsSetup)");
          saveAllSettings();
        }, 1000);
      }
    }, 200);

    // Mostra animazione di successo
    setShowSuccess(true);

    setTimeout(() => {
      if (isInitialSetup && onComplete) {
        onComplete(localSavingsPercentage);
      } else {
        setCurrentView('dashboard');
      }
    }, 800);
  };

  // Gestisce l'aggiunta/prelievo di risparmi
  const handleSavingsTransaction = () => {
    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (savingsAction === 'add') {
      addToSavings(amount);
    } else {
      withdrawFromSavings(amount);
    }

    setSavingsAmount('');
    setShowSavingsForm(false);
  };

  // Percentuali preimpostate
  const presetPercentages = [5, 10, 15, 20, 25];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="savings-setup"
      style={{ paddingBottom: '100px' }}
    >
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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
      </AnimatePresence>

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
          {isInitialSetup ? 'Imposta i tuoi risparmi' : 'Gestione risparmi'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          {isInitialSetup 
            ? 'Decidi quanto vuoi risparmiare ogni mese'
            : 'Modifica le tue impostazioni di risparmio'
          }
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
        {/* Icon and Current Savings */}
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
              background: `linear-gradient(135deg, ${theme.secondary}30 0%, ${theme.secondary}10 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PiggyBank size={40} style={{ color: theme.secondary }} />
          </motion.div>
        </motion.div>

        {/* Current Savings Display */}
        {!isInitialSetup && (
          <motion.div
            variants={itemVariants}
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: `${theme.secondary}15`,
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
              RISPARMI ATTUALI
            </p>
            <motion.p
              key={totalSavings}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: theme.secondary,
                marginBottom: '12px',
              }}
            >
              € {totalSavings.toFixed(2)}
            </motion.p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSavingsAction('add');
                  setShowSavingsForm(true);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor: theme.secondary,
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={16} />
                Aggiungi
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSavingsAction('withdraw');
                  setShowSavingsForm(true);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Minus size={16} />
                Preleva
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Savings Form */}
        <AnimatePresence>
          {showSavingsForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
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
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '16px',
                  }}
                >
                  {savingsAction === 'add' ? 'Aggiungi ai risparmi' : 'Preleva dai risparmi'}
                </h4>
                
                <div style={{ marginBottom: '16px' }}>
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
                    <input
                      type="number"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 40px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: 'white',
                        color: '#1A2151',
                        fontSize: '16px',
                        outline: 'none',
                      }}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSavingsTransaction}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: savingsAction === 'add' ? theme.secondary : theme.danger,
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {savingsAction === 'add' ? 'Aggiungi' : 'Preleva'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSavingsForm(false)}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Percentage Selection */}
        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '16px',
            }}
          >
            Percentuale di risparmio mensile
          </h3>
          
          {/* Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '14px', color: theme.textSecondary }}>
                0%
              </span>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor: `${theme.secondary}15`,
                  color: theme.secondary,
                  fontWeight: '700',
                  fontSize: '18px',
                }}
              >
                {localSavingsPercentage}%
              </div>
              <span style={{ fontSize: '14px', color: theme.textSecondary }}>
                50%
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="50"
              value={localSavingsPercentage}
              onChange={(e) => setLocalSavingsPercentage(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, ${theme.secondary} 0%, ${theme.secondary} ${localSavingsPercentage * 2}%, ${theme.background} ${localSavingsPercentage * 2}%, ${theme.background} 100%)`,
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Preset Percentages */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '24px',
            }}
          >
            {presetPercentages.map((percentage) => (
              <motion.button
                key={percentage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocalSavingsPercentage(percentage)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${
                    localSavingsPercentage === percentage
                      ? theme.secondary
                      : theme.border
                  }`,
                  backgroundColor:
                    localSavingsPercentage === percentage
                      ? theme.secondary
                      : theme.background,
                  color:
                    localSavingsPercentage === percentage
                      ? 'white'
                      : theme.text,
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {percentage}%
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Savings Summary */}
        <motion.div
          variants={itemVariants}
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: theme.background,
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              Risparmio mensile
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.secondary,
              }}
            >
              € {calculateMonthlySavings().toFixed(2)}
            </span>
          </div>
          
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              Risparmio annuale
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.secondary,
              }}
            >
              € {(calculateMonthlySavings() * 12).toFixed(2)}
            </span>
          </div>
          
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              Disponibile per spese
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.text,
              }}
            >
              € {calculateAvailableAmount().toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Advanced Options */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: theme.background,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} />
            {showAdvanced ? 'Nascondi' : 'Mostra'} consigli sul risparmio
          </motion.button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '24px' }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: `${theme.primary}15`,
                    border: `1px solid ${theme.primary}30`,
                  }}
                >
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: theme.text,
                      marginBottom: '12px',
                    }}
                  >
                    💡 Consigli per risparmiare
                  </h4>
                  <ul
                    style={{
                      fontSize: '14px',
                      color: theme.text,
                      lineHeight: '1.5',
                      paddingLeft: '16px',
                    }}
                  >
                    <li style={{ marginBottom: '8px' }}>
                      La regola del 50/30/20: 50% necessità, 30% desideri, 20% risparmi
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      Inizia con una percentuale bassa e aumentala gradualmente
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      Automatizza i tuoi risparmi per non dimenticartene
                    </li>
                    <li>
                      Considera i risparmi come una spesa fissa obbligatoria
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Save Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.secondary} 0%, #27AE60 100%)`,
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          {isInitialSetup ? 'Completa configurazione' : 'Salva impostazioni'}
        </motion.button>

        {/* Navigation - solo se non è la configurazione iniziale */}
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
              onClick={() => setCurrentView('expenses')}
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
              onClick={() => setCurrentView('dashboard')}
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
              Dashboard
              <TrendingUp size={16} />
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SavingsSetup;

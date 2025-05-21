import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, ArrowRight, Check, Calendar, Info } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const SavingsSetup = ({ isInitialSetup, onComplete }) => {
  const {
    savingsPercentage,
    setSavingsPercentage,
    monthlyIncome,
    theme,
    setCurrentView,
    addToSavings,
    completeSetup,
    // Stato e funzioni relative al ciclo di pagamento
    paymentCycleType,
    lastPaydayDate,
    nextPaydayDate,
    getDaysUntilPayday
  } = useContext(AppContext);

  const [percentage, setPercentage] = useState(savingsPercentage);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

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

  const handleSave = () => {
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      setSavingsPercentage(percentage);
      
      // Calcola e aggiungi automaticamente il risparmio mensile
      const savingsAmount = calculateSavingAmount();
      if (savingsAmount > 0) {
        addToSavings(savingsAmount);
      }
      
      setShowSuccess(true);
      
      setTimeout(() => {
        if (isInitialSetup && onComplete) {
          onComplete({ savings: percentage });
          
          // Completa la configurazione iniziale solo se in modalità setup iniziale
          if (isInitialSetup) {
            completeSetup();
          }
        } else {
          setCurrentView('dashboard');
        }
      }, 800);
    }
  };

  // Calcola l'importo di risparmio basato sul ciclo di pagamento
  const calculateSavingAmount = () => {
    const baseAmount = (monthlyIncome * percentage) / 100;
    
    // Per cicli non mensili, adattiamo l'importo
    if (paymentCycleType === 'weekly') {
      return baseAmount / 4; // Approssimazione settimanale (un mese = ~4 settimane)
    } else if (paymentCycleType === 'biweekly') {
      return baseAmount / 2; // Approssimazione bisettimanale (un mese = ~2 periodi di due settimane)
    }
    
    return baseAmount; // Ciclo mensile
  };

  // Ottiene l'importo di risparmio per visualizzazione
  const getSavingsAmount = () => {
    const baseAmount = (monthlyIncome * percentage) / 100;
    
    // Restituisci il valore appropriato in base al ciclo
    if (paymentCycleType === 'weekly') {
      return baseAmount / 4; // ~1/4 del risparmio mensile ogni settimana
    } else if (paymentCycleType === 'biweekly') {
      return baseAmount / 2; // Metà del risparmio mensile ogni due settimane
    }
    
    return baseAmount; // Importo mensile completo
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

  // Ottiene la descrizione del ciclo di pagamento attuale
  const getPaymentCycleDescription = () => {
    let cycleLabel = 'Mensile';
    
    if (paymentCycleType === 'weekly') {
      cycleLabel = 'Settimanale';
    } else if (paymentCycleType === 'biweekly') {
      cycleLabel = 'Ogni 15 giorni';
    }
    
    return cycleLabel;
  };

  // Ottiene una descrizione del ciclo di pagamento e delle date
  const getPaymentInfo = () => {
    if (!lastPaydayDate && !nextPaydayDate) {
      return 'Nessun ciclo di pagamento configurato. Vai su "Stipendio" per configurarlo.';
    }
    
    const cycleType = getPaymentCycleDescription();
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
  
  // Ottiene la dicitura del periodo per la visualizzazione
  const getSavingPeriodLabel = () => {
    switch(paymentCycleType) {
      case 'weekly':
        return 'RISPARMIO SETTIMANALE';
      case 'biweekly':
        return 'RISPARMIO BISETTIMANALE';
      default:
        return 'RISPARMIO MENSILE';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="savings-setup"
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
          {isInitialSetup ? 'Ultimo passo: i tuoi risparmi' : 'Risparmio'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Imposta i tuoi obiettivi finanziari
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

        {/* Icon */}
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
              rotate: [0, 10, -10, 0],
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
            <Target size={40} style={{ color: theme.secondary }} />
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
              Ciclo di risparmio: {getPaymentCycleDescription()}
            </p>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
              I risparmi si adattano al tuo ciclo di stipendio
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
                  Informazioni sul ciclo di risparmio
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
                  Modifica ciclo <Calendar size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={itemVariants}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text,
              marginBottom: '8px',
            }}
          >
            Risparmio {paymentCycleType === 'monthly' ? 'mensile' : 
                      paymentCycleType === 'biweekly' ? 'bisettimanale' : 'settimanale'}
          </h3>
          <p style={{ fontSize: '14px', color: theme.textSecondary }}>
            Imposta la percentuale di entrate da risparmiare
          </p>
        </motion.div>

        {/* Percentage Slider */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              0%
            </span>
            <motion.span
              key={percentage}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: theme.secondary,
              }}
            >
              {percentage}%
            </motion.span>
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              100%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: theme.border,
              outline: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              marginBottom: '24px',
            }}
            className="savings-slider"
          />

          <style jsx>{`
            .savings-slider::-webkit-slider-thumb {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${theme.secondary};
              cursor: pointer;
              -webkit-appearance: none;
              appearance: none;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
            }

            .savings-slider::-moz-range-thumb {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${theme.secondary};
              cursor: pointer;
              border: none;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
            }

            .savings-slider::-webkit-slider-runnable-track {
              background: linear-gradient(
                to right,
                ${theme.secondary} 0%,
                ${theme.secondary} ${percentage}%,
                ${theme.border} ${percentage}%,
                ${theme.border} 100%
              );
              height: 8px;
              border-radius: 4px;
            }

            .savings-slider::-moz-range-track {
              background: linear-gradient(
                to right,
                ${theme.secondary} 0%,
                ${theme.secondary} ${percentage}%,
                ${theme.border} ${percentage}%,
                ${theme.border} 100%
              );
              height: 8px;
              border-radius: 4px;
            }
          `}</style>
        </motion.div>

        {/* Savings Amount Display */}
        <motion.div
          variants={itemVariants}
          style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: `${theme.secondary}15`,
            marginBottom: '32px',
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
            {getSavingPeriodLabel()}
          </p>
          <motion.p
            key={getSavingsAmount()}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: theme.secondary,
            }}
          >
            € {getSavingsAmount().toFixed(2)}
          </motion.p>
          
          {paymentCycleType !== 'monthly' && (
            <p
              style={{
                fontSize: '14px',
                color: theme.textSecondary,
                marginTop: '8px',
              }}
            >
              (€ {((monthlyIncome * percentage) / 100).toFixed(2)} al mese)
            </p>
          )}
        </motion.div>

        {/* Quick Presets */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <p
            style={{
              fontSize: '14px',
              color: theme.textSecondary,
              marginBottom: '12px',
            }}
          >
            Suggerimenti:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[5, 10, 15, 20, 30].map((preset) => (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPercentage(preset)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor:
                    percentage === preset ? theme.secondary : theme.background,
                  color: percentage === preset ? 'white' : theme.text,
                  border: `1px solid ${
                    percentage === preset ? theme.secondary : theme.border
                  }`,
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {preset}%
              </motion.button>
            ))}
          </div>
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
            background: `linear-gradient(135deg, ${theme.secondary} 0%, #26CC71 100%)`,
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isInitialSetup ? 'Completa configurazione' : 'Salva e vai alla Dashboard'}
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
              onClick={() => setCurrentView('goals')}
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
              Obiettivi
              <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SavingsSetup;

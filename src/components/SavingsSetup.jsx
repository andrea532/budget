import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, ArrowRight, Check } from 'lucide-react';
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
  } = useContext(AppContext);

  const [percentage, setPercentage] = useState(savingsPercentage);
  const [showSuccess, setShowSuccess] = useState(false);

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
      const monthlyAutomaticSavings = (monthlyIncome * percentage) / 100;
      if (monthlyAutomaticSavings > 0) {
        addToSavings(monthlyAutomaticSavings);
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

  const savingsAmount = (monthlyIncome * percentage) / 100;

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
            Risparmio mensile
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
            RISPARMIO MENSILE
          </p>
          <motion.p
            key={savingsAmount}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: theme.secondary,
            }}
          >
            € {savingsAmount.toFixed(2)}
          </motion.p>
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

import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';
import { AppContext } from '../context/AppContext';

// Verifica se siamo in PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || // Safari iOS
         document.referrer.includes('android-app://');
};

const IncomeSetup = ({ isInitialSetup, onComplete }) => {
  const {
    monthlyIncome,
    setMonthlyIncome,
    lastPaydayDate,
    setLastPaydayDate,
    nextPaydayDate,
    setNextPaydayDate,
    theme,
    setCurrentView,
    saveAllSettings, // Utilizziamo questa funzione per forzare il salvataggio
  } = useContext(AppContext);

  // Ottieni il mese corrente in formato testo (es. "Maggio")
  const currentMonth = new Date().toLocaleString('it-IT', { month: 'long' });

  // Ottieni la data odierna
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  
  // Ottieni l'ultimo giorno del mese corrente
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDayFormatted = lastDayOfMonth.toISOString().split('T')[0];

  // Stato locale con valori predefiniti dal contesto
  const [income, setIncome] = useState(
    monthlyIncome ? monthlyIncome.toString() : ''
  );
  const [periodStart, setPeriodStart] = useState(
    lastPaydayDate || todayFormatted
  );
  const [periodEnd, setPeriodEnd] = useState(
    nextPaydayDate || lastDayFormatted
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  // Aggiorna gli stati locali quando cambiano i valori nel contesto
  useEffect(() => {
    if (monthlyIncome && !saveAttempted) {
      setIncome(monthlyIncome.toString());
    }
    if (lastPaydayDate && !saveAttempted) {
      setPeriodStart(lastPaydayDate);
    }
    if (nextPaydayDate && !saveAttempted) {
      setPeriodEnd(nextPaydayDate);
    }
  }, [monthlyIncome, lastPaydayDate, nextPaydayDate, saveAttempted]);

  const handlePeriodStartChange = (e) => {
    const newStartDate = e.target.value;
    setPeriodStart(newStartDate);
    
    // Se la data di fine è precedente alla nuova data di inizio, aggiorna la data di fine
    if (new Date(periodEnd) < new Date(newStartDate)) {
      setPeriodEnd(newStartDate);
    }
  };

  const handleSave = () => {
    const parsedIncome = parseFloat(income);
    if (!isNaN(parsedIncome) && parsedIncome > 0) {
      console.log("Salvando reddito:", {
        monthlyIncome: parsedIncome,
        lastPaydayDate: periodStart,
        nextPaydayDate: periodEnd
      });
      
      // Salva l'entrata
      setMonthlyIncome(parsedIncome);
      
      // Usa la data inizio periodo come ultima data di pagamento
      setLastPaydayDate(periodStart);
      
      // La data fine periodo è considerata il prossimo pagamento
      setNextPaydayDate(periodEnd);

      // Forza un salvataggio immediatamente
      setTimeout(() => {
        saveAllSettings();
        
        // Per PWA, effettua un secondo tentativo dopo un breve ritardo
        if (isPWA()) {
          setTimeout(() => {
            console.log("Secondo tentativo di salvataggio in PWA (IncomeSetup)");
            saveAllSettings();
          }, 1000);
        }
      }, 200);
      
      setSaveAttempted(true);
      
      // Mostra animazione e procedi
      setShowSuccess(true);

      // Backup in localStorage (solo come sicurezza)
      try {
        localStorage.setItem('budget-income', parsedIncome.toString());
        localStorage.setItem('budget-payday-last', periodStart);
        localStorage.setItem('budget-payday-next', periodEnd);
      } catch (e) {
        console.error("Errore nel backup localStorage:", e);
      }
      
      setTimeout(() => {
        if (isInitialSetup && onComplete) {
          onComplete(parsedIncome);
        } else {
          // Salva nuovamente prima di cambiare vista
          saveAllSettings();
          
          // Passa un breve ritardo prima di cambiare vista
          setTimeout(() => {
            setCurrentView('expenses');
          }, 200);
        }
      }, 800);
    }
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
          marginTop: isInitialSetup ? '40px' : '0',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
          {isInitialSetup ? 'Configurazione reddito' : 'Il tuo reddito'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Inserisci quanto hai guadagnato
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 16px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Importo */}
        <div style={{ marginBottom: '32px' }}>
          <label 
            style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: theme.text,
              marginBottom: '16px',
              display: 'block',
              textAlign: 'center'
            }}
          >
            Quanto hai guadagnato questo mese?
          </label>
          
          <div style={{ 
            position: 'relative',
            marginBottom: '12px'
          }}>
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
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0"
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
              step="1"
              min="0"
            />
          </div>
        </div>

        {/* Periodo */}
        <div style={{ marginBottom: '32px' }}>
          <label 
            style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: theme.text,
              marginBottom: '16px',
              display: 'block',
              textAlign: 'center'
            }}
          >
            Periodo
          </label>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textSecondary,
                  marginBottom: '8px',
                  display: 'block'
                }}
              >
                Dal
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => handlePeriodStartChange(e)}
                min={todayFormatted}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: 'white',
                  color: '#1A2151',
                  fontSize: '16px',
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textSecondary,
                  marginBottom: '8px',
                  display: 'block'
                }}
              >
                Al
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                min={periodStart}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: 'white',
                  color: '#1A2151',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Pulsante salva */}
        <motion.button
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
          {isInitialSetup ? 'Continua' : 'Salva e continua'}
        </motion.button>

        {/* Navigation - solo se non è setup iniziale */}
        {!isInitialSetup && (
          <div
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
              onClick={() => {
                // Salva prima di navigare
                handleSave();
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
              Spese fisse
              <TrendingUp size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default IncomeSetup;

import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import IncomeSetup from './IncomeSetup';
import ExpensesSetup from './ExpensesSetup';
import SavingsSetup from './SavingsSetup';

const InitialSetupWizard = () => {
  const { theme, completeSetup } = useContext(AppContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    income: 0,
    expenses: [],
    savings: 10
  });

  // Funzione per gestire il passaggio alla fase successiva
  const goToNextStep = (data) => {
    if (currentStep === 1) {
      setSetupData(prev => ({ ...prev, income: data.income }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setSetupData(prev => ({ ...prev, expenses: data.expenses }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setSetupData(prev => ({ ...prev, savings: data.savings }));
      // Completa configurazione
      completeSetup();
    }
  };

  // Stile del componente
  const wizardStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.background,
    overflowY: 'auto',
    zIndex: 100
  };

  // Indicatore di progresso
  const ProgressIndicator = () => (
    <div style={{ 
      position: 'absolute', 
      top: 20, 
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      zIndex: 10
    }}>
      {[1, 2, 3].map(step => (
        <motion.div
          key={step}
          animate={{
            backgroundColor: step <= currentStep ? theme.primary : theme.border,
            scale: step === currentStep ? 1.2 : 1
          }}
          style={{
            width: step === currentStep ? '24px' : '20px',
            height: '6px',
            borderRadius: '3px',
            transition: 'all 0.3s ease'
          }}
        />
      ))}
    </div>
  );

  // Renderizza il passo corrente del wizard
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <IncomeSetup 
            isInitialSetup={true}
            onComplete={(data) => goToNextStep({ income: data })}
          />
        );
      case 2:
        return (
          <ExpensesSetup 
            isInitialSetup={true}
            onComplete={(data) => goToNextStep({ expenses: data })}
          />
        );
      case 3:
        return (
          <SavingsSetup 
            isInitialSetup={true}
            onComplete={(data) => goToNextStep({ savings: data })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={wizardStyle}>
      <ProgressIndicator />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ height: '100%' }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InitialSetupWizard;

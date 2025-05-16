import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, PiggyBank, Calendar, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import SavingsOverlay from './SavingsOverlay';

// Dashboard con design minimalista e moderno
const MinimalistDashboard = () => {
  // Usa il contesto dell'app per accedere ai dati e alle funzioni
  const { 
    theme: appTheme,
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
    transactions
  } = useContext(AppContext);

  // Tema minimalista
  const theme = {
    primary: '#0F172A',    // Blu scuro quasi nero
    accent: '#3B82F6',     // Blu per accenti
    positive: '#22C55E',   // Verde
    negative: '#EF4444',   // Rosso
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#1E293B',
    textSecondary: '#64748B',
  };

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
  
  // Giorni della settimana
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
  
  // Formattazione importo
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

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
      return "Stai risparmiando molto. Ottimo!";
    } else if (budgetSurplus > 0) {
      return "Stai risparmiando. Continua così.";
    } else if (budgetSurplus === 0) {
      return "Equilibrio perfetto.";
    } else {
      return "Attenzione al budget di oggi.";
    }
  };

  return (
    <div style={{ 
      background: theme.background,
      fontFamily: '"Inter", system-ui, sans-serif',
      padding: '32px 24px',
      minHeight: '100vh',
      maxWidth: '428px',
      margin: '0 auto',
      color: theme.text,
      position: 'relative',
      paddingBottom: '100px'
    }}>
      {/* Savings Overlay */}
      <SavingsOverlay isOpen={showSavingsOverlay} onClose={() => setShowSavingsOverlay(false)} />

      {/* Header con pulsante risparmi e saldo mensile */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSavingsOverlay(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: theme.card,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          <PiggyBank size={20} color={theme.accent} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>Risparmi</p>
            <p style={{ fontWeight: '600', fontSize: '16px' }}>€ {totalSavings.toFixed(2).replace('.', ',')}</p>
          </div>
        </motion.button>
        
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: theme.textSecondary }}>Saldo mensile</p>
          <p style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: monthlyBalance >= 0 ? theme.primary : theme.negative
          }}>
            € {monthlyBalance.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </motion.div>

      {/* Info prossimo stipendio - versione minimal */}
      {nextPaydayDate && daysUntilPayday !== null && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={20} color={theme.accent} />
          </div>
          
          <div>
            <p style={{ 
              fontWeight: '600', 
              color: theme.text,
              fontSize: '15px'
            }}>
              {daysUntilPayday} giorni al prossimo stipendio
            </p>
            <p style={{ 
              fontSize: '13px', 
              color: theme.textSecondary
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

      {/* Importo principale */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          marginBottom: '40px',
          backgroundColor: theme.card,
          padding: '24px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`
        }}
      >
        <p style={{
          fontSize: '14px',
          fontWeight: '500',
          color: theme.textSecondary,
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Budget disponibile oggi
        </p>
        
        <motion.p
          key={budgetSurplus}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            fontSize: '52px',
            fontWeight: '700',
            color: budgetSurplus >= 0 ? theme.primary : theme.negative,
            marginBottom: '8px',
            textAlign: 'center'
          }}
        >
          €&nbsp;{Math.abs(budgetSurplus).toFixed(2).replace('.', ',')}
        </motion.p>
        
        <div style={{
          height: '4px',
          width: '40px',
          backgroundColor: theme.accent,
          margin: '0 auto 12px auto',
          borderRadius: '2px'
        }}></div>
        
        <p style={{
          fontSize: '14px',
          fontWeight: '500',
          color: budgetSurplus >= 0 ? theme.positive : theme.negative,
          textAlign: 'center'
        }}>
          {getMotivationalMessage()}
        </p>
      </motion.div>

      {/* Budget per i prossimi giorni */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: theme.textSecondary,
          marginBottom: '16px'
        }}
      >
        Previsione budget
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '40px'
        }}
      >
        {[budgetSurplus, tomorrowBudget, afterTomorrowBudget].map((amount, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
            style={{
              flex: 1,
              padding: '20px 12px',
              backgroundColor: theme.card,
              borderRadius: '12px',
              border: index === 0 ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
              textAlign: 'center'
            }}
          >
            <p style={{
              fontSize: '13px',
              fontWeight: '500',
              color: theme.textSecondary,
              marginBottom: '8px'
            }}>
              {days[index]}
            </p>
            
            <p style={{
              fontSize: '18px',
              fontWeight: '600',
              color: index === 0 ? theme.accent : theme.text
            }}>
              € {Math.abs(amount).toFixed(2).replace('.', ',')}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pulsanti di azione minimalisti */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
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
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              border: 'none',
              backgroundColor: theme.positive,
              cursor: 'pointer'
            }}
            onClick={() => {
              setTransactionType('income');
              setNewTransaction({...newTransaction, amount: '', categoryId: 21, type: 'income'});
              setShowAddTransaction(true);
            }}
          >
            <Plus size={20} style={{ marginRight: '8px' }} />
            Entrata
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              height: '56px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '500',
              fontSize: '15px',
              border: 'none',
              backgroundColor: theme.negative,
              cursor: 'pointer'
            }}
            onClick={() => {
              setTransactionType('expense');
              setNewTransaction({...newTransaction, amount: '', categoryId: 1, type: 'expense'});
              setShowAddTransaction(true);
            }}
          >
            <Minus size={20} style={{ marginRight: '8px' }} />
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
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
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
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Header con pulsante Salva */}
                <div style={{ 
                  padding: '20px 24px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  {/* Handle bar */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <div 
                      style={{ 
                        width: '40px',
                        height: '4px',
                        backgroundColor: theme.border,
                        borderRadius: '2px',
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
                    marginBottom: '16px'
                  }}>
                    <button
                      onClick={() => setShowAddTransaction(false)}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme.textSecondary,
                        fontSize: '15px',
                        cursor: 'pointer'
                      }}
                    >
                      Annulla
                    </button>

                    <h2 style={{
                      fontSize: '16px',
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
                          ? (transactionType === 'expense' ? theme.negative : theme.positive)
                          : theme.border,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '500',
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
                    borderRadius: '8px',
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
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: transactionType === 'expense' ? theme.card : 'transparent',
                        color: transactionType === 'expense' ? theme.negative : theme.textSecondary,
                        fontWeight: '500',
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
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: transactionType === 'income' ? theme.card : 'transparent',
                        color: transactionType === 'income' ? theme.positive : theme.textSecondary,
                        fontWeight: '500',
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
                  padding: '24px',
                  paddingBottom: '32px'
                }}>
                  {/* Importo Input con formattazione automatica */}
                  <div style={{ 
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      backgroundColor: theme.background,
                      borderRadius: '16px',
                      padding: '24px',
                      textAlign: 'center'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.textSecondary,
                        marginBottom: '16px'
                      }}>
                        Importo
                      </label>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        marginBottom: '16px'
                      }}>
                        <span style={{
                          fontSize: '32px',
                          fontWeight: '600',
                          color: transactionType === 'expense' ? theme.negative : theme.positive
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
                            fontSize: '32px',
                            fontWeight: '600',
                            color: theme.text,
                            width: '160px',
                            textAlign: 'left',
                            caretColor: transactionType === 'expense' ? theme.negative : theme.positive
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
                          caretColor: theme.accent
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
                      marginBottom: '16px',
                      paddingLeft: '4px'
                    }}>
                      Seleziona categoria
                    </label>
                    
                    {/* Container scrollabile per le categorie */}
                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingRight: '8px'
                    }}>
                      <div 
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
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: parseInt(newTransaction.categoryId) === category.id 
                                  ? `${theme.background}` 
                                  : theme.card,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: parseInt(newTransaction.categoryId) === category.id 
                                  ? (transactionType === 'expense' ? theme.negative : theme.positive)
                                  : theme.border,
                                gap: '12px',
                                minHeight: '64px'
                              }}
                            >
                              <div style={{
                                fontSize: '24px',
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

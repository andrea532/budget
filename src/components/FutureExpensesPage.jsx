import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Calendar,
  Calculator,
  AlertCircle,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const FutureExpensesPage = () => {
  const {
    theme,
    futureExpenses,
    addFutureExpense,
    updateFutureExpense,
    deleteFutureExpense,
    categories,
  } = useContext(AppContext);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [addExpenseStep, setAddExpenseStep] = useState('details'); // 'category' o 'details'
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    dueDate: '',
    categoryId: 1,
    description: '',
  });

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

  // Calcola i giorni rimanenti fino alla scadenza
  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calcola l'importo giornaliero da accantonare
  const calculateDailyAmount = (totalAmount, dueDate) => {
    const daysRemaining = calculateDaysRemaining(dueDate);
    if (daysRemaining <= 0) return 0;
    return (totalAmount / daysRemaining).toFixed(2);
  };

  // Calcola il totale giornaliero di tutte le spese future
  const getTotalDailyAmount = () => {
    return futureExpenses.reduce((total, expense) => {
      const dailyAmount = calculateDailyAmount(expense.amount, expense.dueDate);
      return total + parseFloat(dailyAmount);
    }, 0);
  };

  // Formattazione importo in stile bancario
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

  // Handlers
  const handleAddExpense = () => {
    if (
      !newExpense.name ||
      !newExpense.amount ||
      !newExpense.dueDate ||
      isNaN(parseInt(newExpense.amount, 10)) ||
      parseInt(newExpense.amount, 10) <= 0
    ) {
      return;
    }

    const expense = {
      ...newExpense,
      amount: parseInt(newExpense.amount, 10) / 100,
      categoryId: parseInt(newExpense.categoryId),
    };

    if (editingExpenseId) {
      updateFutureExpense(editingExpenseId, expense);
      setEditingExpenseId(null);
    } else {
      addFutureExpense(expense);
    }

    setNewExpense({
      name: '',
      amount: '',
      dueDate: '',
      categoryId: 1,
      description: '',
    });
    setShowAddExpense(false);
    setAddExpenseStep('details');
  };

  const handleEditExpense = (expense) => {
    setNewExpense({
      name: expense.name,
      amount: Math.round(expense.amount * 100).toString(),
      dueDate: expense.dueDate,
      categoryId: expense.categoryId,
      description: expense.description || '',
    });
    setEditingExpenseId(expense.id);
    setAddExpenseStep('details');
    setShowAddExpense(true);
  };

  const handleDeleteExpense = (id) => {
    deleteFutureExpense(id);
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
    setEditingExpenseId(null);
    setShowAddExpense(false);
  };

  const confirmDelete = (id) => {
    setExpenseToDelete(id);
    setShowDeleteConfirm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="future-expenses-page"
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
          Spese Future
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Pianifica e accantona per le spese imminenti
        </p>
      </motion.div>

      {/* Riepilogo totale giornaliero */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 16px 24px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}30 0%, ${theme.primary}10 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Calculator size={40} style={{ color: theme.primary }} />
          </motion.div>

          <p
            style={{
              fontSize: '14px',
              color: theme.textSecondary,
              marginBottom: '8px',
            }}
          >
            ACCANTONAMENTO GIORNALIERO
          </p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: theme.primary,
            }}
          >
            € {getTotalDailyAmount().toFixed(2)}
          </motion.p>
          <p
            style={{
              fontSize: '14px',
              color: theme.textSecondary,
              marginTop: '8px',
            }}
          >
            Da sottrarre dal budget giornaliero
          </p>
        </div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <motion.div
            variants={itemVariants}
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: `${theme.warning}15`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
              SPESE PIANIFICATE
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: theme.warning,
                marginTop: '4px',
              }}
            >
              {futureExpenses.length}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: `${theme.danger}15`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
              TOTALE DA PAGARE
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: theme.danger,
                marginTop: '4px',
              }}
            >
              € {futureExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Lista spese future */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          margin: '0 16px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h3
              style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}
            >
              Prossime spese
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: theme.textSecondary,
                marginTop: '4px',
              }}
            >
              Gestisci le tue spese imminenti
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setNewExpense({
                name: '',
                amount: '',
                dueDate: '',
                categoryId: 1,
                description: '',
              });
              setEditingExpenseId(null);
              setAddExpenseStep('details');
              setShowAddExpense(!showAddExpense);
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: `${theme.primary}15`,
              color: theme.primary,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {showAddExpense ? <Minus size={20} /> : <Plus size={20} />}
          </motion.button>
        </div>

        {/* Bottom Sheet per aggiungere/modificare spesa */}
        <AnimatePresence>
          {showAddExpense && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
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
                onClick={() => setShowAddExpense(false)}
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: '20%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  maxWidth: '428px',
                  margin: '0 auto',
                  height: '80%'
                }}
              >
                <div style={{
                  backgroundColor: theme.card,
                  borderTopLeftRadius: '32px',
                  borderTopRightRadius: '32px',
                  height: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '16px 20px',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
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
                        onClick={() => {
                          if (addExpenseStep === 'category') {
                            setAddExpenseStep('details');
                          } else {
                            setShowAddExpense(false);
                          }
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <button
                        onClick={() => {
                          if (addExpenseStep === 'category') {
                            setAddExpenseStep('details');
                          } else {
                            setShowAddExpense(false);
                          }
                        }}
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: theme.textSecondary,
                          fontSize: '16px',
                          cursor: 'pointer'
                        }}
                      >
                        {addExpenseStep === 'category' ? 'Indietro' : 'Annulla'}
                      </button>

                      <h2 style={{
                        fontSize: '17px',
                        fontWeight: '600',
                        color: theme.text
                      }}>
                        {editingExpenseId 
                          ? 'Modifica spesa futura' 
                          : 'Aggiungi spesa futura'}
                      </h2>

                      {addExpenseStep === 'details' ? (
                        <button
                          onClick={handleAddExpense}
                          disabled={!newExpense.name || !newExpense.amount || !newExpense.dueDate || parseInt(newExpense.amount, 10) <= 0}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: newExpense.name && newExpense.amount && newExpense.dueDate && parseInt(newExpense.amount, 10) > 0
                              ? theme.primary
                              : theme.border,
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: newExpense.name && newExpense.amount && newExpense.dueDate && parseInt(newExpense.amount, 10) > 0 ? 'pointer' : 'not-allowed',
                            opacity: newExpense.name && newExpense.amount && newExpense.dueDate && parseInt(newExpense.amount, 10) > 0 ? 1 : 0.5,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {editingExpenseId ? 'Aggiorna' : 'Salva'}
                        </button>
                      ) : (
                        <div style={{ width: '64px' }}></div>
                      )}
                    </div>
                  </div>

                  {/* Pulsante elimina per modalità modifica - SPOSTATO QUI IN ALTO */}
                  {editingExpenseId && addExpenseStep === 'details' && (
                    <div style={{ 
                      padding: '8px 16px',
                      borderBottom: `1px solid ${theme.border}`,
                      backgroundColor: `${theme.danger}08`
                    }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => confirmDelete(editingExpenseId)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: `${theme.danger}15`,
                          color: theme.danger,
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '16px'
                        }}
                      >
                        <Trash2 size={20} />
                        Elimina spesa futura
                      </motion.button>
                    </div>
                  )}

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    paddingBottom: '32px'
                  }}>
                    {addExpenseStep === 'category' && (
                      <div>
                        <div style={{
                          maxHeight: '500px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          paddingRight: '8px'
                        }}>
                          <div 
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '16px',
                              paddingBottom: '8px'
                            }}
                          >
                            {categories
                              .filter(cat => cat.id <= 20)
                              .map(category => (
                                <motion.button
                                  key={category.id}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => {
                                    setNewExpense({...newExpense, categoryId: category.id});
                                    setAddExpenseStep('details');
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px 10px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    backgroundColor: theme.background,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    gap: '10px',
                                    minHeight: '100px'
                                  }}
                                >
                                  <div style={{
                                    fontSize: '32px',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: category.color,
                                    backgroundColor: `${category.color}15`,
                                    borderRadius: '12px',
                                    marginBottom: '6px'
                                  }}>
                                    {category.icon}
                                  </div>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: theme.text,
                                    textAlign: 'center'
                                  }}>
                                    {category.name}
                                  </span>
                                </motion.button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {addExpenseStep === 'details' && (
                      <>
                        {/* Categoria selezionata */}
                        {newExpense.categoryId && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            marginBottom: '24px'
                          }}>
                            {categories.filter(c => c.id === parseInt(newExpense.categoryId)).map(category => (
                              <div key={category.id} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => setAddExpenseStep('category')}
                                  style={{
                                    fontSize: '36px',
                                    width: '64px',
                                    height: '64px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: category.color,
                                    backgroundColor: `${category.color}15`,
                                    borderRadius: '16px',
                                    marginBottom: '4px',
                                    cursor: 'pointer'
                                  }}>
                                  {category.icon}
                                </motion.div>
                                <span style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: theme.text
                                }}>
                                  {category.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Form di dettagli */}
                        <div style={{ 
                          marginBottom: '24px'
                        }}>
                          <div style={{
                            backgroundColor: theme.background,
                            borderRadius: '20px',
                            padding: '20px',
                            marginBottom: '20px'
                          }}>
                            <label style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: theme.textSecondary,
                              marginBottom: '8px'
                            }}>
                              Nome spesa
                            </label>
                            
                            <input
                              type="text"
                              value={newExpense.name}
                              onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                              placeholder="Es. Bollo auto, Assicurazione"
                              style={{
                                width: '100%',
                                backgroundColor: 'white',
                                border: `1px solid ${theme.border}`,
                                borderRadius: '12px',
                                padding: '14px',
                                fontSize: '16px',
                                color: '#1A2151',
                                outline: 'none'
                              }}
                            />
                          </div>
                          
                          <div style={{
                            backgroundColor: theme.background,
                            borderRadius: '20px',
                            padding: '20px',
                            marginBottom: '20px',
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
                                color: theme.primary
                              }}>
                                €
                              </span>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={formatAmount(newExpense.amount)}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, '');
                                  
                                  if (value === '') {
                                    setNewExpense({...newExpense, amount: ''});
                                    return;
                                  }
                                  
                                  if (value.length > 8) {
                                    value = value.slice(0, 8);
                                  }
                                  
                                  setNewExpense({...newExpense, amount: value});
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
                                  caretColor: theme.primary
                                }}
                              />
                            </div>
                          </div>
                          
                          <div style={{
                            backgroundColor: theme.background,
                            borderRadius: '20px',
                            padding: '20px',
                            marginBottom: '20px'
                          }}>
                            <label style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: theme.textSecondary,
                              marginBottom: '8px'
                            }}>
                              Data scadenza
                            </label>
                            
                            <input
                              type="date"
                              value={newExpense.dueDate}
                              onChange={(e) => setNewExpense({...newExpense, dueDate: e.target.value})}
                              style={{
                                width: '100%',
                                backgroundColor: 'white',
                                border: `1px solid ${theme.border}`,
                                borderRadius: '12px',
                                padding: '14px',
                                fontSize: '16px',
                                color: '#1A2151',
                                outline: 'none'
                              }}
                            />
                          </div>
                          
                          <div style={{
                            backgroundColor: theme.background,
                            borderRadius: '20px',
                            padding: '20px'
                          }}>
                            <label style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: theme.textSecondary,
                              marginBottom: '8px'
                            }}>
                              Descrizione (opzionale)
                            </label>
                            
                            <input
                              type="text"
                              value={newExpense.description}
                              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                              placeholder="Note aggiuntive sulla spesa"
                              style={{
                                width: '100%',
                                backgroundColor: 'white',
                                border: `1px solid ${theme.border}`,
                                borderRadius: '12px',
                                padding: '14px',
                                fontSize: '16px',
                                color: '#1A2151',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Conferma Eliminazione */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 60,
              }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                style={{
                  backgroundColor: theme.card,
                  padding: '24px',
                  borderRadius: '20px',
                  maxWidth: '300px',
                  width: '90%',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '16px',
                  }}
                >
                  Sei sicuro?
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.textSecondary,
                    marginBottom: '24px',
                  }}
                >
                  Questa azione non può essere annullata.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteExpense(expenseToDelete)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: theme.danger,
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Elimina
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteConfirm(false)}
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista delle spese */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {futureExpenses.map((expense) => {
            const daysRemaining = calculateDaysRemaining(expense.dueDate);
            const dailyAmount = calculateDailyAmount(expense.amount, expense.dueDate);
            const isUrgent = daysRemaining <= 7;
            const isOverdue = daysRemaining === 0;
            const category = categories.find(c => c.id === expense.categoryId);

            return (
              <motion.div
                key={expense.id}
                variants={itemVariants}
                layout
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme.background,
                  border: `1px solid ${
                    isOverdue ? theme.danger : isUrgent ? theme.warning : theme.border
                  }`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: `${category?.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {category?.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: theme.text,
                          }}
                        >
                          {expense.name}
                        </h4>
                        {isUrgent && !isOverdue && (
                          <AlertCircle
                            size={16}
                            style={{ color: theme.warning }}
                          />
                        )}
                        {isOverdue && (
                          <AlertCircle
                            size={16}
                            style={{ color: theme.danger }}
                          />
                        )}
                      </div>
                      <p
                        style={{ fontSize: '14px', color: theme.textSecondary }}
                      >
                        Scadenza: {new Date(expense.dueDate).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditExpense(expense)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: `${theme.primary}15`,
                        color: theme.primary,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => confirmDelete(expense.id)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: `${theme.danger}15`,
                        color: theme.danger,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: `${theme.primary}20`,
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - (daysRemaining / 30) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '4px',
                      backgroundColor: isOverdue
                        ? theme.danger
                        : isUrgent
                        ? theme.warning
                        : theme.primary,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                      {isOverdue
                        ? 'Scaduta!'
                        : `${daysRemaining} giorni rimanenti`}
                    </p>
                    <p
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: theme.primary,
                      }}
                    >
                      € {dailyAmount} al giorno
                    </p>
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                    € {expense.amount.toFixed(2)}
                  </p>
                </div>

                {expense.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: theme.textSecondary,
                      marginTop: '12px',
                      fontStyle: 'italic',
                    }}
                  >
                    {expense.description}
                  </p>
                )}
              </motion.div>
            );
          })}

          {futureExpenses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                borderRadius: '16px',
                backgroundColor: theme.background,
                color: theme.textSecondary,
              }}
            >
              <Receipt
                size={48}
                style={{ margin: '0 auto 16px', opacity: 0.5 }}
              />
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                Nessuna spesa pianificata
              </p>
              <p style={{ fontSize: '14px' }}>
                Aggiungi le spese future per calcolare l'accantonamento giornaliero
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FutureExpensesPage;

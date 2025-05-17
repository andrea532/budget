import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const TransactionItem = ({ transaction, category, showActions = true }) => {
  const { theme, updateTransaction, deleteTransaction, categories } =
    useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState({
    ...transaction,
    amount: transaction.amount ? Math.round(transaction.amount * 100).toString() : '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editStep, setEditStep] = useState('details'); // 'category' o 'details'

  // Animazioni
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
    exit: {
      opacity: 0,
      x: -100,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Formattazione importo
  const formatAmount = (value) => {
    if (!value) return '';
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

  const handleSaveEdit = () => {
    if (
      !editedTransaction.amount ||
      isNaN(parseInt(editedTransaction.amount, 10)) ||
      parseInt(editedTransaction.amount, 10) <= 0
    ) {
      return;
    }

    // Converti l'importo dal formato centesimi a decimale
    const amount = (parseInt(editedTransaction.amount, 10) / 100);

    updateTransaction(transaction.id, {
      amount: amount,
      categoryId: editedTransaction.categoryId,
      description: editedTransaction.description,
      date: editedTransaction.date,
      type: editedTransaction.type,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      deleteTransaction(transaction.id);
    }, 300);
  };

  const getRelevantCategories = () => {
    if (editedTransaction.type === 'expense') {
      return categories.filter((cat) => cat.id <= 20);
    } else {
      return categories.filter((cat) => cat.id >= 21);
    }
  };

  const isIncome = transaction.type === 'income';
  const formattedDate = new Date(transaction.date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });

  if (isEditing) {
    return (
      <AnimatePresence>
        <motion.div
          key="overlay"
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
          onClick={() => setIsEditing(false)}
        />

        <motion.div
          key="edit-sheet"
          initial={{ y: '100%' }}
          animate={{ y: '10%' }} /* Portato più in alto (era 20%) */
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
            height: '90%' /* Aumentato da 80% a 90% */
          }}
        >
          <div style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            height: '90%', /* Aumentato da 80% a 90% */
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
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
                    if (editStep === 'category') {
                      setEditStep('details');
                    } else {
                      setIsEditing(false);
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
                    if (editStep === 'category') {
                      setEditStep('details');
                    } else {
                      setIsEditing(false);
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
                  {editStep === 'category' ? 'Indietro' : 'Annulla'}
                </button>

                <h2 style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: theme.text
                }}>
                  {editStep === 'category' 
                    ? `Seleziona categoria ${isIncome ? 'entrata' : 'spesa'}`
                    : `Modifica transazione`
                  }
                </h2>

                {editStep === 'details' ? (
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editedTransaction.amount || parseInt(editedTransaction.amount, 10) <= 0}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: editedTransaction.amount && parseInt(editedTransaction.amount, 10) > 0
                        ? (isIncome ? theme.secondary : theme.danger)
                        : theme.border,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: editedTransaction.amount && parseInt(editedTransaction.amount, 10) > 0 ? 'pointer' : 'not-allowed',
                      opacity: editedTransaction.amount && parseInt(editedTransaction.amount, 10) > 0 ? 1 : 0.5,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Salva
                  </button>
                ) : (
                  <div style={{ width: '64px' }}></div>
                )}
              </div>

              <div style={{
                display: 'flex',
                backgroundColor: theme.background,
                borderRadius: '12px',
                padding: '4px'
              }}>
                <button
                  disabled={true}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: !isIncome ? theme.card : 'transparent',
                    color: !isIncome ? theme.danger : theme.textSecondary,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'default',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Spesa
                </button>
                <button
                  disabled={true}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isIncome ? theme.card : 'transparent',
                    color: isIncome ? theme.secondary : theme.textSecondary,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'default',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Entrata
                </button>
              </div>
            </div>

            {/* Contenuto */}
            <div 
              className="transaction-edit-content"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                paddingBottom: '100px', /* Aumentato notevolmente il padding inferiore */
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.textSecondary} ${theme.background}`
              }}
            >
              <style>{`
                /* Stile scrollbar per il contenitore principale */
                .transaction-edit-content::-webkit-scrollbar {
                  width: 6px;
                }
                .transaction-edit-content::-webkit-scrollbar-track {
                  background: ${theme.background};
                  border-radius: 3px;
                }
                .transaction-edit-content::-webkit-scrollbar-thumb {
                  background: ${theme.textSecondary};
                  border-radius: 3px;
                }
                .transaction-edit-content::-webkit-scrollbar-thumb:hover {
                  background: ${theme.text};
                }
                
                .categories-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .categories-scroll::-webkit-scrollbar-track {
                  background: ${theme.background};
                  border-radius: 3px;
                }
                .categories-scroll::-webkit-scrollbar-thumb {
                  background: ${theme.textSecondary};
                  border-radius: 3px;
                }
                .categories-scroll::-webkit-scrollbar-thumb:hover {
                  background: ${theme.text};
                }
              `}</style>
              
              {editStep === 'category' && (
                <div>
                  <div style={{
                    maxHeight: '500px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '8px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${theme.textSecondary} ${theme.background}`
                  }}>
                    <div 
                      className="categories-scroll"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        paddingBottom: '8px'
                      }}
                    >
                      {getRelevantCategories().map(category => (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setEditedTransaction({...editedTransaction, categoryId: category.id});
                            setEditStep('details');
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 10px',
                            borderRadius: '16px',
                            border: 'none',
                            backgroundColor: category.id === editedTransaction.categoryId 
                              ? `${category.color}20` 
                              : theme.background,
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
              
              {editStep === 'details' && (
                <>
                  {editedTransaction.categoryId && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      marginBottom: '24px'
                    }}>
                      {categories.filter(c => c.id === parseInt(editedTransaction.categoryId)).map(category => (
                        <div key={category.id} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setEditStep('category')}
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
                  
                  <div style={{ 
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      backgroundColor: theme.background,
                      borderRadius: '20px',
                      padding: '20px',
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
                          color: isIncome ? theme.secondary : theme.danger
                        }}>
                          €
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={formatAmount(editedTransaction.amount)}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9]/g, '');
                            
                            if (value === '') {
                              setEditedTransaction({...editedTransaction, amount: ''});
                              return;
                            }
                            
                            if (value.length > 8) {
                              value = value.slice(0, 8);
                            }
                            
                            setEditedTransaction({...editedTransaction, amount: value});
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
                            caretColor: isIncome ? theme.secondary : theme.danger
                          }}
                          autoFocus
                        />
                      </div>

                      <input
                        type="text"
                        value={editedTransaction.description}
                        onChange={(e) => setEditedTransaction({...editedTransaction, description: e.target.value})}
                        placeholder={isIncome ? "Da dove arriva?" : "Cosa hai comprato?"}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${theme.border}`,
                          outline: 'none',
                          textAlign: 'center',
                          fontSize: '16px',
                          color: theme.textSecondary,
                          padding: '8px',
                          caretColor: theme.primary
                        }}
                      />
                    </div>
                    
                    {/* Data */}
                    <div style={{ marginTop: '20px' }}>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: theme.textSecondary,
                          display: 'block',
                          marginBottom: '8px',
                          textAlign: 'center'
                        }}
                      >
                        Data
                      </label>
                      <input
                        type="date"
                        value={editedTransaction.date}
                        onChange={(e) => setEditedTransaction({...editedTransaction, date: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: 'white',
                          color: '#1A2151',
                          fontSize: '16px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    {/* Pulsante elimina con margine molto ampio */}
                    <div style={{ marginTop: '32px', marginBottom: '50px' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          width: '100%',
                          padding: '16px', /* Aumentato il padding */
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
                          fontSize: '16px' /* Aumentato la dimensione del testo */
                        }}
                      >
                        <Trash2 size={24} /> {/* Icona più grande */}
                        Elimina transazione
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Conferma Eliminazione */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    key="delete-confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 60,
                    }}
                  >
                    <motion.div
                      key="confirm-modal"
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
                          onClick={handleDelete}
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
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          key={`transaction-${transaction.id}`}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div
            whileHover={{ backgroundColor: theme.background }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: `1px solid ${theme.border}`,
              transition: 'background-color 0.3s ease',
              cursor: 'pointer',
            }}
          >
            {/* Left side - Category and details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: `${category?.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '24px' }}>{category?.icon}</span>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: isIncome ? theme.secondary : theme.danger,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isIncome ? (
                    <ArrowUpRight size={10} color="white" />
                  ) : (
                    <ArrowDownRight size={10} color="white" />
                  )}
                </motion.div>
              </motion.div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: '500',
                    color: theme.text,
                    marginBottom: '2px',
                  }}
                >
                  {category?.name}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.textSecondary,
                    marginBottom: '2px',
                  }}
                >
                  {transaction.description || 'Nessuna descrizione'}
                </p>
                <p style={{ fontSize: '16px', color: theme.textSecondary }}>
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Right side - Amount and actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: isIncome ? theme.secondary : theme.danger,
                }}
              >
                {isIncome ? '+' : '-'} €{' '}
                {parseFloat(transaction.amount).toFixed(2)}
              </motion.p>

              {showActions && (
                <AnimatePresence>
                  {!showDeleteConfirm ? (
                    <motion.div
                      key="action-buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: '8px' }}
                    >
                      <motion.button
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: theme.primary,
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Converti l'importo al formato in centesimi per l'editing
                          setEditedTransaction({
                            ...transaction,
                            amount: transaction.amount ? Math.round(transaction.amount * 100).toString() : ''
                          });
                          setEditStep('details');
                          setIsEditing(true);
                        }}
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
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Pencil size={16} />
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: theme.danger,
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
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
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirm-buttons"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        backgroundColor: theme.background,
                        padding: '6px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: theme.danger,
                          color: 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={14} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: theme.background,
                          color: theme.textSecondary,
                          border: `1px solid ${theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionItem;

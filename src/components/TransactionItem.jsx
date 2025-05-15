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
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSaveEdit = () => {
    if (
      !editedTransaction.amount ||
      isNaN(parseFloat(editedTransaction.amount)) ||
      parseFloat(editedTransaction.amount) <= 0
    ) {
      return;
    }

    updateTransaction(transaction.id, {
      amount: parseFloat(editedTransaction.amount),
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
      return categories.filter((cat) => cat.id <= 5);
    } else {
      return categories.filter((cat) => cat.id >= 6);
    }
  };

  const isIncome = transaction.type === 'income';
  const formattedDate = new Date(transaction.date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          padding: '16px',
          margin: '0 16px 12px',
          borderRadius: '16px',
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {/* Amount input */}
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textSecondary,
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Importo (€)
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="number"
              value={editedTransaction.amount}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  amount: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                backgroundColor: 'white',
                color: '#1A2151', // MODIFICATO: colore testo fisso
                fontSize: '16px',
                fontWeight: '600',
              }}
              step="0.01"
              min="0"
            />
          </div>

          {/* Category select */}
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textSecondary,
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Categoria
            </label>
            <select
              value={editedTransaction.categoryId}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  categoryId: parseInt(e.target.value),
                })
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                backgroundColor: 'white',
                color: '#1A2151', // MODIFICATO: colore testo fisso
                fontSize: '16px',
              }}
            >
              {getRelevantCategories().map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description input */}
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textSecondary,
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Descrizione
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={editedTransaction.description}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  description: e.target.value,
                })
              }
              placeholder="Descrizione opzionale"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                backgroundColor: 'white',
                color: '#1A2151', // MODIFICATO: colore testo fisso
                fontSize: '16px',
              }}
            />
          </div>

          {/* Date input */}
          <div>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textSecondary,
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Data
            </label>
            <input
              type="date"
              value={editedTransaction.date}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  date: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                backgroundColor: 'white',
                color: '#1A2151', // MODIFICATO: colore testo fisso
                fontSize: '16px',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveEdit}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: theme.secondary,
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Check size={18} />
              Salva
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(false)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: theme.background,
                color: theme.textSecondary,
                fontWeight: '600',
                fontSize: '16px',
                border: `1px solid ${theme.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <X size={18} />
              Annulla
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
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
                <p style={{ fontSize: '12px', color: theme.textSecondary }}>
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

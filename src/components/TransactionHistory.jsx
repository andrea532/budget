import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import TransactionItem from './TransactionItem';

const TransactionHistory = () => {
  const { theme, transactions, categories } = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  // Filtra e ordina transazioni
  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter((t) => {
        const category = categories.find((c) => c.id === t.categoryId);
        return (
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (filter !== 'all') {
      filtered = filtered.filter((t) => t.categoryId === parseInt(filter));
    }

    switch (sortBy) {
      case 'date-asc':
        filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case 'date-desc':
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredAndSortedTransactions();
  const totalFilteredExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="transaction-history"
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
          Cronologia transazioni
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Visualizza le tue entrate e uscite
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '0 16px',
          marginBottom: '24px',
        }}
      >
        <motion.div
          variants={itemVariants}
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: `${theme.primary}15`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: theme.textSecondary,
              marginBottom: '4px',
            }}
          >
            TRANSAZIONI
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: theme.primary,
            }}
          >
            {filteredTransactions.length}
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
          <p
            style={{
              fontSize: '10px',
              color: theme.textSecondary,
              marginBottom: '4px',
            }}
          >
            TOTALE SPESE
          </p>
          <p
            style={{ fontSize: '20px', fontWeight: '700', color: theme.danger }}
          >
            € {totalFilteredExpenses.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: `${theme.secondary}15`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: theme.textSecondary,
              marginBottom: '4px',
            }}
          >
            TOTALE ENTRATE
          </p>
          <p
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: theme.secondary,
            }}
          >
            € {totalFilteredIncome.toFixed(2)}
          </p>
        </motion.div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '0 16px',
          marginBottom: '16px',
        }}
      >
        {/* Search Bar */}
        <motion.div
          style={{
            position: 'relative',
            marginBottom: '12px',
          }}
        >
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.textSecondary,
            }}
          />
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder="Cerca transazioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.background,
              color: theme.text,
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {['all', 'expense', 'income'].map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTypeFilter(type)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${
                  typeFilter === type
                    ? type === 'expense'
                      ? theme.danger
                      : type === 'income'
                      ? theme.secondary
                      : theme.primary
                    : theme.border
                }`,
                backgroundColor:
                  typeFilter === type
                    ? type === 'expense'
                      ? theme.danger
                      : type === 'income'
                      ? theme.secondary
                      : theme.primary
                    : theme.background,
                color: typeFilter === type ? 'white' : theme.text,
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {type === 'all'
                ? 'Tutte'
                : type === 'expense'
                ? 'Spese'
                : 'Entrate'}
            </motion.button>
          ))}
        </motion.div>

        {/* Advanced Filters Toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.background,
            color: theme.text,
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          <Filter size={16} />
          Filtri avanzati
        </motion.button>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}
              >
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontSize: '14px',
                  }}
                >
                  <option value="all">Tutte le categorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontSize: '14px',
                  }}
                >
                  <option value="date-desc">Più recenti</option>
                  <option value="date-asc">Meno recenti</option>
                  <option value="amount-desc">Importo ↓</option>
                  <option value="amount-asc">Importo ↑</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ padding: '0 16px' }}
      >
        {filteredTransactions.length === 0 ? (
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
            <Calendar
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
              Nessuna transazione trovata
            </p>
            <p style={{ fontSize: '14px' }}>
              {searchTerm
                ? 'Prova con un altro termine di ricerca'
                : 'Aggiungi delle spese o entrate per vederle qui'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <AnimatePresence>
              {filteredTransactions.map((transaction, index) => {
                const category = categories.find(
                  (c) => c.id === transaction.categoryId
                );
                return (
                  <motion.div
                    key={transaction.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    custom={index}
                    layout
                  >
                    <TransactionItem
                      transaction={transaction}
                      category={category}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TransactionHistory;

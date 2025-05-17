import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const StatsPage = () => {
  const {
    theme,
    categories,
    transactions,
    getMonthlyStats,
    getWeeklyComparison,
  } = useContext(AppContext);

  // Stati per il periodo selezionato
  const [selectedPeriodType, setSelectedPeriodType] = useState('month'); // 'month' o 'week'
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = attuale, -1 = precedente, -2 = due periodi fa, ecc.
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Calcola le date basate sul periodo selezionato
  const getCurrentPeriodDates = () => {
    const today = new Date();
    
    if (selectedPeriodType === 'month') {
      // Ottieni mese con offset
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + periodOffset);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Primo e ultimo giorno del mese
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      return {
        startDate,
        endDate,
        label: startDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      };
    } else { // week
      // Trova la domenica della settimana corrente (inizio settimana)
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay(); // 0 per domenica, 1 per lunedì, ecc.
      
      // Vai a domenica
      currentDate.setDate(currentDate.getDate() - dayOfWeek);
      
      // Applica l'offset
      currentDate.setDate(currentDate.getDate() + (periodOffset * 7));
      
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 6); // Sabato (fine settimana)
      
      return {
        startDate,
        endDate,
        label: `${startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`
      };
    }
  };
  
  const periodDates = getCurrentPeriodDates();
  
  // Funzione per ottenere statistiche per il periodo selezionato
  const getStatsForPeriod = () => {
    const { startDate, endDate } = periodDates;
    
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
    
    const expenses = periodTransactions.filter(t => t.type === 'expense');
    const income = periodTransactions.filter(t => t.type === 'income');
    
    const categoryExpenses = {};
    expenses.forEach(t => {
      if (!categoryExpenses[t.categoryId]) {
        categoryExpenses[t.categoryId] = 0;
      }
      categoryExpenses[t.categoryId] += t.amount;
    });
    
    return {
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
      totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: periodTransactions.length,
      averageExpense: expenses.length ? expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length : 0,
      categoryBreakdown: categoryExpenses,
      dailyAverageExpense: expenses.length ? 
        expenses.reduce((sum, t) => sum + t.amount, 0) / 
        (Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1) : 0
    };
  };
  
  // Funzione per ottenere i dati settimanali per il grafico
  const getWeeklyDataForPeriod = () => {
    const { startDate } = periodDates;
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayExpenses = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'expense' && tDate.toDateString() === date.toDateString();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      weekData.push({
        day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        amount: dayExpenses,
        date: date,
      });
    }
    
    return weekData;
  };
  
  const periodStats = getStatsForPeriod();
  const weeklyData = selectedPeriodType === 'week' ? getWeeklyDataForPeriod() : [];
  const maxWeeklyAmount = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.amount)) : 0;

  // Calcola le statistiche per categoria per il periodo selezionato
  const getCategoryStatsForPeriod = () => {
    const stats = [];
    Object.entries(periodStats.categoryBreakdown).forEach(
      ([categoryId, amount]) => {
        const category = categories.find((c) => c.id === parseInt(categoryId));
        if (category) {
          stats.push({
            category,
            amount,
            percentage: (amount / periodStats.totalExpenses) * 100,
          });
        }
      }
    );
    return stats.sort((a, b) => b.amount - a.amount);
  };

  const categoryStats = getCategoryStatsForPeriod();

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="stats-page"
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
          Statistiche e Analisi
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Visualizza i tuoi progressi finanziari
        </p>
      </motion.div>

      {/* NUOVO: Controlli di navigazione periodo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          margin: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Tabs per tipo di periodo */}
        <div
          style={{
            display: 'flex',
            backgroundColor: theme.background,
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '4px',
          }}
        >
          <button
            onClick={() => { 
              setSelectedPeriodType('month');
              setPeriodOffset(0);
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedPeriodType === 'month' ? theme.card : 'transparent',
              color: selectedPeriodType === 'month' ? theme.primary : theme.textSecondary,
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Mese
          </button>
          <button
            onClick={() => {
              setSelectedPeriodType('week');
              setPeriodOffset(0);
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedPeriodType === 'week' ? theme.card : 'transparent',
              color: selectedPeriodType === 'week' ? theme.primary : theme.textSecondary,
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Settimana
          </button>
        </div>
        
        {/* Navigazione periodo con label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.card,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPeriodOffset(periodOffset - 1)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: `${theme.primary}15`,
              color: theme.primary,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={24} />
          </motion.button>
          
          <div style={{ textAlign: 'center' }}>
            <motion.p
              key={periodDates.label}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.text,
              }}
            >
              {periodDates.label}
            </motion.p>
            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
              {selectedPeriodType === 'month' ? 'Mese' : 'Settimana'} {periodOffset === 0 ? 'corrente' : (periodOffset === -1 ? 'precedente' : (periodOffset < -1 ? Math.abs(periodOffset) + ' periodi fa' : ''))}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPeriodOffset(periodOffset + 1)}
            disabled={periodOffset >= 0}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: periodOffset >= 0 ? theme.border : `${theme.primary}15`,
              color: periodOffset >= 0 ? theme.textSecondary : theme.primary,
              cursor: periodOffset >= 0 ? 'not-allowed' : 'pointer',
              opacity: periodOffset >= 0 ? 0.5 : 1,
            }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </div>
      </motion.div>

      {/* Riepilogo del Periodo Selezionato */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px 24px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.text,
            marginBottom: '20px',
          }}
        >
          Riepilogo {selectedPeriodType === 'month' ? 'Mensile' : 'Settimanale'}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: `${theme.danger}15`,
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: theme.textSecondary,
                marginBottom: '8px',
              }}
            >
              SPESE TOTALI
            </p>
            <motion.p
              key={periodStats.totalExpenses}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: theme.danger,
              }}
            >
              € {periodStats.totalExpenses.toFixed(2)}
            </motion.p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: `${theme.secondary}15`,
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: theme.textSecondary,
                marginBottom: '8px',
              }}
            >
              ENTRATE EXTRA
            </p>
            <motion.p
              key={periodStats.totalIncome}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: theme.secondary,
              }}
            >
              € {periodStats.totalIncome.toFixed(2)}
            </motion.p>
          </motion.div>
        </div>

        {/* Spesa media */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: theme.background,
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                Spesa Media Giornaliera
              </p>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: theme.text,
                }}
              >
                € {periodStats.dailyAverageExpense.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                Media per Transazione
              </p>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: theme.text,
                }}
              >
                € {periodStats.averageExpense.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Grafico (solo quando è selezionata la settimana) */}
      {selectedPeriodType === 'week' && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          style={{
            margin: '0 16px 24px',
            padding: '24px',
            borderRadius: '24px',
            backgroundColor: theme.card,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h3
              style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}
            >
              Spese Giornaliere
            </h3>
            <BarChart3 size={20} style={{ color: theme.primary }} />
          </div>

          <div
            style={{
              height: '200px',
              position: 'relative',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              {weeklyData.map((day, index) => {
                const height =
                  maxWeeklyAmount > 0 ? (day.amount / maxWeeklyAmount) * 100 : 0;
                const isToday = 
                  new Date(day.date).toDateString() === new Date().toDateString() && 
                  periodOffset === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      width: 'calc((100% - 48px) / 7)',
                      backgroundColor: isToday
                        ? theme.primary
                        : `${theme.primary}60`,
                      borderRadius: '8px 8px 0 0',
                      position: 'relative',
                      cursor: 'pointer',
                      minHeight: '4px',
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: theme.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      €{day.amount.toFixed(0)}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {weeklyData.map((day, index) => {
              const isToday = 
                new Date(day.date).toDateString() === new Date().toDateString() && 
                periodOffset === 0;
              
              return (
                <div
                  key={index}
                  style={{
                    width: 'calc((100% - 48px) / 7)',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: isToday ? theme.primary : theme.textSecondary,
                    fontWeight: isToday ? '600' : '400',
                  }}
                >
                  {day.day}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Spese per Categoria */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px 24px',
          padding: '24px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}
          >
            Spese per Categoria
          </h3>
          <PieChart size={20} style={{ color: theme.primary }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${showAllCategories}-${periodOffset}-${selectedPeriodType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {categoryStats.length > 0 ? (
              categoryStats
                .slice(0, showAllCategories ? undefined : 5)
                .map((stat, index) => (
                  <motion.div
                    key={stat.category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory?.id === stat.category.id
                          ? null
                          : stat.category
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <motion.div
                          animate={{
                            scale:
                              selectedCategory?.id === stat.category.id ? 1.2 : 1,
                            backgroundColor:
                              selectedCategory?.id === stat.category.id
                                ? stat.category.color
                                : `${stat.category.color}20`,
                          }}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>
                            {stat.category.icon}
                          </span>
                        </motion.div>
                        <div>
                          <p style={{ fontWeight: '500', color: theme.text }}>
                            {stat.category.name}
                          </p>
                          <p
                            style={{
                              fontSize: '14px',
                              color: theme.textSecondary,
                            }}
                          >
                            {stat.percentage.toFixed(1)}% del totale
                          </p>
                        </div>
                      </div>
                      <p style={{ fontWeight: '600', color: theme.text }}>
                        € {stat.amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: theme.background,
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        style={{
                          height: '100%',
                          borderRadius: '3px',
                          backgroundColor: stat.category.color,
                        }}
                      />
                    </div>
                  </motion.div>
                ))
            ) : (
              <div
                style={{
                  padding: '40px 0',
                  textAlign: 'center',
                  color: theme.textSecondary,
                }}
              >
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ fontSize: '16px', marginBottom: '12px' }}
                >
                  😢
                </motion.p>
                <p>Nessuna spesa in questo periodo</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {categoryStats.length > 5 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAllCategories(!showAllCategories)}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: theme.background,
              color: theme.primary,
              fontWeight: '500',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {showAllCategories ? 'Mostra meno' : 'Vedi tutte le categorie'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StatsPage;

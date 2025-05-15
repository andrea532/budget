import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Trophy,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const StatsPage = () => {
  const {
    theme,
    categories,
    transactions,
    getMonthlyStats,
    getWeeklyComparison,
    streak,
    achievements,
    setAchievements,
    setCurrentView,
  } = useContext(AppContext);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const monthlyStats = getMonthlyStats();
  const weeklyComparison = getWeeklyComparison();

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

  // Calcola le statistiche per categoria
  const getCategoryStats = () => {
    const stats = [];
    Object.entries(monthlyStats.categoryBreakdown).forEach(
      ([categoryId, amount]) => {
        const category = categories.find((c) => c.id === parseInt(categoryId));
        if (category) {
          stats.push({
            category,
            amount,
            percentage: (amount / monthlyStats.totalExpenses) * 100,
          });
        }
      }
    );
    return stats.sort((a, b) => b.amount - a.amount);
  };

  const categoryStats = getCategoryStats();

  // Dati per il grafico settimanale
  const getWeeklyData = () => {
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayExpenses = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === 'expense' && tDate.toDateString() === date.toDateString()
          );
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

  const weeklyData = getWeeklyData();
  const maxWeeklyAmount = Math.max(...weeklyData.map((d) => d.amount));

  // Achievement non visti
  const unseenAchievements = achievements.filter((a) => !a.seen);

  useEffect(() => {
    if (unseenAchievements.length > 0) {
      const timer = setTimeout(() => {
        setAchievements((prev) => prev.map((a) => ({ ...a, seen: true })));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [unseenAchievements, setAchievements]);

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

      {/* Achievement Notifications */}
      <AnimatePresence>
        {unseenAchievements.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              margin: '0 16px 16px',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: `${theme.warning}20`,
              border: `1px solid ${theme.warning}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{
                x: [0, 100, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: '-100px',
                width: '100px',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${theme.warning}40, transparent)`,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trophy size={24} style={{ color: theme.warning }} />
              <div>
                <p style={{ fontWeight: '600', color: theme.text }}>
                  Nuovo Achievement!
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  {unseenAchievements[0].title}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riepilogo Mensile */}
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
          Riepilogo Mensile
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: theme.danger,
              }}
            >
              € {monthlyStats.totalExpenses.toFixed(2)}
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: theme.secondary,
              }}
            >
              € {monthlyStats.totalIncome.toFixed(2)}
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
                € {monthlyStats.dailyAverageExpense.toFixed(2)}
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
                € {monthlyStats.averageExpense.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trend settimanale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {weeklyComparison.percentageChange < 0 ? (
              <ArrowDown size={20} style={{ color: theme.secondary }} />
            ) : (
              <ArrowUp size={20} style={{ color: theme.danger }} />
            )}
            <span style={{ fontSize: '14px', color: theme.textSecondary }}>
              Rispetto alla settimana scorsa
            </span>
          </div>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontWeight: '600',
              color:
                weeklyComparison.percentageChange < 0
                  ? theme.secondary
                  : theme.danger,
            }}
          >
            {weeklyComparison.percentageChange > 0 ? '+' : ''}
            {weeklyComparison.percentageChange.toFixed(1)}%
          </motion.span>
        </div>
      </motion.div>

      {/* Grafico Settimanale */}
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
            Spese Settimanali
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
              const isToday = index === 6;

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
          {weeklyData.map((day, index) => (
            <div
              key={index}
              style={{
                width: 'calc((100% - 48px) / 7)',
                textAlign: 'center',
                fontSize: '12px',
                color: index === 6 ? theme.primary : theme.textSecondary,
                fontWeight: index === 6 ? '600' : '400',
              }}
            >
              {day.day}
            </div>
          ))}
        </div>
      </motion.div>

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
            key={showAllCategories ? 'all' : 'limited'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {categoryStats
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
              ))}
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

      {/* Achievements e Streak */}
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
            Progressi e Achievements
          </h3>
          <Trophy size={20} style={{ color: theme.warning }} />
        </div>

        {/* Streak Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
            marginBottom: '20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated background */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }}
          />

          <Calendar
            size={32}
            style={{ color: 'white', margin: '0 auto 12px' }}
          />
          <p style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>
            Streak Attuale
          </p>
          <motion.p
            key={streak}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              color: 'white',
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '8px',
            }}
          >
            {streak}
          </motion.p>
          <p style={{ color: 'white', fontSize: '14px', opacity: 0.9 }}>
            giorni consecutivi sotto budget
          </p>
        </motion.div>

        {/* Recent Achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {achievements
            .slice(-3)
            .reverse()
            .map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: theme.background,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.warning}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={20} style={{ color: theme.warning }} />
                </div>
                <div>
                  <p style={{ fontWeight: '500', color: theme.text }}>
                    {achievement.title}
                  </p>
                  <p style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {new Date(achievement.date).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>

        {achievements.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              fontSize: '14px',
              color: theme.textSecondary,
              padding: '32px 0',
            }}
          >
            Completa obiettivi per sbloccare achievements!
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StatsPage;

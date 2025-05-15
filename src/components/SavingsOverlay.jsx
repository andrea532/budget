import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  YAxis,
  Tooltip,
} from 'recharts';

const SavingsOverlay = ({ isOpen, onClose }) => {
  const { theme, savingsHistory, totalSavings } = useContext(AppContext);

  // Prepara i dati per il grafico
  const chartData = savingsHistory.map((entry, index) => ({
    index,
    savings: entry.total,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${theme.primary} 0%, #5A85FF 100%)`,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pulsante chiusura */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            <X size={24} color="white" />
          </motion.button>

          {/* Importo totale */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                marginBottom: '12px',
                fontWeight: '500',
              }}
            >
              HAI RISPARMIATO
            </motion.p>
            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
              style={{
                fontSize: '56px',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              € {totalSavings.toFixed(2)}
            </motion.h1>
          </motion.div>

          {/* Grafico animato */}
          {savingsHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                width: '90%',
                maxWidth: '400px',
                height: '300px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <YAxis hide={true} domain={['dataMin', 'dataMax']} />
                  <Tooltip 
                    formatter={(value) => [`€ ${value.toFixed(2)}`, 'Totale']}
                    labelFormatter={() => ''}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '2px solid rgba(76, 111, 255, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      color: '#1A2151',
                      fontWeight: '600',
                      padding: '12px 16px',
                    }}
                    itemStyle={{
                      color: '#4C6FFF',
                      fontWeight: '700',
                      fontSize: '16px',
                    }}
                    labelStyle={{
                      color: '#757F8C',
                      fontWeight: '500',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="rgba(255, 255, 255, 0.8)"
                    fillOpacity={1}
                    fill="url(#colorGradient)"
                    strokeWidth={3}
                    animationDuration={2000}
                    animationBegin={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Messaggio motivazionale */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '40px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Continua così! Il tuo futuro ti ringrazierà 🚀
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SavingsOverlay;
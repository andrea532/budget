import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ theme }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme?.background || '#121218',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          backgroundColor: theme?.primary || '#4C6FFF',
          marginBottom: '24px'
        }}
      />
      <motion.h2
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          color: theme?.text || '#FFFFFF',
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '16px'
        }}
      >
        Budget App
      </motion.h2>
      <p style={{ color: theme?.textSecondary || '#A0A3BD' }}>
        Caricamento in corso...
      </p>
    </div>
  );
};

export default LoadingScreen;
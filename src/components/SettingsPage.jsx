import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Globe,
  Key,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wallet,
  PiggyBank,
  Calculator,
  Shield,
  Info,
  Smartphone,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const SettingsPage = () => {
  const { theme, userSettings, setUserSettings, setCurrentView } =
    useContext(AppContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const toggleDarkMode = () => {
    setUserSettings((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const toggleNotifications = () => {
    setUserSettings((prev) => ({
      ...prev,
      notifications: !prev.notifications,
    }));
  };

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    action,
    toggle = false,
    toggleValue = false,
    color = theme.primary,
  }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, x: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={action}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderRadius: '16px',
        backgroundColor: theme.background,
        border: `1px solid ${theme.border}`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hover effect background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 2, opacity: 0.1 }}
        style={{
          position: 'absolute',
          left: '40px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color }} />
        </motion.div>
        <div>
          <p style={{ fontWeight: '500', color: theme.text }}>{title}</p>
          <p style={{ fontSize: '14px', color: theme.textSecondary }}>
            {description}
          </p>
        </div>
      </div>

      {toggle ? (
        <motion.div
          initial={false}
          animate={{ backgroundColor: toggleValue ? color : theme.border }}
          style={{
            width: '48px',
            height: '28px',
            borderRadius: '14px',
            padding: '4px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              x: toggleValue ? 20 : 0,
              backgroundColor: toggleValue ? 'white' : '#f1f1f1',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '10px',
            }}
          />
        </motion.div>
      ) : (
        <ChevronRight size={20} style={{ color: theme.textSecondary }} />
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="settings-page"
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
          Impostazioni
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '4px',
          }}
        >
          Personalizza la tua esperienza
        </p>
      </motion.div>

      {/* Account e Preferenze */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px 24px',
          padding: '20px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <motion.h3
          variants={itemVariants}
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.text,
            marginBottom: '16px',
          }}
        >
          Account e Preferenze
        </motion.h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SettingItem
            icon={userSettings.darkMode ? Moon : Sun}
            title="Tema"
            description={
              userSettings.darkMode ? 'Tema scuro attivo' : 'Tema chiaro attivo'
            }
            action={toggleDarkMode}
            toggle={true}
            toggleValue={userSettings.darkMode}
            color="#6366F1"
          />

          <SettingItem
            icon={Bell}
            title="Notifiche"
            description={
              userSettings.notifications
                ? 'Notifiche attive'
                : 'Notifiche disattivate'
            }
            action={toggleNotifications}
            toggle={true}
            toggleValue={userSettings.notifications}
            color="#F59E0B"
          />

          <SettingItem
            icon={Globe}
            title="Lingua"
            description="Italiano"
            action={() => {}}
            color="#10B981"
          />

          <SettingItem
            icon={Key}
            title="Privacy e Sicurezza"
            description="Gestisci PIN e backup"
            action={() => {}}
            color="#EF4444"
          />
        </div>
      </motion.div>

      {/* Configurazione Budget */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px 24px',
          padding: '20px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <motion.h3
          variants={itemVariants}
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.text,
            marginBottom: '16px',
          }}
        >
          Configurazione Budget
        </motion.h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('income')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: `${theme.secondary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={20} style={{ color: theme.secondary }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>Entrate</p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Modifica le tue entrate mensili
                </p>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: theme.textSecondary }} />
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('expenses')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: `${theme.danger}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calculator size={20} style={{ color: theme.danger }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>
                  Spese Fisse
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Gestisci le spese ricorrenti
                </p>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: theme.textSecondary }} />
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('savings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: `${theme.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PiggyBank size={20} style={{ color: theme.primary }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>Risparmi</p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Configura i tuoi obiettivi
                </p>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: theme.textSecondary }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Supporto e Info */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 16px 24px',
          padding: '20px',
          borderRadius: '24px',
          backgroundColor: theme.card,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <motion.h3
          variants={itemVariants}
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.text,
            marginBottom: '16px',
          }}
        >
          Supporto e Informazioni
        </motion.h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SettingItem
            icon={HelpCircle}
            title="Guide e Tutorial"
            description="Impara a usare l'app"
            action={() => {}}
            color="#8B5CF6"
          />

          <motion.div
            variants={itemVariants}
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: `${theme.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Info size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>
                  Versione App
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  1.0.0
                </p>
              </div>
            </div>
          </motion.div>

          <SettingItem
            icon={Shield}
            title="Privacy Policy"
            description="Leggi la nostra privacy policy"
            action={() => {}}
            color="#059669"
          />

          <SettingItem
            icon={Smartphone}
            title="Info sul dispositivo"
            description="Dettagli tecnici"
            action={() => {}}
            color="#3B82F6"
          />
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{ margin: '24px 16px', position: 'relative' }}
      >
        <AnimatePresence>
          {showLogoutConfirm ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: theme.card,
                borderRadius: '16px',
                padding: '20px',
                zIndex: 10,
                border: `1px solid ${theme.border}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: theme.text,
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                Sei sicuro di voler uscire?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
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
                  Esci
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
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
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: `${theme.danger}15`,
                color: theme.danger,
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogOut size={20} />
              Esci
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Developer Credits */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '32px 16px 16px',
          textAlign: 'center',
        }}
      >
        <motion.p
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ fontSize: '12px', color: theme.textSecondary }}
        >
          Sviluppato con ❤️ per aiutarti a gestire le tue finanze
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;

import React, { useContext, useState, useEffect } from 'react';
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
  Palette,
  Check,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const SettingsPage = () => {
  const { theme, userSettings, setUserSettings, setCurrentView, updateThemeColors, activeTheme } =
    useContext(AppContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Opzioni di tema disponibili con colori di sfondo personalizzati
  const themeOptions = [
    // Temi disponibili
    { 
      id: 'blue', 
      name: 'Blu Classico', 
      primary: '#4C6FFF', 
      secondary: '#2ECC71',
      danger: '#FF5252',
      warning: '#FFB74D',
      background: '#ECF1FF', // Sfondo blu chiaro
      card: '#FFFFFF',
      darkBackground: '#1A1B21',
      darkCard: '#25262E',
    },
    { 
      id: 'forest', 
      name: 'Verde Foresta', 
      primary: '#2E7D32', 
      secondary: '#388E3C',
      danger: '#D32F2F',
      warning: '#FFB74D',
      background: '#EDFBEF', // Sfondo verde chiaro
      card: '#FFFFFF',
      darkBackground: '#1A2017',
      darkCard: '#252E25',
    },
    { 
      id: 'dark', 
      name: 'Grigio Scuro', 
      primary: '#455A64', 
      secondary: '#607D8B',
      danger: '#F44336',
      warning: '#FFB74D',
      background: '#ECEFF1', // Sfondo grigio chiaro
      card: '#FFFFFF',
      darkBackground: '#1A1A1D',
      darkCard: '#282831',
    },
    { 
      id: 'purple', 
      name: 'Viola', 
      primary: '#9C27B0', 
      secondary: '#E91E63',
      danger: '#FF5252',
      warning: '#FFB74D',
      background: '#F3E5F5', // Sfondo viola chiaro
      card: '#FFFFFF',
      darkBackground: '#22162B',
      darkCard: '#341C42',
    },
    { 
      id: 'pink', 
      name: 'Rosa', 
      primary: '#E91E63', 
      secondary: '#FF4081',
      danger: '#FF5252',
      warning: '#FFB74D',
      background: '#FCE4EC', // Sfondo rosa chiaro
      card: '#FFFFFF',
      darkBackground: '#2A151E',
      darkCard: '#3D1F2D',
    },
    { 
      id: 'teal', 
      name: 'Turchese', 
      primary: '#009688', 
      secondary: '#26A69A',
      danger: '#F44336',
      warning: '#FFB74D',
      background: '#E0F2F1', // Sfondo turchese chiaro
      card: '#FFFFFF',
      darkBackground: '#0F2A29',
      darkCard: '#1A3D3A',
    },
  ];

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

  // Trova il tema corrente
  const getCurrentTheme = () => {
    if (!userSettings.themeId) {
      return userSettings.darkMode ? 'Tema scuro' : 'Tema chiaro';
    }
    
    const currentTheme = themeOptions.find(t => t.id === userSettings.themeId);
    return currentTheme ? currentTheme.name : 'Personalizzato';
  };

  // Cambia tema
  const setTheme = (themeId) => {
    // Aggiorniamo le impostazioni utente
    setUserSettings(prev => ({
      ...prev,
      themeId: themeId,
      // Manteniamo la darkMode separata per retrocompatibilità
      darkMode: prev.darkMode
    }));
    
    // Aggiorniamo i colori del tema direttamente
    updateThemeColors(themeId);
    
    setShowThemeSelector(false);
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
          {/* Selezione Tema */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowThemeSelector(true)}
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
                  backgroundColor: `${theme.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palette size={20} style={{ color: theme.primary }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>Tema</p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  {getCurrentTheme()}
                </p>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: theme.textSecondary }} />
          </motion.div>

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

      {/* Selettore Tema (Overlay) */}
      <AnimatePresence>
        {showThemeSelector && (
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
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.card,
                borderRadius: '24px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              }}
            >
              <h3 
                style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: theme.text,
                  textAlign: 'center',
                  marginBottom: '24px' 
                }}
              >
                Scegli il tuo tema
              </h3>

              {/* Temi disponibili */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(1, 1fr)',
                  gap: '16px',
                  marginBottom: '24px'
                }}
              >
                {themeOptions.map(themeOption => (
                  <motion.div
                    key={themeOption.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTheme(themeOption.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: userSettings.darkMode ? themeOption.darkBackground : themeOption.background,
                      border: userSettings.themeId === themeOption.id ? `2px solid ${themeOption.primary}` : '1px solid #eaeaea',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Indicatore di selezione */}
                    {userSettings.themeId === themeOption.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: themeOption.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                      >
                        <Check size={16} color="white" />
                      </motion.div>
                    )}
                    
                    {/* Nome del tema */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: themeOption.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Palette size={20} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', color: userSettings.darkMode ? '#fff' : '#333' }}>{themeOption.name}</p>
                        <p style={{ fontSize: '12px', color: userSettings.darkMode ? '#ccc' : '#666' }}>Tema personalizzato</p>
                      </div>
                    </div>
                    
                    {/* Anteprima del tema */}
                    <div
                      style={{
                        backgroundColor: userSettings.darkMode ? themeOption.darkCard : themeOption.card,
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* Budget entrate/uscite */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '48%',
                            padding: '10px',
                            backgroundColor: `${themeOption.danger}15`,
                            borderRadius: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ fontSize: '10px', color: userSettings.darkMode ? '#ccc' : '#666' }}>SPESE</p>
                          <p style={{ fontWeight: '600', color: themeOption.danger }}>€ 25,00</p>
                        </div>
                        <div
                          style={{
                            width: '48%',
                            padding: '10px',
                            backgroundColor: `${themeOption.secondary}15`,
                            borderRadius: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ fontSize: '10px', color: userSettings.darkMode ? '#ccc' : '#666' }}>ENTRATE</p>
                          <p style={{ fontWeight: '600', color: themeOption.secondary }}>€ 100,00</p>
                        </div>
                      </div>
                      
                      {/* Budget disponibile */}
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          backgroundColor: `${themeOption.primary}15`,
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ fontSize: '10px', color: userSettings.darkMode ? '#ccc' : '#666' }}>DISPONIBILE</p>
                        <p style={{ fontWeight: '600', color: themeOption.primary }}>€ 75,00</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Alternanza Modalità Chiaro/Scuro */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px 0',
                  borderTop: `1px solid ${theme.border}`,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleDarkMode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: theme.background,
                    borderRadius: '12px',
                    padding: '10px 16px',
                    border: 'none',
                    color: theme.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  {userSettings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  {userSettings.darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
                </motion.button>
              </div>
              
              {/* Pulsante Chiudi */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowThemeSelector(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '16px',
                }}
              >
                Chiudi
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resto del contenuto della pagina */}
      {/* ... */}
      
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

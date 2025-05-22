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
  RefreshCw,
  AlertTriangle,
  Database,
  Download,
  Upload,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { getBackupInfo, createManualBackup, isPWA } from '../services/db';

const SettingsPage = () => {
  const { 
    theme, 
    userSettings, 
    setUserSettings, 
    setCurrentView, 
    updateThemeColors, 
    activeTheme, 
    resetApp,
    backupStatus,
    setBackupStatus,
    createAutoBackup,
    verifyDataIntegrity
  } = useContext(AppContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmationStep, setResetConfirmationStep] = useState(1);
  
  // Stati per gestione backup
  const [backupInfo, setBackupInfo] = useState({ exists: false });
  const [showBackupDetails, setShowBackupDetails] = useState(false);
  const [backupOperationStatus, setBackupOperationStatus] = useState('');

  // Carica informazioni backup all'avvio
  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = () => {
    try {
      const info = getBackupInfo();
      setBackupInfo(info);
      console.log("✅ Informazioni backup caricate:", info);
    } catch (error) {
      console.error("❌ Errore caricamento info backup:", error);
    }
  };

  // Crea backup manuale
  const handleCreateBackup = async () => {
    setBackupOperationStatus('creating');
    try {
      console.log("🔄 Creazione backup manuale...");
      const backup = await createManualBackup();
      
      if (backup) {
        setBackupOperationStatus('success');
        loadBackupInfo(); // Ricarica le informazioni
        
        // Aggiorna anche lo stato del context
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: new Date().toISOString()
        }));
        
        setTimeout(() => setBackupOperationStatus(''), 3000);
        console.log("✅ Backup creato con successo");
      } else {
        throw new Error('Backup non creato');
      }
    } catch (error) {
      console.error("❌ Errore nella creazione del backup:", error);
      setBackupOperationStatus('error');
      setTimeout(() => setBackupOperationStatus(''), 3000);
    }
  };

  // Verifica integrità dati
  const handleVerifyData = async () => {
    setBackupOperationStatus('verifying');
    try {
      const result = await verifyDataIntegrity();
      if (result) {
        setBackupOperationStatus('verified');
        console.log("✅ Dati verificati");
      } else {
        setBackupOperationStatus('error');
        console.log("❌ Errore verifica dati");
      }
      setTimeout(() => setBackupOperationStatus(''), 3000);
    } catch (error) {
      console.error("❌ Errore nella verifica dati:", error);
      setBackupOperationStatus('error');
      setTimeout(() => setBackupOperationStatus(''), 3000);
    }
  };

  // Toggle backup automatico
  const toggleAutoBackup = () => {
    const newValue = !backupStatus.autoBackupEnabled;
    setBackupStatus(prev => ({
      ...prev,
      autoBackupEnabled: newValue
    }));
    
    setUserSettings(prev => ({
      ...prev,
      autoBackupEnabled: newValue
    }));
    
    console.log(newValue ? "✅ Backup automatico attivato" : "❌ Backup automatico disattivato");
  };

  // Opzioni di tema disponibili
  const themeOptions = [
    { 
      id: 'blue', 
      name: 'Blu Classico', 
      primary: '#4C6FFF', 
      secondary: '#2ECC71',
      danger: '#FF5252',
      warning: '#FFB74D',
      background: '#ECF1FF',
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
      background: '#EDFBEF',
      card: '#FFFFFF',
      darkBackground: '#1A2017',
      darkCard: '#252E25',
    },
    { 
      id: 'purple', 
      name: 'Viola', 
      primary: '#9C27B0', 
      secondary: '#E91E63',
      danger: '#FF5252',
      warning: '#FFB74D',
      background: '#F3E5F5',
      card: '#FFFFFF',
      darkBackground: '#22162B',
      darkCard: '#341C42',
    }
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

  const getCurrentTheme = () => {
    if (!userSettings.themeId) {
      return userSettings.darkMode ? 'Tema scuro' : 'Tema chiaro';
    }
    
    const currentTheme = themeOptions.find(t => t.id === userSettings.themeId);
    return currentTheme ? currentTheme.name : 'Personalizzato';
  };

  const setTheme = (themeId) => {
    setUserSettings(prev => ({
      ...prev,
      themeId: themeId,
      darkMode: prev.darkMode
    }));
    
    updateThemeColors(themeId);
    setShowThemeSelector(false);
    console.log(`✅ Tema cambiato a: ${themeId}`);
  };

  const toggleDarkMode = () => {
    setUserSettings((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
    console.log(`✅ Modalità scura: ${!userSettings.darkMode ? 'attivata' : 'disattivata'}`);
  };

  const toggleNotifications = () => {
    setUserSettings((prev) => ({
      ...prev,
      notifications: !prev.notifications,
    }));
    console.log(`✅ Notifiche: ${!userSettings.notifications ? 'attivate' : 'disattivate'}`);
  };

  const handleResetApp = () => {
    if (resetConfirmationStep === 1) {
      setResetConfirmationStep(2);
    } else {
      console.log("🔄 Reset dell'app in corso...");
      resetApp();
      setShowResetConfirm(false);
      setResetConfirmationStep(1);
    }
  };

  // Componente per lo status delle operazioni di backup
  const BackupOperationStatus = () => {
    if (!backupOperationStatus) return null;

    const statusConfig = {
      creating: { icon: RefreshCw, color: theme.primary, text: "Creazione backup...", spin: true },
      success: { icon: CheckCircle, color: theme.secondary, text: "Backup creato con successo!" },
      error: { icon: XCircle, color: theme.danger, text: "Errore nell'operazione" },
      verifying: { icon: RefreshCw, color: theme.primary, text: "Verifica in corso...", spin: true },
      verified: { icon: CheckCircle, color: theme.secondary, text: "Dati verificati correttamente" }
    };

    const config = statusConfig[backupOperationStatus];
    const Icon = config?.icon || Info;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: theme.card,
          color: config?.color || theme.text,
          padding: '12px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          border: `1px solid ${config?.color || theme.border}`,
        }}
      >
        <motion.div
          animate={config?.spin ? { rotate: 360 } : {}}
          transition={config?.spin ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Icon size={20} />
        </motion.div>
        <span style={{ fontWeight: '500' }}>{config?.text}</span>
      </motion.div>
    );
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
      {/* Status operazioni backup */}
      <AnimatePresence>
        <BackupOperationStatus />
      </AnimatePresence>

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

      {/* Sezione Backup e Sicurezza Dati - SOLO SE PWA */}
      {isPWA() && (
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Database size={20} style={{ color: theme.primary }} />
            Backup e Sicurezza Dati
          </motion.h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Stato del backup */}
            <motion.div
              variants={itemVariants}
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: backupInfo.exists ? `${theme.secondary}15` : `${theme.warning}15`,
                border: `1px solid ${backupInfo.exists ? `${theme.secondary}30` : `${theme.warning}30`}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {backupInfo.exists ? (
                  <CheckCircle size={20} style={{ color: theme.secondary }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: theme.warning }} />
                )}
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>
                  {backupInfo.exists ? 'Backup Disponibile' : 'Nessun Backup'}
                </h4>
              </div>
              
              {backupInfo.exists ? (
                <div>
                  <p style={{ fontSize: '14px', color: theme.text, marginBottom: '4px' }}>
                    Ultimo backup: {backupInfo.timestamp ? new Date(backupInfo.timestamp).toLocaleString('it-IT') : 'N/D'}
                  </p>
                  <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                    {backupInfo.totalItems} elementi salvati
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowBackupDetails(!showBackupDetails)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: theme.primary,
                      border: `1px solid ${theme.primary}`,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {showBackupDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
                  </motion.button>
                  
                  <AnimatePresence>
                    {showBackupDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: '12px' }}
                      >
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: theme.background, 
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: theme.textSecondary
                        }}>
                          {backupInfo.itemCounts && Object.entries(backupInfo.itemCounts).map(([store, count]) => (
                            <div key={store} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>{store}:</span>
                              <span>{count} elementi</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: theme.text }}>
                  Ti consigliamo di creare un backup per proteggere i tuoi dati.
                </p>
              )}
            </motion.div>

            {/* Backup automatico toggle */}
            <SettingItem
              icon={RefreshCw}
              title="Backup Automatico"
              description={
                backupStatus.autoBackupEnabled
                  ? 'Backup automatici attivi'
                  : 'Backup automatici disattivati'
              }
              action={toggleAutoBackup}
              toggle={true}
              toggleValue={backupStatus.autoBackupEnabled}
              color="#10B981"
            />

            {/* Azioni backup */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateBackup}
                disabled={backupOperationStatus === 'creating'}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: backupOperationStatus === 'creating' ? 'not-allowed' : 'pointer',
                  opacity: backupOperationStatus === 'creating' ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={16} />
                {backupOperationStatus === 'creating' ? 'Creando...' : 'Crea Backup'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerifyData}
                disabled={backupOperationStatus === 'verifying'}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: backupOperationStatus === 'verifying' ? 'not-allowed' : 'pointer',
                  opacity: backupOperationStatus === 'verifying' ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={16} />
                {backupOperationStatus === 'verifying' ? 'Verificando...' : 'Verifica Dati'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

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
                <Palette size={20) style={{ color: theme.primary }} />
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

      {/* Selettore Tema */}
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
                    
                    <div
                      style={{
                        backgroundColor: userSettings.darkMode ? themeOption.darkCard : themeOption.card,
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}
                    >
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

      {/* Gestione dati */}
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
          Gestione dati
        </motion.h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResetConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: `${theme.danger}10`,
              border: `1px solid ${theme.danger}30`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
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
                backgroundColor: theme.danger,
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
                  backgroundColor: `${theme.danger}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw size={20} style={{ color: theme.danger }} />
              </motion.div>
              <div>
                <p style={{ fontWeight: '500', color: theme.text }}>Azzera dati</p>
                <p style={{ fontSize: '14px', color: theme.textSecondary }}>
                  Ricomincia da zero
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
                  2.0.0 {isPWA() ? '(PWA)' : '(Web)'} - LocalStorage
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
                    console.log("🔄 Logout...");
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

      {/* Modale di conferma reset */}
      <AnimatePresence>
        {showResetConfirm && (
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
            onClick={() => {
              setShowResetConfirm(false);
              setResetConfirmationStep(1);
            }}
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
                maxWidth: '340px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.danger}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={30} color={theme.danger} />
                </motion.div>
              </div>

              <h3 
                style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: theme.text,
                  textAlign: 'center',
                  marginBottom: '16px' 
                }}
              >
                {resetConfirmationStep === 1 
                  ? 'Azzerare tutti i dati?' 
                  : 'Sei davvero sicuro?'}
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                {resetConfirmationStep === 1 
                  ? 'Questa operazione eliminerà tutti i tuoi dati e riporterà l\'app allo stato iniziale. Tutti i budget, le transazioni e le impostazioni andranno persi.'
                  : 'Tutti i tuoi dati verranno eliminati definitivamente. Questa azione non può essere annullata.'}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetApp}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: theme.danger,
                    color: 'white',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={18} />
                  {resetConfirmationStep === 1 
                    ? 'Sì, voglio azzerare i dati' 
                    : 'Sì, sono sicuro'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmationStep(1);
                  }}
                  style={{
                    padding: '14px',
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
          Budget App PWA - Versione 2.0 ✅
        </motion.p>
        {isPWA() && (
          <p style={{ fontSize: '10px', color: theme.textSecondary, marginTop: '4px' }}>
            PWA • Dati salvati localmente • Backup disponibile
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;

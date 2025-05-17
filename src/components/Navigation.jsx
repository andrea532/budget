import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Home, Calendar, Receipt, BarChart3, Settings } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Navigation = () => {
  const { currentView, setCurrentView, theme } = useContext(AppContext);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'history', icon: Calendar, label: 'Spese' },
    { id: 'future-expenses', icon: Receipt, label: 'Future' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'settings', icon: Settings, label: 'Altro' },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="navigation safe-area-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme?.card || '#FFFFFF',
        borderTop: `1px solid ${theme?.border || '#E3E8F1'}`,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 0',
          maxWidth: '428px',
          margin: '0 auto',
        }}
      >
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentView(item.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                currentView === item.id ? theme?.primary : theme?.textSecondary,
              transition: 'all 0.3s ease',
            }}
          >
            {currentView === item.id && (
              <motion.div
                layoutId="nav-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '4px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: theme?.primary,
                }}
              />
            )}
            <motion.div
              animate={{
                scale: currentView === item.id ? 1.15 : 1,
                color:
                  currentView === item.id
                    ? theme?.primary
                    : theme?.textSecondary,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <item.icon size={28} />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
};

export default Navigation;

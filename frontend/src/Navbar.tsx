import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, CreditCard, RefreshCw, 
  Crown, Users, Star, AlertTriangle, 
  ShieldAlert, LogOut, ChevronRight,
  Moon, Sun, Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Ensure this path matches your config

const Navbar = ({ isDriverMode, setIsDriverMode }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out of StateRide?");
    
    if (confirmLogout) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear local storage & Redirect
        localStorage.clear();
        navigate('/login');
        setIsOpen(false);
      } catch (error: any) {
        console.error("Logout Error:", error.message);
        alert("Logout failed. Please try again.");
      }
    }
  };

  return (
    <header style={headerStyle}>
      {/* 1. LOGO */}
      <div style={logoContainerStyle}>
        <div style={logoIconStyle}>
          <Car size={24} strokeWidth={2.5} />
        </div>
        <span className="logo-text" style={{ fontWeight: '800', fontSize: '20px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
          State<span style={{ color: '#2563eb' }}>Ride</span>
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        {/* 2. PFP TRIGGER */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          style={pfpButtonStyle}
        >
          <User size={22} color="white" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* BACKDROP TO CLOSE MENU */}
              <div style={backdropStyle} onClick={() => setIsOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="menu-card"
                style={menuCardStyle}
              >
                {/* Profile Header */}
                <div 
                  className="menu-header"
                  style={menuHeaderStyle} 
                  onClick={() => navigate('/profile')}
                >
                   <div style={largePfpStyle}><User size={24} color="#2563eb"/></div>
                   <div style={{ flex: 1 }}>
                     <div className="text-main" style={{ fontWeight: '700', fontSize: '15px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
                        Bilir Goyari
                     </div>
                     <div className="text-secondary" style={{ fontSize: '11px', color: '#64748b' }}>
                        Account Settings
                     </div>
                   </div>
                   <ChevronRight size={16} color="#cbd5e1" />
                </div>

                <div style={listStyle}>
                  <MenuButton icon={<Trophy size={18}/>} label="Leaderboard" isDark={isDarkMode} />
                  <MenuButton icon={<CreditCard size={18}/>} label="Payments" isDark={isDarkMode} />
                  
                  <MenuButton 
                    icon={<RefreshCw size={18} color="#2563eb"/>} 
                    label={isDriverMode ? "Switch to Rider" : "Switch to Driver"} 
                    isDark={isDarkMode}
                    onClick={() => { setIsDriverMode(!isDriverMode); setIsOpen(false); }}
                  />

                  {/* 4. DARK MODE TOGGLE */}
                  <div style={toggleItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isDarkMode ? <Moon size={18} color="#f8fafc"/> : <Sun size={18} color="#334155"/>}
                      <span className="text-main" style={{ color: isDarkMode ? '#ffffff' : '#334155', fontSize: '14px', fontWeight: '500' }}>
                        Dark Mode
                      </span>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      style={toggleSwitchStyle(isDarkMode)}
                    >
                      <motion.div 
                        animate={{ x: isDarkMode ? 18 : 2 }}
                        style={toggleCircleStyle} 
                      />
                    </button>
                  </div>

                  <MenuButton icon={<Crown size={18} color="#eab308"/>} label="Buy Pro" isDark={isDarkMode} />
                  <MenuButton icon={<Users size={18}/>} label="Refer a Friend" isDark={isDarkMode} />
                  <MenuButton icon={<Star size={18}/>} label="Rate the App" isDark={isDarkMode} />
                  <MenuButton icon={<AlertTriangle size={18}/>} label="Report an Issue" isDark={isDarkMode} />
                  <MenuButton icon={<ShieldAlert size={18} color="#ef4444"/>} label="SOS / Safety" isDark={isDarkMode} />
                  
                  {/* LOGOUT BUTTON */}
                  <MenuButton 
                    icon={<LogOut size={18} color={isDarkMode ? "#f87171" : "#ef4444"} />} 
                    label="Log Out" 
                    isDark={isDarkMode}
                    isDestructive={true}
                    onClick={handleLogout} 
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

/* --- SHARED COMPONENTS --- */
const MenuButton = ({ icon, label, onClick, isDark, isDestructive }: any) => {
  const getTextColor = () => {
    if (isDestructive) return isDark ? '#f87171' : '#ef4444';
    return isDark ? '#ffffff' : '#334155';
  };

  return (
    <button 
      onClick={onClick} 
      className="menu-btn" 
      style={{...menuBtnStyle, color: getTextColor()}}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon} <span>{label}</span>
      </span>
    </button>
  );
};

/* --- STYLES --- */
const headerStyle: React.CSSProperties = {
  position: 'absolute', top: 0, width: '100%',
  padding: '20px 40px', 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
  boxSizing: 'border-box'
};

const logoContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };

const logoIconStyle: React.CSSProperties = {
  backgroundColor: '#2563eb', color: 'white', padding: '8px', borderRadius: '10px',
  display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
};

const pfpButtonStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0f172a',
  border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const menuCardStyle: React.CSSProperties = {
  position: 'absolute', top: '55px', right: '0px', width: '260px',
  backgroundColor: 'white', borderRadius: '20px', padding: '12px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 1001
};

const menuHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
  cursor: 'pointer', backgroundColor: '#f8fafc', borderRadius: '14px', marginBottom: '8px'
};

const largePfpStyle: React.CSSProperties = {
  width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff',
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };

const menuBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '12px', border: 'none', background: 'transparent',
  borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
  fontSize: '14px', fontWeight: '500'
};

const toggleItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px', fontSize: '14px', fontWeight: '500'
};

const toggleSwitchStyle = (isOn: boolean): React.CSSProperties => ({
  width: '36px', height: '20px', borderRadius: '20px',
  backgroundColor: isOn ? '#2563eb' : '#cbd5e1',
  border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center',
  transition: 'background-color 0.3s ease'
});

const toggleCircleStyle: React.CSSProperties = {
  width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'absolute'
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000
};

export default Navbar;
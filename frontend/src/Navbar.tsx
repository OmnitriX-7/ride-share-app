import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, CreditCard, RefreshCw, 
  Crown, Users, Star, AlertTriangle, 
  ShieldAlert, LogOut, ChevronRight,
  Moon, Sun, Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

const Navbar = ({ isDriverMode, setIsDriverMode }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  // Sync internal state with document class on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const handleReferral = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to refer friends!");
        return;
      }

      const referralLink = `${window.location.origin}/auth?ref=${user.id}`;
      const shareData = {
        title: 'Join CampusRide',
        text: 'Use my link to join CampusRide and we both get ride discounts!',
        url: referralLink,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(referralLink);
        alert("Referral link copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <header style={headerStyle}>
      <div style={logoContainerStyle}>
        <div style={logoIconStyle}><Car size={24} strokeWidth={2.5} /></div>
        <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-main)' }}>
          Campus<span style={{ color: '#2563eb' }}>Ride</span>
        </span>
      </div>

      <div style={{ position: 'relative' }}>
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
              <div style={backdropStyle} onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={menuCardStyle}
              >
                <div 
                  style={menuHeaderStyle} 
                  onClick={() => navigate('/profile')}
                >
                   <div style={largePfpStyle}><User size={24} color="#2563eb"/></div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Bilir Goyari</div>
                     <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Account Settings</div>
                   </div>
                   <ChevronRight size={16} color="#cbd5e1" />
                </div>

                <div style={listStyle}>
                  <MenuButton icon={<Trophy size={18}/>} label="Leaderboard" />
                  <MenuButton icon={<CreditCard size={18}/>} label="Payments" />
                  
                  <MenuButton 
                    icon={<RefreshCw size={18} color="#2563eb"/>} 
                    label={isDriverMode ? "Switch to Rider" : "Switch to Driver"} 
                    onClick={() => { setIsDriverMode(!isDriverMode); setIsOpen(false); }}
                  />

                  {/* Dark Mode Toggle */}
                  <div style={toggleItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isDarkMode ? <Moon size={18} color="var(--text-main)"/> : <Sun size={18} color="var(--text-main)"/>}
                      <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>Dark Mode</span>
                    </div>
                    <button onClick={toggleDarkMode} style={toggleSwitchStyle(isDarkMode)}>
                      <motion.div animate={{ x: isDarkMode ? 18 : 2 }} style={toggleCircleStyle} />
                    </button>
                  </div>

                  <MenuButton icon={<Crown size={18} color="#eab308"/>} label="Buy Pro" />
                  
                  <MenuButton 
                    icon={<Users size={18} color="#2563eb"/>} 
                    label="Refer a Friend" 
                    onClick={handleReferral}
                  />

                  <MenuButton icon={<Star size={18}/>} label="Rate the App" />
                  <MenuButton icon={<AlertTriangle size={18}/>} label="Report an Issue" />
                  <MenuButton icon={<ShieldAlert size={18} color="#ef4444"/>} label="SOS / Safety" />
                  
                  <MenuButton 
                    icon={<LogOut size={18} color="#ef4444" />} 
                    label="Log Out" 
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
const MenuButton = ({ icon, label, onClick, isDestructive }: any) => {
  return (
    <button 
      onClick={onClick} 
      style={{
        ...menuBtnStyle, 
        color: isDestructive ? '#ef4444' : 'var(--text-main)'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon} <span>{label}</span>
      </span>
    </button>
  );
};

/* --- STYLES --- */
// Using CSS Variables for automatic theme switching
const headerStyle: React.CSSProperties = { 
  position: 'absolute', top: 0, width: '100%', padding: '20px 40px', 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
  zIndex: 1000, boxSizing: 'border-box' 
};

const logoContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };

const logoIconStyle: React.CSSProperties = { 
  backgroundColor: '#2563eb', color: 'white', padding: '8px', 
  borderRadius: '10px', display: 'flex', justifyContent: 'center', 
  alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' 
};

const pfpButtonStyle: React.CSSProperties = { 
  width: '44px', height: '44px', borderRadius: '50%', 
  backgroundColor: '#0f172a', border: 'none', cursor: 'pointer', 
  display: 'flex', justifyContent: 'center', alignItems: 'center' 
};

const menuCardStyle: React.CSSProperties = { 
  position: 'absolute', top: '55px', right: '0px', width: '260px', 
  borderRadius: '20px', padding: '12px', zIndex: 1001,
  backgroundColor: 'var(--card-bg)',
  border: '1px solid var(--border-subtle)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
};

const menuHeaderStyle: React.CSSProperties = { 
  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
  cursor: 'pointer', borderRadius: '14px', marginBottom: '8px',
  backgroundColor: 'var(--bg-main)'
};

const largePfpStyle: React.CSSProperties = { 
  width: '40px', height: '40px', borderRadius: '10px', 
  backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', 
  justifyContent: 'center', alignItems: 'center' 
};

const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };

const menuBtnStyle: React.CSSProperties = { 
  display: 'flex', alignItems: 'center', width: '100%', padding: '12px', 
  border: 'none', background: 'transparent', borderRadius: '10px', 
  cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500' 
};

const toggleItemStyle: React.CSSProperties = { 
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
  padding: '12px', fontSize: '14px', fontWeight: '500' 
};

const toggleSwitchStyle = (isOn: boolean): React.CSSProperties => ({ 
  width: '36px', height: '20px', borderRadius: '20px', 
  backgroundColor: isOn ? '#2563eb' : '#cbd5e1', border: 'none', 
  cursor: 'pointer', position: 'relative', display: 'flex', 
  alignItems: 'center', transition: 'background-color 0.3s ease' 
});

const toggleCircleStyle: React.CSSProperties = { 
  width: '16px', height: '16px', borderRadius: '50%', 
  backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', 
  position: 'absolute' 
};

const backdropStyle: React.CSSProperties = { 
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000 
};

export default Navbar;
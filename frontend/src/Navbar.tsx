import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, CreditCard, RefreshCw, 
  Crown, Users, Star, AlertTriangle, 
  ShieldAlert, LogOut, ChevronRight,
  Moon, Sun, Car, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

const Navbar = ({ isDriverMode, setIsDriverMode }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  /* --- 1. REALTIME COUPON LISTENER --- */
  useEffect(() => {
    let channel: any;

    const initRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('coupon-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'coupons',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const discount = payload.new.discount_percent;
            setToastMsg(`🎁 Reward: ${discount}% Discount Coupon Added!`);
            setShowToast(true);

            // Stay for 3 seconds then disappear
            setTimeout(() => setShowToast(false), 3000);
          }
        )
        .subscribe();
    };

    initRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  /* --- 2. REFERRAL LOGIC --- */
  const handleReferral = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to refer friends!");
        return;
      }

      const referralLink = `${window.location.origin}/auth?ref=${user.id}`;
      
      const shareData = {
        title: 'Join StateRide',
        text: 'Use my link to join StateRide and we both get ride discounts!',
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
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <>
      {/* --- 3. TOP NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -50, x: '-50%', opacity: 0 }}
            animate={{ y: 20, x: '-50%', opacity: 1 }}
            exit={{ y: -50, x: '-50%', opacity: 0 }}
            style={toastStyle}
          >
            <div style={toastIconStyle}><Gift size={18} color="white" /></div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={headerStyle}>
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}><Car size={24} strokeWidth={2.5} /></div>
          <span style={{ fontWeight: '800', fontSize: '20px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>
            State<span style={{ color: '#2563eb' }}>Ride</span>
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
                  style={{...menuCardStyle, backgroundColor: isDarkMode ? '#1e293b' : 'white'}}
                >
                  <div 
                    style={{...menuHeaderStyle, backgroundColor: isDarkMode ? '#334155' : '#f8fafc'}} 
                    onClick={() => navigate('/profile')}
                  >
                     <div style={largePfpStyle}><User size={24} color="#2563eb"/></div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: '700', fontSize: '15px', color: isDarkMode ? '#ffffff' : '#0f172a' }}>Bilir Goyari</div>
                       <div style={{ fontSize: '11px', color: '#64748b' }}>Account Settings</div>
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

                    {/* Dark Mode Toggle */}
                    <div style={toggleItemStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isDarkMode ? <Moon size={18} color="#f8fafc"/> : <Sun size={18} color="#334155"/>}
                        <span style={{ color: isDarkMode ? '#ffffff' : '#334155', fontSize: '14px', fontWeight: '500' }}>Dark Mode</span>
                      </div>
                      <button onClick={toggleDarkMode} style={toggleSwitchStyle(isDarkMode)}>
                        <motion.div animate={{ x: isDarkMode ? 18 : 2 }} style={toggleCircleStyle} />
                      </button>
                    </div>

                    <MenuButton icon={<Crown size={18} color="#eab308"/>} label="Buy Pro" isDark={isDarkMode} />
                    
                    {/* Referral Button */}
                    <MenuButton 
                      icon={<Users size={18} color="#2563eb"/>} 
                      label="Refer a Friend" 
                      isDark={isDarkMode} 
                      onClick={handleReferral}
                    />

                    <MenuButton icon={<Star size={18}/>} label="Rate the App" isDark={isDarkMode} />
                    <MenuButton icon={<AlertTriangle size={18}/>} label="Report an Issue" isDark={isDarkMode} />
                    <MenuButton icon={<ShieldAlert size={18} color="#ef4444"/>} label="SOS / Safety" isDark={isDarkMode} />
                    
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
    </>
  );
};

/* --- SHARED COMPONENTS --- */
const MenuButton = ({ icon, label, onClick, isDark, isDestructive }: any) => {
  const getTextColor = () => {
    if (isDestructive) return isDark ? '#f87171' : '#ef4444';
    return isDark ? '#ffffff' : '#334155';
  };

  return (
    <button onClick={onClick} style={{...menuBtnStyle, color: getTextColor()}}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon} <span>{label}</span>
      </span>
    </button>
  );
};

/* --- STYLES --- */
const toastStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: '50%', zIndex: 10001,
  backgroundColor: '#1e293b', color: 'white', padding: '10px 24px',
  borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'
};

const toastIconStyle = { backgroundColor: '#2563eb', padding: '6px', borderRadius: '50%', display: 'flex' };

const headerStyle: React.CSSProperties = { position: 'absolute', top: 0, width: '100%', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxSizing: 'border-box' };
const logoContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };
const logoIconStyle: React.CSSProperties = { backgroundColor: '#2563eb', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' };
const pfpButtonStyle: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const menuCardStyle: React.CSSProperties = { position: 'absolute', top: '55px', right: '0px', width: '260px', borderRadius: '20px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 1001 };
const menuHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '14px', marginBottom: '8px' };
const largePfpStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const menuBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', width: '100%', padding: '12px', border: 'none', background: 'transparent', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500' };
const toggleItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', fontSize: '14px', fontWeight: '500' };
const toggleSwitchStyle = (isOn: boolean): React.CSSProperties => ({ width: '36px', height: '20px', borderRadius: '20px', backgroundColor: isOn ? '#2563eb' : '#cbd5e1', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', transition: 'background-color 0.3s ease' });
const toggleCircleStyle: React.CSSProperties = { width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'absolute' };
const backdropStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000 };

export default Navbar;
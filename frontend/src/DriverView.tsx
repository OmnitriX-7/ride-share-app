import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Map as MapIcon, Star, TrendingUp, Search } from 'lucide-react';

const DriverView = () => {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div 
      className="view-container"
      style={{ 
        height: '100%', 
        width: '100%', 
        padding: '120px 40px', 
        backgroundColor: 'transparent', // Let index.css handle the body bg
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 1. DRIVER STATS ROW */}
        <div style={statsContainerStyle}>
          <StatCard icon={<Star size={18} color="#eab308"/>} label="Rating" value="4.9" />
          <StatCard icon={<TrendingUp size={18} color="#22c55e"/>} label="Today's Earnings" value="₹1,240" />
          <StatCard icon={<MapIcon size={18} color="#2563eb"/>} label="Total Rides" value="12" />
        </div>

        {/* 2. GO ONLINE TOGGLE CARD */}
        <div className="panel-card" style={toggleCardStyle(isOnline)}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                backgroundColor: isOnline ? '#22c55e' : '#94a3b8',
                boxShadow: isOnline ? '0 0 10px #22c55e' : 'none'
              }} />
              <span className="text-secondary" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                System Status: {isOnline ? 'Active' : 'Standby'}
              </span>
            </div>
            <h2 className="text-main" style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
              {isOnline ? "You're Online!" : "You're Offline"}
            </h2>
            <p className="text-secondary" style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>
              {isOnline ? "Searching for nearby passengers..." : "Tap the button to start receiving requests."}
            </p>
          </div>

          <button 
            onClick={() => setIsOnline(!isOnline)} 
            style={powerBtnStyle(isOnline)}
          >
            <Power size={32} strokeWidth={2.5} />
          </button>
        </div>

        {/* 3. REQUESTS AREA */}
        <AnimatePresence>
          {isOnline && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ marginTop: '40px' }}
            >
              <h3 className="text-main" style={{ marginBottom: '20px', fontWeight: '800', fontSize: '18px' }}>
                Nearby Requests
              </h3>
              
              <div className="panel-card" style={emptyStateStyle}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Search size={40} className="text-secondary" color="#cbd5e1" strokeWidth={1.5} />
                </motion.div>
                <p className="text-secondary" style={{ marginTop: '15px', fontWeight: '500' }}>
                  Scanning for passengers in your area...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* --- SHARED COMPONENTS --- */

const StatCard = ({ icon, label, value }: any) => (
  <div className="stats-card" style={{ 
    flex: 1, 
    backgroundColor: 'white', 
    padding: '24px', 
    borderRadius: '24px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9'
  }}>
    <div className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
      {icon} {label}
    </div>
    <div className="text-main" style={{ fontSize: '28px', fontWeight: '900' }}>{value}</div>
  </div>
);

/* --- STYLES --- */

const statsContainerStyle: React.CSSProperties = { 
  display: 'flex', 
  gap: '24px', 
  marginBottom: '40px' 
};

const toggleCardStyle = (online: boolean): React.CSSProperties => ({
  display: 'flex', 
  alignItems: 'center', 
  padding: '40px', 
  borderRadius: '32px', 
  backgroundColor: 'white', 
  border: `1px solid ${online ? '#dcfce7' : '#f1f5f9'}`,
  boxShadow: online ? '0 20px 40px rgba(34, 197, 94, 0.1)' : '0 10px 30px rgba(0,0,0,0.04)', 
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
});

const powerBtnStyle = (online: boolean): React.CSSProperties => ({
  width: '90px', 
  height: '90px', 
  borderRadius: '50%', 
  border: 'none',
  backgroundColor: online ? '#22c55e' : '#f1f5f9', 
  color: online ? 'white' : '#94a3b8',
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  transition: 'all 0.3s ease',
  boxShadow: online ? '0 15px 30px rgba(34, 197, 94, 0.4)' : 'none'
});

const emptyStateStyle: React.CSSProperties = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  justifyContent: 'center',
  padding: '60px', 
  backgroundColor: 'white',
  border: '2px dashed #e2e8f0', 
  borderRadius: '32px' 
};

export default DriverView;
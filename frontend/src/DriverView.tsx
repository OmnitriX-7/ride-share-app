import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Map as MapIcon, Star, TrendingUp, Search, Navigation, ShieldCheck, Clock, Activity, ChevronRight, Zap } from 'lucide-react';

const DriverView = () => {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div 
      style={{ 
        height: '100%', 
        width: '100%', 
        padding: '100px 20px 40px 20px', 
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: 'var(--text-main)'
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px 0' }}>Driver Dashboard</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
              Welcome back, Bilir
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--card-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
            <Activity size={16} color={isOnline ? "#10b981" : "var(--text-secondary)"} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: isOnline ? "#10b981" : "var(--text-secondary)" }}>
              {isOnline ? 'Zone: High Demand' : 'Offline'}
            </span>
          </div>
        </div>

        <div style={{ 
          position: 'relative',
          padding: '40px', 
          borderRadius: '32px', 
          backgroundColor: 'var(--card-bg)', 
          border: `1px solid ${isOnline ? '#10b981' : 'var(--border-subtle)'}`,
          boxShadow: isOnline ? '0 20px 40px rgba(16, 185, 129, 0.1)' : '0 10px 30px rgba(0,0,0,0.02)', 
          transition: 'all 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          
          <AnimatePresence>
            {isOnline && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.05 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute',
                  right: '65px',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  pointerEvents: 'none'
                }}
              />
            )}
          </AnimatePresence>

          <div style={{ zIndex: 2 }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0' }}>
              {isOnline ? "You're Online" : "You're Offline"}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px', fontWeight: '500' }}>
              {isOnline ? "Scanning area for ride requests..." : "Tap the power button to start your shift."}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOnline(!isOnline)}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10b981' : 'var(--input-bg)',
              color: isOnline ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: isOnline ? '0 10px 30px rgba(16, 185, 129, 0.4)' : 'none',
              zIndex: 2,
              border: `1px solid ${isOnline ? 'transparent' : 'var(--border-subtle)'}`
            }}
          >
            <Power size={36} strokeWidth={2.5} />
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '24px', backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#10b981"/> Daily Goal
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800' }}>₹1,240 / ₹2,000</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', backgroundColor: '#10b981', borderRadius: '10px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <ActionBtn icon={<Navigation size={20} />} label="Navigate" />
            <ActionBtn icon={<ShieldCheck size={20} />} label="Safety" />
            <ActionBtn icon={<Zap size={20} />} label="Hotspots" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <StatCard icon={<Star size={20} color="#eab308"/>} label="Rating" value="4.92" />
          <StatCard icon={<Clock size={20} color="#3b82f6"/>} label="Online Time" value="4h 12m" />
          <StatCard icon={<MapIcon size={20} color="#8b5cf6"/>} label="Acceptance" value="94%" />
        </div>

        <AnimatePresence>
          {isOnline && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', margin: 0 }}>Active Radar</h3>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '50px', 
                backgroundColor: 'var(--card-bg)',
                border: '1px dashed var(--border-subtle)', 
                borderRadius: '24px' 
              }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Search size={40} color="var(--text-secondary)" strokeWidth={1.5} opacity={0.5} />
                </motion.div>
                <p style={{ marginTop: '16px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '15px' }}>
                  Awaiting ride requests...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div style={{ 
    backgroundColor: 'var(--card-bg)', 
    padding: '24px', 
    borderRadius: '24px', 
    border: '1px solid var(--border-subtle)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)' }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label }: any) => (
  <button style={{ 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    backgroundColor: 'var(--card-bg)', 
    border: '1px solid var(--border-subtle)', 
    borderRadius: '20px',
    cursor: 'pointer',
    color: 'var(--text-main)',
    fontWeight: '600',
    fontSize: '13px'
  }}>
    <div style={{ padding: '10px', backgroundColor: 'var(--input-bg)', borderRadius: '14px' }}>
      {icon}
    </div>
    {label}
  </button>
);

export default DriverView;
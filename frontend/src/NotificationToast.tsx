import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { useUserStore } from './store';

const Notification = () => {
  const { notification } = useUserStore();

  return (
    <AnimatePresence>
      {notification.visible && (
        <motion.div
          initial={{ y: -100, x: '-50%', opacity: 0 }}
          animate={{ y: 30, x: '-50%', opacity: 1 }}
          exit={{ y: -100, x: '-50%', opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            zIndex: 10000, 
            backgroundColor: '#0f172a',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            minWidth: '320px'
          }}
        >
          <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '12px' }}>
            <Gift size={18} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.3px' }}>
              Reward Unlocked!
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
              {notification.message}
            </span>
          </div>
          <Sparkles size={16} color="#fbbf24" style={{ marginLeft: 'auto' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
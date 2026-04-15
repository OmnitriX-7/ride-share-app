import React from 'react';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        // DEAD CENTER FIX:
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Vertical Center
        alignItems: 'center',     // Horizontal Center
        backgroundColor: 'var(--card-bg)', 
        zIndex: 99999, // Ensure it's above everything
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '280px', position: 'relative' }}>
        {/* Progress Track */}
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: 'rgba(148, 163, 184, 0.1)', 
          borderRadius: '20px', 
          overflow: 'hidden' 
        }}>
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', backgroundColor: '#2563eb' }}
          />
        </div>

        {/* Driving Car */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: 248 }} 
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', top: '-35px' }}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
          >
            <Car size={32} color="#2563eb" fill="#2563eb" />
          </motion.div>
        </motion.div>
      </div>

      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ 
          marginTop: '32px', 
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--text-main)',
          textAlign: 'center'
        }}
      >
        Preparing your ride...
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
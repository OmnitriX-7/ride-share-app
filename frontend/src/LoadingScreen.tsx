import React from 'react';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-overlay"
      style={{ 
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div style={{ width: '280px', position: 'relative' }}>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: 'rgba(148, 163, 184, 0.2)', 
          borderRadius: '20px', 
          overflow: 'hidden' 
        }}>
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', backgroundColor: '#2563eb' }}
          />
        </div>

        <motion.div
          initial={{ x: 0 }}
          animate={{ x: 248 }} // 280 (container) - 32 (car width)
          transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', top: '-35px' }}
        >
          <Car size={32} color="#2563eb" fill="#2563eb" />
        </motion.div>
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ 
          marginTop: '24px', 
          fontSize: '15px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}
        className="text-main"
      >
        Preparing your ride...
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
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
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
        backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', zIndex: 9999 
      }}
    >
      <div style={{ width: '300px', position: 'relative' }}>
        {/* The Track */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
          {/* The Progress Fill */}
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "easeInOut" }} // Updated to 3s
            style={{ height: '100%', backgroundColor: '#2563eb' }}
          />
        </div>

        {/* The Car Icon Moving Horizontally */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }} // Updated to 3s
          style={{ position: 'absolute', top: '-25px', transform: 'translateX(-100%)' }}
        >
          <Car size={32} color="#2563eb" fill="#2563eb" />
        </motion.div>
      </div>

      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: '20px', color: '#0f172a', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}
      >
        Preparing your ride...
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
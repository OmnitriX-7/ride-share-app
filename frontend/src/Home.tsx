import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import RiderView from './RiderView';
import DriverView from './DriverView';

const Home = () => {
  const [isDriverMode, setIsDriverMode] = useState(false);

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden', 
      backgroundColor: '#f8fafc', // Consistent slate background
      fontFamily: '"Inter", sans-serif'
    }}>
      
      {/* 1. Global Navbar: High Z-Index ensures it stays visible during transitions */}
      <div style={{ position: 'relative', zIndex: 1000 }}>
        <Navbar 
          isDriverMode={isDriverMode} 
          setIsDriverMode={setIsDriverMode} 
        />
      </div>

      {/* 2. Main Viewport */}
      <main style={{ height: '100%', width: '100%' }}>
        <AnimatePresence mode="wait">
          {isDriverMode ? (
            <motion.div
              key="driver"
              // Slide in from right, exit to left
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ height: '100%', width: '100%' }}
            >
              <DriverView />
            </motion.div>
          ) : (
            <motion.div
              key="rider"
              // Slide in from left, exit to right
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ height: '100%', width: '100%' }}
            >
              <RiderView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Subtle Bottom Shadow (Optional Visual Polish) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '80px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.02))',
        pointerEvents: 'none',
        zIndex: 5
      }} />
    </div>
  );
};

export default Home;
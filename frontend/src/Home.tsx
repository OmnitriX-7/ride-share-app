import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import RiderView from './RiderView';
import DriverView from './DriverView';

const Home = () => {
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Sync the view with the user's saved role from the database
  useEffect(() => {
    const syncRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data?.role === 'driver') {
          setIsDriverMode(true);
        }
      }
      setLoading(false);
    };
    syncRole();
  }, []);

  if (loading) return null; // Let App.tsx handle the car animation

  return (
    <div 
      className="home-wrapper" // Target this in CSS for theme transitions
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        width: '100%', 
        backgroundColor: 'transparent', // Let body background show through
        fontFamily: '"Inter", sans-serif'
      }}
    >
      
      {/* Navbar: Z-Index keeps it above the sliding views */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <Navbar 
          isDriverMode={isDriverMode} 
          setIsDriverMode={setIsDriverMode} 
        />
      </div>

      {/* Main Viewport */}
      <main style={{ width: '100%' }}>
        <AnimatePresence mode="wait">
          {isDriverMode ? (
            <motion.div
              key="driver"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // "Slingshot" feel
              style={{ width: '100%' }}
            >
              <DriverView />
            </motion.div>
          ) : (
            <motion.div
              key="rider"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%' }}
            >
              <RiderView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Polish: Subtle shadow overlay at bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '100px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.03))',
        pointerEvents: 'none',
        zIndex: 5
      }} />
    </div>
  );
};

export default Home;
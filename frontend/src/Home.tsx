import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { useUserStore } from './store'; 
import Navbar from './Navbar';
import RiderView from './RiderView';
import DriverView from './DriverView';

const Home = () => {
  const { profile, showToast } = useUserStore();
  const [isDriverMode, setIsDriverMode] = useState(profile?.role === 'driver');
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    if (profile) {
      setIsDriverMode(profile.role === 'driver');
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;

    const rewardChannel = supabase.channel(`new-reward-${profile.id}`);

    rewardChannel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'coupons',
        filter: `user_id=eq.${profile.id}` 
      },
      async (payload: any) => {
        if (payload.new.is_referral_reward && !payload.new.notified) {
          try {
            await supabase
              .from('coupons')
              .update({ notified: true })
              .eq('id', payload.new.id);
            
            showToast(`Referral Success! ${payload.new.discount_percent}% discount added.`);
          } catch (err) {
            console.error(err);
          }
        }
      }
    );

    rewardChannel.subscribe();

    return () => {
      supabase.removeChannel(rewardChannel);
    };
  }, [profile?.id, showToast]);

  if (loading) return null;

  return (
    <div 
      className="home-wrapper"
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        width: '100%', 
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        fontFamily: '"Inter", sans-serif',
        transition: 'background-color 0.3s ease',
        overflowX: 'hidden'
      }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <Navbar 
          isDriverMode={isDriverMode} 
          setIsDriverMode={setIsDriverMode} 
        />
      </div>

      <main style={{ width: '100%', minHeight: 'calc(100vh - 80px)' }}>
        <AnimatePresence mode="wait">
          {isDriverMode ? (
            <motion.div
              key="driver"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%' }}
            >
              <DriverView />
            </motion.div>
          ) : (
            <motion.div
              key="rider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%' }}
            >
              <RiderView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: '100px',
        background: 'linear-gradient(transparent, var(--bg-main))',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.5
      }} />
    </div>
  );
};

export default Home;
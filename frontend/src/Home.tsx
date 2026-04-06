import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { useUserStore } from './store'; 
import Navbar from './Navbar';
import RiderView from './RiderView';
import DriverView from './DriverView';

const Home = () => {
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useUserStore();

  // 1. ROLE SYNC
  useEffect(() => {
    const syncRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.role === 'driver') {
          setIsDriverMode(true);
        }
      }
      setLoading(false);
    };
    syncRole();
  }, []);

  // 2. REWARD NOTIFICATIONS (Fixed ordering)
  useEffect(() => {
    let rewardChannel: any;

    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initialize the channel
      rewardChannel = supabase.channel(`new-reward-${user.id}`);

      // STEP A: Attach the listener FIRST
      rewardChannel.on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'coupons',
          filter: `user_id=eq.${user.id}` 
        },
        async (payload: any) => {
          if (payload.new.is_referral_reward && !payload.new.notified) {
            try {
              // Update notified status so we don't show it again
              await supabase
                .from('coupons')
                .update({ notified: true })
                .eq('id', payload.new.id);
              
              showToast(`Referral Success! ${payload.new.discount_percent}% discount added.`);
            } catch (err) {
              console.error("Failed to update notification status", err);
            }
          }
        }
      );

      // STEP B: Call subscribe LAST
      rewardChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: Successfully listening for rewards');
        }
      });
    };

    setupNotifications();

    return () => {
      if (rewardChannel) {
        supabase.removeChannel(rewardChannel);
      }
    };
  }, [showToast]);

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
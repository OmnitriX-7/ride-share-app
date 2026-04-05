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

  // 1. Sync the view with the user's saved role
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

  // 2. UPDATED QUEUE SYSTEM: Mark as notified BEFORE showing toast to prevent repeats
  useEffect(() => {
    const processNotificationQueue = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pendingRewards } = await supabase
        .from('coupons')
        .select('id, code, discount_percent')
        .eq('user_id', user.id)
        .eq('is_referral_reward', true)
        .eq('notified', false)
        .order('created_at', { ascending: true });

      if (pendingRewards && pendingRewards.length > 0) {
        const rewardIds = pendingRewards.map(r => r.id);

        // FIX: Mark ALL as notified in DB IMMEDIATELY
        // This ensures if they refresh during the toasts, they don't see them again.
        await supabase
          .from('coupons')
          .update({ notified: true })
          .in('id', rewardIds);

        // Now show them one by one for the UI experience
        pendingRewards.forEach((reward, i) => {
          setTimeout(() => {
            showToast(`🎁 Reward: ${reward.discount_percent}% Discount Added! (Code: ${reward.code})`);
          }, i * 4000); 
        });
      }
    };

    processNotificationQueue();

    // Real-time listener for new rewards while user is online
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const rewardChannel = supabase
              .channel('new-reward-notif')
              .on(
                'postgres_changes',
                { 
                  event: 'INSERT', 
                  schema: 'public', 
                  table: 'coupons',
                  filter: `user_id=eq.${session.user.id}` // Safety filter
                },
                async (payload) => {
                  if (payload.new.is_referral_reward && !payload.new.notified) {
                    // Mark as notified immediately
                    await supabase
                      .from('coupons')
                      .update({ notified: true })
                      .eq('id', payload.new.id);
                      
                    showToast(`New Referral! ${payload.new.discount_percent}% discount added.`);
                  }
                }
              )
              .subscribe();

            return () => {
              supabase.removeChannel(rewardChannel);
            };
        }
    });

  }, [showToast]);

  if (loading) return null;

  return (
    <div 
      className="home-wrapper"
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        width: '100%', 
        // FIX: Force the background to use the theme variable
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        fontFamily: '"Inter", sans-serif',
        transition: 'background-color 0.3s ease'
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

      {/* Decorative gradient overlay */}
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
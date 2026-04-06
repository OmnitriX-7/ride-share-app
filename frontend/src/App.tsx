import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient'; 
import { useUserStore } from './store'; 
import Auth from './Auth';
import OnboardingSurvey from './OnboardingSurvey';
import Home from './Home';
import LoadingScreen from './LoadingScreen';
import NotificationToast from './NotificationToast';

function App() {
  const { setProfile, hasProfile, setHasProfile } = useUserStore();
  const [session, setSession] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Helper: Fetches profile and updates global store
  const fetchAndSyncProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;

      if (data && data.onboarded) {
        setProfile(data);
        setHasProfile(true);
        return true;
      }
      
      setHasProfile(false);
      return false;
    } catch (err) {
      setHasProfile(false);
      return false;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          // 1. Get the profile data first
          await fetchAndSyncProfile(initialSession.user.id);
          
          // 2. Calculate animation timing (Minimum 2 seconds for the car)
          const elapsedTime = Date.now() - startTime;
          const minWait = 2000; 
          
          setTimeout(() => {
            // 3. Reveal the app ONLY after the car finishes its journey
            setSession(initialSession);
            setIsInitialLoading(false);
          }, Math.max(0, minWait - elapsedTime));
        } else {
          setHasProfile(false);
          setSession(null);
          setIsInitialLoading(false);
        }
      } catch (error) {
        console.error("Init Error:", error);
        setIsInitialLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession) {
        // Bring back the car for the login transition
        setIsInitialLoading(true);
        
        const startTime = Date.now();
        await fetchAndSyncProfile(currentSession.user.id);
        
        const elapsedTime = Date.now() - startTime;
        const loginWait = 1800; 

        setTimeout(() => {
          // Sync state and hide loading simultaneously
          setSession(currentSession);
          setIsInitialLoading(false);
        }, Math.max(0, loginWait - elapsedTime));
      } 
      else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setHasProfile(false);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Guard: Stay on the car animation while loading or while session/profile sync is pending
  if (isInitialLoading || (session && hasProfile === null)) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <NotificationToast />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Landing / Login Logic */}
          <Route path="/" element={
            !session ? <Auth /> : 
            (hasProfile === true ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />)
          } />

          {/* Onboarding Logic */}
          <Route path="/onboarding" element={
            session && hasProfile === false ? <OnboardingSurvey /> : 
            (hasProfile === true ? <Navigate to="/home" replace /> : <Navigate to="/" replace />)
          } />

          {/* Protected Home Logic */}
          <Route path="/home" element={
            session && hasProfile === true ? (
              <motion.div 
                key="home-content" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5 }}
                style={{ width: '100%' }}
              >
                <Home />
              </motion.div>
            ) : (
              <Navigate to={session ? "/onboarding" : "/"} replace />
            )
          } />

          {/* Global Catch-all Redirect */}
          <Route path="*" element={
            <Navigate to={!session ? "/" : (hasProfile === true ? "/home" : "/onboarding")} replace />
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
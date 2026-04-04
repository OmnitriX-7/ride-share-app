import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient'; 
import { useUserStore } from './store'; 
import Auth from './Auth';
import OnboardingSurvey from './OnboardingSurvey';
import Home from './Home';
import LoadingScreen from './LoadingScreen';

function App() {
  const { hasProfile, setHasProfile } = useUserStore();
  const [session, setSession] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Helper: Checks if the profile has a valid role assigned
  const checkProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      // Profile is complete ONLY if role is 'rider' or 'driver'
      return !!(data && (data.role === 'rider' || data.role === 'driver'));
    } catch (err) {
      console.error("Auth Check Error:", err);
      return false;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        if (initialSession) {
          const isComplete = await checkProfileStatus(initialSession.user.id);
          setHasProfile(isComplete); 
        } else {
          setHasProfile(false);
        }
      } finally {
        // Wait 3.2s to let the 3s car animation finish fully
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 3200); 
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN') {
        // 1. Immediately "close the curtain"
        setHasProfile(null);
        setSession(currentSession);

        if (currentSession) {
          // 2. Check status while the car is driving
          const isComplete = await checkProfileStatus(currentSession.user.id);
          
          // 3. Lift curtain only after the 3s animation finishes
          setTimeout(() => {
            setHasProfile(isComplete);
          }, 3000);
        }
      } 
      else if (event === 'SIGNED_OUT') {
        setSession(null);
        setHasProfile(false);
      }
      else {
        setSession(currentSession);
      }
    });

    return () => subscription.unsubscribe();
  }, [setHasProfile]);

  // --- FLASH PROTECTOR ---
  // Blocks the Router from rendering until we know EXACTLY where to send the user
  if (isInitialLoading || (session && hasProfile === null)) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/" 
            element={
              !session ? <Auth /> : (hasProfile === true ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />)
            } 
          />

          <Route 
            path="/auth" 
            element={
              !session ? <Auth /> : (hasProfile === true ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />)
            } 
          />

          <Route 
            path="/onboarding" 
            element={
              session && hasProfile === false ? (
                <OnboardingSurvey />
              ) : (
                <Navigate to={hasProfile === true ? "/home" : "/"} replace />
              )
            } 
          />

          <Route 
            path="/home" 
            element={
              session && hasProfile === true ? (
                <motion.div 
                  key="home-content"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <Home />
                </motion.div>
              ) : (
                <Navigate to={session ? "/onboarding" : "/"} replace />
              )
            } 
          />

          <Route 
            path="*" 
            element={
              <Navigate 
                to={!session ? "/" : (hasProfile === true ? "/home" : "/onboarding")} 
                replace 
              />
            } 
          />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
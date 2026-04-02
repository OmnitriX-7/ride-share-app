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

  const checkProfileStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      return !!data?.role;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // 1. Start fetching data immediately in the background
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const isComplete = await checkProfileStatus(session.user.id);
        setHasProfile(isComplete);
      }

      // 2. FORCE the 3.2s delay for the animation to play fully
      // This runs every time the component mounts (refresh or first visit)
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 3200);
    };

    initApp();

    // Listener for Auth changes during the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        const isComplete = await checkProfileStatus(session.user.id);
        setHasProfile(isComplete);
      }
      if (event === 'SIGNED_OUT') {
        setHasProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setHasProfile]);

  // If initial loading is true, we ONLY show the loading screen
  // This blocks the router until the car finishes its drive
  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Landing Path */}
          <Route 
            path="/" 
            element={!session ? <Auth /> : (hasProfile ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />)} 
          />

          {/* Onboarding Path */}
          <Route 
            path="/onboarding" 
            element={session ? <OnboardingSurvey /> : <Navigate to="/" replace />} 
          />

          {/* Home Path with smooth entry animation */}
          <Route 
            path="/home" 
            element={
              session && hasProfile ? (
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

          <Route path="*" element={<Navigate to={session ? (hasProfile ? "/home" : "/onboarding") : "/"} replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
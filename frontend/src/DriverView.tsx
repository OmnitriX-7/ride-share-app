import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Map as MapIcon, Star, TrendingUp, Search, Navigation, ShieldCheck, Clock, Activity, MapPin, Check, X, CarFront, IndianRupee, Zap } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useUserStore } from './store';

const DriverView = () => {
  const { showToast } = useUserStore();
  const [isOnline, setIsOnline] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);

  useEffect(() => {
    const initDriver = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDriverId(user.id);
        const { data } = await supabase.from('drivers').select('status').eq('id', user.id).single();
        if (data && data.status === 'available') setIsOnline(true);
        if (data && data.status === 'in_trip') {
           const { data: rideData } = await supabase.from('rides').select('*').eq('driver_id', user.id).eq('status', 'accepted').single();
           if(rideData) {
             setActiveRide(rideData);
             setIsOnline(false);
           }
        }
      }
    };
    initDriver();
  }, []);

  const toggleOnlineStatus = async () => {
    if (!driverId || activeRide) return;
    const newStatus = !isOnline ? 'available' : 'offline';
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', driverId);
    if (!error) {
      setIsOnline(!isOnline);
      showToast(!isOnline ? "You are now online." : "You are now offline.");
    } else {
      showToast("Failed to update status.");
    }
  };

  useEffect(() => {
    if (!driverId || !isOnline) return;

    const dispatchSubscription = supabase
      .channel('driver_dispatches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_dispatches', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          if (payload.new.status === 'pending') {
            setIncomingRequest(payload.new);
            showToast("New ride request!");
          }
        }
      )
      .on(
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'ride_dispatches', filter: `driver_id=eq.${driverId}` },
         (payload) => {
           if (payload.new.status === 'timeout' && incomingRequest?.id === payload.new.id) {
             setIncomingRequest(null);
             showToast("Request timed out.");
           }
         }
      )
      .subscribe();

    return () => { supabase.removeChannel(dispatchSubscription); };
  }, [driverId, isOnline, incomingRequest]);

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    if (!incomingRequest) return;
    
    const { error } = await supabase.from('ride_dispatches').update({ status }).eq('id', incomingRequest.id);
    
    if (error) {
      showToast("Failed to update request.");
      return;
    }

    if (status === 'accepted') {
      setActiveRide(incomingRequest);
      setIsOnline(false); 
    }
    setIncomingRequest(null);
  };

  const finishRide = async () => {
    if (!activeRide) return;
    await supabase.from('rides').update({ status: 'completed' }).eq('dispatch_id', activeRide.id);
    await supabase.from('drivers').update({ status: 'available' }).eq('id', driverId);
    setActiveRide(null);
    setIsOnline(true);
    showToast("Ride completed! You are back online.");
  };

  return (
    <div 
      style={{ 
        height: '100%', 
        width: '100%', 
        padding: '100px 20px 40px 20px', 
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: 'var(--text-main)',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px 0' }}>Driver Dashboard</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
              Welcome back, Bilir
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--card-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
            <Activity size={16} color={isOnline ? "#10b981" : (activeRide ? "#3b82f6" : "var(--text-secondary)")} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: isOnline ? "#10b981" : (activeRide ? "#3b82f6" : "var(--text-secondary)") }}>
              {activeRide ? 'On Trip' : (isOnline ? 'Zone: High Demand' : 'Offline')}
            </span>
          </div>
        </div>

        <div style={{ 
          position: 'relative',
          padding: '40px', 
          borderRadius: '32px', 
          backgroundColor: 'var(--card-bg)', 
          border: `1px solid ${isOnline ? '#10b981' : (activeRide ? '#3b82f6' : 'var(--border-subtle)')}`,
          boxShadow: isOnline ? '0 20px 40px rgba(16, 185, 129, 0.1)' : (activeRide ? '0 20px 40px rgba(59, 130, 246, 0.1)' : '0 10px 30px rgba(0,0,0,0.02)'), 
          transition: 'all 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          
          <AnimatePresence>
            {isOnline && !activeRide && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.05 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  position: 'absolute',
                  right: '65px',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  pointerEvents: 'none'
                }}
              />
            )}
          </AnimatePresence>

          <div style={{ zIndex: 2 }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0' }}>
              {activeRide ? "Ride in Progress" : (isOnline ? "You're Online" : "You're Offline")}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px', fontWeight: '500' }}>
              {activeRide ? "Navigate safely to the destination." : (isOnline ? "Scanning area for ride requests..." : "Tap the power button to start your shift.")}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: activeRide ? 1 : 1.05 }}
            whileTap={{ scale: activeRide ? 1 : 0.95 }}
            onClick={toggleOnlineStatus}
            disabled={!!activeRide}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: activeRide ? '#3b82f6' : (isOnline ? '#10b981' : 'var(--input-bg)'),
              color: activeRide || isOnline ? 'white' : 'var(--text-secondary)',
              cursor: activeRide ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: activeRide ? '0 10px 30px rgba(59, 130, 246, 0.4)' : (isOnline ? '0 10px 30px rgba(16, 185, 129, 0.4)' : 'none'),
              zIndex: 2,
              border: `1px solid ${isOnline || activeRide ? 'transparent' : 'var(--border-subtle)'}`,
              opacity: activeRide ? 0.7 : 1
            }}
          >
            {activeRide ? <CarFront size={36} strokeWidth={2.5} /> : <Power size={36} strokeWidth={2.5} />}
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '24px', backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#10b981"/> Daily Goal
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800' }}>₹1,240 / ₹2,000</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', backgroundColor: '#10b981', borderRadius: '10px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <ActionBtn icon={<Navigation size={20} />} label="Navigate" />
            <ActionBtn icon={<ShieldCheck size={20} />} label="Safety" />
            <ActionBtn icon={<Zap size={20} />} label="Hotspots" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <StatCard icon={<Star size={20} color="#eab308"/>} label="Rating" value="4.92" />
          <StatCard icon={<Clock size={20} color="#3b82f6"/>} label="Online Time" value="4h 12m" />
          <StatCard icon={<MapIcon size={20} color="#8b5cf6"/>} label="Acceptance" value="94%" />
        </div>

        <AnimatePresence mode="wait">
          {incomingRequest && !activeRide && (
            <motion.div 
              key="incoming"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '32px', border: '2px solid var(--accent-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>New Request</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '600' }}>Tap to accept within 30s</p>
              </div>

              <div style={{ backgroundColor: 'var(--input-bg)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <MapPin size={20} color="var(--accent-primary)" />
                    <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '16px' }}>{incomingRequest.pickup_name}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <MapPin size={20} color="#ef4444" />
                    <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '16px' }}>{incomingRequest.dropoff_name}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px' }}>Est. Earnings</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center' }}><IndianRupee size={24} />{incomingRequest.fare_amount}</span>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => handleResponse('rejected')} style={{ ...actionBtnStyle, backgroundColor: 'transparent', color: '#ef4444', border: '2px solid #ef4444' }}><X size={24} /></button>
                <button onClick={() => handleResponse('accepted')} style={{ ...actionBtnStyle, backgroundColor: '#10b981', color: '#fff', flex: 1, border: 'none' }}><Check size={24} /> Accept Ride</button>
              </div>
            </motion.div>
          )}

          {activeRide && (
            <motion.div 
              key="active"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-subtle)' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px' }}>
                    <CarFront size={28} color="#3b82f6" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>Current Trip</h3>
                </div>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>₹{activeRide.fare_amount || activeRide.fare}</span>
              </div>

              <div style={{ backgroundColor: 'var(--input-bg)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <MapPin size={20} color="var(--accent-primary)" />
                    <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '16px' }}>{activeRide.pickup_name}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MapPin size={20} color="#ef4444" />
                    <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '16px' }}>{activeRide.dropoff_name}</span>
                 </div>
              </div>
              <button onClick={finishRide} style={{ ...actionBtnStyle, backgroundColor: '#3b82f6', color: '#fff', width: '100%', border: 'none' }}>Complete Ride</button>
            </motion.div>
          )}

          {isOnline && !incomingRequest && !activeRide && (
            <motion.div 
              key="radar"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', margin: 0 }}>Active Radar</h3>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              </div>
              
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px', 
                backgroundColor: 'var(--card-bg)', border: '1px dashed var(--border-subtle)', borderRadius: '24px' 
              }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Search size={40} color="var(--text-secondary)" strokeWidth={1.5} opacity={0.5} />
                </motion.div>
                <p style={{ marginTop: '16px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '15px' }}>
                  Awaiting ride requests...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div style={{ 
    backgroundColor: 'var(--card-bg)', 
    padding: '24px', 
    borderRadius: '24px', 
    border: '1px solid var(--border-subtle)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)' }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label }: any) => (
  <button style={{ 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    backgroundColor: 'var(--card-bg)', 
    border: '1px solid var(--border-subtle)', 
    borderRadius: '20px',
    cursor: 'pointer',
    color: 'var(--text-main)',
    fontWeight: '600',
    fontSize: '13px',
    padding: '16px 0'
  }}>
    <div style={{ padding: '10px', backgroundColor: 'var(--input-bg)', borderRadius: '14px' }}>
      {icon}
    </div>
    {label}
  </button>
);

const actionBtnStyle: React.CSSProperties = { 
  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', 
  padding: '18px', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s' 
};

export default DriverView;
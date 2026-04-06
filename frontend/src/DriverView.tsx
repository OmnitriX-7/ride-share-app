import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Map as MapIcon, Star, TrendingUp, Search, Navigation, ShieldCheck, Clock, Activity, MapPin, CarFront } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useUserStore } from './store';
import RequestCard from './RequestCard';

const DriverView = () => {
  const { showToast } = useUserStore();
  const [isOnline, setIsOnline] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  
  // Track driver location for distance calculation in RequestCard
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const initDriver = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDriverId(user.id);
        const { data } = await supabase.from('drivers').select('status').eq('id', user.id).single();
        
        if (data?.status === 'busy') {
          const { data: rideData } = await supabase
            .from('ride_dispatches')
            .select('*')
            .eq('driver_id', user.id)
            .eq('status', 'accepted')
            .single();
          
          if (rideData) {
            setActiveRide(rideData);
            setIsOnline(false);
          }
        } else {
          // Force offline on fresh load to prevent accidental broadcasting
          if (data?.status === 'available') {
            await supabase.from('drivers').update({ status: 'offline' }).eq('id', user.id);
          }
          setIsOnline(false);
        }
      }
    };
    initDriver();
  }, []);

  useEffect(() => {
    let heartbeatId: any;

    const pingLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          // Update local state so RequestCards can calculate km
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          if (driverId) {
            await supabase.from('drivers').update({
              lat: latitude,
              lng: longitude,
              last_ping: new Date().toISOString()
            }).eq('id', driverId);
            console.log("📍 Heartbeat:", latitude, longitude);
          }
        },
        (err) => console.warn("GPS Warning:", err.message),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    };

    if ((isOnline || activeRide) && driverId) {
      pingLocation();
      heartbeatId = setInterval(pingLocation, 10000);
    }

    return () => clearInterval(heartbeatId);
  }, [isOnline, activeRide, driverId]);

  useEffect(() => {
    const handleUnload = () => {
      if (isOnline && driverId) {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        fetch(`${url}/rest/v1/drivers?id=eq.${driverId}`, {
          method: 'PATCH',
          headers: { 'apikey': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offline' }),
          keepalive: true
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isOnline, driverId]);

  const toggleOnlineStatus = async () => {
    if (!driverId || activeRide) return;
    const newStatus = !isOnline ? 'available' : 'offline';
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', driverId);
    if (!error) setIsOnline(!isOnline);
  };

  useEffect(() => {
    if (!driverId || !isOnline) {
      setIncomingRequests([]); // Clear requests if driver goes offline
      return;
    }

    const fetchExistingRequests = async () => {
      const { data } = await supabase
        .from('ride_dispatches')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'pending');
      
      if (data) {
        console.log("Existing pending requests:", data);
        setIncomingRequests(data);
      }
    };
    fetchExistingRequests();

    const dispatchSubscription = supabase
      .channel(`driver_inbox_${driverId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_dispatches', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          console.log("New Request Inbound:", payload.new);
          if (payload.new.status === 'pending') {
            setIncomingRequests((prev) => {
              if (prev.some(req => req.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ride_dispatches', filter: `driver_id=eq.${driverId}` },
        (payload) => {
          if (['cancelled', 'timeout'].includes(payload.new.status)) {
            setIncomingRequests((prev) => prev.filter(req => req.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(dispatchSubscription); };
  }, [driverId, isOnline]);

  const handleResponse = async (request: any, status: 'accepted' | 'rejected') => {
    // UI Cleanup
    setIncomingRequests((prev) => prev.filter(req => req.id !== request.id));
    
    const { error } = await supabase.from('ride_dispatches').update({ status }).eq('id', request.id);
    if (error) {
      showToast("Connection error. Try again.");
      return;
    }

    if (status === 'accepted') {
      // Clear other requests
      setIncomingRequests([]);
      await supabase.from('drivers').update({ status: 'busy' }).eq('id', driverId);
      setActiveRide(request);
      setIsOnline(false); 
      showToast("Trip started! Head to pickup.");
    }
  };

  const finishRide = async () => {
    if (!activeRide || !driverId) return;
    await supabase.from('ride_dispatches').update({ status: 'completed' }).eq('id', activeRide.id);
    await supabase.from('drivers').update({ status: 'available' }).eq('id', driverId);
    setActiveRide(null);
    setIsOnline(true);
    showToast("Trip complete!");
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px 0' }}>Driver Dashboard</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>Welcome, Bilir</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--card-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
            <Activity size={16} color={activeRide ? "#3b82f6" : (isOnline ? "#10b981" : "var(--text-secondary)")} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: activeRide ? "#3b82f6" : (isOnline ? "#10b981" : "var(--text-secondary)") }}>
              {activeRide ? 'On Trip' : (isOnline ? 'Online' : 'Offline')}
            </span>
          </div>
        </div>

        <div style={{ 
          position: 'relative', padding: '40px', borderRadius: '32px', backgroundColor: 'var(--card-bg)', 
          border: `1px solid ${activeRide ? '#3b82f6' : (isOnline ? '#10b981' : 'var(--border-subtle)')}`,
          boxShadow: activeRide ? '0 20px 40px rgba(59, 130, 246, 0.1)' : (isOnline ? '0 20px 40px rgba(16, 185, 129, 0.1)' : '0 10px 30px rgba(0,0,0,0.02)'), 
          transition: 'all 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden'
        }}>
          <AnimatePresence>
            {isOnline && !activeRide && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 2, opacity: 0.05 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', right: '65px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#10b981', pointerEvents: 'none' }}
              />
            )}
          </AnimatePresence>

          <div style={{ zIndex: 2 }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0' }}>
              {activeRide ? "In Trip" : (isOnline ? "You're Online" : "Go Online")}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px', fontWeight: '500' }}>
              {activeRide ? "Navigating to drop-off." : (isOnline ? "Waiting for requests..." : "Toggle to start earning.")}
            </p>
          </div>

          <motion.button whileHover={{ scale: activeRide ? 1 : 1.05 }} whileTap={{ scale: activeRide ? 1 : 0.95 }} onClick={toggleOnlineStatus} disabled={!!activeRide}
            style={{
              width: '90px', height: '90px', borderRadius: '50%', zIndex: 2, cursor: activeRide ? 'not-allowed' : 'pointer',
              backgroundColor: activeRide ? '#3b82f6' : (isOnline ? '#10b981' : 'var(--input-bg)'),
              color: activeRide || isOnline ? 'white' : 'var(--text-secondary)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${isOnline || activeRide ? 'transparent' : 'var(--border-subtle)'}`,
              boxShadow: activeRide ? '0 10px 30px rgba(59, 130, 246, 0.4)' : (isOnline ? '0 10px 30px rgba(16, 185, 129, 0.4)' : 'none'),
            }}
          >
            {activeRide ? <CarFront size={36} strokeWidth={2.5} /> : <Power size={36} strokeWidth={2.5} />}
          </motion.button>
        </div>

        {/* INCOMING REQUEST QUEUE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {incomingRequests.map((req) => (
              <RequestCard 
                key={req.id} 
                request={req} 
                handleResponse={handleResponse} 
                driverLocation={currentLocation}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* STATS & RADAR */}
        {!activeRide && incomingRequests.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={goalBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={goalHeaderStyle}><TrendingUp size={18} color="#10b981"/> Daily Goal</span>
                  <span style={{ fontSize: '15px', fontWeight: '800' }}>₹840 / ₹1,500</span>
                </div>
                <div style={progressTrackStyle}>
                  <div style={{ width: '56%', height: '100%', backgroundColor: '#10b981', borderRadius: '10px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ActionBtn icon={<Navigation size={20} />} label="Map" />
                <ActionBtn icon={<ShieldCheck size={20} />} label="Safety" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <StatCard icon={<Star size={20} color="#eab308"/>} label="Rating" value="4.95" />
              <StatCard icon={<Clock size={20} color="#3b82f6"/>} label="Shift" value="1h 45m" />
              <StatCard icon={<MapIcon size={20} color="#8b5cf6"/>} label="Trips" value="12" />
            </div>

            {isOnline && (
              <div style={radarPlaceholderStyle}>
                 <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Search size={48} color="var(--text-secondary)" />
                 </motion.div>
                 <p style={{ marginTop: '16px', fontWeight: '700', color: 'var(--text-secondary)' }}>Scanning for nearby riders...</p>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeRide && (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={activeTripCardStyle}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={iconBoxStyle}><CarFront size={28} color="#3b82f6" /></div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>Current Trip</h3>
                </div>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>₹{activeRide.fare_amount}</span>
              </div>
              <div style={requestDetailsStyle}>
                 <div style={locationRowStyle}><MapPin size={20} color="var(--accent-primary)" /> <span>{activeRide.pickup_name}</span></div>
                 <div style={locationRowStyle}><MapPin size={20} color="#ef4444" /> <span>{activeRide.dropoff_name}</span></div>
              </div>
              <button onClick={finishRide} style={completeButtonStyle}>Complete Ride</button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = { height: '100%', width: '100%', padding: '100px 20px 40px 20px', overflowY: 'auto', boxSizing: 'border-box', color: 'var(--text-main)', position: 'relative' };
const goalBoxStyle: React.CSSProperties = { padding: '24px', backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-subtle)' };
const goalHeaderStyle: React.CSSProperties = { fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const progressTrackStyle: React.CSSProperties = { width: '100%', height: '8px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', overflow: 'hidden' };
const requestDetailsStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', borderRadius: '16px', padding: '16px', marginBottom: '16px' };
const locationRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontSize: '16px' };
const activeTripCardStyle: React.CSSProperties = { backgroundColor: 'var(--card-bg)', borderRadius: '32px', padding: '32px', border: '1px solid var(--border-subtle)', marginTop: '20px' };
const iconBoxStyle: React.CSSProperties = { padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px' };
const radarPlaceholderStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', backgroundColor: 'rgba(0,0,0,0.02)', border: '2px dashed var(--border-subtle)', borderRadius: '32px' };
const completeButtonStyle: React.CSSProperties = { backgroundColor: '#3b82f6', color: '#fff', width: '100%', border: 'none', padding: '20px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' };

const StatCard = ({ icon, label, value }: any) => (
  <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>{icon} {label}</div>
    <div style={{ fontSize: '28px', fontWeight: '900' }}>{value}</div>
  </div>
);

const ActionBtn = ({ icon, label }: any) => (
  <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '20px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '700', padding: '16px 0' }}>
    <div style={{ padding: '10px', backgroundColor: 'var(--input-bg)', borderRadius: '12px' }}>{icon}</div>
    {label}
  </button>
);

export default DriverView;
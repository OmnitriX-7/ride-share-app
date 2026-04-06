import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, MapPin, Search, Star, CarFront, ArrowUpDown, X, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useUserStore } from './store';

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RiderView = () => {
  const { showToast } = useUserStore();
  
  const [step, setStep] = useState(1); 
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [currentDispatchId, setCurrentDispatchId] = useState<string | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<any>(null);

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<'pickup' | 'destination' | null>(null);

  const [sortBy, setSortBy] = useState<'distance' | 'fare' | 'rating'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchLandmarks = async (query: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (query.trim().length < 1) { setter([]); return; }
      const { data } = await supabase.from('landmarks').select('*').ilike('name', `%${query}%`).limit(5);
      if (data) setter(data);
    };
    if (activeField === 'pickup') fetchLandmarks(pickup, setPickupSuggestions);
    if (activeField === 'destination') fetchLandmarks(destination, setDestSuggestions);
  }, [pickup, destination, activeField]);

  const handleSearchClick = async () => {
    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      showToast("Please select valid locations from the suggestions.");
      return;
    }

    setStep(2);
    setAvailableDrivers([]);
    
    const { data: { user } } = await supabase.auth.getUser();
    let bestCoupon = null;

    if (user) {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_used', false)
        .order('discount_percent', { ascending: false })
        .limit(1);
        
      if (coupons && coupons.length > 0) {
        bestCoupon = coupons[0];
        setActiveCoupon(bestCoupon);
      } else {
        setActiveCoupon(null);
      }
    }

    const { data, error } = await supabase.rpc('get_nearby_drivers', {
      rider_lat: pickupLat,
      rider_lng: pickupLng,
      radius_km: 5.0
    });

    if (error) {
      showToast("Error finding drivers.");
      setStep(1);
    } else if (data) {
      const tripDistance = getDistanceFromLatLonInKm(pickupLat, pickupLng, destLat, destLng);
      
      const formattedDrivers = data.map((d: any) => {
        const baseAppFee = 10;
        const pickupCost = d.distance * 5;
        const tripCost = tripDistance * d.fare;
        const ratingBonus = Math.max(0, (d.rating - 4.0) * 5);
        
        const calculatedOriginalFare = Math.round(baseAppFee + pickupCost + tripCost + ratingBonus);
        
        const finalFare = bestCoupon 
          ? Math.round(calculatedOriginalFare * (1 - bestCoupon.discount_percent / 100))
          : calculatedOriginalFare;

        return {
          ...d,
          distance: parseFloat(d.distance.toFixed(2)),
          originalFare: calculatedOriginalFare,
          fare: finalFare,
          pfp: d.name ? d.name.substring(0, 2).toUpperCase() : 'DR'
        };
      });
      setAvailableDrivers(formattedDrivers);
    }
  };

  const handleRequestRide = async (driver: any) => {
    setIsRequesting(true);
    setSelectedDriver(driver);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      showToast("Error: Not logged in."); 
      setIsRequesting(false);
      return; 
    }

    const { data, error } = await supabase
      .from('ride_dispatches')
      .insert({
        rider_id: user.id,
        driver_id: driver.id,
        pickup_name: pickup,
        dropoff_name: destination,
        fare_amount: driver.fare, 
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      showToast("Failed to request ride.");
      setIsRequesting(false);
    } else {
      setCurrentDispatchId(data.id);
      setStep(3);
      setIsRequesting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (currentDispatchId) {
      await supabase.from('ride_dispatches').update({ status: 'cancelled' }).eq('id', currentDispatchId);
      setCurrentDispatchId(null);
    }
    setStep(2);
    setSelectedDriver(null);
  };

  useEffect(() => {
    if (step === 3 && currentDispatchId) {
      const dispatchSubscription = supabase
        .channel(`dispatch_${currentDispatchId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'ride_dispatches', filter: `id=eq.${currentDispatchId}` },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'accepted') {
              setStep(4);
              showToast("Driver accepted your ride!");
            } else if (newStatus === 'rejected') {
              showToast("Driver declined. Try another.");
              setStep(2);
              setCurrentDispatchId(null);
              setSelectedDriver(null);
            } else if (newStatus === 'timeout' || newStatus === 'cancelled') {
               showToast(`Request ended.`);
               setStep(2);
               setCurrentDispatchId(null);
               setSelectedDriver(null);
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(dispatchSubscription); };
    }
  }, [step, currentDispatchId, showToast]);

  // --- THE DEAD MAN'S SWITCH (Upgraded for Tab Close) ---
  useEffect(() => {
    let offlineTimeout: ReturnType<typeof setTimeout>;

    const handleBeforeUnload = () => {
      if (step === 3 && currentDispatchId) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const storedSession = localStorage.getItem('sb-' + new URL(supabaseUrl).hostname.split('.')[0] + '-auth-token');
        let token = '';
        
        if (storedSession) {
          try {
            token = JSON.parse(storedSession).access_token;
          } catch (e) {}
        }

        if (token) {
          fetch(`${supabaseUrl}/rest/v1/ride_dispatches?id=eq.${currentDispatchId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' }),
            keepalive: true
          });
        }
      }
    };

    const handleOffline = () => {
      if (step === 3 && currentDispatchId) {
        offlineTimeout = setTimeout(() => {
          showToast("Connection lost. Request cancelled.");
          handleCancelRequest();
        }, 15000);
      }
    };

    const handleOnline = () => {
      if (offlineTimeout) clearTimeout(offlineTimeout);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (offlineTimeout) clearTimeout(offlineTimeout);
    };
  }, [step, currentDispatchId]);

  const sortedDrivers = useMemo(() => {
    return [...availableDrivers].sort((a, b) => {
      let modifier = sortOrder === 'asc' ? 1 : -1;
      if (a[sortBy] < b[sortBy]) return -1 * modifier;
      if (a[sortBy] > b[sortBy]) return 1 * modifier;
      return 0;
    });
  }, [availableDrivers, sortBy, sortOrder]);

  const handleSelect = (item: any, type: 'pickup' | 'destination') => {
    if (type === 'pickup') { 
      setPickup(item.name); 
      setPickupLat(item.lat);
      setPickupLng(item.lng);
      setPickupSuggestions([]); 
    } 
    else { 
      setDestination(item.name); 
      setDestLat(item.lat);
      setDestLng(item.lng);
      setDestSuggestions([]); 
    }
    setActiveField(null);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <style>{`
        .rider-search-input { background: transparent !important; border: none !important; color: var(--text-main) !important; width: 100%; outline: none; }
        .rider-search-input::placeholder { color: var(--text-secondary) !important; }
        .suggestion-item:hover { background-color: var(--input-bg); }
        .cancel-btn:hover { background-color: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }
        .driver-list::-webkit-scrollbar { width: 6px; }
        .driver-list::-webkit-scrollbar-track { background: transparent; }
        .driver-list::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
      `}</style>

      <div className="map-placeholder" style={mapPlaceholderStyle}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '900' }}>[ Radar Active ]</div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="search" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="panel-card" style={panelStyle}>
             <div style={{ marginBottom: '28px' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Where to?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', margin: 0 }}>Select your location for CampusRide</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              <div style={inputWrapperStyle}>
                <div style={iconStyle}><Circle size={10} fill="currentColor" strokeWidth={3} /></div>
                <input placeholder="Pick up Location" value={pickup} onFocus={() => setActiveField('pickup')} onChange={(e) => setPickup(e.target.value)} className="rider-search-input" />
              </div>
              {activeField === 'pickup' && pickupSuggestions.length > 0 && (
                <div style={{ ...dropdownStyle, top: '65px' }}>
                  {pickupSuggestions.map((item) => (
                    <div key={item.id} className="suggestion-item" onClick={() => handleSelect(item, 'pickup')} style={suggestionItemStyle}>
                      <MapPin size={16} color="var(--text-secondary)" /> <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={inputWrapperStyle}>
                <div style={iconStyle}><MapPin size={18} strokeWidth={2.5} /></div>
                <input placeholder="Enter Destination" value={destination} onFocus={() => setActiveField('destination')} onChange={(e) => setDestination(e.target.value)} className="rider-search-input" />
              </div>
              {activeField === 'destination' && destSuggestions.length > 0 && (
                <div style={{ ...dropdownStyle, top: '135px' }}>
                  {destSuggestions.map((item) => (
                    <div key={item.id} className="suggestion-item" onClick={() => handleSelect(item, 'destination')} style={suggestionItemStyle}>
                      <MapPin size={16} color="var(--text-secondary)" /> <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={connectorLineStyle} />
            </div>
            <button onClick={handleSearchClick} style={{...confirmBtnStyle, opacity: (!pickupLat || !destLat) ? 0.5 : 1}} disabled={!pickupLat || !destLat}>
              <Search size={18} style={{ marginRight: '8px' }} /> Find Drivers
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="drivers" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="panel-card" style={{ ...panelStyle, width: '420px', padding: '24px' }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '700', marginBottom: '16px', padding: 0 }}>← Back</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0' }}>
                  {availableDrivers.length > 0 ? `${availableDrivers.length} Near You` : 'Scanning...'}
                </h2>
                {activeCoupon && (
                  <p style={{ color: '#10b981', fontSize: '12px', fontWeight: '700', margin: 0 }}>✓ {activeCoupon.discount_percent}% Discount Applied</p>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: '12px' }}>
                {['distance', 'fare', 'rating'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt as any)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s', backgroundColor: sortBy === opt ? 'var(--card-bg)' : 'transparent', color: sortBy === opt ? 'var(--text-main)' : 'var(--text-secondary)', boxShadow: sortBy === opt ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px' }} />
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                  <ArrowUpDown size={14} color="var(--text-main)" style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            </div>

            <div className="driver-list" style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {sortedDrivers.map((driver) => (
                <div key={driver.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: 'var(--input-bg)', borderRadius: '16px', border: activeCoupon ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                  
                  {activeCoupon && (
                    <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#10b981', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderBottomLeftRadius: '12px' }}>
                      {activeCoupon.discount_percent}% OFF
                    </div>
                  )}

                  <div style={{ marginRight: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <CarFront size={24} color="var(--accent-primary)" />
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '15px', fontWeight: '800' }}>{driver.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'var(--card-bg)', padding: '2px 6px', borderRadius: '8px' }}><Star size={10} fill="#eab308" color="#eab308" /> <span style={{ fontSize: '11px', fontWeight: '700' }}>{driver.rating}</span></div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '12px', fontWeight: '500' }}>{driver.vehicle}</p>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '11px' }}>{driver.distance} km away</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
                      {activeCoupon && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'line-through', fontWeight: '600' }}>₹{driver.originalFare}</span>
                      )}
                      <span style={{ fontSize: '20px', fontWeight: '900', color: activeCoupon ? '#10b981' : 'var(--text-main)' }}>₹{driver.fare}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleRequestRide(driver)} 
                      disabled={isRequesting} 
                      style={{ padding: '6px 20px', borderRadius: '10px', fontSize: '13px', border: 'none', cursor: 'pointer', fontWeight: '800', backgroundColor: 'var(--accent-primary)', color: '#fff', opacity: isRequesting && selectedDriver?.id !== driver.id ? 0.5 : 1 }}
                    >
                      {isRequesting && selectedDriver?.id === driver.id ? '...' : 'Request'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="waiting" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel-card" style={{ ...panelStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '50px 32px' }}>
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}><Search size={32} color="var(--accent-primary)" /></motion.div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Requesting {selectedDriver?.name}...</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '32px' }}>Waiting for driver to accept.</p>
            <button onClick={handleCancelRequest} className="cancel-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: '1.5px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}><X size={16} /> Cancel Request</button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="accepted" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel-card" style={{ ...panelStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '50px 32px' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}><CheckCircle2 size={40} color="#10b981" /></motion.div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Ride Accepted!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', margin: 0 }}><b>{selectedDriver?.name}</b> is on their way.</p>
            <button onClick={() => { setStep(1); setPickup(''); setDestination(''); setSelectedDriver(null); setActiveCoupon(null); setAvailableDrivers([]); }} style={{ marginTop: '30px', padding: '12px 24px', borderRadius: '12px', border: '1.5px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer' }}>Close</button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const mapPlaceholderStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'var(--border-subtle)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const panelStyle: React.CSSProperties = { position: 'absolute', top: '100px', left: '40px', width: '380px', borderRadius: '28px', padding: '32px', zIndex: 10, backgroundColor: 'var(--card-bg)' };
const inputWrapperStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '16px', backgroundColor: 'var(--input-bg)' };
const iconStyle: React.CSSProperties = { width: '24px', display: 'flex', justifyContent: 'center' };
const connectorLineStyle: React.CSSProperties = { position: 'absolute', left: '27px', top: '48px', height: '24px', zIndex: 1, borderLeft: '2px dashed var(--border-subtle)' };
const inputStyle: React.CSSProperties = { outline: 'none', width: '100%', fontSize: '16px', fontWeight: '600' };
const confirmBtnStyle: React.CSSProperties = { width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '800', border: 'none', marginTop: '24px', cursor: 'pointer', backgroundColor: 'var(--accent-primary)', color: '#fff' };
const dropdownStyle: React.CSSProperties = { position: 'absolute', left: 0, width: '100%', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '8px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '4px' };
const suggestionItemStyle: React.CSSProperties = { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '10px' };

export default RiderView;
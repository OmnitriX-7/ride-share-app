import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Check, X, IndianRupee, Navigation } from 'lucide-react';

interface RequestCardProps {
  request: any;
  handleResponse: (request: any, status: 'accepted' | 'rejected') => void;
  driverLocation: { lat: number; lng: number } | null;
}

export default function RequestCard({ 
  request, 
  handleResponse, 
  driverLocation 
}: RequestCardProps) {
  const [timeLeft, setTimeLeft] = useState(30);

  // 1. COUNTDOWN TIMER LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleResponse(request, 'rejected'); // Auto-reject on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request, handleResponse]);

  // 2. PRECISION DISTANCE CALCULATION (Haversine)
  const getDistanceToRider = () => {
    // These match the columns we just added to ride_dispatches
    const riderLat = request.pickup_lat;
    const riderLng = request.pickup_lng;

    if (!driverLocation || !riderLat || !riderLng) return null;
    
    const R = 6371; // Radius of Earth in km
    const dLat = (riderLat - driverLocation.lat) * (Math.PI / 180);
    const dLon = (riderLng - driverLocation.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(driverLocation.lat * (Math.PI / 180)) * Math.cos(riderLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); 
  };

  const distanceText = getDistanceToRider();

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.8, x: 50 }} 
      style={requestCardStyle}
    >
      {/* HEADER & TIMER BAR */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Incoming Request</h3>
          <span style={{ fontSize: '12px', fontWeight: '900', color: timeLeft <= 10 ? '#ef4444' : 'var(--text-secondary)' }}>
            {timeLeft}s
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 30) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{ 
              height: '100%', 
              backgroundColor: timeLeft > 10 ? '#10b981' : '#ef4444',
              boxShadow: timeLeft <= 10 ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
            }}
          />
        </div>
      </div>

      {/* RIDE DETAILS */}
      <div style={requestDetailsStyle}>
         <div style={locationRowStyle}>
            <div style={{ minWidth: '24px' }}><MapPin size={18} color="#2563eb" /></div>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>{request.pickup_name}</span>
         </div>
         
         <div style={distanceRowStyle}>
            <Navigation size={12} color="var(--text-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {distanceText ? `${distanceText} km from you` : 'Calculating distance...'}
            </span>
         </div>

         <div style={locationRowStyle}>
            <div style={{ minWidth: '24px' }}><MapPin size={18} color="#ef4444" /></div>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>{request.dropoff_name}</span>
         </div>
         
         <div style={fareRowStyle}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '13px' }}>Earnings</span>
            <span style={farePriceStyle}>
              <IndianRupee size={18} strokeWidth={3} />
              {request.fare_amount}
            </span>
         </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => handleResponse(request, 'rejected')} 
          style={rejectButtonStyle}
        >
          <X size={20} strokeWidth={3} />
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleResponse(request, 'accepted')} 
          style={acceptButtonStyle}
        >
          <Check size={20} strokeWidth={3} /> Accept Trip
        </motion.button>
      </div>
    </motion.div>
  );
}

// --- UPDATED STYLES FOR CONSISTENCY ---
const requestCardStyle: React.CSSProperties = { 
  backgroundColor: 'var(--card-bg)', 
  borderRadius: '24px', 
  padding: '20px', 
  border: '1px solid var(--border-subtle)', 
  boxShadow: '0 15px 30px rgba(0,0,0,0.08)', 
  marginBottom: '12px' 
};

const requestDetailsStyle: React.CSSProperties = { 
  backgroundColor: 'var(--input-bg)', 
  borderRadius: '16px', 
  padding: '16px', 
  marginBottom: '20px' 
};

const locationRowStyle: React.CSSProperties = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px' 
};

const distanceRowStyle: React.CSSProperties = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px', 
  paddingLeft: '22px', 
  margin: '8px 0', 
  borderLeft: '2px dashed var(--border-subtle)',
  marginLeft: '8px'
};

const fareRowStyle: React.CSSProperties = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  borderTop: '1px solid var(--border-subtle)', 
  paddingTop: '12px', 
  marginTop: '12px' 
};

const farePriceStyle: React.CSSProperties = { 
  fontSize: '24px', 
  fontWeight: '900', 
  color: '#10b981', 
  display: 'flex', 
  alignItems: 'center' 
};

const acceptButtonStyle: React.CSSProperties = { 
  backgroundColor: '#10b981', 
  color: '#fff', 
  flex: 1, 
  border: 'none', 
  padding: '16px', 
  borderRadius: '16px', 
  fontWeight: '900', 
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  gap: '8px', 
  fontSize: '15px',
  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
};

const rejectButtonStyle: React.CSSProperties = { 
  backgroundColor: 'var(--input-bg)', 
  color: '#ef4444', 
  border: '1.5px solid var(--border-subtle)', 
  padding: '16px', 
  borderRadius: '16px', 
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  width: '64px' 
};
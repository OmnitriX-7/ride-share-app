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

  // Debug: Check if the card is receiving the data
  useEffect(() => {
    console.log("Rendering Card for Request:", request.id, "Distance Calc Ready:", !!driverLocation);
  }, [request.id, driverLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleResponse(request, 'rejected');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request, handleResponse]);

  const getDistanceToRider = () => {
    // FIX: Check for multiple possible key names (pickup_lat OR pickup_latitude)
    const riderLat = request.pickup_lat || request.pickup_latitude;
    const riderLng = request.pickup_lng || request.pickup_longitude;

    if (!driverLocation || !riderLat || !riderLng) return null;
    
    const R = 6371; 
    const dLat = (riderLat - driverLocation.lat) * (Math.PI / 180);
    const dLon = (riderLng - driverLocation.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(driverLocation.lat * (Math.PI / 180)) * Math.cos(riderLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance.toFixed(1); 
  };

  const distanceText = getDistanceToRider();

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 30, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} 
      style={requestCardStyle}
    >
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900' }}>New Trip Request</h3>
        
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 30, ease: 'linear' }}
            style={{ height: '100%', backgroundColor: timeLeft > 10 ? '#10b981' : '#ef4444' }}
          />
        </div>
      </div>

      <div style={requestDetailsStyle}>
         <div style={locationRowStyle}>
            <MapPin size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: '700' }}>{request.pickup_name || 'Unknown Location'}</span>
         </div>
         
         <div style={distanceRowStyle}>
            <Navigation size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {distanceText ? `${distanceText} km away` : 'Connecting location...'}
            </span>
         </div>

         <div style={locationRowStyle}>
            <MapPin size={18} color="#ef4444" />
            <span style={{ fontWeight: '700' }}>{request.dropoff_name || 'Unknown Destination'}</span>
         </div>
         
         <div style={fareRowStyle}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '14px' }}>Expected Fare</span>
            <span style={farePriceStyle}><IndianRupee size={18} strokeWidth={3} />{request.fare_amount || 0}</span>
         </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => handleResponse(request, 'rejected')} style={rejectButtonStyle}>
          <X size={24} strokeWidth={3} />
        </button>
        <button onClick={() => handleResponse(request, 'accepted')} style={acceptButtonStyle}>
          <Check size={24} strokeWidth={3} /> Accept
        </button>
      </div>
    </motion.div>
  );
}

// --- STYLES ---
const requestCardStyle: React.CSSProperties = { backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '20px', border: '2px solid var(--accent-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', marginBottom: '10px' };
const requestDetailsStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', borderRadius: '16px', padding: '16px', marginBottom: '16px' };
const locationRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' };
const distanceRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '19px', margin: '6px 0 6px 2px', borderLeft: '2px dashed var(--border-subtle)' };
const fareRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' };
const farePriceStyle: React.CSSProperties = { fontSize: '24px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center' };
const acceptButtonStyle: React.CSSProperties = { backgroundColor: '#10b981', color: '#fff', flex: 1, border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' };
const rejectButtonStyle: React.CSSProperties = { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '2px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px' };
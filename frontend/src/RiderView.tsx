import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const RiderView = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      
      {/* 1. MAP BACKGROUND - Uses className for Dark Mode dimming */}
      <div className="map-placeholder" style={mapPlaceholderStyle}>
        <div style={{ 
          color: '#94a3b8', 
          fontSize: '14px', 
          letterSpacing: '1px', 
          textTransform: 'uppercase',
          fontWeight: '700' 
        }}>
          [ Mapbox Engine Active ]
        </div>
      </div>

      {/* 2. BOOKING PANEL (The Floating Card) */}
      <div className="panel-card" style={panelStyle}>
        <div style={{ marginBottom: '24px' }}>
          <h2 className="text-main" style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0' }}>
            Where to?
          </h2>
          <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
            Enter your destination for StateRide
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
          
          {/* Pickup Input */}
          <div className="input-wrapper" style={inputWrapperStyle}>
            <div className="icon-circle" style={iconCircleStyle('#eff6ff')}>
              <MapPin size={16} color="#2563eb" strokeWidth={2.5} />
            </div>
            <input 
              placeholder="Current Location" 
              value={pickup} 
              onChange={(e) => setPickup(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          {/* Destination Input */}
          <div className="input-wrapper" style={inputWrapperStyle}>
            <div className="icon-circle" style={iconCircleStyle('#f0fdf4')}>
              <Navigation size={16} color="#16a34a" strokeWidth={2.5} />
            </div>
            <input 
              placeholder="Enter Destination" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          {/* Decorative connector line between icons */}
          <div style={connectorLineStyle} />
        </div>

        <button 
          style={confirmBtnStyle}
          className="search-btn"
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
        >
          Search Rides
        </button>
      </div>
    </div>
  );
};

/* --- STYLES --- */

const mapPlaceholderStyle: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
  backgroundColor: '#cbd5e1', 
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  transition: 'all 0.3s ease'
};

const panelStyle: React.CSSProperties = {
  position: 'absolute', 
  top: '120px', 
  left: '40px', 
  width: '380px', 
  backgroundColor: 'white', 
  borderRadius: '28px', 
  padding: '32px', 
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
  zIndex: 10,
  transition: 'all 0.3s ease'
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  backgroundColor: '#f8fafc', 
  padding: '14px', 
  borderRadius: '16px', 
  border: '1px solid #f1f5f9',
  transition: 'all 0.3s ease'
};

const iconCircleStyle = (bg: string): React.CSSProperties => ({
  width: '32px', height: '32px', borderRadius: '10px', 
  backgroundColor: bg, display: 'flex', justifyContent: 'center', alignItems: 'center'
});

const connectorLineStyle: React.CSSProperties = {
  position: 'absolute', left: '30px', top: '48px', width: '2px', height: '24px', 
  backgroundColor: '#e2e8f0', zIndex: -1
};

const inputStyle: React.CSSProperties = { 
  border: 'none', background: 'transparent', outline: 'none', 
  width: '100%', fontSize: '15px', fontWeight: '500'
};

const confirmBtnStyle: React.CSSProperties = {
  width: '100%', padding: '18px', borderRadius: '16px', backgroundColor: '#0f172a', 
  color: 'white', fontWeight: '700', border: 'none', marginTop: '24px', 
  cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '16px'
};

export default RiderView;
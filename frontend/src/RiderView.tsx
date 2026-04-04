import React, { useState } from 'react';
import { Circle, MapPin, Search } from 'lucide-react';

const RiderView = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* 1. MAP BACKGROUND - Dims automatically via .dark .map-placeholder in CSS */}
      <div className="map-placeholder" style={mapPlaceholderStyle}>
        <div style={{ 
          color: '#64748b', 
          fontSize: '12px', 
          letterSpacing: '2px', 
          textTransform: 'uppercase',
          fontWeight: '900' 
        }}>
          [ Map Engine Active ]
        </div>
      </div>

      {/* 2. BOOKING PANEL - Pinned to the Left Side */}
      <div className="panel-card" style={panelStyle}>
        <div style={{ marginBottom: '28px' }}>
          <h2 className="text-main" style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Where to?
          </h2>
          <p className="text-secondary" style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
            Enter your destination for CampusRide
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
          
          {/* Pickup Input - .text-main ensures bright white text in dark mode */}
          <div className="bg-loc-start" style={inputWrapperStyle}>
            <div className="loc-start" style={iconStyle}>
              <Circle size={10} fill="currentColor" strokeWidth={3} />
            </div>
            <input 
              placeholder="Current Location" 
              value={pickup} 
              onChange={(e) => setPickup(e.target.value)} 
              className="text-main"
              style={inputStyle} 
            />
          </div>

          {/* Destination Input */}
          <div className="bg-loc-dest" style={inputWrapperStyle}>
            <div className="loc-dest" style={iconStyle}>
              <MapPin size={18} strokeWidth={2.5} />
            </div>
            <input 
              placeholder="Enter Destination" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              className="text-main"
              style={inputStyle} 
            />
          </div>

          {/* Decorative connector dashed line - Style handled by .loc-line class */}
          <div className="loc-line" style={connectorLineStyle} />
        </div>

        {/* This button stays Blue in both modes via .search-btn in CSS */}
        <button className="search-btn" style={confirmBtnStyle}>
          <Search size={18} style={{ marginRight: '8px' }} />
          Search Rides
        </button>
      </div>
    </div>
  );
};

/* --- STYLES --- */

const mapPlaceholderStyle: React.CSSProperties = {
  position: 'absolute', 
  top: 0, 
  left: 0, 
  width: '100%', 
  height: '100%', 
  backgroundColor: '#e2e8f0', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  transition: 'background-color 0.4s ease'
};

const panelStyle: React.CSSProperties = {
  position: 'absolute', 
  top: '120px', 
  left: '40px', 
  width: '380px', 
  borderRadius: '28px', 
  padding: '32px', 
  zIndex: 10,
  transition: 'transform 0.3s ease, background-color 0.3s ease'
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '14px', 
  padding: '16px', 
  borderRadius: '16px', 
  transition: 'all 0.2s ease',
  border: '1.5px solid transparent' // Allows the CSS border-color to show
};

const iconStyle: React.CSSProperties = {
  width: '24px', 
  display: 'flex', 
  justifyContent: 'center'
};

const connectorLineStyle: React.CSSProperties = {
  position: 'absolute', 
  left: '27px', 
  top: '48px', 
  height: '24px', 
  zIndex: 1
};

const inputStyle: React.CSSProperties = { 
  border: 'none', 
  background: 'transparent', 
  outline: 'none', 
  width: '100%', 
  fontSize: '16px', 
  fontWeight: '600'
};

const confirmBtnStyle: React.CSSProperties = {
  width: '100%', 
  padding: '18px', 
  borderRadius: '16px', 
  fontWeight: '800', 
  border: 'none', 
  marginTop: '24px', 
  cursor: 'pointer', 
  fontSize: '16px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center'
};

export default RiderView;
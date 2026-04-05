import React, { useState } from 'react';
import { Circle, MapPin, Search } from 'lucide-react';

const RiderView = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* 1. COMPONENT STYLES - Protects these inputs from global index.css rules */}
      <style>{`
        .rider-search-input {
          background: transparent !important;
          border: none !important;
          color: var(--text-main) !important;
        }
        .rider-search-input::placeholder {
          color: var(--text-secondary) !important;
        }
      `}</style>

      {/* 2. MAP BACKGROUND - Now dynamically uses CSS Variables */}
      <div className="map-placeholder" style={mapPlaceholderStyle}>
        <div style={{ 
          color: 'var(--text-secondary)', // Replaced hardcoded gray
          fontSize: '12px', 
          letterSpacing: '2px', 
          textTransform: 'uppercase',
          fontWeight: '900' 
        }}>
          [ Map Engine Active ]
        </div>
      </div>

      {/* 3. BOOKING PANEL */}
      <div className="panel-card" style={panelStyle}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Where to?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', margin: 0 }}>
            Enter your destination for CampusRide
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
          
          {/* Pickup Input */}
          <div className="bg-loc-start" style={inputWrapperStyle}>
            <div className="loc-start" style={iconStyle}>
              <Circle size={10} fill="currentColor" strokeWidth={3} />
            </div>
            <input 
              placeholder="Pick up Location" 
              value={pickup} 
              onChange={(e) => setPickup(e.target.value)} 
              className="rider-search-input" // Applies our protected styles
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
              className="rider-search-input" // Applies our protected styles
              style={inputStyle} 
            />
          </div>

          {/* Decorative connector dashed line */}
          <div className="loc-line" style={connectorLineStyle} />
        </div>

        {/* Search Button */}
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
  backgroundColor: 'var(--border-subtle)', // FIX: Removed hardcoded '#e2e8f0'
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  transition: 'background-color 0.3s ease'
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
  border: '1.5px solid transparent'
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
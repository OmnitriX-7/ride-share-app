import React, { useState } from 'react';
import { 
  User, MapPin, Navigation, Search, 
  Settings, LogOut, CreditCard, Clock, 
  Star, Filter, Car, ChevronDown 
} from 'lucide-react';
import { supabase } from './supabaseClient';

const Home = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('price');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. MAP PLACEHOLDER (Background) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
          src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4194,37.7749,12/1200x800?access_token=dummy" 
          alt="Map Background" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
        />
        <div style={{ position: 'absolute', color: '#64748b', fontWeight: 'bold' }}>[ Mapbox Integration Point ]</div>
      </div>

      {/* 2. TOP NAVBAR */}
      <header style={{ position: 'absolute', top: 0, width: '100%', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', zIndex: 100 }}>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb', backgroundColor: 'white', padding: '5px 15px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          CAMPUS<span style={{ color: '#0f172a' }}>RIDE</span>
        </div>

        {/* Profile Dropdown Container */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#2563eb', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden' }}
          >
            <User color="white" size={24} />
          </button>

          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '55px', right: 0, width: '220px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button style={dropdownItemStyle}><User size={18} /> My Profile</button>
              <button style={dropdownItemStyle}><Clock size={18} /> Trip History</button>
              <button style={dropdownItemStyle}><Settings size={18} /> Settings</button>
              <hr style={{ border: '0.5px solid #f1f5f9', margin: '5px 0' }} />
              <button onClick={handleLogout} style={{ ...dropdownItemStyle, color: '#ef4444' }}><LogOut size={18} /> Sign Out</button>
            </div>
          )}
        </div>
      </header>

      {/* 3. BOOKING PANEL (Floating Sidebar) */}
      <div style={{ position: 'absolute', top: '100px', left: '30px', width: '380px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '25px', zIndex: 90, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Where to?</h2>
        
        {/* Search Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
          <div style={inputWrapperStyle}>
            <MapPin size={18} color="#2563eb" />
            <input 
              placeholder="Current Location" 
              value={pickup} 
              onChange={(e) => setPickup(e.target.value)} 
              style={inputStyle}
            />
          </div>
          <div style={inputWrapperStyle}>
            <Navigation size={18} color="#16a34a" />
            <input 
              placeholder="Enter Destination" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              style={inputStyle}
            />
          </div>
          {/* Vertical line between icons */}
          <div style={{ position: 'absolute', left: '21px', top: '35px', width: '2px', height: '20px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
          {['price', 'distance', 'rating'].map((f) => (
            <button 
              key={f}
              onClick={() => setSelectedFilter(f)}
              style={{ 
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', cursor: 'pointer',
                backgroundColor: selectedFilter === f ? '#2563eb' : '#f1f5f9',
                color: selectedFilter === f ? 'white' : '#64748b',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              {f === 'price' && 'Lowest Price'}
              {f === 'distance' && 'Nearest'}
              {f === 'rating' && 'Top Rated'}
            </button>
          ))}
        </div>

        {/* Driver List Placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          <DriverCard name="Campus Eco" price="₹45" eta="3 min" icon="🚗" />
          <DriverCard name="Campus Pro" price="₹80" eta="1 min" icon="🚐" />
          <DriverCard name="Bike Buddy" price="₹25" eta="5 min" icon="🏍️" />
        </div>

        <button style={{ width: '100%', padding: '16px', borderRadius: '14px', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
          Confirm Booking
        </button>
      </div>

      {/* 4. QUICK ACTIONS (Bottom Right) */}
      <div style={{ position: 'absolute', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button style={actionBtnStyle} title="My Location"><Navigation size={20} /></button>
        <button style={{ ...actionBtnStyle, backgroundColor: '#ef4444', color: 'white' }} title="SOS"><Star size={20} /></button>
      </div>

    </div>
  );
};

// Sub-components for cleaner code
const DriverCard = ({ name, price, eta, icon }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{name}</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>{eta} away</div>
      </div>
    </div>
    <div style={{ fontWeight: '900', color: '#0f172a' }}>{price}</div>
  </div>
);

// CSS Objects
const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', border: 'none', backgroundColor: 'transparent',
  textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', color: '#334155', fontWeight: '500', transition: 'background 0.2s'
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
};

const inputStyle: React.CSSProperties = {
  border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#1e293b'
};

const actionBtnStyle: React.CSSProperties = {
  width: '50px', height: '50px', borderRadius: '15px', border: 'none', backgroundColor: 'white', color: '#1e293b',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
};

export default Home;
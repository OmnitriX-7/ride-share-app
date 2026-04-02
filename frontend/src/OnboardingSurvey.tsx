import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import LoadingScreen from './LoadingScreen'; 
import { useUserStore } from './store'; // Import the Zustand store

export default function OnboardingSurvey() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  // Zustand: Get the setter to update global state
  const setHasProfile = useUserStore((state) => state.setHasProfile);

  const [step, setStep] = useState(1);
  const [fullname, setFullname] = useState('');
  const [phoneNo, setPhoneNo] = useState<string | undefined>('');
  const [role, setRole] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // Protect the route if userId is missing (user didn't come from Auth)
  if (!userId) {
    navigate('/');
    return null;
  }

  // --- VALIDATION LOGIC ---

  const validateName = () => {
    if (!fullname.trim()) return false;
    const isCapitalized = /^[A-Z]/.test(fullname.trim());
    if (!isCapitalized) {
      setError("Name must start with a Capital letter.");
      return false;
    }
    setError("");
    return true;
  };

  const validatePhone = () => {
    if (!phoneNo || !isValidPhoneNumber(phoneNo)) {
      setError("Please enter a valid phone number.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateName()) return;
    if (step === 2 && !validatePhone()) return;
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          fullname: fullname.trim(),
          phoneNo, 
          role
        }),
      });

      if (response.ok) {
        // 1. Trigger Global State Update (The Zustand Magic)
        // This tells App.tsx immediately that the user now has a profile
        setHasProfile(true);

        // 2. Set UI status to loading for the Car Animation
        setStatusMessage('loading'); 
        
        // 3. Wait for animation then navigate home
        setTimeout(() => {
          navigate('/home');
        }, 3200); 
      } else {
        setStatusMessage('Error saving profile. Please try again.');
      }
    } catch (err) {
      setStatusMessage('Network error occurred.');
    }
  };

  // --- CONDITIONAL RENDERING ---

  if (statusMessage === 'loading') {
    return <LoadingScreen />;
  }

  if (statusMessage && statusMessage !== 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
        <h2 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>{statusMessage}</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px', marginBottom: '30px', overflow: 'hidden' }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s ease' }} />
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>{error}</p>}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>What is your full name?</h2>
            <input
              type="text"
              value={fullname}
              onChange={(e) => { setFullname(e.target.value); setError(''); }}
              placeholder="e.g. John Doe"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
            />
            <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Contact Details</h2>
            <div className="phone-container">
              <PhoneInput
                international
                defaultCountry="IN"
                value={phoneNo}
                onChange={(val) => { setPhoneNo(val); setError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}
              />
            </div>
            <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              Verify & Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Final Step: Your Role</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setRole('rider')} 
                style={{ 
                  flex: 1, padding: '20px', borderRadius: '12px', 
                  border: role === 'rider' ? '2px solid #2563eb' : '2px solid #e2e8f0', 
                  backgroundColor: role === 'rider' ? '#eff6ff' : 'white', 
                  fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' 
                }}
              >
                🚗 Rider
              </button>
              <button 
                onClick={() => setRole('driver')} 
                style={{ 
                  flex: 1, padding: '20px', borderRadius: '12px', 
                  border: role === 'driver' ? '2px solid #2563eb' : '2px solid #e2e8f0', 
                  backgroundColor: role === 'driver' ? '#eff6ff' : 'white', 
                  fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' 
                }}
              >
                🛠️ Driver
              </button>
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={!role} 
              style={{ 
                padding: '14px', borderRadius: '12px', border: 'none', 
                backgroundColor: role ? '#16a34a' : '#94a3b8', 
                color: 'white', fontWeight: 'bold', 
                cursor: role ? 'pointer' : 'not-allowed', marginTop: '10px' 
              }}
            >
              Complete Setup
            </button>
          </div>
        )}
      </div>

      <style>{`
        .PhoneInputInput {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          font-size: 15px !important;
          margin-left: 10px;
          width: 100%;
        }
        .PhoneInputCountry {
          margin-right: 5px;
        }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import LoadingScreen from './LoadingScreen'; 
import { useUserStore } from './store'; 
import { supabase } from './supabaseClient';

export default function OnboardingSurvey() {
  const navigate = useNavigate();
  const setHasProfile = useUserStore((state) => state.setHasProfile);

  const [step, setStep] = useState(1);
  const [fullname, setFullname] = useState('');
  const [phoneNo, setPhoneNo] = useState<string | undefined>('');
  const [role, setRole] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // We don't need a profile check here because App.tsx already 
  // acts as the gatekeeper. If the user is here, they need a profile.

  const validateName = () => {
    if (!fullname.trim()) return false;
    const isCapitalized = /^[A-Z]/.test(fullname.trim());
    if (!isCapitalized) {
      setError("Please capitalize the first letter of your name.");
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
      // 1. Show the Car Animation immediately
      setStatusMessage('loading');

      // 2. Call the SQL Function
      const { error: rpcError } = await supabase.rpc('complete_onboarding', {
        user_full_name: fullname.trim(),
        user_phone: phoneNo,
        user_role: role
      });

      if (rpcError) {
        console.error("Onboarding Error:", rpcError.message);
        setStatusMessage('Error saving profile. Please try again.');
        return;
      }

      // 3. WAIT for the car animation to reach the finish line (3.2 seconds)
      setTimeout(() => {
        // 4. Update Zustand. App.tsx will see this and move user to /home
        setHasProfile(true);
      }, 3200); 

    } catch (err) {
      console.error('Submission error:', err);
      setStatusMessage('Network error occurred.');
    }
  };

  if (statusMessage === 'loading') {
    return <LoadingScreen />;
  }

  if (statusMessage && statusMessage !== 'loading') {
    return (
      <div className="force-light" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '30px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>{statusMessage}</h2>
          <button 
            onClick={() => setStatusMessage('')} 
            style={{ padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', border: '1.5px solid #e2e8f0', backgroundColor: 'white', fontWeight: '700' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="force-light" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04)', width: '100%', maxWidth: '400px', border: '1px solid #f1f5f9' }}>
        
        {/* Progress bar stays in sync with steps */}
        <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginBottom: '32px', overflow: 'hidden' }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: '600' }}>{error}</p>}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Your Name</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>How should we address you?</p>
            </div>
            <input
              type="text"
              value={fullname}
              onChange={(e) => { setFullname(e.target.value); setError(''); }}
              placeholder="Full Name"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box', color: '#1e293b' }}
            />
            <button onClick={handleNext} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Phone Number</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Used for ride coordination</p>
            </div>
            <div className="phone-container">
              <PhoneInput
                international
                defaultCountry="IN"
                value={phoneNo}
                onChange={(val) => { setPhoneNo(val); setError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}
              />
            </div>
            <button onClick={handleNext} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              Verify & Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>I want to...</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>You can change this later</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setRole('rider')} 
                style={{ 
                  flex: 1, padding: '24px 16px', borderRadius: '16px', 
                  border: role === 'rider' ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0', 
                  backgroundColor: role === 'rider' ? '#eff6ff' : 'white', 
                  color: role === 'rider' ? '#2563eb' : '#64748b',
                  fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px'
                }}
              >
                Rider
              </button>
              <button 
                onClick={() => setRole('driver')} 
                style={{ 
                  flex: 1, padding: '24px 16px', borderRadius: '16px', 
                  border: role === 'driver' ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0', 
                  backgroundColor: role === 'driver' ? '#eff6ff' : 'white', 
                  color: role === 'driver' ? '#2563eb' : '#64748b',
                  fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px'
                }}
              >
                Driver
              </button>
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={!role} 
              style={{ 
                padding: '16px', borderRadius: '14px', border: 'none', 
                backgroundColor: role ? '#16a34a' : '#94a3b8', 
                color: 'white', fontWeight: '800', 
                cursor: role ? 'pointer' : 'not-allowed', marginTop: '8px', transition: 'all 0.2s'
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
          color: #1e293b !important;
        }
        .PhoneInputCountryIcon {
          width: 24px !important;
          height: 18px !important;
        }
      `}</style>
    </div>
  );
}
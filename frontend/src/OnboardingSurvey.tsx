import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import LoadingScreen from './LoadingScreen'; 
import { useUserStore } from './store'; 
import { supabase } from './supabaseClient';

export default function OnboardingSurvey() {
  const navigate = useNavigate();
  const { setProfile, setHasProfile } = useUserStore();

  const [step, setStep] = useState(1);
  const [fullname, setFullname] = useState('');
  const [phoneNo, setPhoneNo] = useState<string | undefined>('');
  const [role, setRole] = useState<'rider' | 'driver' | ''>('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  
  const [isResuming, setIsResuming] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkResumeState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone_number, role, onboarded')
          .eq('id', user.id)
          .single();

        if (data) {
          if (data.full_name) setFullname(data.full_name);
          if (data.phone_number) setPhoneNo(data.phone_number);
          
          if (data.role === 'driver' && data.onboarded === false) {
            setRole('driver');
            setIsResuming(true);
            setStep(4);
          } else if (data.onboarded === true) {
            navigate('/home', { replace: true });
          }
        }
      }
    };
    checkResumeState();
  }, [navigate]);

  if (statusMessage === 'loading') {
    return <LoadingScreen />;
  }

  const lightThemeVars: React.CSSProperties = {
    // @ts-ignore
    '--bg-main': '#f8fafc',
    '--card-bg': '#ffffff',
    '--text-main': '#0f172a',
    '--text-secondary': '#64748b',
    '--border-subtle': '#e2e8f0',
    '--input-bg': '#ffffff',
  };

  const validateName = () => {
    if (!fullname.trim()) {
      setError("Please enter your name.");
      return false;
    }
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

  const handleBack = () => {
    if (step > 1 && !(step === 4 && isResuming)) {
      setError("");
      setStep(step - 1);
    }
  };

  const handleBasicSubmit = async () => {
    if (!role) return;
    
    try {
      setStatusMessage('loading');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session found");

      const { error: rpcError } = await supabase.rpc('save_basic_profile', {
        user_full_name: fullname.trim(),
        user_phone: phoneNo,
        user_role: role
      });

      if (rpcError) throw rpcError;

      if (role === 'rider') {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('id', user.id);
        
        if (updateErr) throw updateErr;

        setProfile({
          id: user.id,
          full_name: fullname.trim(),
          role: 'rider',
          onboarded: true
        });
        setHasProfile(true); 
        navigate('/home', { replace: true });
      } else {
        setStatusMessage('');
        setStep(4);
      }

    } catch (err) {
      console.error(err);
      setStatusMessage('Error saving profile. Try again.');
    }
  };

  const handleDriverSubmit = async () => {
    if (!vehicleModel.trim() || !plateNumber.trim()) {
      setError("Please fill in both vehicle details.");
      return;
    }

    try {
      setStatusMessage('loading');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session found");

      // 1. Save vehicle details
      const { error: rpcError } = await supabase.rpc('complete_driver_profile', {
        v_model: vehicleModel.trim(),
        v_plate: plateNumber.trim().toUpperCase()
      });

      if (rpcError) throw rpcError;

      // 2. Request initial location for the drivers table
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await supabase.from('drivers').update({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            status: 'offline'
          }).eq('id', user.id);
        });
      }

      setProfile({
        id: user.id,
        full_name: fullname.trim(),
        role: 'driver',
        onboarded: true
      });
      setHasProfile(true); 
      navigate('/home', { replace: true });

    } catch (err) {
      console.error(err);
      setStatusMessage('Error saving vehicle details.');
    }
  };

  const wrapperStyle: React.CSSProperties = {
    ...lightThemeVars,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'var(--bg-main)',
    padding: '20px',
    color: 'var(--text-main)',
    boxSizing: 'border-box'
  };

  const totalSteps = 4;

  if (statusMessage && statusMessage !== 'loading') {
    return (
      <div style={wrapperStyle}>
        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--card-bg)', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>{statusMessage}</h2>
          <button 
            onClick={() => setStatusMessage('')} 
            style={{ padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', border: '1.5px solid var(--border-subtle)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', fontWeight: '700' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '40px', borderRadius: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-subtle)', position: 'relative' }}>
        
        {step > 1 && !(step === 4 && isResuming) && (
          <button 
            onClick={handleBack}
            style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            ← Back
          </button>
        )}

        <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginBottom: '32px', overflow: 'hidden', marginTop: step > 1 ? '10px' : '0' }}>
          <div style={{ width: `${(step / totalSteps) * 100}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '20px', textAlign: 'center', fontWeight: '700', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2' }}>
            {error}
          </p>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Your Name</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>How should we address you?</p>
            </div>
            <input
              type="text"
              value={fullname}
              onChange={(e) => { setFullname(e.target.value); setError(''); }}
              placeholder="Full Name"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: error && !fullname.trim() ? '1.5px solid #ef4444' : '1.5px solid var(--border-subtle)', fontSize: '15px', outline: 'none', backgroundColor: 'var(--input-bg)', boxSizing: 'border-box', color: 'var(--text-main)' }}
            />
            <button onClick={handleNext} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Phone Number</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Used for ride coordination</p>
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
                  border: error.includes('phone') ? '1.5px solid #ef4444' : '1.5px solid var(--border-subtle)',
                  backgroundColor: 'var(--input-bg)'
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
              <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>I want to...</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Choose your mode</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setRole('rider')} 
                style={{ flex: 1, padding: '24px 16px', borderRadius: '16px', border: role === 'rider' ? '2.5px solid #2563eb' : '1.5px solid var(--border-subtle)', backgroundColor: role === 'rider' ? '#eff6ff' : 'var(--card-bg)', color: role === 'rider' ? '#2563eb' : 'var(--text-secondary)', fontWeight: '800', cursor: 'pointer' }}
              >Rider</button>
              <button 
                onClick={() => setRole('driver')} 
                style={{ flex: 1, padding: '24px 16px', borderRadius: '16px', border: role === 'driver' ? '2.5px solid #2563eb' : '1.5px solid var(--border-subtle)', backgroundColor: role === 'driver' ? '#eff6ff' : 'var(--card-bg)', color: role === 'driver' ? '#2563eb' : 'var(--text-secondary)', fontWeight: '800', cursor: 'pointer' }}
              >Driver</button>
            </div>
            <button 
              onClick={handleBasicSubmit} 
              disabled={!role} 
              style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: role ? '#16a34a' : '#94a3b8', color: 'white', fontWeight: '800', cursor: role ? 'pointer' : 'not-allowed' }}
            >
              {role === 'driver' ? 'Next: Vehicle Details' : 'Complete Setup'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Vehicle Details</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Just a few more details</p>
            </div>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => { setVehicleModel(e.target.value); setError(''); }}
              placeholder="Vehicle Model (e.g., Maruti Alto)"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--border-subtle)', fontSize: '15px', outline: 'none', backgroundColor: 'var(--input-bg)', boxSizing: 'border-box', color: 'var(--text-main)' }}
            />
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => { setPlateNumber(e.target.value.toUpperCase()); setError(''); }}
              placeholder="License Plate (e.g., AS-11-AA-1234)"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid var(--border-subtle)', fontSize: '15px', outline: 'none', backgroundColor: 'var(--input-bg)', boxSizing: 'border-box', color: 'var(--text-main)', textTransform: 'uppercase' }}
            />
            <button onClick={handleDriverSubmit} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: '800', cursor: 'pointer' }}>
              Complete Driver Setup
            </button>
          </div>
        )}

      </div>

      <style>{`
        .PhoneInputInput { border: none !important; outline: none !important; background: transparent !important; font-size: 15px !important; margin-left: 10px; width: 100%; color: var(--text-main) !important; }
        .PhoneInputCountryIcon { width: 24px !important; height: 18px !important; }
        .PhoneInputCountrySelect { background-color: var(--input-bg) !important; color: var(--text-main) !important; }
      `}</style>
    </div>
  );
}
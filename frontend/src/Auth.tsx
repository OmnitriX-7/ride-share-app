import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Car, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateEmail, validatePassword } from './utils/validation'; 

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    // 1. Client-side Validation (Frontend)
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      // Shows: Password must be at least 8 characters long and include an uppercase letter, a number, and a symbol.
      setMessage(passwordCheck.message);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          setMessage('Error: ' + error.message);
        } else {
          setMessage('Login successful. Verifying...');
          
          try {
            const response = await fetch('http://localhost:5000/api/users/profile', {
              headers: { 'user-id': data.user.id }
            });

            const backendData = await response.json();

            if (response.status === 403 && backendData.trap) {
              navigate('/onboarding', { state: { userId: data.user.id } });
            } else if (response.ok) {
              navigate('/home');
            } else {
              setMessage('Error: Profile verification failed.');
            }
          } catch (backendErr) {
            setMessage('Error: Backend unreachable. Check port 5000.');
          }
        }
      } else {
        const response = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, confirmPassword })
        });

        const result = await response.json();

        if (!response.ok) {
          setMessage('Error: ' + (result.message || 'Registration failed'));
        } else {
          // --- REGISTRATION SUCCESS LOGIC ---
          setMessage('Account created! Please sign in with your details.');
          setIsLogin(true);
          
          // Clear all fields so Login page is fresh
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setShowPassword(false);
          setShowConfirmPassword(false);
        }
      }
    } catch (err: any) {
      setMessage('Error: Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 45px 12px 40px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    color: '#1e293b'
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '38px',
    color: '#94a3b8',
    pointerEvents: 'none'
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', backgroundColor: '#f8fafc',
      fontFamily: '"Inter", sans-serif', padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          backgroundColor: 'white', padding: '48px 40px', borderRadius: '28px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)', 
          border: '1px solid #f1f5f9', width: '100%', maxWidth: '440px' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '60px', height: '60px', borderRadius: '18px', 
            backgroundColor: '#eff6ff', color: '#2563eb', marginBottom: '20px'
          }}>
            <Car size={32} strokeWidth={2.5} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.025em' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            {isLogin ? 'Enter your details to access CampusRide' : 'Join the most reliable campus network'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={inputContainerStyle}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Email Address</label>
            <Mail size={18} style={iconStyle} />
            <input 
              type="email" placeholder="" value={email} 
              onChange={(e) => setEmail(e.target.value)} required 
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={inputContainerStyle}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Password</label>
            <Lock size={18} style={iconStyle} />
            <input 
              type={showPassword ? "text" : "password"} placeholder=""
              value={password} onChange={(e) => setPassword(e.target.value)} required 
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button 
              type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', right: '14px', top: '36px',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={inputContainerStyle}
              >
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Confirm Password</label>
                <Lock size={18} style={iconStyle} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} placeholder=""
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                  style={inputStyle}
                />
                <button 
                  type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: 'absolute', right: '14px', top: '36px',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" disabled={loading}
            style={{ 
              padding: '14px', borderRadius: '12px', border: 'none', 
              backgroundColor: '#0f172a', color: 'white', 
              fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s ease', marginTop: '8px'
            }}
          >
            {loading ? 'Working...' : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              marginTop: '24px', padding: '12px', borderRadius: '10px', fontSize: '13px', textAlign: 'center', fontWeight: '500',
              backgroundColor: message.includes('Error') || message.includes('match') || message.includes('at least') ? '#fef2f2' : '#f0fdf4', 
              color: message.includes('Error') || message.includes('match') || message.includes('at least') ? '#b91c1c' : '#15803d', 
              border: `1px solid ${message.includes('Error') || message.includes('match') || message.includes('at least') ? '#fee2e2' : '#dcfce7'}`
            }}
          >
            {message}
          </motion.div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
              style={{ 
                background: 'none', border: 'none', color: '#2563eb', 
                cursor: 'pointer', fontWeight: '600', padding: 0, marginLeft: '4px'
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
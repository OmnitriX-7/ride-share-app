import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (!isLogin && password !== confirmPassword) {
      setMessage('Error: Passwords do not match')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        if (error) setMessage('Error: ' + error.message)
        else setMessage('Success! You are logged in.')
      } else {
        const response = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, confirmPassword })
        })

        const result = await response.json()

        if (!response.ok) {
          const errorMessage = result.message || 'Registration failed'
          setMessage('Error: ' + errorMessage)
        } else {
          setMessage('Registration Success! You can now log in.')
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      setMessage('Network Error: Check if backend is running on port 5000')
    } finally {
      setLoading(false)
    }
  }

  // Common styles for inputs to keep code clean
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f1f5f9', // Softer blue-grey background
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Join the Ride'}
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            {isLogin ? 'Enter your details to access your account' : 'Start your journey with us today'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>Email Address</label>
            <input 
              type="text" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginLeft: '4px' }}>Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '14px', 
              borderRadius: '12px', 
              border: 'none', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              marginTop: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#1d4ed8' }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.backgroundColor = '#2563eb' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '24px', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            backgroundColor: message.includes('Error') ? '#fff1f2' : '#f0fdf4', 
            color: message.includes('Error') ? '#e11d48' : '#16a34a', 
            textAlign: 'center', 
            fontSize: '14px', 
            fontWeight: '500', 
            border: '1px solid',
            borderColor: message.includes('Error') ? '#ffe4e6' : '#dcfce7',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={{ color: '#2563eb', fontWeight: '700' }}>
              {isLogin ? "Sign up" : "Log in"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
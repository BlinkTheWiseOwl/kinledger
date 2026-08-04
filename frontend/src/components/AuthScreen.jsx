import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../utils/storage';

const BlueShield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22V2Z" fill="#60a5fa"/>
    <path d="M12 2V22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" fill="#2563eb"/>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" stroke="#d4af37" strokeWidth="0.75" strokeLinejoin="round"/>
  </svg>
);

export default function AuthScreen({ onAuthSuccess, showStatus, onShowPolicy }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentInfo, setShowConsentInfo] = useState(false);
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const [useFallbackGoogle, setUseFallbackGoogle] = useState(false);

  React.useEffect(() => {
    // Dynamic loading of Google Identity Services library
    const scriptId = 'google-gsi-script';
    let script = document.getElementById(scriptId);

    const initializeGoogleSignIn = () => {
      try {
        if (window.google && window.google.accounts) {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-placeholder.apps.googleusercontent.com';
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: true,
          });

          setGoogleSdkLoaded(true);
        } else if (!import.meta.env.PROD) {
          setUseFallbackGoogle(true);
        }
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
        if (!import.meta.env.PROD) {
          setUseFallbackGoogle(true);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        if (!import.meta.env.PROD) {
          setUseFallbackGoogle(true);
        } else {
          setError('Google Sign-In failed to load. Please check your internet connection.');
        }
      };
      document.body.appendChild(script);
    } else if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    }

    // Fallback trigger if SDK doesn't load/respond within 2.5 seconds (e.g. offline, local dev, emulator)
    const timeout = setTimeout(() => {
      if ((!window.google || !window.google.accounts) && !import.meta.env.PROD) {
        setUseFallbackGoogle(true);
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  // Render Google Sign-in button when SDK loaded
  React.useEffect(() => {
    if (googleSdkLoaded && window.google && window.google.accounts) {
      const container = document.getElementById('google-signin-btn');
      if (container) {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: container.offsetWidth || 300,
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'pill'
        });
      }
    }
  }, [googleSdkLoaded, isLogin]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('Google login failed: no credentials returned.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed.');
      }

      localStorage.setItem('kinledger_jwt_token', data.token);
      localStorage.setItem('kinledger_user_email', data.user.email);
      showStatus('Logged in with Google successfully!', 'success');
      onAuthSuccess(data.token, data.user.email);
    } catch (err) {
      setError(err.message || 'Google Auth server communication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackGoogleSignIn = async () => {
    if (import.meta.env.PROD) {
      setError('Mock Google authentication is disabled in production.');
      return;
    }
    const targetEmail = prompt('Enter your Google Email Address to authenticate (Dev Offline Mode):');
    if (!targetEmail || targetEmail.trim() === '') return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: 'mock-google-token',
          email: targetEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Login failed.');
      }

      localStorage.setItem('kinledger_jwt_token', data.token);
      localStorage.setItem('kinledger_user_email', data.user.email);
      showStatus('Logged in with Google (Dev Fallback) successfully!', 'success');
      onAuthSuccess(data.token, data.user.email);
    } catch (err) {
      setError(err.message || 'Google Auth server communication failed.');
    } finally {
      setLoading(false);
    }
  };


  const containsUnsafeChars = (text) => {
    if (!text) return false;
    return /[<>"\\`;|]/.test(String(text));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (containsUnsafeChars(email)) {
      setError('Email contains unsafe characters.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isLogin && !consentChecked) {
      setError('You must consent to data processing and terms.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Store token and email
      localStorage.setItem('kinledger_jwt_token', data.token);
      localStorage.setItem('kinledger_user_email', data.user.email);
      
      showStatus(
        isLogin ? 'Logged in successfully!' : 'Account registered successfully!', 
        'success'
      );
      
      onAuthSuccess(data.token, data.user.email);
    } catch (err) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animated">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <BlueShield size={32} />
            <h1>KinLedger</h1>
          </div>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to access your family emergency profiles' 
              : 'Create an account to securely document emergency details'}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="auth-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="form-group animated">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-confirm-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group-checkbox animated" style={{ margin: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <label className="checkbox-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span className="checkbox-label" style={{ fontSize: '0.85rem', color: '#a0aec0', lineHeight: '1.35' }}>
                    I agree to the KinLedger{' '}
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); onShowPolicy && onShowPolicy('privacy'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontWeight: '600', display: 'inline' }}
                    >
                      Privacy Policy
                    </button>
                    {' '}and{' '}
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); onShowPolicy && onShowPolicy('terms'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontWeight: '600', display: 'inline' }}
                    >
                      Terms of Service
                    </button>
                    {', and consent to the secure storage of my family\'s medical information under the Indian DPDP Act 2023.'}{' '}
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setShowConsentInfo(!showConsentInfo); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontSize: '0.8rem', display: 'inline', marginLeft: '4px' }}
                    >
                      {showConsentInfo ? 'Hide Details' : 'Learn More'}
                    </button>
                  </span>
                </label>
                
                {showConsentInfo && (
                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>DPDP Consent Information Notice:</strong>
                    <ul style={{ paddingLeft: '15px', margin: '0 0 10px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li><strong>Data Collected</strong>: Family names, age, blood group, chronic medical conditions, critical allergies, medication names/dosages, and emergency contacts.</li>
                      <li><strong>Purpose</strong>: To securely save your health card profiles in our database so they can be instantly fetched during emergencies and shared collaboratively among family members.</li>
                      <li><strong>Security</strong>: Sensitive medical conditions, allergies, medications, and insurance numbers are fully encrypted at rest using AES-256-CBC.</li>
                      <li><strong>Your Rights</strong>: You hold the absolute right to correct, share, revoke sharing access, or permanently delete your account and all associated profiles at any time.</li>
                    </ul>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span>Read our full:</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); onShowPolicy && onShowPolicy('privacy'); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontWeight: '600' }}
                      >
                        Privacy Policy
                      </button>
                      <span style={{ color: 'var(--text-muted)' }}>|</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); onShowPolicy && onShowPolicy('terms'); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontWeight: '600' }}
                      >
                        Terms of Service
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-auth-wrap" style={{ margin: '15px 0 10px', display: 'flex', justifyContent: 'center' }}>
          {useFallbackGoogle ? (
            <button 
              type="button" 
              className="btn-google-fallback" 
              onClick={handleFallbackGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          ) : (
            <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px' }}></div>
          )}
        </div>

        <div className="auth-footer">
          <span>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button 
            className="auth-switch-mode-btn" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
              setConfirmPassword('');
              setConsentChecked(false);
            }}
            disabled={loading}
          >
            {isLogin ? 'Register / Sign Up' : 'Sign In / Log In'}
          </button>
        </div>

        {onShowPolicy && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
            <button 
              type="button" 
              onClick={() => onShowPolicy('privacy')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Privacy Policy
            </button>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <button 
              type="button" 
              onClick={() => onShowPolicy('terms')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Terms of Service
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

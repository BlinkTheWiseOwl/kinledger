import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../utils/storage';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { AnalyticsService } from '../utils/analytics';

const isNative = Capacitor.isNativePlatform();

const BlueShield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22V2Z" fill="#60a5fa"/>
    <path d="M12 2V22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" fill="#2563eb"/>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" stroke="#d4af37" strokeWidth="0.75" strokeLinejoin="round"/>
  </svg>
);

export default function AuthScreen({ onAuthSuccess, showStatus, onShowPolicy }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset' | 'verify'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentInfo, setShowConsentInfo] = useState(false);
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const [nativeGoogleReady, setNativeGoogleReady] = useState(false);

  // Initialize Google Sign-In: native plugin on Android, web SDK on browser
  React.useEffect(() => {
    if (isNative) {
      // Initialize native SocialLogin plugin for Android
      const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      SocialLogin.initialize({
        google: {
          webClientId: webClientId,
        },
      }).then(() => {
        setNativeGoogleReady(true);
      }).catch((err) => {
        console.error('Native Google Sign-In initialization failed:', err);
        setError('Google Sign-In could not be initialized.');
      });
      return; // Skip web SDK loading on native
    }

    // Web SDK loading (browser only)
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
        }
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
        setError('Google Sign-In failed to load.');
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
        setError('Google Sign-In failed to load. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    }
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
          text: mode === 'login' ? 'signin_with' : 'signup_with',
          shape: 'pill'
        });
      }
    }
  }, [googleSdkLoaded, mode]);

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
      AnalyticsService.identify(data.user.email);
      showStatus('Logged in with Google successfully!', 'success');
      onAuthSuccess(data.token, data.user.email);
    } catch (err) {
      setError(err.message || 'Google Auth server communication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Native Google Sign-In handler (Android via SocialLogin plugin)
  const handleNativeGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await SocialLogin.login({
        provider: 'google',
      });

      // Extract the ID token from the native response
      const idToken = result?.result?.idToken;
      if (!idToken) {
        throw new Error('Google login failed: no ID token returned.');
      }

      // Send the real Google ID token to the backend for verification
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed.');
      }

      localStorage.setItem('kinledger_jwt_token', data.token);
      localStorage.setItem('kinledger_user_email', data.user.email);
      AnalyticsService.identify(data.user.email);
      showStatus('Logged in with Google successfully!', 'success');
      onAuthSuccess(data.token, data.user.email);
    } catch (err) {
      // Handle user cancellation gracefully
      if (err?.message?.includes('cancel') || err?.message?.includes('Cancel')) {
        setError('');
      } else {
        setError(err.message || 'Google Sign-In failed.');
      }
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
    setSuccessMsg('');
    setInfoMsg('');

    if (mode === 'verify') {
      if (!resetCode) {
        setError('Please enter the verification code.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: resetCode })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Verification failed.');
        }
        
        localStorage.setItem('kinledger_jwt_token', data.token);
        localStorage.setItem('kinledger_user_email', data.user.email);
        AnalyticsService.identify(data.user.email);
        AnalyticsService.logEvent('user_signed_up', { method: 'email' });
        showStatus('Email verified successfully!', 'success');
        onAuthSuccess(data.token, data.user.email);
      } catch (err) {
        setError(err.message || 'Server connection failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Request failed.');
        }
        if (data.isGoogleAccount) {
          setInfoMsg(data.message);
        } else {
          setSuccessMsg('Reset code sent! Please check your email.');
          setResetEmail(email);
          setResetCode('');
          setMode('reset');
        }
      } catch (err) {
        setError(err.message || 'Server connection failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!resetCode || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword: password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Reset failed.');
        }
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setResetCode('');
          setSuccessMsg('');
        }, 2000);
      } catch (err) {
        setError(err.message || 'Server connection failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

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

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (mode === 'signup' && !consentChecked) {
      setError('You must consent to data processing and terms.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (mode === 'login' && data.requiresVerification) {
          setMode('verify');
          setInfoMsg('Please verify your email to continue.');
          return;
        }
        throw new Error(data.error || 'Authentication failed.');
      }

      if (mode === 'signup' && data.requiresVerification) {
        setMode('verify');
        setSuccessMsg('Account created! A verification code was sent to your email.');
        return;
      }

      // Store token and email
      localStorage.setItem('kinledger_jwt_token', data.token);
      localStorage.setItem('kinledger_user_email', data.user.email);
      AnalyticsService.identify(data.user.email);
      
      if (mode === 'signup') {
        AnalyticsService.logEvent('user_signed_up', { method: 'email' });
      }
      
      showStatus(
        mode === 'login' ? 'Logged in successfully!' : 'Account registered successfully!', 
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
            {mode === 'login' && 'Sign in to access your family emergency profiles'}
            {mode === 'signup' && 'Create an account to securely document emergency details'}
            {mode === 'forgot' && 'Enter the email address associated with your KinLedger account.'}
            {mode === 'reset' && `We've sent a 6-digit code to ${resetEmail}`}
            {mode === 'verify' && `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-success-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>{successMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-info-banner">
            <AlertCircle size={18} />
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {(mode === 'reset' || mode === 'verify') && (
            <div className="form-group">
              <label htmlFor="auth-reset-code">Verification Code</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type="text"
                  id="auth-reset-code"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {(mode !== 'reset' && mode !== 'verify') && (
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
          )}

          {(mode !== 'forgot' && mode !== 'verify') && (
            <div className="form-group">
              <label htmlFor="auth-password">{mode === 'reset' ? 'New Password' : 'Password'}</label>
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
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => {
                setMode('forgot');
                setResetEmail(email);
                setError('');
                setSuccessMsg('');
                setInfoMsg('');
              }}
            >
              Forgot Password?
            </button>
          )}

          {(mode === 'signup' || mode === 'reset') && (
            <>
              <div className="form-group animated">
                <label htmlFor="auth-confirm-password">Confirm {mode === 'reset' ? 'New Password' : 'Password'}</label>
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

              {mode === 'signup' && (
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
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Code' : mode === 'verify' ? 'Verify Email' : 'Reset Password')}
          </button>
        </form>

        {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="auth-switch-mode-btn"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
                setInfoMsg('');
              }}
              disabled={loading}
            >
              ← Back to Login
            </button>
            {mode === 'reset' && (
              <button
                className="auth-resend-link"
                onClick={async () => {
                  setError('');
                  setSuccessMsg('');
                  setLoading(true);
                  try {
                    const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: resetEmail })
                    });
                    if (response.ok) {
                      setSuccessMsg('A new reset code has been sent.');
                    }
                  } catch (err) {
                    // Ignore error on resend
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Didn't receive? Resend Code
              </button>
            )}
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>

            <div className="google-auth-wrap" style={{ margin: '15px 0 10px', display: 'flex', justifyContent: 'center' }}>
              {isNative ? (
                <button 
                  type="button" 
                  className="btn-google-native" 
                  onClick={handleNativeGoogleSignIn}
                  disabled={loading || !nativeGoogleReady}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px' }}></div>
              )}
            </div>
          </>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-footer">
            <span>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button 
              className="auth-switch-mode-btn" 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setPassword('');
                setConfirmPassword('');
                setConsentChecked(false);
              }}
              disabled={loading}
            >
              {mode === 'login' ? 'Register / Sign Up' : 'Sign In / Log In'}
            </button>
          </div>
        )}

        {onShowPolicy && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '15px', flexWrap: 'wrap' }}>
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
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <button 
              type="button" 
              onClick={() => onShowPolicy('refund')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Refund Policy
            </button>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <button 
              type="button" 
              onClick={() => onShowPolicy('contact')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Contact Us
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

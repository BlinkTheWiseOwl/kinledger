import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../utils/storage';

export default function AuthScreen({ onAuthSuccess, showStatus }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentInfo, setShowConsentInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
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

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
          <div className="auth-logo-icon">
            <Shield size={32} />
          </div>
          <h2>KinLedger</h2>
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
                    I agree to the KinLedger Privacy Policy and consent to the secure storage of my family's medical information under the Indian DPDP Act 2023.{' '}
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setShowConsentInfo(!showConsentInfo); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit', fontSize: '0.8rem', display: 'inline' }}
                    >
                      {showConsentInfo ? 'Hide Details' : 'Learn More'}
                    </button>
                  </span>
                </label>
                
                {showConsentInfo && (
                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>DPDP Consent Information Notice:</strong>
                    <ul style={{ paddingLeft: '15px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li><strong>Data Collected</strong>: Family names, age, blood group, chronic medical conditions, critical allergies, medication names/dosages, and emergency contacts.</li>
                      <li><strong>Purpose</strong>: To securely save your health card profiles in our database so they can be instantly fetched during emergencies and shared collaboratively among family members.</li>
                      <li><strong>Security</strong>: Sensitive medical conditions, allergies, medications, and insurance numbers are fully encrypted at rest using AES-256-CBC.</li>
                      <li><strong>Your Rights</strong>: You hold the absolute right to correct, share, revoke sharing access, or permanently delete your account and all associated profiles at any time.</li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

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
      </div>
    </div>
  );
}

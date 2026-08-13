import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

export default function GoogleDeleteModal({ onClose, onConfirm, error }) {
  const [loading, setLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      // Native initialization
      const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      SocialLogin.initialize({
        google: { webClientId }
      }).catch(console.error);
      return;
    }

    // Web initialization
    const scriptId = 'google-gsi-script-delete';
    let script = document.getElementById(scriptId);

    const initGsi = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-placeholder.apps.googleusercontent.com',
          callback: async (res) => {
            if (res.credential) {
              setLoading(true);
              try {
                await onConfirm(res.credential);
              } finally {
                setLoading(false);
              }
            }
          }
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-delete-btn'),
          { theme: 'outline', size: 'large', text: 'continue_with', width: 280 }
        );
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [onConfirm]);

  const handleNativeLogin = async () => {
    setLoading(true);
    try {
      const result = await SocialLogin.login({ provider: 'google' });
      const idToken = result?.result?.idToken;
      if (idToken) {
        await onConfirm(idToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: 0, overflow: 'hidden', backgroundColor: 'var(--bg-card)' }}>
        <div className="modal-header" style={{ backgroundColor: 'var(--primary)', padding: '1.25rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', margin: 0 }}>
            <AlertTriangle size={20} color="#ffffff" />
            Delete Account
          </h2>
          <button onClick={onClose} className="icon-btn" disabled={loading} style={{ color: '#ffffff', background: 'transparent', padding: '4px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>Warning:</strong> This will permanently delete your KinLedger account and all associated family medical profiles. This action cannot be undone.
            </p>
          </div>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Please re-authenticate with Google to verify your identity before deleting.
          </p>
          
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {isNative ? (
              <button 
                onClick={handleNativeLogin} 
                disabled={loading}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? <Loader2 size={16} className="spin-icon" /> : null}
                {loading ? 'Verifying...' : 'Verify with Google'}
              </button>
            ) : (
              <div id="google-delete-btn" style={{ minHeight: '40px', display: loading ? 'none' : 'block' }}></div>
            )}
            {loading && !isNative && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)' }}>
                <Loader2 size={16} className="spin-icon" /> Verifying...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Crown, Shield, Loader2 } from 'lucide-react';

export default function SubscriptionBadge({ plan, status, expiresAt, token, onPlanChange, onShowPaywall }) {
  const isFamily = plan === 'family' && (status === 'active' || status === 'cancelled');
  const isCancelled = status === 'cancelled';
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : null;

  if (isFamily) {
    return (
      <div className="subscription-badge-container">
        <div className="subscription-badge family">
          <Crown size={14} />
          <span>Family Plan</span>
        </div>
        {isCancelled ? (
          <span className="subscription-meta">
            Access until {expiryDate || 'period end'}
          </span>
        ) : (
          <>
            <span className="subscription-meta">
              Expires {expiryDate || '—'}
            </span>
            <div className="subscription-prepaid-note">
              1-Year Prepaid (Does not auto-renew)
            </div>
          </>
        )}
      </div>
    );
  }

  if (plan === 'free' && status === 'expired') {
    return (
      <div className="subscription-badge-container">
        <div className="subscription-badge" style={{ backgroundColor: 'var(--warning-light)', color: '#92400e', borderColor: 'var(--warning)' }}>
          <Crown size={14} />
          <span>Plan Expired</span>
        </div>
        <button className="subscription-upgrade-link" onClick={onShowPaywall}>
          Renew Family Plan
        </button>
      </div>
    );
  }

  return (
    <div className="subscription-badge-container">
      <div className="subscription-badge free">
        <Shield size={14} />
        <span>Free Plan</span>
      </div>
      <button className="subscription-upgrade-link" onClick={onShowPaywall}>
        Upgrade to Family
      </button>
    </div>
  );
}

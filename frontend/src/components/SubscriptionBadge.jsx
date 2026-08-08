import React, { useState } from 'react';
import { Crown, Shield, Loader2 } from 'lucide-react';
import { cancelSubscription } from '../utils/storage';

export default function SubscriptionBadge({ plan, status, expiresAt, token, onPlanChange, onShowPaywall }) {
  const [cancelling, setCancelling] = useState(false);

  const isFamily = plan === 'family' && (status === 'active' || status === 'cancelled');
  const isCancelled = status === 'cancelled';
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : null;

  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your Family plan?\n\n' +
      'You will continue to have access until your current period ends' +
      (expiryDate ? ` (${expiryDate})` : '') + '.\n\n' +
      'After that, you\'ll be limited to 2 family profiles.'
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await cancelSubscription(token);
      onPlanChange('family', 'cancelled');
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

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
              Renews {expiryDate || '—'}
            </span>
            <button
              className="subscription-cancel-link"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 size={12} className="spin-icon" /> : null}
              {cancelling ? 'Cancelling...' : 'Cancel plan'}
            </button>
          </>
        )}
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

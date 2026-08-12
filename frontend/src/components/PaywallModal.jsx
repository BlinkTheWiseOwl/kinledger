import React, { useState, useEffect } from 'react';
import { Shield, Users, Share2, CreditCard, Heart, Check, X, Loader2 } from 'lucide-react';
import { AnalyticsService } from '../utils/analytics';
import { createUpgradeOrder, verifyPayment } from '../utils/storage';

export default function PaywallModal({ isOpen, onClose, onUpgradeSuccess, token, userEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      AnalyticsService.logEvent('paywall_viewed', { source_screen: 'modal' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create order on backend
      const order = await createUpgradeOrder(token);

      // 2. Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'KinLedger',
        description: 'KinLedger Family — 1 Year',
        order_id: order.orderId,
        image: 'https://kinledger-blush.vercel.app/logo.svg',
        webview_intent: true,
        prefill: {
          email: userEmail
        },
        theme: {
          color: '#0f6c5f' // KinLedger primary teal
        },
        handler: async function (response) {
          // 3. Verify payment on backend
          try {
            const result = await verifyPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (result.success) {
              AnalyticsService.logEvent('subscription_purchased', { plan: 'yearly', price: 399.0 });
              onUpgradeSuccess(result);
            }
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed. Contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      razorpay.open();

    } catch (err) {
      let errorMessage = err.message || 'Something went wrong. Please try again.';
      if (errorMessage.toLowerCase().includes('token')) {
        errorMessage = 'Your login session has expired. Please close this window, sign out from the menu, and sign in again to upgrade.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const features = [
    { icon: <Users size={16} />, text: 'Unlimited family profiles' },
    { icon: <Share2 size={16} />, text: 'Share with family caregivers' },
    { icon: <Shield size={16} />, text: 'Emergency Medical Cards' },
    { icon: <Heart size={16} />, text: 'More features included over time' }
  ];

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-modal animated" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="paywall-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Header illustration */}
        <div className="paywall-header">
          <div className="paywall-icon-group">
            <div className="paywall-icon-circle paywall-icon-main">
              <Shield size={28} strokeWidth={2.5} />
            </div>
            <div className="paywall-icon-circle paywall-icon-secondary">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="paywall-body">
          <h2 className="paywall-title">Make your whole family Emergency Ready.</h2>
          <p className="paywall-subtitle">
            You’ve made <strong>2 family members Emergency Ready for free.</strong>
            <br />Upgrade to add everyone you care about.
          </p>

          {/* Features checklist */}
          <div className="paywall-features">
            {features.map((f, i) => (
              <div className="paywall-feature-row" key={i}>
                <span className="paywall-check-icon"><Check size={15} strokeWidth={3} /></span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="paywall-price-block">
            <div className="paywall-price">₹399<span className="paywall-price-period">/year</span></div>
            <div className="paywall-price-monthly">That's just ₹33/month.</div>
          </div>

          {/* Error */}
          {error && (
            <div className="paywall-error">{error}</div>
          )}

          {/* CTAs */}
          <div className="paywall-actions">
            <button
              className="paywall-cta-primary"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={18} className="spin-icon" /> Processing...</>
              ) : (
                <><CreditCard size={18} /> Upgrade to Family</>
              )}
            </button>
            <button className="paywall-cta-secondary" onClick={onClose}>
              Continue with Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

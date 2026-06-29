import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';

export default function HelpPage({ onClose, onReplayOnboarding }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How does offline access work?",
      a: "KinLedger caches your family cards in your browser's local storage so you can view them offline while logged in. However, if you log out, this cache is cleared for security. To guarantee instant access during an emergency, even if you are logged out or offline, we highly recommend using the 'Print / Save PDF' option on the card view to download and save each card directly to your phone or device."
    },
    {
      q: "Is my family's medical data secure?",
      a: "Yes. All sensitive medical information—including chronic conditions, allergies, medications, and insurance policy numbers—is fully encrypted at rest on our servers using secure encryption keys. We do not share or sell your medical data with any third parties."
    },
    {
      q: "How do I share a card with a family member?",
      a: "To share a card, open the card in 'Edit Profile' view, scroll down to the 'Share Card' section, enter your family member's registered email address, and click 'Add Share'. The card will instantly appear on their dashboard."
    },
    {
      q: "How do I print or save a card as a PDF?",
      a: "Open the card and click the 'View & Share Printable Card' tab. Click the 'Print / Save PDF' button at the top. This will open your device's native print dialog where you can print to a physical printer or choose 'Save as PDF'."
    },
    {
      q: "How do I delete my account and data?",
      a: "You can permanently delete your account and all associated family profiles at any time. Open the hamburger menu in the top right corner and click 'Delete Account'. This action is immediate and cannot be undone."
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', minHeight: '80vh' }}>
      <button 
        onClick={onClose} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', fontSize: '0.95rem', padding: 0 }}
      >
        <ArrowLeft size={18} /> Back to App
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <HelpCircle size={28} className="text-primary" />
        <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', margin: 0 }}>Help & FAQ</h1>
      </div>

      {/* Replay Onboarding Section */}
      <div style={{ backgroundColor: 'var(--primary-light)', border: '1.5px solid rgba(15, 108, 95, 0.15)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>New to KinLedger?</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Take a quick 3-slide tour of the application's core features.</p>
        </div>
        <button 
          onClick={onReplayOnboarding}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
        >
          <Play size={16} fill="currentColor" /> Replay Guide
        </button>
      </div>

      {/* FAQ Section */}
      <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '1.25rem' }}>Frequently Asked Questions</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div 
              key={idx} 
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-card)', transition: 'all 0.2s' }}
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.975rem' }}
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-muted" />}
              </button>
              
              {isOpen && (
                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', borderTop: '1px solid var(--border)', paddingTop: '1rem', backgroundColor: 'var(--bg-app)', animation: 'fadeIn 0.25s ease' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

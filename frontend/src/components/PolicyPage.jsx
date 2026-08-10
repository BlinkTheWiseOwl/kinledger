import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PolicyPage({ type, onClose }) {

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: August 9, 2026</p>
            
            <p style={{ marginBottom: '1.25rem' }}>
              Welcome to <strong>KinLedger</strong>. Your privacy is important to us. This Privacy Policy explains how KinLedger ("we", "our", or "us"), operated by Shilpa Kumar, collects, uses, stores, and protects your personal information when you use the KinLedger application.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Information We Collect</h2>
            <p style={{ marginBottom: '1rem' }}>
              KinLedger collects account information (email), family member information (name, relationship, age, blood group), medical information (conditions, allergies, medications), insurance information, and emergency contacts.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
            <p style={{ marginBottom: '1rem' }}>
              We use your information solely to provide the services offered by KinLedger, including creating and displaying emergency medical profiles. We do <strong>not</strong> use your personal or medical information for advertising purposes.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Payment Processing</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              We use Razorpay as a third-party payment gateway for processing subscription payments. We do not store your full credit card details on our servers. When you make a payment, necessary billing information (such as your email address and transaction IDs) is shared securely with Razorpay for processing. Razorpay's use of your personal information is governed by their own privacy policy.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Data Security & Third-Party Services</h2>
            <p style={{ marginBottom: '1rem' }}>
              We use industry-standard security measures including secure HTTPS/SSL encryption. We use trusted third-party service providers to operate the application (e.g., cloud hosting, authentication, payment processing). They process information only as necessary to provide these services.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Medical Disclaimer</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              KinLedger is designed to help organize and securely store personal health information. KinLedger does <strong>not</strong> provide medical advice, diagnosis, treatment, or emergency medical services.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Contact Us</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              If you have any questions, please contact us at: <a href="mailto:support.kinledger@gmail.com" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>support.kinledger@gmail.com</a>.
            </p>
          </article>
        );

      case 'terms':
        return (
          <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Terms of Service</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: August 9, 2026</p>

            <p style={{ marginBottom: '1.25rem' }}>
              Welcome to <strong>KinLedger</strong>, operated by Shilpa Kumar. These Terms of Service ("Terms") govern your access to and use of the KinLedger application ("Service"). By creating an account or using KinLedger, you agree to these Terms.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. About KinLedger</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              KinLedger is a digital tool designed to help individuals and families organize, store, and share personal health information. It is intended for informational and organizational purposes only.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Subscriptions, Billing, and Payments</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Certain features of KinLedger (e.g., KinLedger Family) require a paid subscription. All payments are securely processed through our third-party payment provider, Razorpay. By upgrading to a paid plan, you authorize us (via Razorpay) to charge the applicable subscription fees to your chosen payment method. You are responsible for maintaining a valid payment method. Subscription fees are billed in advance and are non-refundable, except as expressly set forth in our Refund Policy.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Medical Disclaimer</h2>
            <p style={{ marginBottom: '1.25rem', fontWeight: '600', color: 'var(--danger)' }}>
              KinLedger is <strong>not</strong> a medical device and does <strong>not</strong> provide medical advice, diagnosis, treatment, or emergency medical services.
            </p>
            <p style={{ marginBottom: '1.25rem' }}>
              Information displayed within KinLedger is entered by users and is not independently verified. In a medical emergency, always contact your local emergency services (such as 108 or 112 in India) or seek immediate assistance from qualified healthcare professionals. Do not rely solely on KinLedger during a medical emergency.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Limitation of Liability and "As-Is" Warranty</h2>
            <p style={{ marginBottom: '1.25rem', fontWeight: 'bold' }}>
              YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF KINLEDGER IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KINLEDGER, SHILPA KUMAR, AND ANY AFFILIATED DEVELOPERS OR SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 'bold' }}>
              <li>YOUR ACCESS TO, USE OF, OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
              <li>ANY FAILURE OF THE SERVICE TO BE AVAILABLE DURING A MEDICAL EMERGENCY;</li>
              <li>INACCURATE, INCOMPLETE, OR OUTDATED INFORMATION ENTERED BY USERS;</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
            </ul>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Governing Law</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              These Terms shall be governed by and interpreted in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Contact Us</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              If you have any questions regarding these Terms, please contact us at: <a href="mailto:support.kinledger@gmail.com" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>support.kinledger@gmail.com</a>.
            </p>
          </article>
        );

      case 'refund':
        return (
          <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Refund and Cancellation Policy</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: August 9, 2026</p>

            <p style={{ marginBottom: '1.25rem' }}>
              Thank you for subscribing to KinLedger. This policy outlines our terms regarding subscription cancellations and refunds.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Cancellation Policy (Cancel Anytime)</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              You may cancel your KinLedger subscription at any time. When you cancel, your subscription will not automatically renew, and you will not be charged for the next billing cycle. You will continue to have access to KinLedger's premium features until the end of your current paid billing period.
            </p>
            <p style={{ marginBottom: '1.25rem' }}>
              To cancel your subscription, please use the subscription management portal within the application or contact our support team.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Refund Policy (No Refunds)</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Due to the digital nature of our service, <strong>all subscription payments are final and non-refundable</strong>. We do not provide refunds or credits for partially used billing periods or for accidental renewals. 
            </p>
            <p style={{ marginBottom: '1.25rem' }}>
              If you experience a technical issue that prevents you from using the service you paid for, please contact our support team, and we will work with you to resolve the issue.
            </p>

            <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Contact Us</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              If you have any questions regarding your subscription or this policy, please contact us at: <a href="mailto:support.kinledger@gmail.com" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>support.kinledger@gmail.com</a>.
            </p>
          </article>
        );

      case 'contact':
        return (
          <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Contact Us</h1>
            <p style={{ marginBottom: '1.5rem' }}>We are here to help! If you have any questions, concerns, or feedback, please reach out to us using the details below.</p>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Support Email</h3>
              <p style={{ marginBottom: '0.25rem' }}>
                <a href="mailto:support.kinledger@gmail.com" style={{ color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>support.kinledger@gmail.com</a>
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We aim to respond to all inquiries within 2 business days.</p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Privacy & Data Requests</h3>
              <p style={{ marginBottom: '0.25rem' }}>
                <a href="mailto:privacy.kinledger@gmail.com" style={{ color: 'var(--text-primary)', fontWeight: '500', textDecoration: 'none' }}>privacy.kinledger@gmail.com</a>
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Operating Address</h3>
              <p style={{ marginBottom: '0.25rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                Shilpa Kumar{'\n'}
                Kutchappa Street, Dodballapur{'\n'}
                Bangalore - 561203{'\n'}
                India
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Phone Support</h3>
              <p style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                +91 7975763988
              </p>
            </div>
          </article>
        );

      default:
        return <p>Policy not found.</p>;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', minHeight: '80vh' }}>
      <button 
        onClick={onClose} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', fontSize: '0.95rem', padding: 0 }}
      >
        <ArrowLeft size={18} /> Back to App
      </button>

      {renderContent()}
    </div>
  );
}

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PolicyPage({ type, onClose }) {
  const isPrivacy = type === 'privacy';

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', minHeight: '80vh' }}>
      <button 
        onClick={onClose} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', marginBottom: '1.5rem', fontSize: '0.95rem', padding: 0 }}
      >
        <ArrowLeft size={18} /> Back to App
      </button>

      {isPrivacy ? (
        <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
          <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>
          
          <p style={{ marginBottom: '1.25rem' }}>
            At KinLedger, we value your trust and are committed to protecting the privacy of your personal and medical information. This Privacy Policy describes how we collect, use, store, and protect your information when you use the KinLedger application.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Data Collection and Usage</h2>
          <p style={{ marginBottom: '1rem' }}>
            KinLedger is designed to store emergency medical profiles. We collect the following information:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Account Information</strong>: Your email address and password hash (used strictly for authentication).</li>
            <li><strong>Profile Information</strong>: Full name, age, and blood group of the card holder.</li>
            <li><strong>Medical Information</strong>: Chronic health conditions, allergies, and current medications (dosage, frequency, and instructions).</li>
            <li><strong>Insurance Details</strong>: Policy provider, policy number, and expiry date.</li>
            <li><strong>Emergency Contacts</strong>: Name, relationship, phone number, and optional email of up to two contacts.</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Data Encryption and Security</h2>
          <p style={{ marginBottom: '1rem' }}>
            We implement industry-standard security protocols to protect your sensitive data:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Encryption at Rest</strong>: Critical fields (Full Name, Medical Conditions, Allergies, Medication Details, and Insurance Policy Numbers) are fully encrypted before being saved to our cloud database.</li>
            <li><strong>Encryption in Transit</strong>: All data transmitted between the application and our servers is secured using SSL/HTTPS.</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Offline Storage & Local Cache</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            To ensure emergency information is available instantly without internet access, all profiles are cached in your device's local storage. This data remains on your device and is synchronized with the server when an active internet connection is established.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Compliance & User Rights (DPDP Act 2023)</h2>
          <p style={{ marginBottom: '1rem' }}>
            In compliance with the Indian Digital Personal Data Protection (DPDP) Act 2023 and global privacy standards, we provide you with the following controls:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Right to Correction</strong>: You can update your family profiles at any time.</li>
            <li><strong>Right to Erasure (Delete Account)</strong>: You can permanently delete your account and all associated profiles from our servers at any time using the "Delete Account" option in the account menu. This action is immediate and irreversible.</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Third-Party Sharing</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            We do not sell, rent, or share your personal or medical information with any third-party companies, advertisers, or external organizations.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Contact Us</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            If you have any questions regarding this Privacy Policy, please contact us at support@kinledger.app.
          </p>
        </article>
      ) : (
        <article style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
          <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>

          <p style={{ marginBottom: '1.25rem' }}>
            Please read these Terms of Service ("Terms") carefully before using the KinLedger application. By accessing or using the service, you agree to be bound by these Terms.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Emergency Use Disclaimer (CRITICAL)</h2>
          <p style={{ marginBottom: '1.25rem', fontWeight: '600', color: 'var(--danger)' }}>
            KinLedger is an information storage tool designed to help you organize and share family medical details. It is NOT a medical device, nor does it provide professional medical advice, diagnosis, or treatment. In a medical emergency, do not rely solely on this app. Always contact your local emergency services (e.g., 108 or 112 in India) immediately.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Accuracy of Information</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            You are solely responsible for ensuring the accuracy, completeness, and timeliness of the medical information, dosages, allergies, and emergency contact numbers entered into the application.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Account Registration & Security</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            To synchronize your data across devices, you must register an account. You are responsible for safeguarding your password and credentials. KinLedger cannot and will not be liable for any loss or damage arising from your failure to protect your account.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Data Ownership & Deletion</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            You retain full ownership of all data you input. You may delete your account and purge all data from our servers at any time. We do not maintain backups of deleted accounts.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Limitation of Liability</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            To the maximum extent permitted by law, KinLedger and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service, including but not limited to medical complications, data loss, or reliance on incorrect information.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Modifications to Terms</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            We reserve the right to modify these Terms at any time. We will notify users of any significant changes by posting the new Terms within the application.
          </p>
        </article>
      )}
    </div>
  );
}

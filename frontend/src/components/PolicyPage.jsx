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
          <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>
          
          <p style={{ marginBottom: '1.25rem' }}>
            Welcome to <strong>KinLedger</strong>. Your privacy is important to us. This Privacy Policy explains how KinLedger ("we", "our", or "us") collects, uses, stores, and protects your personal information when you use the KinLedger application.
          </p>

          <p style={{ marginBottom: '1.25rem' }}>
            By creating an account or using KinLedger, you agree to the collection and use of your information as described in this Privacy Policy.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '1rem' }}>
            KinLedger is designed to help families securely organize and access emergency medical information. Depending on how you use the application, we may collect the following information:
          </p>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Account Information</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Email address</li>
            <li>Secure authentication credentials (your password is never stored in plain text)</li>
          </ul>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Family Member Information</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Full name</li>
            <li>Relationship</li>
            <li>Age</li>
            <li>Blood group</li>
          </ul>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Medical Information</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Medical conditions</li>
            <li>Allergies</li>
            <li>Current medications, dosage, frequency, and instructions</li>
          </ul>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Insurance Information</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Insurance provider</li>
            <li>Policy number</li>
            <li>Policy expiry date</li>
          </ul>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>Emergency Contacts</h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Contact name</li>
            <li>Relationship</li>
            <li>Phone number</li>
            <li>Optional email address</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '1rem' }}>
            We use your information solely to provide the services offered by KinLedger, including:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Creating emergency medical profiles</li>
            <li>Displaying emergency medical cards</li>
            <li>Securely storing family health information</li>
            <li>Synchronizing your information across supported devices</li>
            <li>Allowing you to share emergency information when you choose to do so</li>
            <li>Improving the reliability, security, and performance of the application</li>
          </ul>
          <p style={{ marginBottom: '1.25rem' }}>
            We do <strong>not</strong> use your personal or medical information for advertising purposes.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Data Security</h2>
          <p style={{ marginBottom: '1rem' }}>
            Protecting your information is one of our highest priorities. We use industry-standard security measures including:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Secure HTTPS/SSL encryption for all communication between your device and our servers</li>
            <li>Secure authentication mechanisms</li>
            <li>Encrypted cloud infrastructure and secure storage technologies</li>
            <li>Appropriate access controls to protect stored information</li>
          </ul>
          <p style={{ marginBottom: '1.25rem' }}>
            While we take reasonable measures to safeguard your information, no system connected to the internet can be guaranteed to be completely secure.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Offline Storage</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            To ensure emergency medical information remains accessible even without an internet connection, KinLedger securely stores a local copy of your family profiles on your device. This information is synchronized with our servers whenever an internet connection is available.
          </p>
          <p style={{ marginBottom: '1.25rem', fontStyle: 'italic' }}>
            Please note that anyone with physical access to your unlocked device may be able to access locally stored information.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Third-Party Service Providers</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            KinLedger uses trusted third-party service providers to operate and secure the application, including cloud hosting, authentication, storage, and infrastructure services. These providers process information only as necessary to provide the services requested by KinLedger and are expected to maintain appropriate security and confidentiality measures.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            We do <strong>not</strong> sell, rent, or trade your personal or medical information to advertisers or data brokers.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Your Rights</h2>
          <p style={{ marginBottom: '1rem' }}>
            In accordance with the Digital Personal Data Protection (DPDP) Act, 2023 and other applicable laws, you have the right to:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Access your information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated family profiles</li>
            <li>Withdraw your consent by discontinuing use of the application and deleting your account</li>
          </ul>
          <p style={{ marginBottom: '1.25rem' }}>
            You can permanently delete your account at any time using the <strong>Delete Account</strong> option available within the application. Account deletion permanently removes your account and associated data from our systems, subject to reasonable technical processing time and any legal obligations that may apply.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>7. Emergency Contacts</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            If you add emergency contact information to KinLedger, you confirm that you have obtained the necessary permission to provide their contact details for emergency purposes.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>8. Cookies and Essential Technologies</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            When using the web version of KinLedger, we may use essential cookies or similar technologies required for authentication, security, and application functionality. These technologies are not used to sell or advertise products to you.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>9. Medical Disclaimer</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            KinLedger is designed to help organize and securely store personal health information. KinLedger does <strong>not</strong> provide medical advice, diagnosis, treatment, or emergency medical services.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            Any health information stored within KinLedger is provided by you. You should always consult qualified healthcare professionals regarding medical decisions or emergencies.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>10. Future Features</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            As KinLedger evolves, future features such as AI-assisted summaries or health insights will only process information that you choose to provide. Where additional consent is required by applicable law, we will request your permission before enabling such features.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>11. Changes to This Privacy Policy</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            We may update this Privacy Policy from time to time to reflect improvements to our services or changes in applicable laws. When we make significant changes, the updated Privacy Policy will be made available within the application, and the Effective Date at the top of this document will be revised. Continued use of KinLedger after changes become effective constitutes acceptance of the updated Privacy Policy.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>12. Contact Us</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at: <a href="mailto:support@kinledger.app" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>support@kinledger.app</a>.
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

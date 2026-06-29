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
          <h1 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>

          <p style={{ marginBottom: '1.25rem' }}>
            Welcome to <strong>KinLedger</strong>. These Terms of Service ("Terms") govern your access to and use of the KinLedger application ("Service"). By creating an account or using KinLedger, you agree to these Terms.
          </p>

          <p style={{ marginBottom: '1.25rem' }}>
            If you do not agree with these Terms, please do not use the Service.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. About KinLedger</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            KinLedger is a digital tool designed to help individuals and families organize, store, and share personal health information, including emergency medical profiles. KinLedger is intended for informational and organizational purposes only.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Medical Disclaimer</h2>
          <p style={{ marginBottom: '1.25rem', fontWeight: '600', color: 'var(--danger)' }}>
            KinLedger is <strong>not</strong> a medical device and does <strong>not</strong> provide medical advice, diagnosis, treatment, or emergency medical services.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            Information displayed within KinLedger is entered by users and is not independently verified.
          </p>
          <p style={{ marginBottom: '1.25rem', fontWeight: '600' }}>
            In a medical emergency, always contact your local emergency services (such as <strong>108</strong> or <strong>112</strong> in India) or seek immediate assistance from qualified healthcare professionals. Do not rely solely on KinLedger during a medical emergency.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Your Responsibilities</h2>
          <p style={{ marginBottom: '1rem' }}>
            You are responsible for:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Providing accurate and up-to-date information.</li>
            <li>Reviewing and updating medical conditions, medications, allergies, insurance details, and emergency contacts when changes occur.</li>
            <li>Obtaining permission before entering another person's contact information, including emergency contacts.</li>
            <li>Using KinLedger only for lawful purposes.</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4. Account Security</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            To synchronize your information across devices, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            If you believe your account has been accessed without authorization, please notify us as soon as reasonably possible.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5. Your Data</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            You retain ownership of the information you enter into KinLedger. You may update, modify, or delete your information at any time.
          </p>
          <p style={{ marginBottom: '1.25rem' }}>
            Deleting your account will permanently remove your account and associated data from our systems, subject to reasonable technical processing time and any legal obligations that may apply.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>6. Service Availability</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            We strive to keep KinLedger available and reliable, but we cannot guarantee uninterrupted or error-free operation. The Service may occasionally be unavailable due to maintenance, technical issues, security updates, or circumstances beyond our reasonable control.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>7. Future Features</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            KinLedger may introduce new features, including document storage, family collaboration, reminders, and AI-assisted summaries. Where required, additional notices or consent requests will be presented before such features become available.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>8. Acceptable Use</h2>
          <p style={{ marginBottom: '1rem' }}>
            You agree not to:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Attempt to gain unauthorized access to KinLedger or its systems.</li>
            <li>Interfere with the operation or security of the Service.</li>
            <li>Upload malicious software or harmful content.</li>
            <li>Use the Service in violation of applicable laws.</li>
          </ul>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>9. Limitation of Liability</h2>
          <p style={{ marginBottom: '1rem' }}>
            To the maximum extent permitted by applicable law, KinLedger and its owners, developers, and service providers shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising from:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Use or inability to use the Service.</li>
            <li>Inaccurate, incomplete, or outdated information entered by users.</li>
            <li>Delays or interruptions in service.</li>
            <li>Data loss or unauthorized access despite reasonable security measures.</li>
            <li>Reliance on information stored within KinLedger.</li>
          </ul>
          <p style={{ marginBottom: '1.25rem' }}>
            Nothing in these Terms limits any rights that cannot legally be excluded under applicable law.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>10. Changes to These Terms</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            We may update these Terms from time to time. If significant changes are made, the revised Terms will be made available within the application and the Effective Date will be updated. Continued use of KinLedger after the revised Terms become effective constitutes acceptance of the updated Terms.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>11. Governing Law</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the jurisdiction of the competent courts located in India.
          </p>

          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>12. Contact Us</h2>
          <p style={{ marginBottom: '1.25rem' }}>
            If you have any questions regarding these Terms, please contact us at: <a href="mailto:support@kinledger.app" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>support@kinledger.app</a>.
          </p>
        </article>
      )}
    </div>
  );
}

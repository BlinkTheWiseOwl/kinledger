import React from 'react';
import { Phone, Heart, ShieldAlert, Award, FileText, Printer, CheckCircle } from 'lucide-react';

export default function EmergencyCard({ profile, emergencyContacts, medications, synced }) {
  const handlePrint = () => {
    window.print();
  };

  const getBloodBadgeColor = (bg) => {
    if (!bg) return '';
    return 'blood-badge';
  };

  return (
    <div className="emergency-card-container animated">
      <div className="card-actions-bar">
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={18} />
          Print / Save PDF
        </button>
      </div>

      <div className="emergency-badge-card" id="printable-card">
        {/* Top Critical Header */}
        <div className="card-red-header">
          <h2>Emergency Medical Card</h2>
          <ShieldAlert className="shield-icon" size={24} />
        </div>

        <div className="badge-body">
          {/* Top Row: Name, Age & Blood Group */}
          <div className="badge-row-top">
            <div className="badge-name-block">
              <h3>{profile.fullName || 'No Name Provided'}</h3>
              <p>Age: {profile.age ? `${profile.age} years` : 'Not specified'}</p>
            </div>
            {profile.bloodGroup && (
              <div className="blood-badge">
                <span className="blood-label">Blood Group</span>
                <span className="blood-type">{profile.bloodGroup}</span>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="badge-section">
            <h4 className="badge-section-title">Medical Conditions / Diagnosis</h4>
            <div className="badge-section-content">
              {profile.conditions || 'No medical conditions reported.'}
            </div>
          </div>

          {/* Allergies */}
          <div className="badge-section">
            <h4 className="badge-section-title">Critical Allergies</h4>
            <div className="badge-section-content allergies">
              {profile.allergies || 'No known drug or food allergies.'}
            </div>
          </div>

          {/* Contacts and Meds Split */}
          <div className="badge-split-two">
            {/* Contacts */}
            <div className="badge-section">
              <h4 className="badge-section-title">Emergency Contacts</h4>
              <div className="contact-card-list">
                {emergencyContacts.length > 0 ? (
                  emergencyContacts.map((contact, index) => (
                    <div key={index} className="contact-card-item">
                      <div className="contact-info-left">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-relation">
                          {contact.relationship} {index === 0 && '• Primary'}
                        </span>
                        {contact.email && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', wordBreak: 'break-all' }}>
                            {contact.email}
                          </span>
                        )}
                      </div>
                      {contact.phoneNumber && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{contact.phoneNumber}</span>
                          <a href={`tel:${contact.phoneNumber}`} className="contact-phone-btn">
                            <Phone size={16} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="badge-section-content" style={{ color: 'var(--text-secondary)' }}>
                    No emergency contacts configured.
                  </div>
                )}
              </div>
            </div>

            {/* Medications */}
            <div className="badge-section">
              <h4 className="badge-section-title">Current Medications</h4>
              <div className="med-card-list">
                {medications.length > 0 ? (
                  medications.map((med, index) => (
                    <div key={index} className="med-card-item">
                      <div className="med-info-left">
                        <span className="med-name">{med.name}</span>
                        <span className="med-freq">
                          {med.frequency} {med.instructions ? `(${med.instructions})` : ''}
                        </span>
                      </div>
                      <span className="med-dose">{med.dosage}</span>
                    </div>
                  ))
                ) : (
                  <div className="badge-section-content" style={{ color: 'var(--text-secondary)' }}>
                    No chronic medications listed.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Details Footer */}
          {(profile.insurancePolicy || profile.insuranceNumber || profile.insuranceValidTill) && (
            <div className="card-footer-policy" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                Insurance Policy: <strong>{profile.insurancePolicy || 'N/A'}</strong>
              </div>
              <div>
                ID/Policy #: <strong>{profile.insuranceNumber || 'N/A'}</strong>
              </div>
              {profile.insuranceValidTill && (
                <div>
                  Valid Till: <strong>{profile.insuranceValidTill}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

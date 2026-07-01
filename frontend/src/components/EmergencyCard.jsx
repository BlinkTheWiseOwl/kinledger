import React from 'react';
import { Phone, Heart, ShieldAlert, Award, FileText, Printer, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';

// Generates a formatted jsPDF document styled as a compact card
function buildCardPdf(profile, emergencyContacts, medications) {
  // Custom card-sized page
  const doc = new jsPDF({ unit: 'mm', format: [160, 220], orientation: 'portrait' });

  // --- PAGE BACKGROUND ---
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 160, 220, 'F');

  // Card coordinates
  const cx = 10, cy = 10, cw = 140, ch = 200;

  // Outer red border
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.roundedRect(cx, cy, cw, ch, 4, 4, 'D');

  // --- RED HEADER BAND ---
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(cx, cy, cw, 18, 4, 4, 'F');
  doc.rect(cx, cy + 9, cw, 9, 'F'); // square bottom

  // Header title — left aligned
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('EMERGENCY MEDICAL CARD', cx + 6, cy + 11.5);


  // --- CONTENT START ---
  let y = cy + 28;
  const col = cx + 6;
  const contentW = cw - 12;

  // --- BLOOD GROUP BADGE ---
  if (profile.bloodGroup) {
    const bw = 36, bh = 15;
    const bx = cx + cw - 6 - bw;
    const by = cy + 25;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, bw, bh, 3, 3, 'FD');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BLOOD GROUP', bx + bw / 2, by + 5, { align: 'center' });
    doc.setFontSize(14);
    doc.text(profile.bloodGroup, bx + bw / 2, by + 11.5, { align: 'center' });
  }

  // --- NAME & AGE ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  const nameMaxW = profile.bloodGroup ? contentW - 42 : contentW;
  const nameLines = doc.splitTextToSize(profile.fullName || 'No Name Provided', nameMaxW);
  doc.text(nameLines, col, y + 2);
  y += nameLines.length * 6;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Age: ${profile.age ? profile.age + ' years' : 'Not specified'}`, col, y + 1);
  y += 7;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(col, y, col + contentW, y);
  y += 6;

  // --- HELPERS ---
  const sectionTitle = (title) => {
    doc.setTextColor(15, 118, 110); // Teal 700
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), col, y);
    y += 3.5;
  };

  const drawBox = (height, isRed = false) => {
    if (isRed) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }
    doc.setLineWidth(0.3);
    doc.roundedRect(col, y, contentW, height, 1.5, 1.5, 'FD');
  };

  // --- CONDITIONS ---
  sectionTitle('Medical Conditions / Diagnosis');
  const condText = profile.conditions || 'No medical conditions reported.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const condLines = doc.splitTextToSize(condText, contentW - 6);
  const condH = condLines.length * 4.5 + 4;
  drawBox(condH, false);
  doc.setTextColor(15, 23, 42);
  doc.text(condLines, col + 3, y + 4.5);
  y += condH + 5;

  // --- ALLERGIES ---
  sectionTitle('Critical Allergies');
  const algText = profile.allergies || 'No known drug or food allergies.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const algLines = doc.splitTextToSize(algText, contentW - 6);
  const algH = algLines.length * 4.5 + 4;
  drawBox(algH, true);
  doc.setTextColor(220, 38, 38);
  doc.text(algLines, col + 3, y + 4.5);
  y += algH + 5;

  // --- EMERGENCY CONTACTS ---
  sectionTitle('Emergency Contacts');
  if (emergencyContacts.length === 0) {
    drawBox(8, false);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text('No emergency contacts configured.', col + 3, y + 5);
    y += 13;
  } else {
    emergencyContacts.forEach((c, i) => {
      let h = 10;
      if (c.email) h += 4;
      
      drawBox(h, false);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(c.name, col + 3, y + 4.5);
      
      if (c.phoneNumber) {
        doc.setFontSize(8.5);
        doc.text(c.phoneNumber, col + contentW - 3, y + 4.5, { align: 'right' });
      }
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const relText = `${c.relationship || ''}${i === 0 ? ' • PRIMARY' : ''}`.toUpperCase();
      doc.text(relText, col + 3, y + 8.5);
      
      if (c.email) {
        doc.setFontSize(7.5);
        doc.text(c.email.toLowerCase(), col + 3, y + 12);
      }
      
      y += h + 2.5;
    });
    y += 2.5;
  }

  // --- MEDICATIONS ---
  sectionTitle('Current Medications');
  if (medications.length === 0) {
    drawBox(8, false);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text('No chronic medications listed.', col + 3, y + 5);
    y += 13;
  } else {
    medications.forEach((m) => {
      const detail = `${m.frequency || ''}${m.instructions ? ' (' + m.instructions + ')' : ''}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const detailLines = doc.splitTextToSize(detail, contentW - 30);
      const h = Math.max(10, detailLines.length * 3.5 + 6);
      
      drawBox(h, false);
      
      doc.setTextColor(15, 118, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(m.name, col + 3, y + 4.5);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(detailLines, col + 3, y + 8.5);
      
      if (m.dosage) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const dw = doc.getTextWidth(m.dosage) + 4;
        const dx = col + contentW - 2 - dw;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(dx, y + 2, dw, 6, 1.5, 1.5, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.text(m.dosage, dx + dw / 2, y + 6.2, { align: 'center' });
      }
      
      y += h + 2.5;
    });
    y += 2.5;
  }

  // --- INSURANCE FOOTER ---
  y += 2;
  if (profile.insurancePolicy || profile.insuranceNumber) {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(col, y, col + contentW, y);
    y += 6;

    const drawFooterPart = (label, value, align) => {
      if (!value) return;
      doc.setFontSize(7.5);
      
      let x = col;
      if (align === 'center') x = col + contentW / 2;
      else if (align === 'right') x = col + contentW;
      
      let wLabel = doc.getTextWidth(label);
      let wVal = doc.getTextWidth(value);
      let totalW = wLabel + wVal;
      
      let startX = x;
      if (align === 'center') startX = x - totalW / 2;
      else if (align === 'right') startX = x - totalW;
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(label, startX, y);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(value, startX + wLabel, y);
    };

    drawFooterPart('Insurance Policy: ', profile.insurancePolicy, 'left');
    drawFooterPart('ID/Policy #: ', profile.insuranceNumber, (profile.insurancePolicy && profile.insuranceValidTill) ? 'center' : (profile.insuranceValidTill ? 'center' : 'right'));
    drawFooterPart('Valid Till: ', profile.insuranceValidTill, 'right');
  }

  return doc;
}


// Builds a fully self-contained HTML string of the card for Android PDF saving
function buildCardHtml(profile, emergencyContacts, medications) {
  const contactsHtml = emergencyContacts.length > 0
    ? emergencyContacts.map((c, i) => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;">
          <strong>${c.name}</strong> &mdash; ${c.relationship}${i === 0 ? ' &bull; Primary' : ''}<br/>
          ${c.email ? `<span style="font-size:0.8em;color:#64748b;">${c.email}</span><br/>` : ''}
          ${c.phoneNumber ? `<span style="font-size:0.9em;font-weight:600;">${c.phoneNumber}</span>` : ''}
        </div>`).join('')
    : '<p style="color:#64748b;">No emergency contacts configured.</p>';

  const medsHtml = medications.length > 0
    ? medications.map(m => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;">
          <div>
            <strong>${m.name}</strong><br/>
            <span style="font-size:0.85em;color:#64748b;">${m.frequency}${m.instructions ? ` (${m.instructions})` : ''}</span>
          </div>
          <span style="font-weight:600;color:#1e40af;">${m.dosage}</span>
        </div>`).join('')
    : '<p style="color:#64748b;">No chronic medications listed.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>KinLedger - Emergency Card</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:16px;background:#f8fafc;color:#1e293b;}
    .header{background:#dc2626;color:#fff;padding:16px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center;}
    .header h2{margin:0;font-size:1.2em;}
    .body{background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:16px;}
    .name{font-size:1.3em;font-weight:700;margin:0;}
    .blood{background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:8px 16px;text-align:center;}
    .blood .label{font-size:0.7em;color:#dc2626;display:block;}
    .blood .type{font-size:1.4em;font-weight:700;color:#dc2626;}
    .section-title{font-size:0.75em;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px;}
    .section-content{background:#f8fafc;border-radius:6px;padding:10px;font-size:0.9em;}
    .split{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
    .footer{margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:0.8em;color:#64748b;}
    @media print{body{background:#fff;padding:0;}}
  </style>
</head>
<body>
  <div class="header">
    <h2>Emergency Medical Card</h2>
    <span>&#128737;</span>
  </div>
  <div class="body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
      <div>
        <p class="name">${profile.fullName || 'No Name Provided'}</p>
        <p style="margin:4px 0 0;color:#64748b;">Age: ${profile.age ? profile.age + ' years' : 'Not specified'}</p>
      </div>
      ${profile.bloodGroup ? `<div class="blood"><span class="label">Blood Group</span><span class="type">${profile.bloodGroup}</span></div>` : ''}
    </div>
    <div class="section-title">Medical Conditions / Diagnosis</div>
    <div class="section-content">${profile.conditions || 'No medical conditions reported.'}</div>
    <div class="section-title">Critical Allergies</div>
    <div class="section-content" style="color:#dc2626;">${profile.allergies || 'No drug or food allergies mentioned.'}</div>
    <div class="split">
      <div>
        <div class="section-title">Emergency Contacts</div>
        ${contactsHtml}
      </div>
      <div>
        <div class="section-title">Current Medications</div>
        ${medsHtml}
      </div>
    </div>
    ${(profile.insurancePolicy || profile.insuranceNumber) ? `
    <div class="footer">
      Insurance: <strong>${profile.insurancePolicy || 'N/A'}</strong> &nbsp;|&nbsp;
      Policy #: <strong>${profile.insuranceNumber || 'N/A'}</strong>
      ${profile.insuranceValidTill ? ` &nbsp;|&nbsp; Valid Till: <strong>${profile.insuranceValidTill}</strong>` : ''}
    </div>` : ''}
  </div>
</body>
</html>`;
}

export default function EmergencyCard({ profile, emergencyContacts, medications, synced }) {
  const handlePrint = async () => {
    if (Capacitor.isNativePlatform()) {
      // Android: generate PDF with jsPDF, write to cache, share via native share sheet
      try {
        const doc = buildCardPdf(profile, emergencyContacts, medications);
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const fileName = `KinLedger_Card_${profile.fullName ? profile.fullName.replace(/\s+/g, '_') : Date.now()}.pdf`;
        await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        const { uri } = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });
        await Share.share({
          title: `KinLedger - ${profile.fullName || 'Emergency Card'}`,
          files: [uri],
          dialogTitle: 'Save or Share Emergency Card PDF',
        });
      } catch (err) {
        // User dismissed the share sheet — not an error, ignore silently
        if (err && !String(err).toLowerCase().includes('cancel')) {
          console.error('PDF generation failed:', err);
          alert('Could not generate the PDF. Please try again.');
        }
      }
    } else {
      // Browser: use native print dialog (works on web/desktop)
      window.print();
    }
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
              {profile.allergies || 'No drug or food allergies mentioned.'}
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

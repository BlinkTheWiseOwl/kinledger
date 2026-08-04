const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

code = code.replace('Check, Pencil }', 'Check, Pencil, Pill }');

const update_funcs = `
  // Update active card contact/medication directly for inline editing
  const updateActiveCardContact = (index, field, value) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        const contacts = [...c.emergencyContacts];
        contacts[index] = { ...contacts[index], [field]: value };
        return { ...c, emergencyContacts: contacts };
      }
      return c;
    });
    setCards(updated);
  };

  const updateActiveCardMedication = (index, field, value) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        const meds = [...c.medications];
        meds[index] = { ...meds[index], [field]: value };
        return { ...c, medications: meds };
      }
      return c;
    });
    setCards(updated);
  };
`;
code = code.replace('const updateActiveCardAvatar = (value) => {', update_funcs + '\n  const updateActiveCardAvatar = (value) => {');

const old_remove_contact = `  // Remove contact from selected card
  const removeContactFromActiveCard = (index) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          emergencyContacts: c.emergencyContacts.filter((_, i) => i !== index)
        };
      }
      return c;
    });
    setCards(updated);
    showStatus("Emergency contact removed. Click 'Save Card Information' at the top to save your changes.", "info");
  };`;
const new_remove_contact = `  // Remove contact from selected card
  const removeContactFromActiveCard = (index) => {
    if (!selectedCardId) return;
    if (window.confirm("Are you sure you want to delete this contact?")) {
      const updated = cards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            emergencyContacts: c.emergencyContacts.filter((_, i) => i !== index)
          };
        }
        return c;
      });
      setCards(updated);
      showStatus("Emergency contact removed.", "info");
    }
  };`;
code = code.replace(old_remove_contact, new_remove_contact);

const old_remove_med = `  // Remove medication from selected card
  const removeMedicationFromActiveCard = (index) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          medications: c.medications.filter((_, i) => i !== index)
        };
      }
      return c;
    });
    setCards(updated);
    showStatus("Medication removed. Click 'Save Card Information' at the top to save your changes.", "info");
  };`;
const new_remove_med = `  // Remove medication from selected card
  const removeMedicationFromActiveCard = (index) => {
    if (!selectedCardId) return;
    if (window.confirm("Are you sure you want to delete this medication?")) {
      const updated = cards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            medications: c.medications.filter((_, i) => i !== index)
          };
        }
        return c;
      });
      setCards(updated);
      showStatus("Medication removed.", "info");
    }
  };`;
code = code.replace(old_remove_med, new_remove_med);

code = code.replace('<User size={15} />\n                {getReadinessStatus', '<Pencil size={15} />\n                {getReadinessStatus');
code = code.replace('<Heart size={18} /></div>\n                    <div className="section-row-info">\n                      <span className="section-row-label">Medications</span>', '<Pill size={18} /></div>\n                    <div className="section-row-info">\n                      <span className="section-row-label">Medications</span>');
code = code.replace('<Share2 size={18} /></div>\n                    <div className="section-row-info">\n                      <span className="section-row-label">Share</span>', '<Users size={18} /></div>\n                    <div className="section-row-info">\n                      <span className="section-row-label">Share</span>');
code = code.replace("{activeSheet === 'meds' && <><Heart size={18} /> Medications</>}", "{activeSheet === 'meds' && <><Pill size={18} /> Medications</>}");
code = code.replace("{activeSheet === 'share' && <><Share2 size={18} /> Share Card</>}", "{activeSheet === 'share' && <><Users size={18} /> Share Card</>}");

code = code.replace(
    `<input type="text" placeholder="e.g., Shloka Kumar" value={newContact.name}
                                  onChange={e => updateNewContact('name', e.target.value)}
                                  style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`,
    `<input type="text" placeholder="e.g., Shloka Kumar" value={contact.name}
                                  onChange={e => updateActiveCardContact(index, 'name', e.target.value)}
                                  style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`
);

code = code.replace(
    `<select value={newContact.relationship} onChange={e => updateNewContact('relationship', e.target.value)}
                                  style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`,
    `<select value={contact.relationship} onChange={e => updateActiveCardContact(index, 'relationship', e.target.value)}
                                  style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`
);

code = code.replace(
    `<input type="tel" placeholder="e.g., 9886012345" value={newContact.phoneNumber}
                                  onChange={e => updateNewContact('phoneNumber', e.target.value)}
                                  style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`,
    `<input type="tel" placeholder="e.g., 9886012345" value={contact.phoneNumber}
                                  onChange={e => updateActiveCardContact(index, 'phoneNumber', e.target.value)}
                                  style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`
);

code = code.replace(
    `<input type="email" placeholder="e.g., shloka@email.com" value={newContact.email || ''}
                                  onChange={e => updateNewContact('email', e.target.value)}
                                  style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`,
    `<input type="email" placeholder="e.g., shloka@email.com" value={contact.email || ''}
                                  onChange={e => updateActiveCardContact(index, 'email', e.target.value)}
                                  style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />`
);

const old_contact_buttons = `<div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={() => {
                                  setEditingContactIndex(null);
                                  setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
                                }}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-secondary" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={(e) => addContactToActiveCard(e)}>
                                  Save Changes
                                </button>
                              </div>`;
code = code.replace(old_contact_buttons, '');

code = code.replace(
    `<div className="form-grid">
                              <div className="form-group">
                                <label>Name <span className="required-asterisk">*</span></label>`,
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Edit Contact</h4>
                                <button type="button" className="btn-icon-subtle" onClick={() => setEditingContactIndex(null)} title="Close">
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="form-grid">
                              <div className="form-group">
                                <label>Name <span className="required-asterisk">*</span></label>`
);

code = code.replace(
    `<input type="text" placeholder="e.g., Metformin" value={newMed.name}
                                  onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))} />`,
    `<input type="text" placeholder="e.g., Metformin" value={med.name}
                                  onChange={e => updateActiveCardMedication(index, 'name', e.target.value)} />`
);

code = code.replace(
    `<input type="text" placeholder="e.g., 500mg, 1 tab" value={newMed.dosage}
                                  onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))} />`,
    `<input type="text" placeholder="e.g., 500mg, 1 tab" value={med.dosage}
                                  onChange={e => updateActiveCardMedication(index, 'dosage', e.target.value)} />`
);

code = code.replace(
    `<select value={newMed.frequency} onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}>`,
    `<select value={med.frequency} onChange={e => updateActiveCardMedication(index, 'frequency', e.target.value)}>`
);

code = code.replace(
    `<input type="text" placeholder="e.g., After meals" value={newMed.instructions}
                                  onChange={e => setNewMed(prev => ({ ...prev, instructions: e.target.value }))} />`,
    `<input type="text" placeholder="e.g., After meals" value={med.instructions}
                                  onChange={e => updateActiveCardMedication(index, 'instructions', e.target.value)} />`
);

const old_med_buttons = `<div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={() => {
                                  setEditingMedIndex(null);
                                  setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
                                }}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-secondary" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={(e) => addMedicationToActiveCard(e)}>
                                  Save Changes
                                </button>
                              </div>`;
code = code.replace(old_med_buttons, '');

code = code.replace(
    `<div className="form-grid">
                              <div className="form-group">
                                <label>Med Name <span className="required-asterisk">*</span></label>`,
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Edit Medication</h4>
                                <button type="button" className="btn-icon-subtle" onClick={() => setEditingMedIndex(null)} title="Close">
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="form-grid">
                              <div className="form-group">
                                <label>Med Name <span className="required-asterisk">*</span></label>`
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');

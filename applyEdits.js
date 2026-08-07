const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// 1. Add updateActiveCardContact / updateActiveCardMedication functions
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
if (!code.includes('updateActiveCardContact')) {
    code = code.replace('const updateActiveCardAvatar = (value) => {', update_funcs + '\n  const updateActiveCardAvatar = (value) => {');
}

// 2. Fix the close sheet buttons to reload data
code = code.replace(
    `<div className="bottom-sheet-overlay" onClick={() => setActiveSheet(null)}>`,
    `<div className="bottom-sheet-overlay" onClick={() => { setActiveSheet(null); if (userEmail) loadCardData(userEmail).then(setCards); }}>`
);
code = code.replace(
    `<button className="modal-close-btn" onClick={() => setActiveSheet(null)} aria-label="Close">`,
    `<button className="modal-close-btn" onClick={() => { setActiveSheet(null); if (userEmail) loadCardData(userEmail).then(setCards); }} aria-label="Close">`
);

// 3. Change Contact inline edit fields to update immediately
code = code.replace(
    `<input type="text" placeholder="e.g., Shloka Kumar" value={newContact.name}`,
    `<input type="text" placeholder="e.g., Shloka Kumar" value={contact.name}`
).replace(
    `onChange={e => updateNewContact('name', e.target.value)}`,
    `onChange={e => updateActiveCardContact(index, 'name', e.target.value)}`
);

code = code.replace(
    `<select value={newContact.relationship} onChange={e => updateNewContact('relationship', e.target.value)}`,
    `<select value={contact.relationship} onChange={e => updateActiveCardContact(index, 'relationship', e.target.value)}`
);

code = code.replace(
    `<input type="tel" placeholder="e.g., 9886012345" value={newContact.phoneNumber}`,
    `<input type="tel" placeholder="e.g., 9886012345" value={contact.phoneNumber}`
).replace(
    `onChange={e => updateNewContact('phoneNumber', e.target.value)}`,
    `onChange={e => updateActiveCardContact(index, 'phoneNumber', e.target.value)}`
);

code = code.replace(
    `<input type="email" placeholder="e.g., shloka@email.com" value={newContact.email || ''}`,
    `<input type="email" placeholder="e.g., shloka@email.com" value={contact.email || ''}`
).replace(
    `onChange={e => updateNewContact('email', e.target.value)}`,
    `onChange={e => updateActiveCardContact(index, 'email', e.target.value)}`
);

// 4. Change Med inline edit fields to update immediately
code = code.replace(
    `<input type="text" placeholder="e.g., Metformin" value={newMed.name}`,
    `<input type="text" placeholder="e.g., Metformin" value={med.name}`
).replace(
    `onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))} />`,
    `onChange={e => updateActiveCardMedication(index, 'name', e.target.value)} />`
);

code = code.replace(
    `<input type="text" placeholder="e.g., 500mg, 1 tab" value={newMed.dosage}`,
    `<input type="text" placeholder="e.g., 500mg, 1 tab" value={med.dosage}`
).replace(
    `onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))} />`,
    `onChange={e => updateActiveCardMedication(index, 'dosage', e.target.value)} />`
);

code = code.replace(
    `<select value={newMed.frequency} onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}>`,
    `<select value={med.frequency} onChange={e => updateActiveCardMedication(index, 'frequency', e.target.value)}>`
);

code = code.replace(
    `<input type="text" placeholder="e.g., After meals" value={newMed.instructions}`,
    `<input type="text" placeholder="e.g., After meals" value={med.instructions}`
).replace(
    `onChange={e => setNewMed(prev => ({ ...prev, instructions: e.target.value }))} />`,
    `onChange={e => updateActiveCardMedication(index, 'instructions', e.target.value)} />`
);

// 5. Remove the Contact buttons and add Edit Contact header
const old_contact_buttons = \`<div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={() => {
                                  setEditingContactIndex(null);
                                  setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
                                }}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-secondary" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={(e) => addContactToActiveCard(e)}>
                                  Save Changes
                                </button>
                              </div>\`;
code = code.replace(old_contact_buttons, '');

code = code.replace(
    \`<div className="form-grid">
                              <div className="form-group">
                                <label>Name <span className="required-asterisk">*</span></label>\`,
    \`<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Edit Contact</h4>
                              </div>
                              <div className="form-grid">
                              <div className="form-group">
                                <label>Name <span className="required-asterisk">*</span></label>\`
);

// 6. Remove the Med buttons and add Edit Med header
const old_med_buttons = \`<div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-outline" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={() => {
                                  setEditingMedIndex(null);
                                  setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
                                }}>
                                  Cancel
                                </button>
                                <button type="button" className="btn btn-secondary" style={{ width: 'auto', flex: 1, minWidth: '120px' }} onClick={(e) => addMedicationToActiveCard(e)}>
                                  Save Changes
                                </button>
                              </div>\`;
code = code.replace(old_med_buttons, '');

code = code.replace(
    \`<div className="form-grid">
                              <div className="form-group">
                                <label>Med Name <span className="required-asterisk">*</span></label>\`,
    \`<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Edit Medication</h4>
                              </div>
                              <div className="form-grid">
                              <div className="form-group">
                                <label>Med Name <span className="required-asterisk">*</span></label>\`
);


fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
console.log("App.jsx updated!");

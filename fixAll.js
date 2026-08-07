const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');
let changes = [];

// ===== FIX 1: Crash - Replace regex-wrapped showStatus calls with proper string calls =====

// Contact messages
code = code.replace(
  `showStatus(/"Emergency contact updated. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Emergency contact updated. Click 'Save & Close' to confirm.", "info")`
);
code = code.replace(
  `showStatus(/"Emergency contact added. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Emergency contact added. Click 'Save & Close' to confirm.", "info")`
);
code = code.replace(
  `showStatus(/"Emergency contact removed. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Emergency contact removed. Click 'Save & Close' to confirm.", "info")`
);

// Medication messages
code = code.replace(
  `showStatus(/"Medication updated. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Medication updated. Click 'Save & Close' to confirm.", "info")`
);
code = code.replace(
  `showStatus(/"Medication added. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Medication added. Click 'Save & Close' to confirm.", "info")`
);
code = code.replace(
  `showStatus(/"Medication removed. Click 'Save & Close' to confirm."/, "info")`,
  `showStatus("Medication removed. Click 'Save & Close' to confirm.", "info")`
);

changes.push('FIX 1: Fixed showStatus regex-literal crash');

// ===== FIX 2: Replace Pill with custom CapsuleIcon =====

// Add CapsuleIcon import after the lucide-react import line
code = code.replace(
  `import { loadCardData, saveCardData, BACKEND_URL } from './utils/storage';`,
  `import { loadCardData, saveCardData, BACKEND_URL } from './utils/storage';\nimport CapsuleIcon from './components/CapsuleIcon';`
);

// Replace <Pill size={18} /> with <CapsuleIcon size={18} />
code = code.replace(/<Pill size=\{18\} \/>/g, '<CapsuleIcon size={18} />');

// Remove Pill from lucide-react import (keep Tablets in case it's used elsewhere)
code = code.replace(', Pill, Tablets', ', Tablets');
// Also try without Tablets
code = code.replace(', Pill', '');

changes.push('FIX 2: Replaced Pill icon with custom CapsuleIcon');

// ===== FIX 3 & 4: Show Add Contact/Medication form even when editing an existing item =====

// For contacts: change {editingContactIndex === null && ( to just (
code = code.replace(
  `{editingContactIndex === null && (
                    <form onSubmit={addContactToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add Contact</h4>`,
  `{(
                    <form onSubmit={addContactToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add New Contact</h4>`
);

// For medications: change {editingMedIndex === null && ( to just (
code = code.replace(
  `{editingMedIndex === null && (
                    <form onSubmit={addMedicationToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add Medication</h4>`,
  `{(
                    <form onSubmit={addMedicationToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add New Medication</h4>`
);

changes.push('FIX 3 & 4: Add forms persist when editing existing items');

// ===== FIX 5: Update handleSaveActiveCard to auto-save pending items =====

const oldHandleSave = `  // Manual trigger to save current active states
  const handleSaveActiveCard = async () => {
    return await saveCollection(cards);
  };`;

const newHandleSave = `  // Manual trigger to save current active states (auto-flushes pending add forms)
  const handleSaveActiveCard = async () => {
    let currentCards = [...cards];
    let cardsChanged = false;

    // Auto-save pending new contact if partially filled
    if (newContact && newContact.name && newContact.name.trim() !== '') {
      currentCards = currentCards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            emergencyContacts: [...c.emergencyContacts, { ...newContact }]
          };
        }
        return c;
      });
      setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
      cardsChanged = true;
    }

    // Auto-save pending new medication if partially filled
    if (newMed && newMed.name && newMed.name.trim() !== '') {
      currentCards = currentCards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            medications: [...c.medications, { ...newMed }]
          };
        }
        return c;
      });
      setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
      cardsChanged = true;
    }

    if (cardsChanged) {
      setCards(currentCards);
    }
    return await saveCollection(currentCards);
  };`;

if (code.includes(oldHandleSave)) {
  code = code.replace(oldHandleSave, newHandleSave);
  changes.push('FIX 5: handleSaveActiveCard auto-saves pending items');
} else {
  console.log('WARNING: Could not find handleSaveActiveCard to replace. It may have already been updated.');
}

fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
console.log('App.jsx updated successfully!');
console.log('Changes applied:');
changes.forEach(c => console.log('  - ' + c));

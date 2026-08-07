const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// 1. Replace Tablets with Pill
code = code.replace(/<Tablets size=\{18\} \/>/g, '<Pill size={18} />');

// 2. Update status messages for add/update/remove Contact and Medication
code = code.replace(
    /"Emergency contact updated. Click 'Save Card Information' at the top to save your changes."/g,
    /"Emergency contact updated. Click 'Save & Close' to confirm."/
);
code = code.replace(
    /"Emergency contact added. Click 'Save Card Information' at the top to save your changes."/g,
    /"Emergency contact added. Click 'Save & Close' to confirm."/
);
code = code.replace(
    /"Emergency contact removed. Click 'Save Card Information' at the top to save your changes."/g,
    /"Emergency contact removed. Click 'Save & Close' to confirm."/
);

code = code.replace(
    /"Medication updated. Click 'Save Card Information' at the top to save your changes."/g,
    /"Medication updated. Click 'Save & Close' to confirm."/
);
code = code.replace(
    /"Medication added. Click 'Save Card Information' at the top to save your changes."/g,
    /"Medication added. Click 'Save & Close' to confirm."/
);
code = code.replace(
    /"Medication removed. Click 'Save Card Information' at the top to save your changes."/g,
    /"Medication removed. Click 'Save & Close' to confirm."/
);


// 3. Update handleSaveActiveCard to flush pending items
const handleSaveActiveCardStr = `
  // Manual trigger to save current active states
  const handleSaveActiveCard = async () => {
    let currentCards = [...cards];
    let cardsChanged = false;

    // Check if there is an unsaved new contact
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

    // Check if there is an unsaved new medication
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
  };
`;

code = code.replace(
    `  // Manual trigger to save current active states
  const handleSaveActiveCard = async () => {
    return await saveCollection(cards);
  };`,
    handleSaveActiveCardStr.trim()
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
console.log("App.jsx updated!");

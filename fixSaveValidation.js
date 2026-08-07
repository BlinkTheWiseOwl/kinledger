const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// The new handleSaveActiveCard function
const newHandleSave = `  // Manual trigger to save current active states (auto-flushes pending add forms with validation)
  const handleSaveActiveCard = async () => {
    let currentCards = [...cards];
    let cardsChanged = false;

    // Validate and auto-save pending new contact if partially filled
    const hasPendingContact = newContact && (
      (newContact.name && newContact.name.trim() !== '') ||
      newContact.relationship ||
      (newContact.phoneNumber && newContact.phoneNumber.trim() !== '') ||
      (newContact.email && newContact.email.trim() !== '')
    );

    if (hasPendingContact) {
      const { name = '', relationship = '', phoneNumber = '', email = '' } = newContact;
      const contactErrors = {};

      if (!name.trim()) {
        contactErrors.newContactName = "Contact Name is required.";
      } else if (name.length < 2 || name.length > 100) {
        contactErrors.newContactName = "Contact Name must be between 2 and 100 characters.";
      } else if (containsUnsafeChars(name)) {
        contactErrors.newContactName = "Contact Name cannot contain unsafe characters (<, >, \\\\, \`).";
      }

      if (!relationship) {
        contactErrors.newContactRelationship = "Relationship is required.";
      }

      if (!phoneNumber.trim()) {
        contactErrors.newContactPhone = "Phone Number is required.";
      } else if (!/^[0-9]{8,14}$/.test(phoneNumber.trim())) {
        contactErrors.newContactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
      }

      if (email && email.trim() !== '') {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          contactErrors.newContactEmail = "Please enter a valid email address.";
        } else if (containsUnsafeChars(email)) {
          contactErrors.newContactEmail = "Email cannot contain unsafe characters (<, >, \\\\, \`).";
        }
      }

      // Check limits
      const activeCard = cards.find(c => c.id === selectedCardId);
      if (activeCard && activeCard.emergencyContacts.length >= 2) {
        showStatus('Emergency contacts are limited to 2 per card.', 'error');
        return false;
      }

      if (Object.keys(contactErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...contactErrors }));
        showStatus('Please correct the contact form errors.', 'error');
        return false;
      }

      // If valid, append it
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

    // Validate and auto-save pending new medication if partially filled
    const hasPendingMed = newMed && (
      (newMed.name && newMed.name.trim() !== '') ||
      (newMed.dosage && newMed.dosage.trim() !== '') ||
      newMed.frequency ||
      (newMed.instructions && newMed.instructions.trim() !== '')
    );

    if (hasPendingMed) {
      const { name = '', dosage = '', frequency = '', instructions = '' } = newMed;

      if (!name.trim()) {
        showStatus('Medication Name is required.', 'error');
        return false;
      }
      if (name.length > 100) {
        showStatus('Medication Name cannot exceed 100 characters.', 'error');
        return false;
      }
      if (containsUnsafeChars(name)) {
        showStatus('Medication Name cannot contain unsafe characters (<, >, \\\\, \`).', 'error');
        return false;
      }
      if (dosage && dosage.length > 50) {
        showStatus('Dosage cannot exceed 50 characters.', 'error');
        return false;
      }
      if (containsUnsafeChars(dosage)) {
        showStatus('Dosage cannot contain unsafe characters (<, >, \\\\, \`).', 'error');
        return false;
      }
      if (containsUnsafeChars(frequency)) {
        showStatus('Frequency cannot contain unsafe characters (<, >, \\\\, \`).', 'error');
        return false;
      }
      if (containsUnsafeChars(instructions)) {
        showStatus('Instructions cannot contain unsafe characters (<, >, \\\\, \`).', 'error');
        return false;
      }

      // If valid, append it
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

// Replace handleSaveActiveCard in the file
// Find handleSaveActiveCard starting line
const startIndex = code.indexOf('  // Manual trigger to save current active states');
if (startIndex !== -1) {
  // Let's replace the block from "  // Manual trigger to save current active states" up to "  // Share app invite / install link"
  const endIndex = code.indexOf('  // Share app invite / install link');
  if (endIndex !== -1) {
    const targetPart = code.substring(startIndex, endIndex);
    code = code.replace(targetPart, newHandleSave.trim() + '\n\n');
    fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
    console.log('Successfully updated handleSaveActiveCard in App.jsx!');
  } else {
    console.log('Error: Could not find end marker.');
  }
} else {
  console.log('Error: Could not find start marker.');
}

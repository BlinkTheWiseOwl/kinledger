const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// 1. Update updateNewContact to use newContactPrefix for validation keys
code = code.replace(
  `      if (field === 'name') {
        if (!value.trim()) {
          copy.contactName = "Contact Name is required.";
        } else if (value.length < 2 || value.length > 100) {
          copy.contactName = "Contact Name must be between 2 and 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.contactName = "Contact Name cannot contain unsafe characters (<, >, \\\\, \`).";
        } else {
          delete copy.contactName;
        }
      }

      if (field === 'relationship') {
        if (!value) {
          copy.contactRelationship = "Relationship is required.";
        } else {
          delete copy.contactRelationship;
        }
      }

      if (field === 'phoneNumber') {
        if (!value.trim()) {
          copy.contactPhone = "Phone Number is required.";
        } else if (!/^[0-9]{8,14}$/.test(value.trim())) {
          copy.contactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
        } else {
          delete copy.contactPhone;
        }
      }

      if (field === 'email') {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            copy.contactEmail = "Please enter a valid email address.";
          } else if (containsUnsafeChars(value)) {
            copy.contactEmail = "Email cannot contain unsafe characters (<, >, \\\\, \`).";
          } else {
            delete copy.contactEmail;
          }
        } else {
          delete copy.contactEmail;
        }
      }`,
  `      if (field === 'name') {
        if (!value.trim()) {
          copy.newContactName = "Contact Name is required.";
        } else if (value.length < 2 || value.length > 100) {
          copy.newContactName = "Contact Name must be between 2 and 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.newContactName = "Contact Name cannot contain unsafe characters (<, >, \\\\, \`).";
        } else {
          delete copy.newContactName;
        }
      }

      if (field === 'relationship') {
        if (!value) {
          copy.newContactRelationship = "Relationship is required.";
        } else {
          delete copy.newContactRelationship;
        }
      }

      if (field === 'phoneNumber') {
        if (!value.trim()) {
          copy.newContactPhone = "Phone Number is required.";
        } else if (!/^[0-9]{8,14}$/.test(value.trim())) {
          copy.newContactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
        } else {
          delete copy.newContactPhone;
        }
      }

      if (field === 'email') {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            copy.newContactEmail = "Please enter a valid email address.";
          } else if (containsUnsafeChars(value)) {
            copy.newContactEmail = "Email cannot contain unsafe characters (<, >, \\\\, \`).";
          } else {
            delete copy.newContactEmail;
          }
        } else {
          delete copy.newContactEmail;
        }
      }`
);

// 2. Update addContactToActiveCard keys
code = code.replace(
  `    const { name, relationship, phoneNumber, email = '' } = newContact;

    const errors = {};
    if (!name.trim()) {
      errors.contactName = "Contact Name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.contactName = "Contact Name must be between 2 and 100 characters.";
    } else if (containsUnsafeChars(name)) {
      errors.contactName = "Contact Name cannot contain unsafe characters (<, >, \\\\, \`).";
    }

    if (!relationship) {
      errors.contactRelationship = "Relationship is required.";
    }

    if (!phoneNumber.trim()) {
      errors.contactPhone = "Phone Number is required.";
    } else if (!/^[0-9]{8,14}$/.test(phoneNumber.trim())) {
      errors.contactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
    }

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.contactEmail = "Please enter a valid email address.";
      } else if (containsUnsafeChars(email)) {
        errors.contactEmail = "Email cannot contain unsafe characters (<, >, \\\\, \`).";
      }
    }`,
  `    const { name, relationship, phoneNumber, email = '' } = newContact;

    const errors = {};
    if (!name.trim()) {
      errors.newContactName = "Contact Name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.newContactName = "Contact Name must be between 2 and 100 characters.";
    } else if (containsUnsafeChars(name)) {
      errors.newContactName = "Contact Name cannot contain unsafe characters (<, >, \\\\, \`).";
    }

    if (!relationship) {
      errors.newContactRelationship = "Relationship is required.";
    }

    if (!phoneNumber.trim()) {
      errors.newContactPhone = "Phone Number is required.";
    } else if (!/^[0-9]{8,14}$/.test(phoneNumber.trim())) {
      errors.newContactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
    }

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.newContactEmail = "Please enter a valid email address.";
      } else if (containsUnsafeChars(email)) {
        errors.newContactEmail = "Email cannot contain unsafe characters (<, >, \\\\, \`).";
      }
    }`
);

code = code.replace(
  `    // Clear contact errors
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.contactName;
      delete copy.contactRelationship;
      delete copy.contactPhone;
      delete copy.contactEmail;
      return copy;
    });`,
  `    // Clear contact errors
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.newContactName;
      delete copy.newContactRelationship;
      delete copy.newContactPhone;
      delete copy.newContactEmail;
      return copy;
    });`
);

// 3. Update saveCollection contacts validation block
code = code.replace(
  `        // 10. Emergency Contacts
        (activeUpdate.emergencyContacts || []).forEach((contact, idx) => {
          if (containsUnsafeChars(contact.name)) {
            errors[\`contactName_\${idx}\`] = \`Emergency Contact #\${idx + 1} Name cannot contain unsafe characters (<, >, \\\\, \\\`).\`;
          }
          if (containsUnsafeChars(contact.email)) {
            errors[\`contactEmail_\${idx}\`] = \`Emergency Contact #\${idx + 1} Email cannot contain unsafe characters (<, >, \\\\, \\\`).\`;
          }
        });`,
  `        // 10. Emergency Contacts
        (activeUpdate.emergencyContacts || []).forEach((contact, idx) => {
          if (!contact.name || !contact.name.trim()) {
            errors[\`contactName_\${idx}\`] = "Contact Name is required.";
          } else if (contact.name.length < 2 || contact.name.length > 100) {
            errors[\`contactName_\${idx}\`] = "Contact Name must be between 2 and 100 characters.";
          } else if (containsUnsafeChars(contact.name)) {
            errors[\`contactName_\${idx}\`] = "Contact Name cannot contain unsafe characters.";
          }

          if (!contact.relationship) {
            errors[\`contactRelationship_\${idx}\`] = "Relationship is required.";
          }

          if (!contact.phoneNumber || !contact.phoneNumber.trim()) {
            errors[\`contactPhone_\${idx}\`] = "Phone Number is required.";
          } else if (!/^[0-9]{8,14}$/.test(contact.phoneNumber.trim())) {
            errors[\`contactPhone_\${idx}\`] = "Phone Number must contain exactly 8 to 14 digits.";
          }

          if (contact.email && contact.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/;
            if (!emailRegex.test(contact.email.trim())) {
              errors[\`contactEmail_\${idx}\`] = "Please enter a valid email address.";
            } else if (containsUnsafeChars(contact.email)) {
              errors[\`contactEmail_\${idx}\`] = "Email cannot contain unsafe characters.";
            }
          }
        });`
);

// 4. Update Add New Contact form fields JSX
code = code.replace(
  `                            style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactName && <span className="field-error">{validationErrors.contactName}</span>}`,
  `                            style={validationErrors.newContactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.newContactName && <span className="field-error">{validationErrors.newContactName}</span>}`
);
code = code.replace(
  `                            style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`,
  `                            style={validationErrors.newContactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`
);
code = code.replace(
  `                          {validationErrors.contactRelationship && <span className="field-error">{validationErrors.contactRelationship}</span>}`,
  `                          {validationErrors.newContactRelationship && <span className="field-error">{validationErrors.newContactRelationship}</span>}`
);
code = code.replace(
  `                            style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactPhone && <span className="field-error">{validationErrors.contactPhone}</span>}`,
  `                            style={validationErrors.newContactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.newContactPhone && <span className="field-error">{validationErrors.newContactPhone}</span>}`
);
code = code.replace(
  `                            style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactEmail && <span className="field-error">{validationErrors.contactEmail}</span>}`,
  `                            style={validationErrors.newContactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.newContactEmail && <span className="field-error">{validationErrors.newContactEmail}</span>}`
);

// 5. Update Inline Edit form fields JSX to use indexed keys
code = code.replace(
  `                                  style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors.contactName && <span className="field-error">{validationErrors.contactName}</span>}`,
  `                                  style={validationErrors[\`contactName_\${index}\`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[\`contactName_\${index}\`] && <span className="field-error">{validationErrors[\`contactName_\${index}\`]}</span>}`
);
code = code.replace(
  `                                  style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`,
  `                                  style={validationErrors[\`contactRelationship_\${index}\`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>`
);
code = code.replace(
  `                                {validationErrors.contactRelationship && <span className="field-error">{validationErrors.contactRelationship}</span>}`,
  `                                {validationErrors[\`contactRelationship_\${index}\`] && <span className="field-error">{validationErrors[\`contactRelationship_\${index}\`]}</span>}`
);
code = code.replace(
  `                                  style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors.contactPhone && <span className="field-error">{validationErrors.contactPhone}</span>}`,
  `                                  style={validationErrors[\`contactPhone_\${index}\`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[\`contactPhone_\${index}\`] && <span className="field-error">{validationErrors[\`contactPhone_\${index}\`]}</span>}`
);
code = code.replace(
  `                                  style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors.contactEmail && <span className="field-error">{validationErrors.contactEmail}</span>}`,
  `                                  style={validationErrors[\`contactEmail_\${index}\`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[\`contactEmail_\${index}\`] && <span className="field-error">{validationErrors[\`contactEmail_\${index}\`]}</span>}`
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
console.log('App.jsx successfully updated with separate validation states!');

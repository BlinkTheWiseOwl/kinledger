const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kinledger_super_secret_key_123456';

const crypto = require('crypto');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Helper to derive 32-byte key from ENCRYPTION_KEY or fall back to JWT_SECRET
const getEncryptionKey = () => {
  const rawKey = process.env.ENCRYPTION_KEY || JWT_SECRET;
  return crypto.createHash('sha256').update(rawKey).digest();
};

// Encrypt text (AES-256-CBC with random IV)
const encrypt = (text) => {
  if (text === null || text === undefined || text === '') return '';
  try {
    const textStr = String(text);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(textStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
};

// Decrypt text (backward-compatible with plaintext)
const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 2) return cipherText; // legacy plaintext
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return cipherText;
  }
};

// Input Validation Helpers
const containsUnsafeChars = (text) => {
  if (!text) return false;
  return /[<>\\`]/.test(String(text));
};

const validateInsuranceExpiryBackend = (dateStr) => {
  const months = {
    jan: 1, january: 1, janruary: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
    nov: 11, november: 11, dec: 12, december: 12
  };
  
  const trimmed = dateStr.trim();
  let month = null;
  let year = null;
  
  const mmyyyy = trimmed.match(/^([0-9]{1,2})\/([0-9]{4})$/);
  if (mmyyyy) {
    month = parseInt(mmyyyy[1], 10);
    year = parseInt(mmyyyy[2], 10);
  } else {
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
      month = months[parts[0].toLowerCase()];
      year = parseInt(parts[1], 10);
    }
  }
  
  if (!month || isNaN(year) || month < 1 || month > 12) {
    return { valid: false, message: "Insurance Valid Till must be in a valid format (e.g. MM/YYYY or 'Dec 2028')." };
  }
  
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  
  if (year < curYear || (year === curYear && month < curMonth)) {
    return { valid: false, message: "Insurance Valid Till date cannot be in the past." };
  }
  
  if (year > curYear + 10 || (year === curYear + 10 && month > curMonth)) {
    return { valid: false, message: "Insurance Valid Till date cannot be more than 10 years in the future." };
  }
  
  return { valid: true };
};

// Audit Log Helper
const logAudit = async (userId, email, action, details) => {
  try {
    await db.query(
      'INSERT INTO public.audit_logs (user_id, user_email, action, details) VALUES ($1, $2, $3, $4)',
      [userId || null, email || null, action, details || '']
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]:', err);
  }
};

app.use(cors());
app.use(express.json());

// Serve React production static build folder
const staticPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(staticPath));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user; // user: { id, email }
    next();
  });
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (containsUnsafeChars(email)) {
    return res.status(400).json({ error: 'Email contains unsafe characters.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Check if email already exists
    const userCheck = await db.query('SELECT id FROM public.users WHERE email = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [cleanEmail, passwordHash]
    );

    const userObj = newUser.rows[0];
    
    // Create token
    const token = jwt.sign({ id: userObj.id, email: userObj.email }, JWT_SECRET, { expiresIn: '30d' });

    // Log signup audit event
    await logAudit(userObj.id, userObj.email, 'SIGNUP', 'New user registered and accepted DPDP consent terms.');

    res.json({ token, user: { email: userObj.email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Check user existence
    const userQuery = await db.query('SELECT * FROM public.users WHERE email = $1', [cleanEmail]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = userQuery.rows[0];
    
    // Compare password hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Create token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    // Log login audit event
    await logAudit(user.id, user.email, 'LOGIN', 'User successfully logged in.');

    res.json({ token, user: { email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Delete User Account for DPDP compliance (Right to Erasure)
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase().trim();

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account.' });
  }

  try {
    // 1. Fetch user password hash
    const userQuery = await db.query('SELECT password_hash FROM public.users WHERE id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const validPassword = await bcrypt.compare(password, userQuery.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect password. Account deletion rejected.' });
    }

    // 2. Delete user record. Foreign keys with ON DELETE CASCADE will purge profiles, shares, contacts, medications.
    await db.query('DELETE FROM public.users WHERE id = $1', [userId]);

    // 3. Log audit event
    await logAudit(null, userEmail, 'DELETE_ACCOUNT', 'User permanently deleted their account and all associated profiles.');

    res.json({ success: true, message: 'Your account and all associated family records have been permanently deleted.' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Server error during account deletion.' });
  }
});

// ==========================================
// 2. COLLABORATIVE SHARING ENDPOINTS
// ==========================================

// Share a Card
app.post('/api/shares', authenticateToken, async (req, res) => {
  const { profileId, emailToShare } = req.body;
  const userId = req.user.id;

  if (!profileId || !emailToShare) {
    return res.status(400).json({ error: 'Profile ID and email are required.' });
  }

  const cleanEmail = emailToShare.toLowerCase().trim();

  try {
    // Verify that current user owns this profile
    const checkQuery = await db.query('SELECT owner_id FROM public.profiles WHERE id = $1', [profileId]);
    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile card not found.' });
    }
    if (checkQuery.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can share this card.' });
    }

    // Verify they aren't sharing with themselves
    if (cleanEmail === req.user.email.toLowerCase().trim()) {
      return res.status(400).json({ error: 'You cannot share a card with yourself.' });
    }

    // Insert sharing record
    await db.query(`
      INSERT INTO public.card_shares (profile_id, shared_with_email, access_level)
      VALUES ($1, $2, 'edit')
      ON CONFLICT (profile_id, shared_with_email) DO NOTHING
    `, [profileId, cleanEmail]);

    await logAudit(userId, req.user.email, 'CREATE_SHARE', `Shared card ${profileId} with ${cleanEmail}`);

    res.json({ success: true, message: `Card shared with ${cleanEmail} successfully.` });
  } catch (err) {
    console.error('Sharing setup error:', err);
    res.status(500).json({ error: 'Server error setting up card share.' });
  }
});

// Revoke access to a Card
app.delete('/api/shares', authenticateToken, async (req, res) => {
  const { profileId, emailToRevoke } = req.body;
  const userId = req.user.id;

  if (!profileId || !emailToRevoke) {
    return res.status(400).json({ error: 'Profile ID and email are required.' });
  }

  const cleanEmail = emailToRevoke.toLowerCase().trim();

  try {
    // Verify ownership
    const checkQuery = await db.query('SELECT owner_id FROM public.profiles WHERE id = $1', [profileId]);
    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile card not found.' });
    }
    if (checkQuery.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can revoke sharing.' });
    }

    await db.query(`
      DELETE FROM public.card_shares
      WHERE profile_id = $1 AND shared_with_email = $2
    `, [profileId, cleanEmail]);

    await logAudit(userId, req.user.email, 'REVOKE_SHARE', `Revoked access of card ${profileId} for ${cleanEmail}`);

    res.json({ success: true, message: `Access revoked for ${cleanEmail}.` });
  } catch (err) {
    console.error('Revoke share error:', err);
    res.status(500).json({ error: 'Server error revoking share.' });
  }
});

// ==========================================
// 3. CARDS CRUD ENDPOINTS (SCOPED)
// ==========================================

// Get all cards (Owned or Shared-with)
app.get('/api/cards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase().trim();

    // Fetch profiles owned by this user OR shared with their email
    const profilesQuery = await db.query(`
      SELECT p.*, u.email as owner_email,
             CASE WHEN p.owner_id != $1 THEN true ELSE false END as is_shared
      FROM public.profiles p
      JOIN public.users u ON p.owner_id = u.id
      LEFT JOIN public.card_shares s ON p.id = s.profile_id
      WHERE p.owner_id = $1 OR s.shared_with_email = $2
      GROUP BY p.id, u.email
      ORDER BY p.created_at ASC
    `, [userId, userEmail]);

    const profiles = profilesQuery.rows;
    if (profiles.length === 0) {
      return res.json([]);
    }

    const profileIds = profiles.map(p => p.id);

    // Fetch emergency contacts for these profiles
    const contactsQuery = await db.query(`
      SELECT * FROM public.emergency_contacts
      WHERE profile_id = ANY($1)
    `, [profileIds]);

    // Fetch medications for these profiles
    const medsQuery = await db.query(`
      SELECT * FROM public.medications
      WHERE profile_id = ANY($1)
    `, [profileIds]);

    // Fetch shares list for these profiles
    const sharesQuery = await db.query(`
      SELECT * FROM public.card_shares
      WHERE profile_id = ANY($1)
    `, [profileIds]);

    // Format cards list
    const cards = profiles.map(p => {
      const cardContacts = contactsQuery.rows
        .filter(c => c.profile_id === p.id)
        .map(c => ({
          name: c.name,
          relationship: c.relationship,
          phoneNumber: c.phone_number,
          email: c.email || ''
        }));

      const cardMeds = medsQuery.rows
        .filter(m => m.profile_id === p.id)
        .map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: decrypt(m.instructions)
        }));

      const cardShares = sharesQuery.rows
        .filter(s => s.profile_id === p.id)
        .map(s => s.shared_with_email);

      return {
        id: p.id,
        relationship: p.relationship,
        ownerEmail: p.owner_email,
        isShared: p.is_shared,
        sharedWith: cardShares,
        updatedAt: p.updated_at,
        profile: {
          fullName: decrypt(p.full_name) || '',
          age: p.age !== null ? p.age.toString() : '',
          bloodGroup: p.blood_group || '',
          allergies: decrypt(p.allergies) || '',
          conditions: decrypt(p.conditions) || '',
          insurancePolicy: p.insurance_policy || '',
          insuranceNumber: decrypt(p.insurance_number) || '',
          insuranceValidTill: decrypt(p.insurance_valid_till) || ''
        },
        emergencyContacts: cardContacts,
        medications: cardMeds
      };
    });

    await logAudit(userId, userEmail, 'FETCH_CARDS', `Retrieved ${cards.length} card profiles`);

    res.json(cards);
  } catch (err) {
    console.error('Fetch cards error:', err);
    res.status(500).json({ error: 'Server error fetching cards.' });
  }
});

// Sync complete collection list of cards
app.post('/api/cards', authenticateToken, async (req, res) => {
  const cards = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ error: 'Body must be an array of card profiles.' });
  }

  const userId = req.user.id;
  const userEmail = req.user.email.toLowerCase().trim();

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing cards visible to this user
    const existingQuery = await client.query(`
      SELECT p.id, p.owner_id
      FROM public.profiles p
      LEFT JOIN public.card_shares s ON p.id = s.profile_id
      WHERE p.owner_id = $1 OR s.shared_with_email = $2
      GROUP BY p.id
    `, [userId, userEmail]);
    const existingCards = existingQuery.rows;

    const payloadIds = cards.map(c => c.id);

    // 1. Process Deletions / Revocations
    for (const existing of existingCards) {
      if (!payloadIds.includes(existing.id)) {
        if (existing.owner_id === userId) {
          // If owned by user, delete profile (cascades contacts/meds/shares)
          await client.query('DELETE FROM public.profiles WHERE id = $1', [existing.id]);
        } else {
          // If shared with user, remove user's share access
          await client.query('DELETE FROM public.card_shares WHERE profile_id = $1 AND shared_with_email = $2', [existing.id, userEmail]);
        }
      }
    }

    // 2. Process Updates and Inserts
    // Input Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]+$/;

    for (const card of cards) {
      const { relationship, profile, emergencyContacts = [], medications = [] } = card;
      const { fullName = '', age, bloodGroup = '', allergies = '', conditions = '', insurancePolicy = '', insuranceNumber = '', insuranceValidTill = '' } = profile || {};

      // Profile validation
      if (!fullName || fullName.trim() === '') {
        return res.status(400).json({ error: 'Full Name is required.' });
      }
      if (fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({ error: 'Full Name must be between 2 and 100 characters.' });
      }
      if (containsUnsafeChars(fullName)) {
        return res.status(400).json({ error: 'Full Name contains unsafe characters.' });
      }

      if (!relationship || relationship.trim() === '') {
        return res.status(400).json({ error: 'Relationship is required.' });
      }

      if (age === undefined || age === null || String(age).trim() === '') {
        return res.status(400).json({ error: 'Age is required.' });
      }
      const ageNum = Number(age);
      if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
        return res.status(400).json({ error: 'Age must be an integer between 0 and 130.' });
      }

      if (!bloodGroup || bloodGroup.trim() === '') {
        return res.status(400).json({ error: 'Blood Group is required.' });
      }

      if (conditions && conditions.length > 2000) {
        return res.status(400).json({ error: 'Conditions cannot exceed 2000 characters.' });
      }
      if (containsUnsafeChars(conditions)) {
        return res.status(400).json({ error: 'Conditions contain unsafe characters.' });
      }

      if (allergies && allergies.length > 1000) {
        return res.status(400).json({ error: 'Allergies cannot exceed 1000 characters.' });
      }
      if (containsUnsafeChars(allergies)) {
        return res.status(400).json({ error: 'Allergies contain unsafe characters.' });
      }

      if (insurancePolicy && insurancePolicy.length > 100) {
        return res.status(400).json({ error: 'Insurance Provider cannot exceed 100 characters.' });
      }
      if (containsUnsafeChars(insurancePolicy)) {
        return res.status(400).json({ error: 'Insurance Provider contains unsafe characters.' });
      }

      if (insuranceNumber && insuranceNumber.length > 100) {
        return res.status(400).json({ error: 'Policy Number cannot exceed 100 characters.' });
      }
      if (containsUnsafeChars(insuranceNumber)) {
        return res.status(400).json({ error: 'Policy Number contains unsafe characters.' });
      }

      if (insuranceValidTill && insuranceValidTill.trim() !== '') {
        const expiryVal = validateInsuranceExpiryBackend(insuranceValidTill);
        if (!expiryVal.valid) {
          return res.status(400).json({ error: expiryVal.message });
        }
      }

      // Emergency Contacts validation
      if (emergencyContacts.length > 2) {
        return res.status(400).json({ error: 'Emergency contacts are limited to 2 per card.' });
      }
      for (const contact of emergencyContacts) {
        const { name = '', relationship: cRel = '', phoneNumber = '', email = '' } = contact;
        if (!name.trim()) {
          return res.status(400).json({ error: 'Emergency Contact Name is required.' });
        }
        if (name.length < 2 || name.length > 100) {
          return res.status(400).json({ error: 'Emergency Contact Name must be between 2 and 100 characters.' });
        }
        if (containsUnsafeChars(name)) {
          return res.status(400).json({ error: 'Emergency Contact Name contains unsafe characters.' });
        }

        if (!cRel.trim()) {
          return res.status(400).json({ error: 'Emergency Contact Relationship is required.' });
        }

        if (!phoneNumber.trim()) {
          return res.status(400).json({ error: 'Emergency Contact Phone is required.' });
        }
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 14) {
          return res.status(400).json({ error: 'Emergency Contact Phone must contain between 8 and 14 digits.' });
        }
        if (!phoneRegex.test(phoneNumber)) {
          return res.status(400).json({ error: 'Emergency Contact Phone contains invalid characters.' });
        }

        if (email && email.trim() !== '') {
          if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ error: 'Emergency Contact Email is invalid.' });
          }
          if (containsUnsafeChars(email)) {
            return res.status(400).json({ error: 'Emergency Contact Email contains unsafe characters.' });
          }
        }
      }

      // Medications validation
      for (const med of medications) {
        const { name = '', dosage = '', frequency = '', instructions = '' } = med;
        if (!name.trim()) {
          return res.status(400).json({ error: 'Medication Name is required.' });
        }
        if (name.length > 100) {
          return res.status(400).json({ error: 'Medication Name cannot exceed 100 characters.' });
        }
        if (containsUnsafeChars(name)) {
          return res.status(400).json({ error: 'Medication Name contains unsafe characters.' });
        }

        if (dosage && dosage.length > 50) {
          return res.status(400).json({ error: 'Medication Dosage cannot exceed 50 characters.' });
        }
        if (containsUnsafeChars(dosage)) {
          return res.status(400).json({ error: 'Medication Dosage contains unsafe characters.' });
        }

        if (containsUnsafeChars(frequency)) {
          return res.status(400).json({ error: 'Medication Frequency contains unsafe characters.' });
        }

        if (containsUnsafeChars(instructions)) {
          return res.status(400).json({ error: 'Medication Instructions contain unsafe characters.' });
        }
      }
    }

    for (const card of cards) {
      const { id, relationship, profile, emergencyContacts = [], medications = [], updatedAt } = card;
      const { fullName = '', age, bloodGroup = '', allergies = '', conditions = '', insurancePolicy = '', insuranceNumber = '', insuranceValidTill = '' } = profile || {};
      
      const cleanAge = age ? parseInt(age) : null;

      // Encrypt sensitive data before database insertion / update
      const encryptedFullName = encrypt(fullName);
      const encryptedAllergies = encrypt(allergies);
      const encryptedConditions = encrypt(conditions);
      const encryptedInsuranceNumber = encrypt(insuranceNumber);
      const encryptedInsuranceValidTill = encrypt(insuranceValidTill);

      // Check if profile exists
      const pCheck = await client.query('SELECT owner_id FROM public.profiles WHERE id = $1', [id]);

      if (pCheck.rows.length === 0) {
        // Insert new profile owned by current user
        await client.query(`
          INSERT INTO public.profiles (
            id, owner_id, relationship, full_name, age, blood_group, allergies, conditions, insurance_policy, insurance_number, insurance_valid_till, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_TIMESTAMP))
        `, [id, userId, relationship, encryptedFullName, cleanAge, bloodGroup, encryptedAllergies, encryptedConditions, insurancePolicy, encryptedInsuranceNumber, encryptedInsuranceValidTill, updatedAt ? new Date(updatedAt) : null]);
      } else {
        // Update existing card: ensure edit rights
        const ownerId = pCheck.rows[0].owner_id;
        let authorized = false;

        if (ownerId === userId) {
          authorized = true;
        } else {
          // Check shared edit access
          const shareCheck = await client.query(`
            SELECT id FROM public.card_shares 
            WHERE profile_id = $1 AND shared_with_email = $2 AND access_level = 'edit'
          `, [id, userEmail]);
          if (shareCheck.rows.length > 0) {
            authorized = true;
          }
        }

        if (!authorized) {
          // Skip card updates if not authorized
          continue;
        }

        // Perform profile update
        await client.query(`
          UPDATE public.profiles
          SET relationship = $2, full_name = $3, age = $4, blood_group = $5, allergies = $6,
              conditions = $7, insurance_policy = $8, insurance_number = $9, insurance_valid_till = $10, 
              updated_at = COALESCE($11, CURRENT_TIMESTAMP)
          WHERE id = $1
        `, [id, relationship, encryptedFullName, cleanAge, bloodGroup, encryptedAllergies, encryptedConditions, insurancePolicy, encryptedInsuranceNumber, encryptedInsuranceValidTill, updatedAt ? new Date(updatedAt) : null]);
      }

      // Sync contacts list: clean delete + re-insert
      await client.query('DELETE FROM public.emergency_contacts WHERE profile_id = $1', [id]);
      for (const contact of emergencyContacts) {
        await client.query(`
          INSERT INTO public.emergency_contacts (profile_id, name, relationship, phone_number, email)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, contact.name, contact.relationship, contact.phoneNumber, contact.email || '']);
      }

      // Sync medications list: clean delete + re-insert
      await client.query('DELETE FROM public.medications WHERE profile_id = $1', [id]);
      for (const med of medications) {
        await client.query(`
          INSERT INTO public.medications (profile_id, name, dosage, frequency, instructions)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, med.name, med.dosage, med.frequency, encrypt(med.instructions || '')]);
      }
    }

    await client.query('COMMIT');
    await logAudit(userId, userEmail, 'SYNC_CARDS', `Synchronized ${cards.length} card profiles`);
    res.json({ success: true, message: 'Card collection synchronized to Vercel Postgres.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Card sync transaction error:', err);
    res.status(500).json({ error: 'Server error synchronizing cards collection.' });
  } finally {
    client.release();
  }
});

// ==========================================
// 4. WAITLIST / SURVEY ENDPOINTS
// ==========================================

// POST register waitlist joins
app.post('/api/waitlist', (req, res) => {
  console.log(`[WAITLIST JOIN] User registered for waitlist at ${req.body.timestamp} with choice: ${req.body.feature}`);
  res.json({ success: true, message: 'Waitlist join recorded.' });
});

// Fallback: Serve React index.html for any non-API page routes (enabling client-side routing)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({ message: 'KinLedger Backend Active. React static files not built yet.' });
    }
  });
});

// Initialize database tables conditionally, then run server if not running serverlessly on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  db.initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  });
} else {
  // On Vercel, initialize database in module scope
  db.initDb().catch(err => console.error('Database migration error:', err));
}

module.exports = app;

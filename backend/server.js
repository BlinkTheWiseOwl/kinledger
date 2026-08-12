const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('Razorpay keys missing from environment variables. Payments will not work.');
}

const MAX_FREE_PROFILES = 2;
const FAMILY_PLAN_AMOUNT = 100; // ₹1 in paise (temporary for testing)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (toEmail, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV FALLBACK] Password reset code for ${toEmail}: ${code}`);
    return { success: true, method: 'console' };
  }

  try {
    await transporter.sendMail({
      from: `"KinLedger" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'KinLedger — Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">KinLedger</h2>
          <p style="color: #334155; font-size: 16px;">Hello,</p>
          <p style="color: #334155; font-size: 16px;">Your password reset verification code is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });
    return { success: true, method: 'email' };
  } catch (err) {
    console.error('[EMAIL ERROR]:', err);
    console.log(`[FALLBACK] Password reset code for ${toEmail}: ${code}`);
    return { success: true, method: 'console-fallback' };
  }
};

const sendVerificationEmail = async (toEmail, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV FALLBACK] Email verification code for ${toEmail}: ${code}`);
    return { success: true, method: 'console' };
  }

  try {
    await transporter.sendMail({
      from: `"KinLedger" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'KinLedger — Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">KinLedger</h2>
          <p style="color: #334155; font-size: 16px;">Welcome!</p>
          <p style="color: #334155; font-size: 16px;">Your email verification code is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes.</p>
        </div>
      `
    });
    return { success: true, method: 'email' };
  } catch (err) {
    console.error('[EMAIL ERROR]:', err);
    console.log(`[FALLBACK] Email verification code for ${toEmail}: ${code}`);
    return { success: true, method: 'console-fallback' };
  }
};

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
  return /[<>"\\`;|]/.test(String(text));
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

    // Insert user (unverified by default for email/password)
    const newUser = await db.query(
      'INSERT INTO public.users (email, password_hash, is_verified) VALUES ($1, $2, FALSE) RETURNING id, email',
      [cleanEmail, passwordHash]
    );

    const userObj = newUser.rows[0];
    
    // Generate verification code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Cleanup any old verifications for this email just in case
    await db.query("DELETE FROM public.email_verifications WHERE email = $1", [cleanEmail]);
    
    // Insert verification code
    await db.query(
      "INSERT INTO public.email_verifications (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
      [cleanEmail, code]
    );
    
    // Send email
    await sendVerificationEmail(cleanEmail, code);

    // Log signup audit event
    await logAudit(userObj.id, userObj.email, 'SIGNUP_PENDING', 'New user registered, pending email verification.');

    const responsePayload = { message: 'Account created. Please verify your email.', requiresVerification: true };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devCode = code;
    }
    
    res.json(responsePayload);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Verify Email Endpoint
app.post('/api/auth/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required.' });
  }
  
  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Find valid code
    const codeQuery = await db.query(
      "SELECT * FROM public.email_verifications WHERE email = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [cleanEmail]
    );
    
    if (codeQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    }
    
    const verificationRecord = codeQuery.rows[0];
    
    if (verificationRecord.code !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }
    
    // Update user to verified
    const updateQuery = await db.query('UPDATE public.users SET is_verified = TRUE WHERE email = $1 RETURNING id, email', [cleanEmail]);
    if (updateQuery.rows.length === 0) {
      return res.status(400).json({ error: 'User not found.' });
    }
    
    const userObj = updateQuery.rows[0];
    
    // Delete the used code
    await db.query('DELETE FROM public.email_verifications WHERE id = $1', [verificationRecord.id]);
    
    // Log audit event
    await logAudit(userObj.id, userObj.email, 'EMAIL_VERIFIED', 'User successfully verified their email address.');
    
    // Generate token and log them in
    const token = jwt.sign({ id: userObj.id, email: userObj.email }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ token, user: { email: userObj.email }, message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Server error processing verification.' });
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
    
    // Check if verified
    if (user.is_verified === false) {
      return res.status(403).json({ error: 'Please verify your email address to log in.', requiresVerification: true });
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

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();

    // Rate Limit Check
    const rateLimitCheck = await db.query(
      "SELECT COUNT(*) FROM public.password_resets WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour' AND used = FALSE",
      [cleanEmail]
    );
    if (parseInt(rateLimitCheck.rows[0].count) >= 3) {
      return res.status(429).json({ error: 'Too many reset requests. Please try again later.' });
    }

    // Check user exists
    const userQuery = await db.query('SELECT id FROM public.users WHERE email = $1', [cleanEmail]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: 'There is no account registered with this email address.' });
    }
    const userId = userQuery.rows[0].id;

    // Google-account detection
    const googleSignupCheck = await db.query(
      "SELECT 1 FROM public.audit_logs WHERE user_email = $1 AND action = 'SIGNUP' AND details ILIKE '%Google Sign-In%'",
      [cleanEmail]
    );
    if (googleSignupCheck.rows.length > 0) {
      return res.json({ 
        message: 'This account uses Google Sign-In. Please use the Google button to log in.',
        isGoogleAccount: true 
      });
    }

    // Invalidate old codes
    await db.query('UPDATE public.password_resets SET used = TRUE WHERE email = $1 AND used = FALSE', [cleanEmail]);
    
    // Cleanup expired rows
    await db.query("DELETE FROM public.password_resets WHERE expires_at < NOW()");

    // Generate code
    const code = crypto.randomInt(100000, 999999).toString();

    // Insert code
    await db.query(
      "INSERT INTO public.password_resets (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
      [cleanEmail, code]
    );

    // Send email
    await sendResetEmail(cleanEmail, code);

    // Audit log
    await logAudit(userId, cleanEmail, 'PASSWORD_RESET_REQUEST', 'User requested a password reset code.');

    const responsePayload = { message: 'If this email is registered, a reset code has been sent.' };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devCode = code; // Helper for local testing
    }
    
    res.json(responsePayload);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error processing request.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // Find valid code
    const codeQuery = await db.query(
      "SELECT * FROM public.password_resets WHERE email = $1 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [cleanEmail]
    );
    
    if (codeQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    }
    
    const resetRecord = codeQuery.rows[0];
    
    // Brute-force check
    if (resetRecord.attempts >= 5) {
      await db.query('UPDATE public.password_resets SET used = TRUE WHERE id = $1', [resetRecord.id]);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }
    
    // Code mismatch
    if (resetRecord.code !== code) {
      await db.query('UPDATE public.password_resets SET attempts = attempts + 1 WHERE id = $1', [resetRecord.id]);
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }
    
    // Code matches
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user
    const updateQuery = await db.query('UPDATE public.users SET password_hash = $1 WHERE email = $2 RETURNING id', [passwordHash, cleanEmail]);
    if (updateQuery.rows.length === 0) {
      return res.status(400).json({ error: 'User not found.' });
    }
    
    const userId = updateQuery.rows[0].id;
    
    // Mark code used
    await db.query('UPDATE public.password_resets SET used = TRUE WHERE id = $1', [resetRecord.id]);
    
    // Audit log
    await logAudit(userId, cleanEmail, 'PASSWORD_RESET_SUCCESS', 'Password successfully reset via email verification.');
    
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error processing request.' });
  }
});

// Google Sign-In / Sign-Up
app.post('/api/auth/google', async (req, res) => {
  const { credential, email: backupEmail } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required.' });
  }

  try {
    let email = '';
    
    // Handle mock token for local development only (requires explicit ALLOW_MOCK_AUTH=true)
    const allowMockAuth = process.env.ALLOW_MOCK_AUTH === 'true';
    if (credential === 'mock-google-token' && backupEmail) {
      if (!allowMockAuth) {
        return res.status(403).json({ error: 'Mock authentication is disabled.' });
      }
      email = backupEmail.toLowerCase().trim();
      console.log(`[AUTH] Mock Google Sign-In bypassed for email: ${email}`);
    } else {
      // Decode or verify token from Google tokeninfo endpoint
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const response = await fetch(googleVerifyUrl);
      
      if (!response.ok) {
        throw new Error('Invalid Google credential token.');
      }
      
      const payload = await response.json();
      email = payload.email.toLowerCase().trim();
      
      // If configured, verify the client ID (aud)
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (expectedClientId) {
        // The audience can be the Web Client ID or any of the Android Client IDs.
        // All client IDs for this project start with the same project number.
        const projectPrefix = expectedClientId.split('-')[0] + '-';
        if (payload.aud !== expectedClientId && !payload.aud.startsWith(projectPrefix)) {
          console.error(`Token audience mismatch. Expected: ${expectedClientId}, Got: ${payload.aud}`);
          return res.status(400).json({ error: 'Token audience mismatch.' });
        }
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google credential.' });
    }

    // Check if user already exists
    let userQuery = await db.query('SELECT * FROM public.users WHERE email = $1', [email]);
    let user;

    if (userQuery.rows.length === 0) {
      // Create user. Generate a secure random password hash since password_hash is required NOT NULL
      const secureRandomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(secureRandomPassword, salt);
      
      const newUser = await db.query(
        'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );
      user = newUser.rows[0];
      await logAudit(user.id, user.email, 'SIGNUP', 'New user registered via Google Sign-In.');
    } else {
      user = userQuery.rows[0];
      await logAudit(user.id, user.email, 'LOGIN', 'User logged in via Google Sign-In.');
    }

    // Create app token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { email: user.email } });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(400).json({ error: err.message || 'Google authentication failed.' });
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
// 1b. SUBSCRIPTION / MONETIZATION ENDPOINTS
// ==========================================

app.get('/api/subscription', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const subQuery = await db.query(
      'SELECT * FROM public.subscriptions WHERE user_id = $1',
      [userId]
    );

    const profileCountQuery = await db.query(
      'SELECT COUNT(*) FROM public.profiles WHERE owner_id = $1',
      [userId]
    );
    const ownedProfileCount = parseInt(profileCountQuery.rows[0].count);

    if (subQuery.rows.length === 0) {
      return res.json({
        plan: 'free',
        status: 'active',
        ownedProfileCount,
        maxFreeProfiles: MAX_FREE_PROFILES,
        expiresAt: null
      });
    }

    const sub = subQuery.rows[0];

    if (sub.plan === 'family' && sub.status === 'active' && sub.expires_at) {
      const now = new Date();
      const expiresAt = new Date(sub.expires_at);
      if (now > expiresAt) {
        await db.query(
          "UPDATE public.subscriptions SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [sub.id]
        );
        await logAudit(userId, req.user.email, 'SUBSCRIPTION_EXPIRED',
          'Family plan expired automatically.');
        return res.json({
          plan: 'free',
          status: 'expired',
          ownedProfileCount,
          maxFreeProfiles: MAX_FREE_PROFILES,
          expiresAt: sub.expires_at,
          wasFamily: true
        });
      }
    }

    res.json({
      plan: sub.plan,
      status: sub.status,
      ownedProfileCount,
      maxFreeProfiles: MAX_FREE_PROFILES,
      expiresAt: sub.expires_at,
      startedAt: sub.started_at
    });
  } catch (err) {
    console.error('Subscription fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status.' });
  }
});

app.post('/api/subscription/create-order', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const subQuery = await db.query(
      "SELECT * FROM public.subscriptions WHERE user_id = $1 AND plan = 'family' AND status = 'active'",
      [userId]
    );
    if (subQuery.rows.length > 0) {
      const sub = subQuery.rows[0];
      const expiresAt = new Date(sub.expires_at);
      if (expiresAt > new Date()) {
        return res.status(400).json({
          error: 'You already have an active Family plan.',
          expiresAt: sub.expires_at
        });
      }
    }

    if (!razorpayInstance) {
      return res.status(503).json({ error: 'Payment gateway is not configured on the server.' });
    }

    const order = await razorpayInstance.orders.create({
      amount: FAMILY_PLAN_AMOUNT,
      currency: 'INR',
      receipt: `kinledger_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        email: userEmail,
        plan: 'family'
      }
    });

    await logAudit(userId, userEmail, 'SUBSCRIPTION_ORDER_CREATED',
      `Razorpay order ${order.id} created for ₹${FAMILY_PLAN_AMOUNT / 100}`);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: `We couldn't start the payment. Please try again.` });
  }
});

app.post('/api/subscription/verify', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification data is incomplete.' });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await logAudit(userId, userEmail, 'SUBSCRIPTION_VERIFY_FAILED',
        `Signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await db.query(`
      INSERT INTO public.subscriptions
        (user_id, plan, status, razorpay_order_id, razorpay_payment_id,
         razorpay_signature, amount_paise, started_at, expires_at, updated_at)
      VALUES ($1, 'family', 'active', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        plan = 'family',
        status = 'active',
        razorpay_order_id = $2,
        razorpay_payment_id = $3,
        razorpay_signature = $4,
        amount_paise = $5,
        started_at = $6,
        expires_at = $7,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, razorpay_order_id, razorpay_payment_id, razorpay_signature,
        FAMILY_PLAN_AMOUNT, now.toISOString(), expiresAt.toISOString()]);

    await logAudit(userId, userEmail, 'SUBSCRIPTION_ACTIVATED',
      `Family plan activated. Payment: ${razorpay_payment_id}. Expires: ${expiresAt.toISOString()}`);

    res.json({
      success: true,
      plan: 'family',
      status: 'active',
      expiresAt: expiresAt.toISOString(),
      message: 'Welcome to KinLedger Family! 🎉'
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Server error during payment verification.' });
  }
});

app.post('/api/subscription/cancel', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const subQuery = await db.query(
      "SELECT * FROM public.subscriptions WHERE user_id = $1 AND plan = 'family' AND status = 'active'",
      [userId]
    );

    if (subQuery.rows.length === 0) {
      return res.status(400).json({ error: 'No active Family subscription to cancel.' });
    }

    const sub = subQuery.rows[0];

    await db.query(
      "UPDATE public.subscriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [sub.id]
    );

    await logAudit(userId, userEmail, 'SUBSCRIPTION_CANCELLED',
      `Family plan cancelled. Access continues until ${sub.expires_at}`);

    res.json({
      success: true,
      message: 'Your Family plan has been cancelled. You will continue to have access until your current period ends.',
      accessUntil: sub.expires_at
    });
  } catch (err) {
    console.error('Subscription cancellation error:', err);
    res.status(500).json({ error: 'Server error processing cancellation.' });
  }
});

app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return res.status(200).json({ status: 'ok' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] Signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body);
    console.log(`[WEBHOOK] Received event: ${event.event}`);

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
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

    // ---- MONETIZATION GUARD ----
    let isPaid = false;
    const subCheck = await db.query(
      "SELECT plan, status, expires_at FROM public.subscriptions WHERE user_id = $1",
      [userId]
    );
    if (subCheck.rows.length > 0) {
      const sub = subCheck.rows[0];
      if (sub.plan === 'family' && (sub.status === 'active' || sub.status === 'cancelled')) {
        if (sub.expires_at && new Date(sub.expires_at) > new Date()) {
          isPaid = true;
        }
      }
    }

    const existingOwnedQuery = await db.query('SELECT COUNT(*) FROM public.profiles WHERE owner_id = $1', [userId]);
    const existingOwnedCount = parseInt(existingOwnedQuery.rows[0].count, 10);
    const isOverLimit = !isPaid && existingOwnedCount > MAX_FREE_PROFILES;
    
    if (isOverLimit) {
      return res.status(403).json({ error: 'Sharing is not available while your account is over the free limit. Renew your Family Plan or delete profiles to share.' });
    }
    // ---- END MONETIZATION GUARD ----

    // Verify target email is registered (enrolled)
    const userCheck = await db.query('SELECT id FROM public.users WHERE email = $1', [cleanEmail]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'This email is not registered with KinLedger yet.',
        notEnrolled: true
      });
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
    const isOwner = checkQuery.rows[0].owner_id === userId;
    const isSelfRevocation = req.user.email.toLowerCase().trim() === cleanEmail;

    if (!isOwner && !isSelfRevocation) {
      return res.status(403).json({ error: 'Only the owner or the shared user themselves can revoke sharing access.' });
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
        avatar: p.avatar || '',
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

  // ---- MONETIZATION STATE ----
  let isPaid = false;
  const subCheck = await db.query(
    "SELECT plan, status, expires_at FROM public.subscriptions WHERE user_id = $1",
    [userId]
  );
  if (subCheck.rows.length > 0) {
    const sub = subCheck.rows[0];
    if (sub.plan === 'family' && (sub.status === 'active' || sub.status === 'cancelled')) {
      if (sub.expires_at && new Date(sub.expires_at) > new Date()) {
        isPaid = true;
      }
    }
  }

  const existingOwnedQuery = await db.query('SELECT COUNT(*) FROM public.profiles WHERE owner_id = $1', [userId]);
  const existingOwnedCount = parseInt(existingOwnedQuery.rows[0].count, 10);
  const isOverLimit = !isPaid && existingOwnedCount > MAX_FREE_PROFILES;
  // ---- END MONETIZATION STATE ----

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

      if (age !== undefined && age !== null && String(age).trim() !== '') {
        const ageNum = Number(age);
        if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
          return res.status(400).json({ error: 'Age must be an integer between 0 and 130.' });
        }
      }

      if (conditions && conditions.length > 5000) {
        return res.status(400).json({ error: 'Conditions cannot exceed 5000 characters.' });
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
        if (!/^[0-9]{8,14}$/.test(phoneNumber)) {
          return res.status(400).json({ error: 'Emergency Contact Phone must contain exactly 8 to 14 digits with no special characters.' });
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
      const { id, relationship, profile, emergencyContacts = [], medications = [], updatedAt, avatar } = card;
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
        // Guard: If over limit, block inserts
        if (isOverLimit) {
          return res.status(403).json({ error: 'Your account is over the free limit. Renew your Family Plan or delete profiles to add more.' });
        }
        // Guard: If not over limit, but this insert would put them over (and not paid)
        if (!isPaid && existingOwnedCount >= MAX_FREE_PROFILES) {
          return res.status(403).json({ error: 'Free plan allows up to 2 family profiles. Upgrade to KinLedger Family for unlimited profiles.' });
        }

        // Insert new profile owned by current user
        await client.query(`
          INSERT INTO public.profiles (
            id, owner_id, relationship, full_name, age, blood_group, allergies, conditions, insurance_policy, insurance_number, insurance_valid_till, updated_at, avatar
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_TIMESTAMP), $13)
        `, [id, userId, relationship, encryptedFullName, cleanAge, bloodGroup, encryptedAllergies, encryptedConditions, insurancePolicy, encryptedInsuranceNumber, encryptedInsuranceValidTill, updatedAt ? new Date(updatedAt) : null, avatar || '']);
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
        
        // Guard: If over limit, block updates to owned cards
        if (isOverLimit && ownerId === userId) {
          // Silently skip updating existing cards to allow deletions to proceed
          continue;
        }

        // Perform profile update
        await client.query(`
          UPDATE public.profiles
          SET relationship = $2, full_name = $3, age = $4, blood_group = $5, allergies = $6,
              conditions = $7, insurance_policy = $8, insurance_number = $9, insurance_valid_till = $10, 
              updated_at = COALESCE($11, CURRENT_TIMESTAMP), avatar = $12
          WHERE id = $1
        `, [id, relationship, encryptedFullName, cleanAge, bloodGroup, encryptedAllergies, encryptedConditions, insurancePolicy, encryptedInsuranceNumber, encryptedInsuranceValidTill, updatedAt ? new Date(updatedAt) : null, avatar || '']);
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
app.post('/api/waitlist', async (req, res) => {
  const { email, feature } = req.body;
  console.log(`[WAITLIST JOIN] User registered for waitlist at ${req.body.timestamp} with choice: ${feature}`);
  
  try {
    await db.query(`
      INSERT INTO public.waitlist_submissions (email, feature_id)
      VALUES ($1, $2)
    `, [email || null, feature]);
    res.json({ success: true, message: 'Waitlist join recorded in database.' });
  } catch (err) {
    console.error('Error saving waitlist submission:', err);
    res.json({ success: true, message: 'Waitlist join cached.' });
  }
});

// GET waitlist results (aggregates and raw votes)
app.get('/api/waitlist/results', async (req, res) => {
  try {
    // Get aggregated counts
    const aggregates = await db.query(`
      SELECT feature_id, COUNT(*) as vote_count 
      FROM public.waitlist_submissions 
      GROUP BY feature_id
      ORDER BY vote_count DESC
    `);
    
    // Get recent raw votes
    const rawVotes = await db.query(`
      SELECT email, feature_id, voted_at 
      FROM public.waitlist_submissions 
      ORDER BY voted_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      aggregates: aggregates.rows,
      votes: rawVotes.rows
    });
  } catch (err) {
    console.error('Error fetching waitlist results:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist results.' });
  }
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

// Temporary endpoint to reset subscriptions for testing
app.get('/api/debug/reset-subs', async (req, res) => {
  const emails = [
    'blinkrealestate@gmail.com', 
    'shilpasujathk@gmail.com', 
    'support.kinledger@gmail.com', 
    'sterling4shilpa@gmail.com'
  ];
  try {
    const r = await db.query(`
      DELETE FROM public.subscriptions 
      WHERE user_id IN (
        SELECT id FROM public.users WHERE email = ANY($1)
      )
    `, [emails]);
    res.json({ success: true, message: `Successfully reset! Deleted ${r.rowCount} subscriptions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

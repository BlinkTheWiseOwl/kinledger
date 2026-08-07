# Forgot Password — Design & Implementation Plan

> **Status:** Ready for implementation  
> **Created:** 2026-08-05  
> **Last updated:** 2026-08-05  
> **Feature scope:** Backend API + Frontend UI + Email delivery (Resend)

---

## Table of Contents

1. [Overview](#overview)
2. [User Flow Diagram](#user-flow-diagram)
3. [Email Provider — Cost & Setup](#email-provider--cost--setup)
4. [Database Changes](#database-changes)
5. [Backend API Specification](#backend-api-specification)
6. [Frontend UI Specification](#frontend-ui-specification)
7. [Security Design](#security-design)
8. [Environment Configuration](#environment-configuration)
9. [Files to Modify](#files-to-modify)
10. [Test Plan](#test-plan)
11. [Open Decisions](#open-decisions)

---

## Overview

Implement a secure "Forgot Password" flow using a **6-digit verification code** delivered via email (Resend). The system handles edge cases including Google-only accounts, brute-force protection, rate limiting, and prevents user enumeration.

### Goals

- Production-ready from day one (real email delivery, not just console logs)
- Zero cost at KinLedger's current scale
- Consistent with existing KinLedger UI aesthetics and auth patterns
- DPDP/DISHA-compliant audit trail

---

## User Flow Diagram

```
┌─────────────┐     clicks "Forgot       ┌──────────────────┐
│  Login      │     Password?"            │  Forgot Password │
│  Screen     │ ──────────────────────>   │  Screen          │
│             │                           │                  │
│ [Email    ] │                           │ [Email         ] │
│ [Password ] │                           │ [Send Code btn ] │
│ [Sign In  ] │                           │ [Back to Login ] │
│ [Forgot?  ] │                           │                  │
└─────────────┘                           └────────┬─────────┘
      ^                                            │
      │                                   API: POST /api/auth/forgot-password
      │                                            │
      │                                            v
      │                                  ┌──────────────────┐
      │                                  │  Reset Password  │
      │           success +              │  Screen          │
      │           auto-redirect          │                  │
      │  <─────────────────────────      │ [6-digit code  ] │
      │                                  │ [New password  ] │
      │                                  │ [Confirm pass  ] │
      │                                  │ [Reset btn     ] │
      │                                  │ [Back to Login ] │
      │                                  └────────┬─────────┘
      │                                            │
      │                                   API: POST /api/auth/reset-password
      │                                            │
      └────────────────────────────────────────────┘
```

### Edge Case Flows

```
Google-only account → "Forgot Password" → API detects Google signup →
  Message: "This account uses Google Sign-In. Please use the Google button."
  (No code generated)

Unregistered email → "Forgot Password" → API returns generic success →
  (No code generated, no user enumeration leak)

Rate limited → 4th request within 1 hour →
  Message: "Too many reset requests. Please try again later."

Brute-force → 5+ wrong code attempts →
  Code invalidated, message: "Too many failed attempts. Please request a new code."
```

---

## Email Provider — Cost & Setup

### Provider Comparison (August 2026)

| Provider       | Free Tier                | Daily Limit | Node.js Library         | Branding Watermark       | Verdict                            |
|----------------|--------------------------|-------------|-------------------------|--------------------------|------------------------------------|
| **Resend**     | 3,000/month (permanent)  | 100/day     | `resend` (native SDK)   | ❌ None                  | ✅ **Recommended**                 |
| Brevo          | 9,000/month (permanent)  | 300/day     | `nodemailer` via SMTP   | ⚠️ "Sent by Brevo" logo | Good backup, but has branding      |
| SendGrid       | 60-day trial only        | 100/day     | `@sendgrid/mail`        | ❌ None                  | ❌ No permanent free tier          |
| Amazon SES     | $0.10 per 1,000 emails   | No daily cap| `@aws-sdk/client-ses`   | ❌ None                  | Overkill for this scale            |

### Why Resend

- **$0/month** — Password resets are very low volume; even 1,000 users won't approach 3,000/month
- **No branding watermark** on free tier (unlike Brevo's mandatory logo)
- **Modern Node.js SDK** — `resend` npm package, cleaner than `nodemailer` + SMTP configuration
- **Domain verification** via 2 DNS records (SPF + DKIM) → emails land in inbox, not spam
- No credit card required to sign up

### One-Time Setup (~10 Minutes)

1. **Sign up** at [resend.com](https://resend.com) — free, no credit card
2. **Verify your domain** — Add 2 DNS records in your domain registrar:
   - Resend provides the exact record values; you just copy-paste
   - Without a custom domain, Resend provides `onboarding@resend.dev` for testing
3. **Generate an API key** from the Resend dashboard
4. **Add to environment variables:**
   - **Local development:** Add `RESEND_API_KEY=re_xxxxxxxxxxxx` to `backend/.env`
   - **Production (Vercel):** Add via Vercel Dashboard → Settings → Environment Variables

### Graceful Fallback (No API Key)

When `RESEND_API_KEY` is empty or undefined:
- The system **does not crash** — it logs the verification code to the backend console instead
- In non-production mode, the code is also returned in the API response for testing convenience
- This means local development works without any email setup

---

## Database Changes

### New Table: `public.password_resets`

Add to the `initDb()` function in `backend/db.js`:

```sql
CREATE TABLE IF NOT EXISTS public.password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Column details:**

| Column       | Type          | Purpose                                                        |
|--------------|---------------|----------------------------------------------------------------|
| `email`      | VARCHAR(255)  | The email address that requested the reset                     |
| `code`       | VARCHAR(6)    | The 6-digit numeric verification code                          |
| `expires_at` | TIMESTAMPTZ   | Code expiry time (15 minutes from creation)                    |
| `used`       | BOOLEAN       | Whether the code has been consumed or invalidated              |
| `attempts`   | INTEGER       | Count of failed verification attempts (for brute-force check)  |

---

## Backend API Specification

### Email Service Helper

Add to top of `backend/server.js`:

```js
const { Resend } = require('resend');
const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const RESET_EMAIL_FROM = process.env.RESET_EMAIL_FROM || 'KinLedger <onboarding@resend.dev>';

const sendResetEmail = async (toEmail, code) => {
  if (!resendClient) {
    console.log(`[DEV] Password reset code for ${toEmail}: ${code}`);
    return { success: true, method: 'console' };
  }

  try {
    await resendClient.emails.send({
      from: RESET_EMAIL_FROM,
      to: toEmail,
      subject: 'KinLedger — Password Reset Code',
      html: `...styled HTML template with code...`
    });
    return { success: true, method: 'email' };
  } catch (err) {
    console.error('[EMAIL ERROR]:', err);
    // Fallback to console so the feature still works
    console.log(`[FALLBACK] Password reset code for ${toEmail}: ${code}`);
    return { success: true, method: 'console-fallback' };
  }
};
```

### Email HTML Template (Inline in `sendResetEmail`)

A branded, mobile-responsive email with:
- KinLedger logo/header
- "Your password reset code is:" message
- The 6-digit code displayed in large, spaced monospace font
- "This code expires in 15 minutes" notice
- "If you didn't request this, you can safely ignore this email" footer

---

### Endpoint 1: `POST /api/auth/forgot-password`

**Request body:**
```json
{ "email": "user@example.com" }
```

**Logic (ordered):**

| Step | Action | SQL / Logic |
|------|--------|-------------|
| 1 | Validate email format | Regex check |
| 2 | Rate limit check | `SELECT COUNT(*) FROM password_resets WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour' AND used = FALSE` → reject if ≥ 3 |
| 3 | Check user exists | `SELECT id FROM users WHERE email = $1` → if not found, return generic success (no leak) |
| 4 | Google-account detection | `SELECT 1 FROM audit_logs WHERE user_email = $1 AND action = 'SIGNUP' AND details ILIKE '%Google Sign-In%'` → if found, return specific guidance message |
| 5 | Invalidate old codes | `UPDATE password_resets SET used = TRUE WHERE email = $1 AND used = FALSE` |
| 6 | Cleanup expired rows | `DELETE FROM password_resets WHERE expires_at < NOW()` |
| 7 | Generate code | `crypto.randomInt(100000, 999999).toString()` |
| 8 | Insert code | `INSERT INTO password_resets (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')` |
| 9 | Send email | `sendResetEmail(email, code)` |
| 10 | Console log | `console.log('[RESET] Code for ${email}: ${code}')` |
| 11 | Audit log | `logAudit(userId, email, 'PASSWORD_RESET_REQUEST', ...)` |

**Response (always 200):**
```json
{
  "message": "If this email is registered, a reset code has been sent.",
  "devCode": "123456"   // ← ONLY in non-production mode (NODE_ENV !== 'production')
}
```

**Special responses:**
- Google account: `{ "message": "This account uses Google Sign-In. Please use the Google button to log in.", "isGoogleAccount": true }`
- Rate limited: `{ "error": "Too many reset requests. Please try again later." }` (HTTP 429)

---

### Endpoint 2: `POST /api/auth/reset-password`

**Request body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Logic (ordered):**

| Step | Action | SQL / Logic |
|------|--------|-------------|
| 1 | Validate inputs | email format, code is 6 digits, newPassword ≥ 8 chars |
| 2 | Find valid code | `SELECT * FROM password_resets WHERE email = $1 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1` |
| 3 | No valid code? | Return error: "Invalid or expired code. Please request a new one." |
| 4 | Brute-force check | If `attempts >= 5`: mark code as `used`, return "Too many failed attempts. Please request a new code." |
| 5 | Code mismatch? | Increment `attempts`: `UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1`, return "Incorrect code." |
| 6 | Code matches ✓ | Hash new password with `bcrypt.hash(newPassword, 10)` |
| 7 | Update user | `UPDATE users SET password_hash = $1 WHERE email = $2` |
| 8 | Mark code used | `UPDATE password_resets SET used = TRUE WHERE id = $1` |
| 9 | Audit log | `logAudit(userId, email, 'PASSWORD_RESET_SUCCESS', 'Password successfully reset via email verification.')` |

**Success response (200):**
```json
{ "message": "Password reset successfully. You can now log in with your new password." }
```

**Error responses:**
- Invalid/expired code (400): `{ "error": "Invalid or expired code. Please request a new one." }`
- Wrong code (400): `{ "error": "Incorrect verification code." }`
- Brute-force lockout (400): `{ "error": "Too many failed attempts. Please request a new code." }`
- Validation errors (400): `{ "error": "..." }`

---

## Frontend UI Specification

### State Machine Refactor

Replace the existing `isLogin` boolean with a `mode` string state:

```js
// Before:
const [isLogin, setIsLogin] = useState(true);

// After:
const [mode, setMode] = useState('login');  // 'login' | 'signup' | 'forgot' | 'reset'
const [resetEmail, setResetEmail] = useState('');  // carried from forgot → reset
```

All existing `isLogin` / `!isLogin` checks must be updated to use `mode === 'login'` / `mode === 'signup'`.

### Login Screen Additions

Add "Forgot Password?" link after the password field, before the submit button:

```jsx
{mode === 'login' && (
  <button
    type="button"
    className="auth-forgot-link"
    onClick={() => {
      setMode('forgot');
      setResetEmail(email); // carry over any typed email
      setError('');
    }}
  >
    Forgot Password?
  </button>
)}
```

### Forgot Password Screen (`mode === 'forgot'`)

```
┌──────────────────────────────────────┐
│           🔒  Reset Your Password    │
│                                      │
│  Enter the email address associated  │
│  with your KinLedger account.        │
│                                      │
│  📧 [Email input _______________]    │
│                                      │
│  [    Send Reset Code    ]  (btn)    │
│                                      │
│       ← Back to Login               │
└──────────────────────────────────────┘
```

**Behavior:**
- Email input is pre-filled if user typed it on login screen
- On submit: call `POST /api/auth/forgot-password`
- If `isGoogleAccount: true` in response: show info message (not an error)
- On success: transition to `'reset'` mode, set `resetEmail` state

### Reset Password Screen (`mode === 'reset'`)

```
┌──────────────────────────────────────┐
│       ✉️  Enter Verification Code    │
│                                      │
│  We've sent a 6-digit code to       │
│  us**@example.com                    │
│                                      │
│  🔢 [Code input ____________]       │
│  🔑 [New Password __________] 👁    │
│  🔑 [Confirm Password ______] 👁    │
│                                      │
│  [    Reset Password     ]  (btn)    │
│                                      │
│       ← Back to Login               │
│     Didn't receive? Resend Code      │
└──────────────────────────────────────┘
```

**Behavior:**
- Email is displayed as partially masked (e.g., `us**@example.com`)
- Code input: numeric only, 6 characters
- Password inputs: identical styling to existing auth form (with eye toggle)
- On success:
  - Show green success banner: "Password reset successfully!"
  - After 2 seconds, auto-transition to `'login'` mode
- "Resend Code" link: re-calls `POST /api/auth/forgot-password` with the stored email

### New CSS Classes

Add to `frontend/src/index.css` (appended after existing auth styles around line 1521):

```css
/* Forgot Password Link */
.auth-forgot-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.825rem;
  cursor: pointer;
  text-align: right;
  padding: 0;
  margin-top: -0.5rem;
  transition: var(--transition);
}
.auth-forgot-link:hover {
  color: var(--primary);
  text-decoration: underline;
}

/* Success Banner */
.auth-success-banner {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  font-size: 0.875rem;
}

/* Info Banner (for Google account message) */
.auth-info-banner {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  font-size: 0.875rem;
}

/* Resend Code Link */
.auth-resend-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: var(--transition);
}
.auth-resend-link:hover {
  color: var(--primary);
  text-decoration: underline;
}
```

---

## Security Design

### Threat Model & Mitigations

| Threat                          | Mitigation                                                                  |
|---------------------------------|-----------------------------------------------------------------------------|
| **User enumeration**            | Always return generic "code sent" message regardless of whether email exists|
| **Brute-force code guessing**   | Max 5 attempts per code; on 5th failure, code is invalidated               |
| **Request flooding / spam**     | Max 3 reset codes per email per hour                                       |
| **Multiple valid codes**        | All previous unused codes are invalidated when a new one is requested      |
| **Stale data accumulation**     | Expired rows deleted opportunistically on each forgot-password request     |
| **Google-only account confusion** | Detected via audit_logs; user is guided to Google Sign-In instead        |
| **Email deliverability**        | Resend with domain SPF/DKIM verification → inbox, not spam                 |
| **Code interception**           | 15-minute expiry window limits the usefulness of intercepted codes          |
| **Timing attacks**              | Generic response + consistent response time regardless of user existence   |

### Code Generation

Use `crypto.randomInt(100000, 999999)` — Node.js built-in cryptographically secure random number generator. Produces a 6-digit number (100000–999999), ensuring the code is always exactly 6 digits.

---

## Environment Configuration

### `backend/.env` — New Variables

```env
# ─── Forgot Password / Email (Resend) ───
# Leave RESEND_API_KEY empty for local development (codes will log to console)
RESEND_API_KEY=
RESET_EMAIL_FROM=KinLedger <noreply@yourdomain.com>
```

### Vercel Environment Variables

Add these same two variables in **Vercel Dashboard → Project → Settings → Environment Variables** for production deployment.

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/package.json` | **MODIFY** | Add `"resend": "^4.0.0"` dependency |
| `backend/db.js` | **MODIFY** | Add `password_resets` table creation in `initDb()` |
| `backend/server.js` | **MODIFY** | Add Resend client init, `sendResetEmail()` helper, 2 new API endpoints |
| `backend/.env` | **MODIFY** | Add `RESEND_API_KEY` and `RESET_EMAIL_FROM` placeholders |
| `frontend/src/components/AuthScreen.jsx` | **MODIFY** | Refactor `isLogin` → `mode` state machine; add forgot/reset screens |
| `frontend/src/index.css` | **MODIFY** | Add CSS for forgot link, success/info banners, resend link |

---

## Test Plan

### Manual Test Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | **Happy path** | Login → Forgot Password → enter email → get code → enter code + new password → login | Login succeeds with new password |
| 2 | **Google-only account** | Sign up with Google → Forgot Password → enter Google email | Info message: "This account uses Google Sign-In..." |
| 3 | **Wrong code** | Request code → enter wrong code 5 times | Lockout message after 5th attempt |
| 4 | **Correct code after failures** | Request code → enter wrong code 3 times → enter correct code | Password resets successfully |
| 5 | **Rate limiting** | Request 4+ codes in quick succession for same email | 4th request returns throttle message |
| 6 | **Expired code** | Request code → wait 15+ minutes → try to use it | Error: "Invalid or expired code" |
| 7 | **Non-existent email** | Enter unregistered email in forgot screen | Generic success message (no leak) |
| 8 | **Email delivery** | Request code with Resend configured | Email arrives in inbox (not spam) |
| 9 | **Console fallback** | Request code without Resend API key configured | Code logged to backend console |
| 10 | **Audit trail** | Complete full reset flow → check `audit_logs` table | Contains both `PASSWORD_RESET_REQUEST` and `PASSWORD_RESET_SUCCESS` entries |
| 11 | **Old codes invalidated** | Request code A → request code B → try code A | Code A rejected as invalid |
| 12 | **UI: back navigation** | Navigate to forgot → click "Back to Login" | Returns to login screen cleanly |
| 13 | **UI: email carry-over** | Type email on login → click "Forgot Password?" | Email is pre-filled on forgot screen |

---

## Open Decisions

These need to be resolved before or during implementation:

1. **Email "from" address:** What sender address to use?
   - Option A: `noreply@yourdomain.com` (requires domain verification in Resend)
   - Option B: `onboarding@resend.dev` (works immediately, but not branded)

2. **Domain verification:** Is a custom domain available and DNS access confirmed?

3. **Should Google-only users be able to set a password?** Current design prevents it. Alternative: allow them to set a password via reset flow, effectively enabling both login methods for their account.

---

*This document is self-contained and can be used as the reference for implementing the Forgot Password feature at any point.*

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Determine if SSL is required (Vercel Postgres / Neon requires SSL, local DB usually doesn't)
const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/kinledger',
  ssl: isLocal ? false : {
    rejectUnauthorized: false
  }
});

// Run migrations/initializations on startup
const initDb = async () => {
  let client;
  try {
    console.log('Connecting to PostgreSQL database...');
    client = await pool.connect();
    console.log('Initializing PostgreSQL database tables for KinLedger...');
    
    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Profiles Table (using VARCHAR id for backwards compatibility with client card-id hashes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id VARCHAR(100) PRIMARY KEY,
        owner_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        full_name VARCHAR(255),
        age INTEGER,
        blood_group VARCHAR(10),
        allergies TEXT,
        conditions TEXT,
        insurance_policy VARCHAR(255),
        insurance_number VARCHAR(100),
        insurance_valid_till VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure the insurance_valid_till column exists in case the table was created earlier
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS insurance_valid_till VARCHAR(100);
    `);

    // 3. Create Card Shares Table for Collaborative Access
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.card_shares (
        id SERIAL PRIMARY KEY,
        profile_id VARCHAR(100) REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        shared_with_email VARCHAR(255) NOT NULL,
        access_level VARCHAR(50) DEFAULT 'edit' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_profile_share UNIQUE (profile_id, shared_with_email)
      );
    `);

    // 4. Create Emergency Contacts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.emergency_contacts (
        id SERIAL PRIMARY KEY,
        profile_id VARCHAR(100) REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        email VARCHAR(255)
      );
    `);

    // Ensure the email column exists in case the table was created earlier
    await client.query(`
      ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);

    // 5. Create Medications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.medications (
        id SERIAL PRIMARY KEY,
        profile_id VARCHAR(100) REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        instructions TEXT
      );
    `);

    // 6. Create Audit Logs Table for HIPAA/DISHA compliance
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('Database tables successfully verified / created.');
  } catch (error) {
    console.error('\n==================================================================');
    console.error('DATABASE CONNECTION ERROR: Failed to connect to PostgreSQL.');
    console.error('KinLedger requires a running database to persist files.');
    console.error('Please either:');
    console.error('  1. Ensure your local PostgreSQL is running on port 5432.');
    console.error('  2. Configure your remote Vercel Postgres URL (POSTGRES_URL) in backend/.env');
    console.error('==================================================================\n');
    console.error(error.message);
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb
};

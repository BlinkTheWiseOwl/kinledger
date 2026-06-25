const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL;
console.log('Using connection string:', connectionString ? connectionString.replace(/:[^:@\s]+@/, ':****@') : 'undefined');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('Tables found:', res.rows);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await pool.end();
  }
}

test();

require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.POSTGRES_URL });

async function run() {
  await client.connect();
  const emails = [
    'blinkrealestate@gmail.com', 
    'shilpasujathk@gmail.com', 
    'support.kinledger@gmail.com', 
    'sterling4shilpa@gmail.com'
  ];
  
  try {
    const res = await client.query(`
      DELETE FROM subscriptions 
      WHERE user_id IN (
        SELECT id FROM users WHERE email = ANY($1)
      )
    `, [emails]);
    console.log(`Successfully reset! Deleted ${res.rowCount} subscriptions for the provided emails.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();

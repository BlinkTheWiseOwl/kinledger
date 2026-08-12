require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.POSTGRES_URL });

async function run() {
  await client.connect();
  const res = await client.query("SELECT u.email, s.* FROM subscriptions s JOIN users u ON s.user_id = u.id");
  console.log(res.rows);
  await client.end();
}

run();

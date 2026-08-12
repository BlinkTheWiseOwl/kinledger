require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.POSTGRES_URL });

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM subscriptions");
  console.log("Subscriptions: ", res.rows);
  const users = await client.query("SELECT * FROM users");
  console.log("Users: ", users.rows);
  await client.end();
}

run();

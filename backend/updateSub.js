const db = require('./db');
const run = async () => {
  try {
    const userQuery = await db.query("SELECT id FROM users WHERE email = $1", ['sterling4shilpa@gmail.com']);
    if (userQuery.rows.length === 0) {
      console.log('User not found');
      process.exit(0);
    }
    const userId = userQuery.rows[0].id;
    await db.query("UPDATE subscriptions SET status = 'expired', expires_at = NOW() - INTERVAL '1 day' WHERE user_id = $1", [userId]);
    console.log('Updated user ' + userId + ' to expired');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};
run();

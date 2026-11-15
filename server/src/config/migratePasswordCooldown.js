const pool = require('./db');

async function migrate(database = pool) {
  const [columns] = await database.query("SHOW COLUMNS FROM users LIKE 'password_changed_at'");
  if (!columns.length) await database.query('ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL');
}

if (require.main === module) migrate().catch(() => {
  console.error('Password cooldown migration failed.');
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = { migrate };

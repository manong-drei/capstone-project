const pool = require('./db');

async function ensurePasswordCooldown(database = pool) {
  const [columns] = await database.query("SHOW COLUMNS FROM users WHERE Field = 'password_changed_at'");
  if (columns.length) return;

  try {
    await database.query('ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL');
    console.info('Added users.password_changed_at for the password change cooldown.');
  } catch (error) {
    // Another API instance may have added the column since the check.
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }
}

if (require.main === module) ensurePasswordCooldown().catch(error => {
  console.error('Password cooldown migration failed.', error.code || error.name);
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = ensurePasswordCooldown;

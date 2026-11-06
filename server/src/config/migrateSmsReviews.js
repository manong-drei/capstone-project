const pool = require('./db');

async function migrate(connection = pool) {
  const [columns] = await connection.query("SHOW COLUMNS FROM sms_jobs LIKE 'reviewed_at'");
  if (!columns.length) {
    await connection.query('ALTER TABLE sms_jobs ADD COLUMN reviewed_at DATETIME NULL DEFAULT NULL');
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('SMS failure reviews are available.'))
    .catch(error => { console.error('SMS review migration failed:', error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const pool = require('./db');

async function migrate(database = pool) {
  await database.query(fs.readFileSync(path.join(__dirname, '../../migrations/008_password_recovery.sql'), 'utf8'));
  await database.query("ALTER TABLE sms_jobs MODIFY COLUMN purpose ENUM('temporary_password','queue_alert','password_recovery') NOT NULL");
  const [[column]] = await database.query(`SELECT COUNT(*) AS count FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'sms_jobs' AND column_name = 'recovery_id'`);
  if (!Number(column.count)) await database.query('ALTER TABLE sms_jobs ADD COLUMN recovery_id CHAR(36) NULL, ADD INDEX sms_recovery (recovery_id)');
  console.log('Password recovery schema installed; existing credentials and recovery history preserved.');
}

if (require.main === module) migrate().catch(() => {
  console.error('Password recovery migration failed. Check that the SMS and audit migrations have been applied before retrying.');
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = { migrate };

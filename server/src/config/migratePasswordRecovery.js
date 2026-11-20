const pool = require('./db');

async function migrate(database = pool) {
  const [[purpose]] = await database.query("SHOW COLUMNS FROM sms_jobs WHERE Field = 'purpose'");
  if (!/^enum\('[a-z0-9_]+'(?:,'[a-z0-9_]+')*\)$/i.test(purpose?.Type)) {
    throw Object.assign(new Error('Expected sms_jobs.purpose to be an enum.'), { code: 'SMS_PURPOSE_SCHEMA' });
  }
  if (!purpose.Type.includes("'password_recovery'")) {
    await database.query(`ALTER TABLE sms_jobs MODIFY COLUMN purpose ${purpose.Type.slice(0, -1)},'password_recovery') NOT NULL`);
  }

  const [[recoveryId]] = await database.query("SHOW COLUMNS FROM sms_jobs WHERE Field = 'recovery_id'");
  if (!recoveryId) {
    try {
      await database.query('ALTER TABLE sms_jobs ADD COLUMN recovery_id CHAR(36) NULL, ADD INDEX sms_recovery (recovery_id)');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }

  await database.query(`CREATE TABLE IF NOT EXISTS password_recoveries (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    patient_id INT UNSIGNED NOT NULL,
    phone VARCHAR(11) NOT NULL,
    credential_version INT UNSIGNED NOT NULL,
    otp_hash CHAR(64) NULL,
    reset_token_hash CHAR(64) NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('pending','verified','completed','expired','failed','cancelled') NOT NULL DEFAULT 'pending',
    expires_at DATETIME(3) NOT NULL,
    reset_expires_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX recovery_phone_time (phone, created_at),
    INDEX recovery_user_status (user_id, status),
    INDEX recovery_expiry (status, expires_at)
  ) ENGINE=InnoDB`);
}

if (require.main === module) migrate()
  .then(() => console.info('Password recovery schema is ready.'))
  .catch(error => {
    const code = /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'UNKNOWN';
    console.error(`Password recovery migration failed (${code}). Check the SMS schema and database migration permissions.`);
    process.exitCode = 1;
  }).finally(() => pool.end());

module.exports = { migrate };

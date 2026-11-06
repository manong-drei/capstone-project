const pool = require('./db');

async function migrate(connection = pool) {
  const [columns] = await connection.query("SHOW COLUMNS FROM queues LIKE 'completed_by_doctor_id'");
  if (!columns.length) {
    await connection.query('ALTER TABLE queues ADD COLUMN completed_by_doctor_id INT UNSIGNED NULL DEFAULT NULL');
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Walk-in doctor attribution is available.'))
    .catch(error => { console.error('Walk-in doctor migration failed:', error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

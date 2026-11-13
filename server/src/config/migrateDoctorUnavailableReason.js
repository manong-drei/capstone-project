const pool = require('./db');

async function migrate(database = pool) {
  const [columns] = await database.query("SHOW COLUMNS FROM daily_doctor_settings LIKE 'unavailable_reason'");
  if (!columns.length) await database.query('ALTER TABLE daily_doctor_settings ADD COLUMN unavailable_reason VARCHAR(500) NULL');
}

if (require.main === module) migrate().catch(() => {
  console.error('Doctor unavailable reason migration failed.');
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = { migrate };

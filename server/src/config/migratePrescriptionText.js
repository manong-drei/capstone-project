const pool = require('./db');

async function migrate(database = pool) {
  await database.query('ALTER TABLE prescriptions MODIFY COLUMN medication_name TEXT NOT NULL');
}

if (require.main === module) migrate().catch(() => {
  console.error('Prescription text migration failed.');
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = { migrate };

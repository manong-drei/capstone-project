const pool = require('./db');

async function migrate(connection = pool) {
  for (const table of ['staff', 'doctors']) {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
    for (const [field, length] of [['gender', 20], ['address', 255]]) {
      if (!columns.some(column => column.Field === field)) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${field} VARCHAR(${length}) NULL DEFAULT NULL`);
      }
    }
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Staff and doctor gender and address fields applied.'))
    .catch(error => { console.error('Staff details migration failed:', error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

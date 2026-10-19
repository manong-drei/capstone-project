const pool = require('./db');

async function migrate(connection = pool) {
  for (const table of ['patients', 'staff', 'doctors']) {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
    if (!columns.some(column => column.Field === 'middle_name')) {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN middle_name VARCHAR(100) NULL DEFAULT NULL AFTER first_name`);
    }
    if (!columns.some(column => column.Field === 'suffix')) {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN suffix VARCHAR(20) NULL DEFAULT NULL AFTER last_name`);
    }
  }
  const [[snapshot]] = await connection.query("SHOW COLUMNS FROM queues LIKE 'walk_in_name'");
  const snapshotLength = snapshot?.Type.match(/^varchar\((\d+)\)$/i)?.[1];
  // A saved full name can contain 100 + 100 + 100 + 20 characters and three spaces.
  if (snapshotLength && Number(snapshotLength) < 323) {
    await connection.query('ALTER TABLE queues MODIFY COLUMN walk_in_name VARCHAR(323) NULL DEFAULT NULL');
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Middle name and suffix fields applied to patients, staff, and doctors.'))
    .catch(error => { console.error('User name migration failed:', error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

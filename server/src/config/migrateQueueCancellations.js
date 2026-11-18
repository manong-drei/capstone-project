const pool = require('./db');

async function migrate(database = pool) {
  for (const [name, definition] of [
    ['cancelled_by_role', "ENUM('staff','doctor','admin') NULL"],
    ['cancellation_acknowledged_at', 'DATETIME NULL'],
  ]) {
    const [columns] = await database.query('SHOW COLUMNS FROM queues LIKE ?', [name]);
    if (!columns.length) await database.query(`ALTER TABLE queues ADD COLUMN ${name} ${definition}`);
  }
  const [[purpose]] = await database.query("SHOW COLUMNS FROM sms_jobs LIKE 'purpose'");
  if (!purpose.Type.includes("'queue_cancellation'")) {
    const values = purpose.Type.slice(5, -1);
    await database.query(`ALTER TABLE sms_jobs MODIFY COLUMN purpose ENUM(${values},'queue_cancellation') NOT NULL`);
  }
}

if (require.main === module) migrate()
  .then(() => console.log('Queue cancellation notifications are available.'))
  .catch(() => {
    console.error('Queue cancellation migration failed. Inspect the schema before retrying.');
    process.exitCode = 1;
  }).finally(() => pool.end());

module.exports = migrate;

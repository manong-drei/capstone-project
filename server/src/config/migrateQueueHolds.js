const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE queues MODIFY COLUMN status
      ENUM('waiting', 'called', 'serving', 'missed', 'done', 'cancelled', 'no_show', 'held', 'expired') NULL DEFAULT 'waiting'`);
    const [columns] = await pool.query('SHOW COLUMNS FROM queues');
    const definitions = {
      held_expires_at: 'DATETIME(3) NULL',
      held_reactivated_at: 'DATETIME(3) NULL',
      held_insert_order: 'INT UNSIGNED NULL',
      original_queue_number: `${columns.find(column => column.Field === 'queue_number').Type} NULL`,
    };
    for (const [name, definition] of Object.entries(definitions)) {
      if (!columns.some(column => column.Field === name))
        await pool.query(`ALTER TABLE queues ADD COLUMN ${name} ${definition}`);
    }
    const [indexes] = await pool.query('SHOW INDEX FROM queues');
    if (!indexes.some(index => index.Key_name === 'queues_hold_expiry'))
      await pool.query('ALTER TABLE queues ADD INDEX queues_hold_expiry (category, status, held_expires_at)');
    console.log('Queue holds migration applied.');
  } finally { await pool.end(); }
}

module.exports = migrate;
if (require.main === module)
  migrate().catch(error => { console.error('Queue holds migration failed:', error.message); process.exitCode = 1; });

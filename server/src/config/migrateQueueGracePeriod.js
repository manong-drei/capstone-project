const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`ALTER TABLE queues MODIFY COLUMN status
      ENUM('waiting', 'called', 'serving', 'missed', 'done', 'cancelled', 'no_show') NULL DEFAULT 'waiting'`);
    const [columns] = await pool.query('SHOW COLUMNS FROM queues');
    const definitions = {
      last_called_at: 'DATETIME(3) NULL', call_count: 'TINYINT UNSIGNED NOT NULL DEFAULT 0',
      missed_at: 'DATETIME(3) NULL', grace_expires_at: 'DATETIME(3) NULL', returned_at: 'DATETIME(3) NULL',
    };
    for (const [name, definition] of Object.entries(definitions)) {
      if (!columns.some(column => column.Field === name)) await pool.query(`ALTER TABLE queues ADD COLUMN ${name} ${definition}`);
    }
    const [indexes] = await pool.query('SHOW INDEX FROM queues');
    if (!indexes.some(index => index.Key_name === 'queues_grace_expiry')) {
      await pool.query('ALTER TABLE queues ADD INDEX queues_grace_expiry (category, status, grace_expires_at)');
    }
    // Historical tickets have no recorded call time; preserve their existing order.
    await pool.query(`UPDATE queues SET last_called_at = updated_at, call_count = 1, updated_at = updated_at
      WHERE status IN ('serving', 'done') AND last_called_at IS NULL`);
    console.log('Queue grace-period migration applied.');
  } finally { await pool.end(); }
}

migrate().catch(error => { console.error('Queue grace-period migration failed:', error.message); process.exitCode = 1; });

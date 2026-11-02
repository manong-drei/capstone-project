require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const pool = require('./db');

async function migrate(database = pool) {
  const [columns] = await database.query(`SELECT COLUMN_NAME AS name FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'audit_logs'`);
  const names = new Set(columns.map(column => column.name));
  const required = ['id', 'actor_user_id', 'actor_name', 'actor_role', 'is_development', 'action',
    'target_type', 'target_id', 'outcome', 'reason', 'ip_address', 'details', 'created_at'];
  if (names.size && !required.every(name => names.has(name))) {
    const legacy = ['log_id', 'user_id', 'action', 'table_name', 'record_id', 'details', 'created_at'];
    if (!legacy.every(name => names.has(name)) || names.has('id')) throw new Error('Unrecognized audit schema.');
    const [[existing]] = await database.query(`SELECT COUNT(*) AS count FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'audit_logs_legacy'`);
    if (Number(existing.count)) throw new Error('Legacy audit archive already exists; refusing to overwrite it.');
    await database.query('RENAME TABLE audit_logs TO audit_logs_legacy');
    console.log('Previous audit table preserved as audit_logs_legacy.');
  }
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations/006_admin_audit_logs.sql'), 'utf8');
  await database.query(sql);
  console.log('Admin audit log table installed. Existing audit history was preserved.');
}

if (require.main === module) migrate().catch(() => {
  console.error('Audit migration failed. Inspect database access, audit_logs and audit_logs_legacy before retrying.');
  process.exitCode = 1;
}).finally(() => pool.end());

module.exports = { migrate };

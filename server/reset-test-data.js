/**
 * reset-test-data.js
 * Run from server/ with:  node reset-test-data.js
 *
 * Deletes today's test queue entries and the auto-created same-day
 * appointments so queue numbers restart at Q-001 / G-001 / P-001
 * and appointment + walk-in slots go back to zero.
 *
 * Safe to run at any time during or between demo sessions.
 */

const pool = require('./src/config/db');

async function reset() {
  const [queues] = await pool.query(
    `SELECT id, queue_number, category, status, walk_in_name, patient_id
     FROM queues WHERE DATE(created_at) = CURDATE()`
  );

  if (queues.length === 0) {
    console.log('No test data today — nothing to clean up.');
    pool.end();
    return;
  }

  console.log(`Found ${queues.length} queue entry/entries today:`);
  queues.forEach(q =>
    console.log(`  [${q.queue_number}] ${q.category} | ${q.status} | ${q.walk_in_name ?? `patient_id=${q.patient_id}`}`)
  );

  const queueIds = queues.map(q => q.id);

  // Must delete in FK order: prescriptions → consultations → queues → appointments
  const [consultRows] = await pool.query(
    `SELECT consultation_id FROM consultations WHERE queue_id IN (?)`, [queueIds]
  );
  const consultIds = consultRows.map(c => c.consultation_id);

  let prescResult = { affectedRows: 0 };
  if (consultIds.length > 0) {
    [prescResult] = await pool.query(
      `DELETE FROM prescriptions WHERE consultation_id IN (?)`, [consultIds]
    );
  }

  const [consultResult] = await pool.query(
    `DELETE FROM consultations WHERE queue_id IN (?)`, [queueIds]
  );

  const [queueResult] = await pool.query(
    `DELETE FROM queues WHERE DATE(created_at) = CURDATE()`
  );

  const [apptResult] = await pool.query(
    `DELETE FROM appointments
     WHERE appointment_date = CURDATE()
       AND reason = 'Same-day queue registration'`
  );

  console.log(`\nCleanup done:`);
  console.log(`  Prescriptions deleted : ${prescResult.affectedRows}`);
  console.log(`  Consultations deleted : ${consultResult.affectedRows}`);
  console.log(`  Queues deleted        : ${queueResult.affectedRows}`);
  console.log(`  Auto-appointments del : ${apptResult.affectedRows}`);
  console.log(`\nQueue numbers will restart from Q-001 / G-001 / P-001 on next entry.`);

  pool.end();
}

reset().catch(err => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});

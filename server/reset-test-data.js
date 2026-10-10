/**
 * reset-test-data.js
 * Run from server/ with:  node reset-test-data.js
 *
 * Demo databases only: deletes ALL today's queues and their clinical records,
 * queue SMS jobs, and auto-created same-day appointments; resets daily counters.
 * Stop the backend first so consultations and SMS sends cannot run during reset.
 */

const pool = require('./src/config/db');
const Queue = require('./src/models/Queue');

async function reset() {
  const connection = await pool.getConnection();
  const deleted = {
    prescriptions: 0, vital_signs: 0, medical_records: 0,
    consultations: 0, sms_jobs: 0, queues: 0, appointments: 0,
  };
  try {
    await connection.beginTransaction();
    for (const category of ['dental', 'general']) await Queue.lockCategory(category, connection);
    const [[{ today }]] = await connection.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    const [queues] = await connection.query(
      'SELECT id FROM queues WHERE DATE(created_at) = ? FOR UPDATE', [today],
    );
    const queueIds = queues.map(q => q.id);

    if (queueIds.length) {
      const [consultations] = await connection.query(
        'SELECT consultation_id FROM consultations WHERE queue_id IN (?) FOR UPDATE', [queueIds],
      );
      const consultIds = consultations.map(c => c.consultation_id);
      if (consultIds.length) {
        for (const table of ['prescriptions', 'vital_signs', 'medical_records']) {
          const [result] = await connection.query(`DELETE FROM ${table} WHERE consultation_id IN (?)`, [consultIds]);
          deleted[table] = result.affectedRows;
        }
      }
      const [consultResult] = await connection.query('DELETE FROM consultations WHERE queue_id IN (?)', [queueIds]);
      deleted.consultations = consultResult.affectedRows;
      const [smsResult] = await connection.query("DELETE FROM sms_jobs WHERE purpose = 'queue_alert' AND queue_id IN (?)", [queueIds]);
      deleted.sms_jobs = smsResult.affectedRows;
      const [queueResult] = await connection.query('DELETE FROM queues WHERE id IN (?)', [queueIds]);
      deleted.queues = queueResult.affectedRows;
    }

    const [apptResult] = await connection.query(
      `DELETE FROM appointments WHERE appointment_date = ? AND reason = 'Same-day queue registration'`, [today],
    );
    deleted.appointments = apptResult.affectedRows;
    // Keep the serving rows: they are the category transaction locks.
    const [sequenceResult] = await connection.query(
      "UPDATE queue_sequences SET last_number = 0 WHERE queue_date = ? AND sequence_type <> 'serving'", [today],
    );
    await connection.commit();
    return { today, deleted, sequencesReset: sequenceResult.affectedRows };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = reset;

if (require.main === module) {
  reset().then(({ today, deleted, sequencesReset }) => {
    console.log(`Cleanup done for ${today}:`);
    for (const [table, count] of Object.entries(deleted)) console.log(`  ${table} deleted: ${count}`);
    console.log(`  Daily counters reset: ${sequencesReset}`);
    console.log('Dental counters restart at 1 (AQ/Q regular, AP/P priority); general restarts at G-001.');
  }).catch(err => {
    console.error('Reset failed; changes rolled back:', err.message);
    process.exitCode = 1;
  }).finally(() => pool.end());
}

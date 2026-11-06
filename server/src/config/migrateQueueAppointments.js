const pool = require('./db');

async function migrate(connection = pool) {
  const [columns] = await connection.query("SHOW COLUMNS FROM queues LIKE 'appointment_id'");
  if (!columns.length) {
    await connection.query(`ALTER TABLE queues ADD COLUMN appointment_id INT UNSIGNED NULL,
      ADD CONSTRAINT fk_queue_appointment FOREIGN KEY (appointment_id)
      REFERENCES appointments (appointment_id) ON DELETE SET NULL`);
  }

  // Historical rows can only be paired when both sides are unique and the booking already existed.
  await connection.query(`UPDATE queues q
    JOIN (
      SELECT MIN(id) AS id
      FROM queues WHERE category = 'dental' AND is_walk_in = 0 AND patient_id IS NOT NULL
      GROUP BY patient_id, DATE(created_at) HAVING COUNT(*) = 1
    ) one_ticket ON one_ticket.id = q.id
    JOIN (
      SELECT patient_id, appointment_date, MIN(appointment_id) AS appointment_id,
             MIN(created_at) AS created_at
      FROM appointments GROUP BY patient_id, appointment_date HAVING COUNT(*) = 1
    ) one_appointment ON one_appointment.patient_id = q.patient_id
      AND one_appointment.appointment_date = DATE(q.created_at)
    SET q.appointment_id = one_appointment.appointment_id, q.updated_at = q.updated_at
    WHERE q.appointment_id IS NULL AND one_appointment.created_at <= q.created_at`);
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Queue tickets can now link to appointments.'))
    .catch(error => { console.error('Queue appointment migration failed:', error.code); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = migrate;

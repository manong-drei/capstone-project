const pool = require("../config/db");

const patientName = "COALESCE(NULLIF(CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')), ''), q.walk_in_name, 'Unknown patient')";

module.exports = {
  async findVisits(doctorId, patientId) {
    // shortcut: Dental walk-ins without notes use the intake dentist; store a treating doctor on queues when multiple dentists share intake.
    const [visits] = await pool.query(`
      SELECT CONCAT('queue-', q.id) AS visit_id, q.id AS queue_id, q.patient_id,
             q.queue_number, DATE_FORMAT(q.created_at, '%Y-%m-%d') AS visit_date,
             TIME_FORMAT(q.created_at, '%H:%i:%s') AS visit_time,
             ${patientName} AS patient_full_name,
             IF(q.is_walk_in = 1, 'walk_in', 'appointment') AS visit_type,
             q.services AS queue_services, NULL AS reason, q.status,
             q.status_reason, c.consultation_id
      FROM queues q
      LEFT JOIN patients p ON p.patient_id = q.patient_id
      LEFT JOIN consultations c ON c.consultation_id = (
        SELECT first_visit.consultation_id FROM consultations first_visit
        WHERE first_visit.queue_id = q.id ORDER BY first_visit.consultation_id LIMIT 1
      )
      WHERE (q.category = 'dental' OR (q.is_walk_in = 1 AND c.doctor_id IS NOT NULL)) AND COALESCE(
        c.doctor_id,
        q.completed_by_doctor_id,
        (SELECT booking.doctor_id FROM appointments booking WHERE booking.appointment_id = q.appointment_id),
        (SELECT a.doctor_id FROM appointments a
         WHERE q.appointment_id IS NULL AND q.is_walk_in = 0 AND a.patient_id = q.patient_id AND a.appointment_date = DATE(q.created_at)
           AND a.status != 'cancelled' ORDER BY a.appointment_id LIMIT 1),
        (SELECT d.doctor_id FROM doctors d ORDER BY d.doctor_id LIMIT 1)
      ) = ? ${patientId === undefined ? "" : "AND q.patient_id = ?"}
      UNION ALL
      SELECT CONCAT('appointment-', a.appointment_id), NULL, a.patient_id, NULL,
             DATE_FORMAT(a.appointment_date, '%Y-%m-%d'), a.appointment_time,
             CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')),
             'appointment', NULL, a.reason, a.status, NULL, NULL
      FROM appointments a
      LEFT JOIN patients p ON p.patient_id = a.patient_id
      WHERE a.doctor_id = ? ${patientId === undefined ? "" : "AND a.patient_id = ?"} AND NOT EXISTS (
        SELECT 1 FROM queues q WHERE q.patient_id = a.patient_id
          AND q.category = 'dental' AND q.is_walk_in = 0
          AND (q.appointment_id = a.appointment_id OR (
            q.appointment_id IS NULL AND DATE(q.created_at) = a.appointment_date
            AND (a.status = 'cancelled') = (q.status = 'cancelled')
          ))
      )
      ORDER BY visit_date DESC, visit_time DESC, visit_id DESC
    `, patientId === undefined ? [doctorId, doctorId] : [doctorId, patientId, doctorId, patientId]);
    return visits;
  },

  async findConsultation(doctorId, consultationId) {
    const [[consultation]] = await pool.query(`
      SELECT c.consultation_id, c.chief_complaint, c.notes, c.diagnosis,
             q.queue_number, DATE_FORMAT(q.created_at, '%Y-%m-%d') AS visit_date,
             ${patientName} AS patient_full_name,
             IF(q.is_walk_in = 1, 'walk_in', 'appointment') AS visit_type
      FROM consultations c
      JOIN queues q ON q.id = c.queue_id
      LEFT JOIN patients p ON p.patient_id = q.patient_id
      WHERE c.consultation_id = ? AND c.doctor_id = ?
    `, [consultationId, doctorId]);
    if (!consultation) return null;
    const [prescriptions] = await pool.query(
      "SELECT medication_name FROM prescriptions WHERE consultation_id = ?",
      [consultationId],
    );
    return {
      ...consultation,
      notes: [consultation.chief_complaint, consultation.notes].filter(Boolean).join("\n\n"),
      prescriptions: prescriptions.map((row) => row.medication_name),
    };
  },
};

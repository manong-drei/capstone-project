const audit = require("../services/auditLog");
const pool = require("../config/db");

const Appointment = {
  findActiveToday: async (patient_id, connection = pool) => {
    const [[appointment]] = await connection.query(`SELECT appointment_id FROM appointments
      WHERE patient_id = ? AND appointment_date = CURDATE()
        AND status IN ('pending', 'confirmed') LIMIT 1 FOR UPDATE`, [patient_id]);
    return appointment || null;
  },

  // Patient's own appointments
  findByPatientId: async (patient_id) => {
    // shortcut: Link clinical details only for an unambiguous patient/dentist/day; store a queue reference on appointments to distinguish multiple visits.
    const [rows] = await pool.query(
      `
      SELECT
        a.*,
        d.first_name       AS doctor_first_name,
        d.middle_name      AS doctor_middle_name,
        d.last_name        AS doctor_last_name,
        d.suffix           AS doctor_suffix,
        s.specialization_name,
        (
          SELECT q.services FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status != 'cancelled'
          ORDER BY q.created_at ASC
          LIMIT 1
        ) AS queue_services
        , (
          SELECT q.status_reason FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status = 'cancelled'
          ORDER BY q.updated_at DESC
          LIMIT 1
        ) AS cancellation_reason
        , c.diagnosis, pr.medication_name AS recommendation,
        pr.consultation_id AS prescription_consultation_id
      FROM   appointments a
      JOIN   doctors d ON a.doctor_id = d.doctor_id
      LEFT   JOIN specializations s ON d.specialization_id = s.specialization_id
      LEFT JOIN consultations c ON a.status = 'completed' AND c.consultation_id = (
        SELECT visit.consultation_id FROM consultations visit
        JOIN queues ticket ON ticket.id = visit.queue_id
        WHERE ticket.patient_id = a.patient_id AND visit.patient_id = a.patient_id
          AND visit.doctor_id = a.doctor_id AND ticket.category = 'dental'
          AND ticket.is_walk_in = 0 AND ticket.status = 'done'
          AND DATE(ticket.created_at) = a.appointment_date
          AND (SELECT COUNT(*) FROM queues same_day
               WHERE same_day.patient_id = a.patient_id AND same_day.category = 'dental'
                 AND same_day.is_walk_in = 0 AND same_day.status = 'done'
                 AND DATE(same_day.created_at) = a.appointment_date) = 1
          AND (SELECT COUNT(*) FROM appointments same_day_appointment
               WHERE same_day_appointment.patient_id = a.patient_id
                 AND same_day_appointment.doctor_id = a.doctor_id
                 AND same_day_appointment.appointment_date = a.appointment_date
                 AND same_day_appointment.status = 'completed') = 1
        ORDER BY visit.consultation_id DESC LIMIT 1
      )
      LEFT JOIN prescriptions pr ON pr.consultation_id = c.consultation_id
      WHERE  a.patient_id = ?
      ORDER  BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [patient_id],
    );
    const appointments = new Map();
    for (const { recommendation, prescription_consultation_id, ...row } of rows) {
      let appointment = appointments.get(row.appointment_id);
      if (!appointment) {
        appointment = { ...row, recommendations: null };
        appointments.set(row.appointment_id, appointment);
      }
      if (prescription_consultation_id !== null) {
        (appointment.recommendations ??= []).push(recommendation);
      }
    }
    return [...appointments.values()];
  },

  // Doctor's assigned appointments
  findByDoctorId: async (doctor_id) => {
    const [rows] = await pool.query(
      `
      SELECT
        a.*,
        p.middle_name AS patient_middle_name, p.suffix AS patient_suffix,
        CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')) AS patient_full_name,
        (
          SELECT q.services FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status != 'cancelled'
          ORDER BY q.created_at ASC
          LIMIT 1
        ) AS queue_services
        , (
          SELECT q.status_reason FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status = 'cancelled'
          ORDER BY q.updated_at DESC
          LIMIT 1
        ) AS cancellation_reason
      FROM   appointments a
      JOIN   patients p ON a.patient_id = p.patient_id
      WHERE  a.doctor_id = ?
      ORDER  BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [doctor_id],
    );
    return rows;
  },

  // All appointments — admin/staff
  findAll: async ({ limit = 10, offset = 0, includeWalkIns = false } = {}) => {
    const appointmentQueue = includeWalkIns ? "AND q.is_walk_in = 0" : "";
    const [rows] = await pool.query(`
      SELECT
        ${includeWalkIns ? "a.appointment_id, a.patient_id, a.appointment_date, a.appointment_time, a.reason, a.status," : "a.*,"}
        p.middle_name AS patient_middle_name, p.suffix AS patient_suffix,
        CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')) AS patient_full_name,
        d.first_name  AS doctor_first_name,
        d.middle_name AS doctor_middle_name,
        d.last_name   AS doctor_last_name,
        d.suffix      AS doctor_suffix,
        (
          SELECT q.services FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status != 'cancelled'
            ${appointmentQueue}
          ORDER BY q.created_at ASC
          LIMIT 1
        ) AS queue_services
        , (
          SELECT q.status_reason FROM queues q
          WHERE q.patient_id = a.patient_id
            AND DATE(q.created_at) = a.appointment_date
            AND q.status = 'cancelled'
            ${appointmentQueue}
          ORDER BY q.updated_at DESC
          LIMIT 1
        ) AS cancellation_reason
        ${includeWalkIns ? ", 'appointment' AS visit_type, NULL AS queue_id, NULL AS queue_number" : ""}
      FROM   appointments a
      JOIN   patients p ON a.patient_id = p.patient_id
      JOIN   doctors  d ON a.doctor_id  = d.doctor_id
      ${includeWalkIns ? `
      UNION ALL
      SELECT NULL, q.patient_id, DATE(q.created_at), TIME(q.created_at), NULL, q.status,
             p.middle_name, p.suffix,
             COALESCE(NULLIF(CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')), ''), q.walk_in_name, 'Unknown patient'),
             d.first_name, d.middle_name, d.last_name, d.suffix,
             q.services, q.status_reason, 'walk_in', q.id, q.queue_number
      FROM queues q
      LEFT JOIN patients p ON p.patient_id = q.patient_id
      LEFT JOIN doctors d ON d.doctor_id = COALESCE((
        SELECT c.doctor_id FROM consultations c
        WHERE c.queue_id = q.id ORDER BY c.consultation_id LIMIT 1
      ), q.completed_by_doctor_id)
      WHERE q.is_walk_in = 1
      ORDER BY appointment_date DESC, appointment_time DESC, appointment_id DESC, queue_id DESC
      ` : "ORDER BY a.appointment_date DESC, a.appointment_time DESC, a.appointment_id DESC"}
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    return rows;
  },

  getSummary: async ({ includeWalkIns = false } = {}) => {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(status IN ('completed', 'done')), 0) AS completed,
        COALESCE(SUM(status IN ('pending', 'confirmed', 'waiting', 'called', 'serving', 'missed')), 0) AS open
        ${includeWalkIns ? ", COALESCE(SUM(status IN ('cancelled', 'no_show')), 0) AS cancelled_or_no_show" : ""}
      FROM ${includeWalkIns ? `(
        SELECT status FROM appointments
        UNION ALL
        SELECT status FROM queues WHERE is_walk_in = 1
      ) visits` : "appointments"}
    `);
    return {
      total: Number(row.total), completed: Number(row.completed), open: Number(row.open),
      ...(includeWalkIns && { cancelledOrNoShow: Number(row.cancelled_or_no_show) }),
    };
  },

  // Count appointments created today — used by admin overview
  countToday: async () => {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM   appointments
      WHERE  DATE(created_at) = CURDATE()
    `);
    return rows[0].count;
  },

  // Create a new appointment
  create: async ({
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
    notes,
  }, connection = pool) => {
    const [result] = await connection.query(
      `INSERT INTO appointments
         (patient_id, doctor_id, appointment_date, appointment_time, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason || null,
        notes || null,
      ],
    );
    const [rows] = await connection.query(
      "SELECT * FROM appointments WHERE appointment_id = ?",
      [result.insertId],
    );
    return rows[0];
  },

  // Fetch a single appointment by id
  findById: async (appointment_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE appointment_id = ?",
      [appointment_id],
    );
    return rows[0] || null;
  },

  // Update appointment status
  updateStatus: async (appointment_id, status, isAdmin) => {
    const update = async connection => {
      await connection.query('UPDATE appointments SET status = ?, updated_at = NOW() WHERE appointment_id = ?', [status, appointment_id]);
      const [[updated]] = await connection.query('SELECT * FROM appointments WHERE appointment_id = ?', [appointment_id]);
      return updated || null;
    };
    return isAdmin ? audit.transaction(update) : update(pool);
  },
};

module.exports = Appointment;

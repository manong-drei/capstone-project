const pool = require("../config/db");

const Appointment = {
  // Patient's own appointments
  findByPatientId: async (patient_id) => {
    const [rows] = await pool.query(
      `
      SELECT
        a.*,
        d.first_name       AS doctor_first_name,
        d.last_name        AS doctor_last_name,
        s.specialization_name
      FROM   appointments a
      JOIN   doctors d ON a.doctor_id = d.doctor_id
      LEFT   JOIN specializations s ON d.specialization_id = s.specialization_id
      WHERE  a.patient_id = ?
      ORDER  BY a.appointment_date DESC, a.appointment_time DESC
    `,
      [patient_id],
    );
    return rows;
  },

  // Doctor's assigned appointments
  findByDoctorId: async (doctor_id) => {
    const [rows] = await pool.query(
      `
      SELECT
        a.*,
        p.first_name  AS patient_first_name,
        p.last_name   AS patient_last_name
      FROM   appointments a
      JOIN   patients p ON a.patient_id = p.patient_id
      WHERE  a.doctor_id = ?
      ORDER  BY a.appointment_date ASC, a.appointment_time ASC
    `,
      [doctor_id],
    );
    return rows;
  },

  // All appointments — admin/staff
  findAll: async () => {
    const [rows] = await pool.query(`
      SELECT
        a.*,
        p.first_name  AS patient_first_name,
        p.last_name   AS patient_last_name,
        d.first_name  AS doctor_first_name,
        d.last_name   AS doctor_last_name
      FROM   appointments a
      JOIN   patients p ON a.patient_id = p.patient_id
      JOIN   doctors  d ON a.doctor_id  = d.doctor_id
      ORDER  BY a.appointment_date DESC
    `);
    return rows;
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
  }) => {
    const [result] = await pool.query(
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
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE appointment_id = ?",
      [result.insertId],
    );
    return rows[0];
  },

  // Update appointment status
  updateStatus: async (appointment_id, status) => {
    await pool.query(
      `UPDATE appointments SET status = ?, updated_at = NOW() WHERE appointment_id = ?`,
      [status, appointment_id],
    );
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE appointment_id = ?",
      [appointment_id],
    );
    return rows[0] || null;
  },
};

module.exports = Appointment;

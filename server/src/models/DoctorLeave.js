const { createHash } = require('node:crypto');
const pool = require('../config/db');
const audit = require('../services/auditLog');
const Doctor = require('./Doctor');
const Queue = require('./Queue');
const { clinicToday } = require('../utils/clinicDate');

const fail = (status, message) => Object.assign(new Error(message), { status });
const columns = `l.id, l.doctor_id, DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date,
  DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date, l.reason, l.status,
  l.reviewed_by, l.review_note, l.reviewed_at, l.created_at,
  CONCAT_WS(' ', d.first_name, NULLIF(TRIM(d.middle_name), ''), d.last_name, NULLIF(TRIM(d.suffix), '')) AS doctor_name`;

const DoctorLeave = {
  async list(doctorId) {
    const [rows] = await pool.query(`SELECT ${columns} FROM doctor_leaves l
      JOIN doctors d ON d.doctor_id = l.doctor_id
      ${doctorId ? 'WHERE l.doctor_id = ?' : ''}
      ORDER BY FIELD(l.status, 'pending', 'approved', 'rejected', 'cancelled'), l.start_date DESC, l.id DESC`, doctorId ? [doctorId] : []);
    return rows;
  },

  async findApproved(doctorId, date, connection = pool) {
    const [[leave]] = await connection.query(`SELECT id,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM doctor_leaves
      WHERE doctor_id = ? AND status = 'approved' AND start_date <= ? AND end_date >= ? LIMIT 1`, [doctorId, date, date]);
    return leave || null;
  },

  async assertAvailable(doctorId, date, connection) {
    const leave = await DoctorLeave.findApproved(doctorId, date, connection);
    if (leave) throw fail(409, `The doctor is on approved leave from ${leave.start_date} through ${leave.end_date}. Please choose another date or contact staff.`);
  },

  async conflicts(leave, connection = pool) {
    const [appointments] = await connection.query(`SELECT a.appointment_id,
      DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date, a.appointment_time, a.status,
      CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')) AS patient_name
      FROM appointments a LEFT JOIN patients p ON p.patient_id = a.patient_id
      WHERE a.doctor_id = ? AND a.appointment_date BETWEEN ? AND ? AND a.status IN ('pending', 'confirmed')
      ORDER BY a.appointment_date, a.appointment_id${connection === pool ? '' : ' FOR UPDATE'}`, [leave.doctor_id, leave.start_date, leave.end_date]);
    // Dental intake uses the lowest-ID active dentist.
    const [queues] = await connection.query(`SELECT q.id, q.queue_number, q.status,
      COALESCE(NULLIF(CONCAT_WS(' ', p.first_name, p.last_name), ''), q.walk_in_name, 'Unknown patient') AS patient_name
      FROM queues q LEFT JOIN patients p ON p.patient_id = q.patient_id
      WHERE q.category = 'dental' AND DATE(q.created_at) = CURDATE()
        AND q.status IN ('waiting', 'called', 'serving', 'missed')
        AND CURDATE() BETWEEN ? AND ?
        AND ? = (${Doctor.defaultActiveDoctorQuery})
      ORDER BY q.id${connection === pool ? '' : ' FOR UPDATE'}`, [leave.start_date, leave.end_date, leave.doctor_id]);
    const version = createHash('sha256').update(JSON.stringify([
      appointments.map(row => [row.appointment_id, row.status]), queues.map(row => [row.id, row.status]),
    ])).digest('hex');
    return { appointments, queues, version };
  },

  async reviewDetails(id) {
    const [[leave]] = await pool.query(`SELECT ${columns} FROM doctor_leaves l
      JOIN doctors d ON d.doctor_id = l.doctor_id WHERE l.id = ?`, [id]);
    if (!leave) throw fail(404, 'Leave request not found.');
    return { leave, impacts: await DoctorLeave.conflicts(leave) };
  },

  async request(doctorId, start, end, reason) {
    return audit.transaction(async connection => {
      await connection.query('SELECT doctor_id FROM doctors WHERE doctor_id = ? FOR UPDATE', [doctorId]);
      const [[overlap]] = await connection.query(`SELECT id FROM doctor_leaves
        WHERE doctor_id = ? AND status IN ('pending', 'approved') AND start_date <= ? AND end_date >= ? LIMIT 1`, [doctorId, end, start]);
      if (overlap) throw fail(409, 'These dates overlap an existing pending or approved leave request.');
      const [result] = await connection.query(`INSERT INTO doctor_leaves (doctor_id, start_date, end_date, reason)
        VALUES (?, ?, ?, ?)`, [doctorId, start, end, reason || null]);
      return result.insertId;
    });
  },

  async decide(id, status, note, req, { doctorId, acknowledge, version } = {}) {
    return audit.transaction(async connection => {
      // Match registration's lock order so approval and new bookings cannot race.
      await Queue.lockCategory('dental', connection);
      const [[identity]] = await connection.query('SELECT doctor_id FROM doctor_leaves WHERE id = ?', [id]);
      if (!identity || (doctorId && identity.doctor_id !== doctorId)) throw fail(404, 'Leave request not found.');
      await connection.query('SELECT doctor_id FROM doctors WHERE doctor_id = ? FOR UPDATE', [identity.doctor_id]);
      const [[leave]] = await connection.query(`SELECT l.id, l.doctor_id, l.status,
        DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date FROM doctor_leaves l WHERE l.id = ? FOR UPDATE`, [id]);
      const allowed = doctorId
        ? leave.status === 'pending' && status === 'cancelled'
        : (leave.status === 'pending' && ['approved', 'rejected'].includes(status)) || (leave.status === 'approved' && status === 'cancelled');
      if (!allowed) throw fail(409, 'This leave request has already changed. Refresh the list before continuing.');
      if (status === 'approved') {
        if (leave.end_date < clinicToday()) throw fail(409, 'This leave period has already ended. Reject it or request new dates.');
        const [[overlap]] = await connection.query(`SELECT id FROM doctor_leaves
          WHERE doctor_id = ? AND status = 'approved' AND id != ? AND start_date <= ? AND end_date >= ? LIMIT 1 FOR UPDATE`, [leave.doctor_id, id, leave.end_date, leave.start_date]);
        if (overlap) throw fail(409, 'These dates overlap another approved leave.');
        const impacts = await DoctorLeave.conflicts(leave, connection);
        if ((impacts.appointments.length || impacts.queues.length) && (!acknowledge || version !== impacts.version)) {
          throw fail(409, 'Review the affected appointments and queue tickets again, then acknowledge staff follow-up before approving.');
        }
      }
      await connection.query(`UPDATE doctor_leaves SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
        [status, note || null, doctorId ? null : req.user.user_id, id]);
      return { id, status };
    });
  },
};

module.exports = DoctorLeave;

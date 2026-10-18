/**
 * doctorController.js – Doctor read handlers + consultation recording
 */

const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const pool = require("../config/db");

const validReportDate = (date) => typeof date === "string" && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const reportWindow = (query) => {
  const period = query.period ?? "today";
  const report_date = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const date = query.date ?? report_date;
  if (!["today", "weekly", "monthly"].includes(period) || !validReportDate(date)) return null;
  const from = new Date(`${date}T00:00:00Z`);
  if (period === "weekly") from.setUTCDate(from.getUTCDate() - (from.getUTCDay() + 6) % 7);
  if (period === "monthly") from.setUTCDate(1);
  const until = new Date(from);
  if (period === "monthly") until.setUTCMonth(until.getUTCMonth() + 1);
  else until.setUTCDate(until.getUTCDate() + (period === "weekly" ? 7 : 1));
  return { period, report_date, from: from.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };
};

// Scalar lookups keep each queue visit counted once, even with duplicate legacy records.
// shortcut: Unlinked visits use the current default dentist and demographics use current profiles; snapshot at completion for immutable history.
const queueDoctor = `COALESCE(
  (SELECT c.doctor_id FROM consultations c WHERE c.queue_id = q.id ORDER BY c.consultation_id ASC LIMIT 1),
  (SELECT a.doctor_id FROM appointments a
   WHERE a.patient_id = q.patient_id AND a.appointment_date = DATE(q.created_at) AND a.status != 'cancelled'
   ORDER BY a.appointment_id ASC LIMIT 1),
  (SELECT d.doctor_id FROM doctors d ORDER BY d.doctor_id ASC LIMIT 1)
)`;

/** GET /api/doctor/analytics?period=today|weekly|monthly&date=YYYY-MM-DD */
const getAnalytics = async (req, res) => {
  const window = reportWindow(req.query);
  if (!window) return res.status(400).json({ success: false, message: "A valid analytics period and date are required." });
  const { from, until } = window;
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
    const [[queue]] = await pool.query(`
      SELECT COUNT(DISTINCT q.patient_id) AS patients,
             COALESCE(SUM(status = 'waiting'), 0) AS waiting,
             COALESCE(SUM(status = 'serving'), 0) AS serving,
             COALESCE(SUM(status = 'done'), 0) AS completed,
             COALESCE(SUM(type = 'priority'), 0) AS priority,
             COALESCE(SUM(is_walk_in = 1), 0) AS walk_ins
      FROM queues q WHERE q.category = 'dental' AND q.created_at >= ? AND q.created_at < ? AND ${queueDoctor} = ?
    `, [from, until, doctor.doctor_id]);
    const [[{ appointments }]] = await pool.query(`
      SELECT COUNT(*) AS appointments FROM appointments
      WHERE appointment_date >= ? AND appointment_date < ? AND status != 'cancelled' AND doctor_id = ?
    `, [from, until, doctor.doctor_id]);
    const [completed_demographics] = await pool.query(`
      SELECT COALESCE(NULLIF(TRIM(p.barangay), ''), 'Unknown') AS barangay,
      CASE LOWER(TRIM(COALESCE(NULLIF(TRIM(p.gender), ''), q.walk_in_gender, '')))
        WHEN 'male' THEN 'Male' WHEN 'female' THEN 'Female' WHEN 'other' THEN 'Other' ELSE 'Unknown'
      END AS sex,
      CASE
        WHEN COALESCE(p.date_of_birth, q.walk_in_dob) IS NULL OR COALESCE(p.date_of_birth, q.walk_in_dob) > DATE(q.created_at) THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 1 THEN '0–11 months'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 5 THEN '1–4 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 10 THEN '5–9 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 15 THEN '10–14 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 20 THEN '15–19 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 60 THEN '20–59 years'
        ELSE '60+ years'
      END AS age_group, COUNT(*) AS count
      FROM queues q LEFT JOIN patients p ON p.patient_id = q.patient_id
      WHERE q.category = 'dental' AND q.status = 'done' AND q.created_at >= ? AND q.created_at < ? AND ${queueDoctor} = ?
      GROUP BY barangay, sex, age_group ORDER BY barangay, age_group, sex
    `, [from, until, doctor.doctor_id]);
    const ages = new Map();
    for (const row of completed_demographics) ages.set(row.age_group, (ages.get(row.age_group) || 0) + Number(row.count));
    res.json({
      ...window,
      ...Object.fromEntries(Object.entries(queue).map(([key, value]) => [key, Number(value)])),
      appointments: Number(appointments),
      age_groups: Array.from(ages, ([age_group, count]) => ({ age_group, count })),
      completed_demographics: completed_demographics.map((row) => ({ ...row, count: Number(row.count) })),
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const reportValue = (data) => typeof data === "string" ? JSON.parse(data) : data;
const validReportData = (data, length = 24) => {
  const validCount = (value) => value === null ||
    (Number.isSafeInteger(value) && value >= 0 && value <= 999999999);
  return Array.isArray(data) && data.length === 24 &&
    data.every((values) => Array.isArray(values) && values.length === length && values.every(validCount));
};
const reportRows = (stored) => {
  const rows = stored?.barangays;
  if (validReportData(rows)) return rows;
  if (validReportData(rows, 12)) return rows.map((row) => [...row, ...Array(12).fill(null)]);
  return null;
};

const getDailyReport = async (req, res) => {
  if (!validReportDate(req.query.date)) return res.status(400).json({ success: false, message: "A valid report date is required." });
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
    const [[report]] = await pool.query(
      "SELECT data FROM doctor_daily_reports WHERE doctor_id = ? AND report_date = ?",
      [doctor.doctor_id, req.query.date],
    );
    const stored = report ? reportValue(report.data) : null;
    res.json({ data: reportRows(stored), legacy: stored?.categories ? { categories: stored.categories, pregnant: stored.pregnant } : null });
  } catch (err) {
    console.error("getDailyReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const saveDailyReport = async (req, res) => {
  if (!validReportDate(req.body?.date) || !validReportData(req.body?.data)) {
    return res.status(400).json({ success: false, message: "A valid date and 24 barangay rows of blank or whole-number counts are required." });
  }
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
    const [[previous]] = await pool.query(
      "SELECT data FROM doctor_daily_reports WHERE doctor_id = ? AND report_date = ?",
      [doctor.doctor_id, req.body.date],
    );
    const data = { ...(previous ? reportValue(previous.data) : {}), barangays: req.body.data };
    await pool.query(
      `INSERT INTO doctor_daily_reports (doctor_id, report_date, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [doctor.doctor_id, req.body.date, JSON.stringify(data)],
    );
    res.json({ success: true, data: data.barangays });
  } catch (err) {
    console.error("saveDailyReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getMonthlyReport = async (req, res) => {
  const month = req.query.month;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || ""))
    return res.status(400).json({ success: false, message: "A valid report month is required." });
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
    const [rows] = await pool.query(
      "SELECT data FROM doctor_daily_reports WHERE doctor_id = ? AND report_date >= ? AND report_date < DATE_ADD(?, INTERVAL 1 MONTH) ORDER BY report_date",
      [doctor.doctor_id, `${month}-01`, `${month}-01`],
    );
    res.json({ reports: rows.map((row) => reportRows(reportValue(row.data))).filter(Boolean) });
  } catch (err) {
    console.error("getMonthlyReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/doctor/report?period=today|weekly|monthly&date=YYYY-MM-DD */
const getReport = async (req, res) => {
  const window = reportWindow(req.query);
  if (!window) return res.status(400).json({ success: false, message: "A valid report period and date are required." });
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
    const [rows] = await pool.query(
      "SELECT data FROM doctor_daily_reports WHERE doctor_id = ? AND report_date >= ? AND report_date < ? ORDER BY report_date",
      [doctor.doctor_id, window.from, window.until],
    );
    const { period, from, until } = window;
    res.json({ period, from, until, reports: rows.map((row) => reportRows(reportValue(row.data))).filter(Boolean) });
  } catch (err) {
    console.error("getReport error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/doctor/daily-settings?date=YYYY-MM-DD */
const getDailySettings = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Dentist profile not found." });

    const [[settings]] = await pool.query(
      "SELECT * FROM daily_doctor_settings WHERE doctor_id = ? AND date = ?",
      [doctor.doctor_id, date],
    );

    const [[{ booked_count }]] = await pool.query(
      `SELECT COUNT(*) AS booked_count FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [doctor.doctor_id, date],
    );

    const [[{ walkin_count }]] = await pool.query(
      `SELECT COUNT(*) AS walkin_count FROM queues
       WHERE is_walk_in = 1 AND DATE(created_at) = ?`,
      [date],
    );

    res.status(200).json({
      appointment_limit: settings?.appointment_limit ?? 10,
      walk_in_limit: settings?.walk_in_limit ?? 0,
      booked_count: booked_count ?? 0,
      walkin_count: walkin_count ?? 0,
      is_available: settings?.is_available ?? 1,
    });
  } catch (err) {
    console.error("getDailySettings error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/doctor/daily-settings */
const upsertDailySettings = async (req, res) => {
  try {
    const { date, appointment_limit, walk_in_limit, is_available = 1 } = req.body;

    if (
      appointment_limit === undefined ||
      walk_in_limit === undefined ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "date, appointment_limit, and walk_in_limit are required.",
      });
    }
    if (appointment_limit > 10) {
      return res.status(400).json({
        success: false,
        message: "Appointment limit cannot exceed 10.",
      });
    }
    if (appointment_limit < 0 || walk_in_limit < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Limits cannot be negative." });
    }
    if (walk_in_limit > 999) {
      return res
        .status(400)
        .json({ success: false, message: "Walk-in limit cannot exceed 999." });
    }

    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Dentist profile not found." });

    await pool.query(
      `INSERT INTO daily_doctor_settings (doctor_id, date, appointment_limit, walk_in_limit, is_available)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         appointment_limit = VALUES(appointment_limit),
         walk_in_limit     = VALUES(walk_in_limit),
         is_available      = VALUES(is_available)`,
      [doctor.doctor_id, date, appointment_limit, walk_in_limit, is_available ? 1 : 0],
    );

    res.status(200).json({ success: true, message: "Daily settings saved." });
  } catch (err) {
    console.error("upsertDailySettings error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
/** GET /api/doctors */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res
      .status(200)
      .json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error("getAllDoctors error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/doctors/:id */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Dentist not found." });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    console.error("getDoctorById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/doctor/:id/records (admin only) */
const getDoctorRecords = async (req, res) => {
  const id = Number(req.params.id);
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "A valid doctor ID is required." });
  }
  try {
    const doctor = await Doctor.findAdminProfile(id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found." });
    const availability = await Doctor.findAvailabilityRecords(id);
    res.status(200).json({ success: true, data: { doctor, availability } });
  } catch (err) {
    console.error("getDoctorRecords error:", err);
    res.status(500).json({ success: false, message: "Unable to load doctor records." });
  }
};

/** POST /api/doctor/consultations */
const createConsultation = async (req, res) => {
  try {
    const { queue_id, notes, diagnosis, prescription } = req.body;
    const id = Number(queue_id);

    if (!Number.isSafeInteger(id) || id <= 0 || typeof notes !== 'string' || !notes.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "queue_id and notes are required." });
    }

    // Get the doctor profile from the logged-in user
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Dentist profile not found." });
    }

    const result = await Queue._withTicket(id, async (queueRow, connection) => {
      // Staff may finish the queue before the dentist saves notes.
      if (!['serving', 'done'].includes(queueRow.status)) {
        throw Object.assign(new Error('The patient must be serving or finished before saving a consultation.'), { status: 400 });
      }
      const [[existing]] = await connection.query('SELECT consultation_id FROM consultations WHERE queue_id = ? LIMIT 1', [id]);
      if (existing) throw Object.assign(new Error('A consultation has already been saved for this patient visit.'), { status: 409 });

      const [consultResult] = await connection.query(
        `INSERT INTO consultations (queue_id, doctor_id, patient_id, chief_complaint, diagnosis, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, doctor.doctor_id, queueRow.patient_id, notes, diagnosis || null, null],
      );
      const consultation_id = consultResult.insertId;
      if (prescription && prescription.trim()) {
        await connection.query(
          `INSERT INTO prescriptions (consultation_id, medication_name) VALUES (?, ?)`,
          [consultation_id, prescription.trim()],
        );
      }
      if (queueRow.status === 'serving') {
        await connection.query(`UPDATE queues SET status = ?, status_reason = ?, updated_at = NOW() WHERE id = ?`, ['done', null, id]);
      }
      if (queueRow.patient_id) {
        await connection.query(
          `UPDATE appointments SET status = 'completed', updated_at = NOW()
           WHERE patient_id = ? AND appointment_date = CURDATE() AND status IN ('pending', 'confirmed')`,
          [queueRow.patient_id],
        );
      }
      return { consultation_id };
    });
    if (!result) return res.status(404).json({ success: false, message: 'Queue entry not found.' });
    if (result.expired) return res.status(409).json({ success: false, message: 'This ticket has expired and cannot receive a consultation.' });
    require('../services/smsNotifications').wakeWorker();

    res
      .status(201)
      .json({ success: true, message: "Consultation saved.", consultation_id: result.consultation_id });
  } catch (err) {
    if (!err.status) console.error("createConsultation error:", err);
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorRecords,
  createConsultation,
  getDailySettings,
  upsertDailySettings,
  getAnalytics,
  getDailyReport,
  saveDailyReport,
  getMonthlyReport,
  getReport,
};

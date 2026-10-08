/**
 * doctorController.js – Doctor read handlers + consultation recording
 */

const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const pool = require("../config/db");

/** GET /api/doctor/analytics?period=today|weekly|monthly */
const getAnalytics = async (req, res) => {
  const windows = {
    today: ["CURDATE()", "DATE_ADD(CURDATE(), INTERVAL 1 DAY)"],
    weekly: ["DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)", "DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)"],
    monthly: ["DATE_FORMAT(CURDATE(), '%Y-%m-01')", "DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)"],
  };
  const period = req.query.period || "today";
  if (!Object.hasOwn(windows, period)) return res.status(400).json({ success: false, message: "Invalid analytics period." });
  const [from, until] = windows[period];
  try {
    const [[queue]] = await pool.query(`
      SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS report_date,
             COUNT(DISTINCT patient_id) AS patients,
             COALESCE(SUM(status = 'waiting'), 0) AS waiting,
             COALESCE(SUM(status = 'serving'), 0) AS serving,
             COALESCE(SUM(status = 'done'), 0) AS completed,
             COALESCE(SUM(type = 'priority'), 0) AS priority,
             COALESCE(SUM(is_walk_in = 1), 0) AS walk_ins
      FROM queues WHERE category = 'dental' AND created_at >= ${from} AND created_at < ${until}
    `);
    const [[{ appointments }]] = await pool.query(`
      SELECT COUNT(*) AS appointments FROM appointments
      WHERE appointment_date >= ${from} AND appointment_date < ${until} AND status != 'cancelled'
    `);
    const [age_groups] = await pool.query(`
      SELECT CASE
        WHEN COALESCE(p.date_of_birth, q.walk_in_dob) IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 1 THEN '0–11 months'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 5 THEN '1–4 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 10 THEN '5–9 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 15 THEN '10–14 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 20 THEN '15–19 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 60 THEN '20–59 years'
        ELSE '60+ years'
      END AS age_group, COUNT(*) AS count
      FROM queues q LEFT JOIN patients p ON p.patient_id = q.patient_id
      WHERE q.category = 'dental' AND q.created_at >= ${from} AND q.created_at < ${until}
      GROUP BY age_group
    `);
    const { report_date, ...queueCounts } = queue;
    res.json({
      period,
      report_date,
      ...Object.fromEntries(Object.entries(queueCounts).map(([key, value]) => [key, Number(value)])),
      appointments: Number(appointments),
      age_groups: age_groups.map((row) => ({ ...row, count: Number(row.count) })),
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const validReportDate = (date) => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
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

/** POST /api/doctor/consultations */
const createConsultation = async (req, res) => {
  try {
    const { queue_id, notes, diagnosis, prescription } = req.body;

    if (!queue_id || !notes) {
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

    // Get the queue entry to retrieve patient_id
    const [[queueRow]] = await pool.query("SELECT * FROM queues WHERE id = ?", [
      queue_id,
    ]);
    if (!queueRow) {
      return res
        .status(404)
        .json({ success: false, message: "Queue entry not found." });
    }

    // Only allow consultation on an actively serving queue entry
    if (queueRow.status !== "serving") {
      return res
        .status(400)
        .json({ success: false, message: "Queue entry is not currently being served." });
    }

    // Insert consultation record
    const [consultResult] = await pool.query(
      `INSERT INTO consultations (queue_id, doctor_id, patient_id, chief_complaint, diagnosis, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        queue_id,
        doctor.doctor_id,
        queueRow.patient_id,
        notes,
        diagnosis || null,
        null,
      ],
    );
    const consultation_id = consultResult.insertId;

    // Insert prescription if provided
    if (prescription && prescription.trim()) {
      await pool.query(
        `INSERT INTO prescriptions (consultation_id, medication_name)
         VALUES (?, ?)`,
        [consultation_id, prescription.trim()],
      );
    }

    // Mark the queue entry as done now that consultation is saved
    await require('../models/Queue').updateStatus(queue_id, 'done');
    require('../services/smsNotifications').wakeWorker();

    // Completing consultation should also complete today's linked appointment.
    if (queueRow.patient_id) {
      await pool.query(
        `UPDATE appointments
         SET status = 'completed', updated_at = NOW()
         WHERE patient_id = ? AND appointment_date = CURDATE() AND status IN ('pending', 'confirmed')`,
        [queueRow.patient_id],
      );
    }

    res
      .status(201)
      .json({ success: true, message: "Consultation saved.", consultation_id });
  } catch (err) {
    console.error("createConsultation error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createConsultation,
  getDailySettings,
  upsertDailySettings,
  getAnalytics,
  getDailyReport,
  saveDailyReport,
  getMonthlyReport,
};

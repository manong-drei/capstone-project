/**
 * doctorController.js – Doctor read handlers + consultation recording
 */

const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const pool = require("../config/db");

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
       WHERE patient_id IS NULL AND DATE(created_at) = ?`,
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
    await pool.query(
      "UPDATE queues SET status = 'done', updated_at = NOW() WHERE id = ?",
      [queue_id],
    );

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
};

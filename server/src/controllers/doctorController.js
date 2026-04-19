/**
 * doctorController.js – Doctor read handlers + consultation recording
 */

const Doctor = require('../models/Doctor');
const Queue = require('../models/Queue');
const pool = require('../config/db');

/** GET /api/doctors */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error('getAllDoctors error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/doctors/:id */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    console.error('getDoctorById error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/doctor/consultations */
const createConsultation = async (req, res) => {
  try {
    const { queue_id, notes, diagnosis, prescription } = req.body;

    if (!queue_id || !notes) {
      return res.status(400).json({ success: false, message: 'queue_id and notes are required.' });
    }

    // Get the doctor profile from the logged-in user
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Get the queue entry to retrieve patient_id
    const [[queueRow]] = await pool.query(
      'SELECT * FROM queues WHERE id = ?',
      [queue_id]
    );
    if (!queueRow) {
      return res.status(404).json({ success: false, message: 'Queue entry not found.' });
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
      ]
    );
    const consultation_id = consultResult.insertId;

    // Insert prescription if provided
    if (prescription && prescription.trim()) {
      await pool.query(
        `INSERT INTO prescriptions (consultation_id, medication_name)
         VALUES (?, ?)`,
        [consultation_id, prescription.trim()]
      );
    }

    res.status(201).json({ success: true, message: 'Consultation saved.', consultation_id });
  } catch (err) {
    console.error('createConsultation error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllDoctors, getDoctorById, createConsultation };
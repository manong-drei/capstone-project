/**
 * doctorController.js – Doctor read handlers
 */

const Doctor = require('../models/Doctor');

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

module.exports = { getAllDoctors, getDoctorById };

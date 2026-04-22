const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const pool = require("../config/db");

/** GET /api/appointments/me — patient's own appointments */
const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    const appointments = await Appointment.findByPatientId(patient.patient_id);
    res.json({ success: true, appointments });
  } catch (err) {
    console.error("getMyAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/appointments — admin/staff sees all appointments */
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    console.error("getAllAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/appointments/doctor — doctor's own assigned appointments */
const getMyDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findByUserId(req.user.user_id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found." });
    }
    const appointments = await Appointment.findByDoctorId(doctor.doctor_id);
    res.json({ success: true, appointments });
  } catch (err) {
    console.error("getMyDoctorAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/appointments — patient books an appointment */
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason, notes } =
      req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message:
          "doctor_id, appointment_date, and appointment_time are required.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date) || isNaN(new Date(appointment_date).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid appointment_date format. Use YYYY-MM-DD." });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(appointment_date) < today) {
      return res.status(400).json({ success: false, message: "Appointment date cannot be in the past." });
    }

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found." });
    }

    // Enforce doctor's daily appointment limit
    const [[settings]] = await pool.query(
      "SELECT appointment_limit FROM daily_doctor_settings WHERE doctor_id = ? AND date = ?",
      [doctor_id, appointment_date],
    );
    const limit = settings?.appointment_limit ?? 10;
    const [[{ booked }]] = await pool.query(
      `SELECT COUNT(*) AS booked FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status IN ('pending','confirmed')`,
      [doctor_id, appointment_date],
    );
    if (booked >= limit) {
      return res.status(409).json({
        success: false,
        message: "This doctor has no available appointment slots for that date.",
      });
    }

    const appointment = await Appointment.create({
      patient_id: patient.patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
      notes,
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    console.error("createAppointment error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/appointments/:id/status — update appointment status */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }

    // Doctors can only update appointments assigned to them
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findByUserId(req.user.user_id);
      if (!doctor || appointment.doctor_id !== doctor.doctor_id) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized to update this appointment." });
      }
    }

    const updated = await Appointment.updateStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getMyAppointments,
  getAllAppointments,
  getMyDoctorAppointments,
  createAppointment,
  updateAppointmentStatus,
};

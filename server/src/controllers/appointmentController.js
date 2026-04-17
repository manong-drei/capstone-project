const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

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
    const updated = await Appointment.updateStatus(req.params.id, status);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getMyAppointments,
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
};

const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const pool = require("../config/db");
const DoctorLeave = require("../models/DoctorLeave");
const { clinicToday, validDate } = require("../utils/clinicDate");
const { parsePagination } = require("../utils/pagination");
const audit = require("../services/auditLog");

const httpError = (status, message) => Object.assign(new Error(message), { status });

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
    const { page: requestedPage, limit } = parsePagination(req.query);
    const summary = await Appointment.getSummary();
    const totalPages = Math.max(1, Math.ceil(summary.total / limit));
    const page = Math.min(requestedPage, totalPages);
    const appointments = await Appointment.findAll({ limit, offset: (page - 1) * limit });
    await audit.bestEffort(req, { action: 'patient.history_viewed', target_type: 'patient_history' });
    res.json({
      success: true, count: appointments.length, data: appointments, summary,
      pagination: { page, limit, total: summary.total, totalPages },
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
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

    if (!validDate(appointment_date)) {
      return res.status(400).json({ success: false, message: "Invalid appointment_date format. Use YYYY-MM-DD." });
    }
    if (appointment_date < clinicToday()) {
      return res.status(400).json({ success: false, message: "Appointment date cannot be in the past." });
    }

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Use the call-next lock so booking and the first call have one cutoff.
      await Queue.lockCategory('dental', connection);
      if (await Queue.hasDentalQueueStarted(appointment_date, connection)) {
        throw httpError(409, Queue.REGISTRATION_CLOSED_MESSAGE);
      }
      const [[doctor]] = await connection.query(
        "SELECT doctor_id FROM doctors WHERE doctor_id = ? FOR UPDATE",
        [doctor_id],
      );
      if (!doctor) throw httpError(404, "Doctor not found.");
      await DoctorLeave.assertAvailable(doctor_id, appointment_date, connection);

      const [[settings]] = await connection.query(
        `SELECT appointment_limit, is_available FROM daily_doctor_settings
         WHERE doctor_id = ? AND date = ?`,
        [doctor_id, appointment_date],
      );
      if (settings?.is_available === 0) {
        throw httpError(409, "This doctor is unavailable for that date.");
      }

      const [[{ booked }]] = await connection.query(
        `SELECT COUNT(*) AS booked FROM appointments
         WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
        [doctor_id, appointment_date],
      );
      if (booked >= (settings?.appointment_limit ?? 10)) {
        throw httpError(409, "This doctor has no available appointment slots for that date.");
      }

      const appointment = await Appointment.create({
        patient_id: patient.patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason,
        notes,
      }, connection);
      await connection.commit();
      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("createAppointment error:", err);
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
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

    const updated = await Appointment.updateStatus(req.params.id, status, req);
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

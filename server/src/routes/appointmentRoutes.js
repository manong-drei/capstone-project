const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {
  getMyAppointments,
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

// GET /api/appointments/me — patient's own appointments
router.get("/me", authenticate, authorize("patient"), getMyAppointments);

// GET /api/appointments — admin/staff sees all
router.get("/", authenticate, authorize("admin", "staff"), getAllAppointments);

// POST /api/appointments — patient books an appointment
router.post("/", authenticate, authorize("patient"), createAppointment);

// PATCH /api/appointments/:id/status
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "staff", "doctor"),
  updateAppointmentStatus,
);

module.exports = router;

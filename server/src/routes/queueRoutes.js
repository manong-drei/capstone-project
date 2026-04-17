const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {
  getAll,
  getMyQueue,
  createQueue,
  callNext,
  updateStatus,
  cancelQueue,
  createWalkIn,
} = require("../controllers/queueController");

// GET /api/queue/me — must be defined before /:id routes
router.get("/me", authenticate, authorize("patient"), getMyQueue);

// GET /api/queue — staff/doctor/admin view all today's active queues
router.get("/", authenticate, authorize("staff", "doctor", "admin"), getAll);

// POST /api/queue — patient gets a queue number
router.post("/", authenticate, authorize("patient"), createQueue);

// POST /api/queue/call-next — used by DoctorDashboard
router.post("/call-next", authenticate, authorize("staff", "doctor"), callNext);

// POST /api/queue/next — alias used by StaffDashboard
router.post("/next", authenticate, authorize("staff", "doctor"), callNext);

// POST /api/queue/walkin — staff creates a walk-in entry
router.post("/walkin", authenticate, authorize("staff", "admin"), createWalkIn);

// PATCH /api/queue/:id/status
router.patch(
  "/:id/status",
  authenticate,
  authorize("staff", "doctor", "admin"),
  updateStatus,
);

// PATCH /api/queue/:id/cancel
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("patient", "staff", "admin"),
  cancelQueue,
);

module.exports = router;

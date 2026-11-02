const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  getDoctorRecords,
  getPatientHistory,
  getConsultation,
  createConsultation,
  getDailySettings,
  upsertDailySettings,
  getAnalytics,
  getDailyReport,
  saveDailyReport,
  getMonthlyReport,
  getReport,
} = require("../controllers/doctorController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const leave = require('../controllers/doctorLeaveController');

router.get('/leave-requests', authenticate, authorize('doctor'), leave.listOwn);
router.post('/leave-requests', authenticate, authorize('doctor'), leave.requestLeave);
router.patch('/leave-requests/:id/withdraw', authenticate, authorize('doctor'), leave.withdraw);

router.get("/", authenticate, getAllDoctors);
router.get(
  "/daily-settings",
  authenticate,
  authorize("doctor"),
  getDailySettings,
);
router.put(
  "/daily-settings",
  authenticate,
  authorize("doctor"),
  upsertDailySettings,
);
router.get("/analytics", authenticate, authorize("doctor"), getAnalytics);
router.get("/report", authenticate, authorize("doctor"), getReport);
router.get("/daily-report", authenticate, authorize("doctor"), getDailyReport);
router.put("/daily-report", authenticate, authorize("doctor"), saveDailyReport);
router.get("/monthly-report", authenticate, authorize("doctor"), getMonthlyReport);
router.get("/patient-history", authenticate, authorize("doctor"), getPatientHistory);
router.get("/consultations/:id", authenticate, authorize("doctor"), getConsultation);
router.post(
  "/consultations",
  authenticate,
  authorize("doctor"),
  createConsultation,
);
router.get("/:id/records", authenticate, authorize("admin"), getDoctorRecords);
router.get("/:id", authenticate, getDoctorById);

module.exports = router;

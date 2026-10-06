const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createConsultation,
  getDailySettings,
  upsertDailySettings,
  getAnalytics,
  getDailyReport,
  saveDailyReport,
  getMonthlyReport,
} = require("../controllers/doctorController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

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
router.get("/daily-report", authenticate, authorize("doctor"), getDailyReport);
router.put("/daily-report", authenticate, authorize("doctor"), saveDailyReport);
router.get("/monthly-report", authenticate, authorize("doctor"), getMonthlyReport);
router.post(
  "/consultations",
  authenticate,
  authorize("doctor"),
  createConsultation,
);
router.get("/:id", authenticate, getDoctorById);

module.exports = router;

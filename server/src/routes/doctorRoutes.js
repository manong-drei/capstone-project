const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createConsultation,
  getDailySettings,
  upsertDailySettings,
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
router.post(
  "/consultations",
  authenticate,
  authorize("doctor"),
  createConsultation,
);
router.get("/:id", authenticate, getDoctorById);

module.exports = router;

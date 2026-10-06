const express = require("express");
const router = express.Router();

// Controllers
const {
  getMyProfile,
  updateProfile,
  getPatientById,
  searchPatients,
  mergePatient,
} = require("../controllers/patientController");

// Middleware
const protect = require("../middleware/authenticate"); // direct import
const authorize = require("../middleware/authorize"); // direct import

// Routes

// Get patient profile (protected, only "patient" role)
router.get("/me", protect, authorize("patient"), getMyProfile);

// Update patient profile (protected, only "patient" role)
router.put("/me", protect, authorize("patient"), updateProfile);

router.get("/search", protect, authorize("staff", "admin"), searchPatients);
router.get("/:id", protect, authorize("staff", "admin"), getPatientById);
router.post("/:id/merge", protect, authorize("staff", "admin"), mergePatient);

module.exports = router;

const express = require("express");
const router = express.Router();

// Controllers
const {
  getMyProfile,
  updateProfile,
} = require("../controllers/patientController");

// Middleware
const protect = require("../middleware/authenticate"); // direct import
const authorize = require("../middleware/authorize"); // direct import

// Routes

// Get patient profile (protected, only "patient" role)
router.get("/me", protect, authorize("patient"), getMyProfile);

// Update patient profile (protected, only "patient" role)
router.put("/me", protect, authorize("patient"), updateProfile);

module.exports = router;

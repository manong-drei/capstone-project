const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Controllers
const {
  getMyProfile,
  updateProfile,
  getPatientById,
  searchPatients,
  mergePatient,
  recoverAccount,
} = require("../controllers/patientController");

// Middleware
const protect = require("../middleware/authenticate"); // direct import
const authorize = require("../middleware/authorize"); // direct import

const requireRecoverySession = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.devBypass || req.user.purpose !== "session" || !Number.isSafeInteger(req.user.user_id) || req.user.user_id < 1) {
    return res.status(403).json({ success: false, message: "Log in with a real staff or admin account to recover a patient account." });
  }
  next();
};
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user.user_id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many recovery requests. Please try again in 15 minutes." },
});

// Routes

// Get patient profile (protected, only "patient" role)
router.get("/me", protect, authorize("patient"), getMyProfile);

// Update patient profile (protected, only "patient" role)
router.put("/me", protect, authorize("patient"), updateProfile);

router.get("/search", protect, authorize("staff", "admin"), searchPatients);
router.get("/:id", protect, authorize("staff", "admin"), getPatientById);
router.post("/:id/merge", protect, authorize("staff", "admin"), mergePatient);
router.post("/:id/account-recovery", protect, authorize("staff", "admin"), requireRecoverySession, recoveryLimiter, recoverAccount);

module.exports = router;

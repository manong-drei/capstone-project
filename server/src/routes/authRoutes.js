const express = require("express");
const router = express.Router();

// Controllers
const {
  login,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

// Middleware (direct import)
const protect = require("../middleware/authenticate"); // <-- changed here
const requireProfileSession = require("../middleware/requireProfileSession");
const rateLimit = require('express-rate-limit');
const recovery = require('../controllers/passwordRecoveryController');
const recoveryLimit = max => rateLimit({
  windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many recovery attempts. Please try again in 15 minutes.' },
});

// Routes
router.post("/login", login);
router.post('/password-recovery/request', recoveryLimit(10), recovery.request);
router.post('/password-recovery/verify', recoveryLimit(20), recovery.verify);
router.post('/password-recovery/reset', recoveryLimit(10), recovery.reset);
router.get("/me", protect, getMe); // now 'protect' is defined
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, requireProfileSession, updateProfile);
router.patch("/change-password", protect, changePassword);

module.exports = router;

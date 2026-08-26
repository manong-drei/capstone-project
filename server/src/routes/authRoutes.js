const express = require("express");
const router = express.Router();

// Controllers
const {
  login,
  getMe,
  getProfile,
  changePassword,
} = require("../controllers/authController");

// Middleware (direct import)
const protect = require("../middleware/authenticate"); // <-- changed here

// Routes
router.post("/login", login);
router.get("/me", protect, getMe); // now 'protect' is defined
router.get("/profile", protect, getProfile);
router.patch("/change-password", protect, changePassword);

module.exports = router;

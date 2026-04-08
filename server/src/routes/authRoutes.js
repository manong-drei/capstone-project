const express = require("express");
const router = express.Router();

// Controllers
const { register, login, getMe } = require("../controllers/authController");

// Middleware (direct import)
const protect = require("../middleware/authenticate"); // <-- changed here

// Routes
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); // now 'protect' is defined

module.exports = router;

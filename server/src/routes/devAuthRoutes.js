/**
 * devAuthRoutes.js – Development-Only Auth Routes
 * E-KALUSUGAN Backend
 *
 * Exposes POST /api/auth/dev-login which returns a signed JWT
 * for a mock user of the requested role. The JWT is real and
 * identical in structure to a production token, so AuthContext
 * and all protected routes work normally after bypass login.
 *
 * This entire router is disabled (404) when NODE_ENV !== 'development'.
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const DEV_USERS = {
  patient: {
    id: 1,
    fullName: "Dev Patient",
    email: "devpatient@ekalusugan.dev",
    role: "patient",
  },
  doctor: {
    id: 2,
    fullName: "Dr. Dev Doctor",
    email: "devdoctor@ekalusugan.dev",
    role: "doctor",
  },
  staff: {
    id: 3,
    fullName: "Dev Staff",
    email: "devstaff@ekalusugan.dev",
    role: "staff",
  },
  admin: {
    id: 4,
    fullName: "Dev Admin",
    email: "devadmin@ekalusugan.dev",
    role: "admin",
  },
};

/**
 * POST /api/auth/dev-login
 * Body: { role: "patient" | "doctor" | "staff" | "admin" }
 * Returns: { token, user }
 */
router.post("/dev-login", (req, res) => {
  // ── Guard ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "development") {
    return res
      .status(404)
      .json({ success: false, message: "Route not found." });
  }

  const { role } = req.body;
  const mockUser = DEV_USERS[role?.toLowerCase()];

  if (!mockUser) {
    return res.status(400).json({
      success: false,
      message: `Invalid role "${role}". Valid values: patient, doctor, staff, admin.`,
    });
  }

  // Issue a real JWT (same structure as authController.login)
  const token = jwt.sign(
    { user_id: mockUser.id, role: mockUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  );

  console.log(`[DEV LOGIN] Issued token for role: ${mockUser.role}`);

  res.json({
    success: true,
    token,
    user: mockUser,
  });
});

module.exports = router;

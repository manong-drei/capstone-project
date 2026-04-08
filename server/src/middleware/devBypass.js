/**
 * devBypass.js – Development-Only Authentication Bypass
 * E-KALUSUGAN Backend Middleware
 *
 * HOW IT WORKS:
 *   In development mode, any request that includes the header:
 *     x-dev-role: patient | doctor | staff | admin
 *   ...will be treated as an authenticated user with that role,
 *   skipping JWT verification entirely.
 *
 * SAFETY:
 *   This middleware does NOTHING when NODE_ENV is not "development".
 *   It is completely inert in staging and production environments.
 */

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
 * devBypass middleware
 *
 * Mount this BEFORE your authenticate middleware in server.js.
 * If the bypass applies, it sets req.user and calls next().
 * If the bypass does not apply, it also calls next() — letting
 * the normal authenticate middleware handle the request.
 */
function devBypass(req, res, next) {
  // ── Guard: only active in development ─────────────────────────────────
  if (process.env.NODE_ENV !== "development") {
    return next();
  }

  const requestedRole = req.headers["x-dev-role"];

  // No bypass header — fall through to normal auth
  if (!requestedRole) {
    return next();
  }

  const mockUser = DEV_USERS[requestedRole.toLowerCase()];

  // Unknown role value — reject clearly
  if (!mockUser) {
    return res.status(400).json({
      success: false,
      message: `[DEV BYPASS] Unknown role "${requestedRole}". Valid values: patient, doctor, staff, admin.`,
    });
  }

  // Inject mock user and mark as bypassed for logging
  req.user = mockUser;
  req.devBypass = true;

  console.log(
    `[DEV BYPASS] Authenticated as ${mockUser.role} (${mockUser.fullName})`,
  );
  next();
}

module.exports = devBypass;

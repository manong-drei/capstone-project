const jwt = require("jsonwebtoken");
const User = require("../models/User");
const audit = require("../services/auditLog");

module.exports = async (req, res, next) => {
  // devBypass already authenticated this request in development mode.
  if (req.devBypass) {
    await audit.setActor(req, req.user, true);
    return next();
  }

  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided." });
  }
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      code: expired ? "SESSION_EXPIRED" : "SESSION_REVOKED",
      message: expired ? "Session expired. Please log in again." : "Invalid session. Please log in again.",
    });
  }
  try {
    if (
      process.env.NODE_ENV === "development" &&
      req.user.purpose === "development" &&
      ["patient", "doctor", "staff", "admin"].includes(req.user.role)
    ) {
      await audit.setActor(req, req.user, true);
      return next();
    }
    const user = await User.findById(req.user.user_id);
    if (
      !user ||
      !user.is_active ||
      user.credential_version !== req.user.credential_version ||
      !["session", "password_setup"].includes(req.user.purpose)
    ) {
      return res
        .status(401)
        .json({
          success: false,
          code: "SESSION_REVOKED",
          message: "This session is no longer active. Please log in again.",
        });
    }
    req.user.role = user.role;
    req.user.phone = user.phone;
    await audit.setActor(req, user);
    const setup = req.user.purpose === "password_setup";
    if (user.must_change_password || setup) {
      const allowed =
        (req.method === "PATCH" && req.path === "/change-password") ||
        (req.method === "GET" && req.path === "/me");
      if (!user.must_change_password || !setup || !allowed) {
        return res
          .status(403)
          .json({
            success: false,
            ...(!setup && { code: "SESSION_REVOKED" }),
            message: "Change your temporary password before continuing.",
          });
      }
    }
    next();
  } catch {
    res
      .status(503)
      .json({ success: false, code: "AUTH_UNAVAILABLE", message: "Unable to verify your session right now. Please try again." });
  }
};

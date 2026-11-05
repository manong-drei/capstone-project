module.exports = (req, res, next) => {
  if (req.devBypass || req.user.purpose !== "session" || !Number.isSafeInteger(req.user.user_id) || req.user.user_id < 1) {
    return res.status(403).json({ success: false, message: "Log in with your account to update your profile." });
  }
  next();
};

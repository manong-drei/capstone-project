/**
 * authController.js – Register, Login, and GetMe
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");

/** POST /api/auth/register */
const register = async (req, res) => {
  try {
    const { username, phone, password, role, confirmPassword, ...profileData } =
      req.body;

    const existing = await User.findByPhone(phone);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already registered." });
    }

    const user_id = await User.create({
      username,
      phone,
      password,
      role: "patient",
    });

    await Patient.create({ user_id, ...profileData, phone });

    res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user_id,
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration." });
  }
};

/** POST /api/auth/login */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findByUsername(username);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password." });
    }

    const isMatch = await User.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { user_id: user.user_id, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};

/** GET /api/auth/me  (protected) */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe };

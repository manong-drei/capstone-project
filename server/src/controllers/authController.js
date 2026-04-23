/**
 * authController.js – Register, Login, and GetMe
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const pool = require("../config/db");
const { normalizePhilippineMobilePhone } = require("../utils/phone");

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  staff: "Staff",
  admin: "Administrator",
};

const pickFirst = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const buildDisplayName = (row) => {
  if (!row) return "User";

  const fullName = pickFirst(row.full_name, row.dev_full_name);
  if (fullName) return fullName;

  const firstName = pickFirst(row.first_name);
  const lastName = pickFirst(row.last_name);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  return pickFirst(row.username, ROLE_LABELS[row.role], "User");
};

const normalizeProfile = (row) => ({
  user_id: row.user_id,
  role: row.role,
  display_name: buildDisplayName(row),
  first_name: pickFirst(row.first_name),
  last_name: pickFirst(row.last_name),
  full_name: pickFirst(row.full_name, row.dev_full_name),
  username: pickFirst(row.username),
  phone: pickFirst(
    row.profile_contact_number,
    row.user_phone,
    row.phone,
  ),
  email: pickFirst(row.email, row.dev_email),
  position: pickFirst(row.position),
  specialization_name: pickFirst(row.specialization_name),
  license_number: pickFirst(row.license_number),
  barangay: pickFirst(row.barangay),
  city: pickFirst(row.city),
});

/** POST /api/auth/register */
const register = async (req, res) => {
  try {
    const { username, phone, password, role, confirmPassword, ...profileData } =
      req.body;
    const normalizedPhone = normalizePhilippineMobilePhone(phone);

    if (!username || !phone || !password) {
      return res.status(400).json({ success: false, message: "username, phone, and password are required." });
    }
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number." });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res
        .status(409)
        .json({ success: false, message: "Username is already taken." });
    }

    const existing = await User.findByPhone(normalizedPhone);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already registered." });
    }

    const user_id = await User.create({
      username,
      phone: normalizedPhone,
      password,
      role: "patient",
    });

    await Patient.create({ user_id, ...profileData, phone: normalizedPhone });

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
      user: { user_id: user.user_id, phone: user.phone, role: user.role, username: user.username },
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

/** GET /api/auth/profile (protected) */
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          u.user_id,
          u.role,
          u.username,
          u.phone AS user_phone,
          u.email,
          p.full_name AS patient_full_name,
          p.contact_number AS patient_contact_number,
          p.barangay AS patient_barangay,
          p.city AS patient_city,
          d.first_name AS doctor_first_name,
          d.last_name AS doctor_last_name,
          d.contact_number AS doctor_contact_number,
          d.license_number,
          sp.specialization_name,
          st.first_name AS staff_first_name,
          st.last_name AS staff_last_name,
          st.position,
          st.contact_number AS staff_contact_number
        FROM users u
        LEFT JOIN patients p
          ON u.user_id = p.user_id
        LEFT JOIN doctors d
          ON u.user_id = d.user_id
        LEFT JOIN specializations sp
          ON d.specialization_id = sp.specialization_id
        LEFT JOIN staff st
          ON u.user_id = st.user_id
        WHERE u.user_id = ?
        LIMIT 1
      `,
      [req.user.user_id],
    );

    const row = rows[0];
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const shapedRow = {
      ...row,
      full_name:
        row.role === "patient"
          ? row.patient_full_name
          : null,
      first_name:
        row.role === "doctor"
          ? row.doctor_first_name
          : row.role === "staff" || row.role === "admin"
            ? row.staff_first_name
            : null,
      last_name:
        row.role === "doctor"
          ? row.doctor_last_name
          : row.role === "staff" || row.role === "admin"
            ? row.staff_last_name
            : null,
      profile_contact_number:
        row.role === "patient"
          ? row.patient_contact_number
          : row.role === "doctor"
            ? row.doctor_contact_number
            : row.role === "staff" || row.role === "admin"
              ? row.staff_contact_number
              : null,
      barangay: row.role === "patient" ? row.patient_barangay : null,
      city: row.role === "patient" ? row.patient_city : null,
    };

    res.status(200).json({
      success: true,
      data: normalizeProfile(shapedRow),
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe, getProfile };

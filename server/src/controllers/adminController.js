const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const Queue = require("../models/Queue");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Staff = require("../models/Staff");

/** GET /api/admin/overview — live stats for the admin dashboard */
const getOverview = async (req, res) => {
  try {
    const [[patientRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM patients",
    );
    const [[doctorRow]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM   doctors d
      JOIN   users u ON d.user_id = u.user_id
      WHERE  u.is_active = 1
    `);

    const queueStats = await Queue.getTodayStats();
    const appointmentCount = await Appointment.countToday();

    res.json({
      success: true,
      totalPatients: patientRow.count,
      activeQueues: queueStats.activeQueues ?? 0,
      doneToday: queueStats.doneToday ?? 0,
      priorityServed: queueStats.priorityServed ?? 0,
      doctorsOnDuty: doctorRow.count,
      appointments: appointmentCount,
    });
  } catch (err) {
    console.error("getOverview error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/admin/staff */
const getStaff = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.user_id, u.email, u.role, u.is_active,
             d.first_name, d.last_name
      FROM   users u
      JOIN   doctors d ON u.user_id = d.user_id
      WHERE  u.role = 'doctor' AND u.is_active = 1

      UNION ALL

      SELECT u.user_id, u.email, u.role, u.is_active,
             s.first_name, s.last_name
      FROM   users u
      JOIN   staff s ON u.user_id = s.user_id
      WHERE  u.role IN ('staff', 'admin') AND u.is_active = 1

      ORDER BY last_name ASC
    `);

    res.json({ success: true, staff: rows });
  } catch (err) {
    console.error("getStaff error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/admin/staff */
const createStaff = async (req, res) => {
  try {
    const {
      username, first_name, last_name, email, phone, password, role,
      license_number, specialization_id, position,
    } = req.body;

    if (!username || !first_name || !last_name || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    if (role === 'doctor' && !license_number) {
      return res.status(400).json({ success: false, message: "License number is required for doctors." });
    }

    if (role === 'staff' && !position) {
      return res.status(400).json({ success: false, message: "Position is required for staff." });
    }

    // Check duplicates
    const [[existingPhone]] = await pool.query(
      "SELECT user_id FROM users WHERE phone = ?", [phone]
    );
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "Phone number already in use." });
    }

    const [[existingUsername]] = await pool.query(
      "SELECT user_id FROM users WHERE username = ?", [username]
    );
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username already in use." });
    }

    // Create user
    const password_hash = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (username, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email || null, phone, password_hash, role]
    );
    const user_id = userResult.insertId;

    // Create role-specific profile
    if (role === 'doctor') {
      await Doctor.create({
        user_id,
        first_name,
        last_name,
        license_number,
        specialization_id: specialization_id || null,
        contact_number: phone,
      });
    } else {
      // staff and admin both go into the staff table
      await Staff.create({
        user_id,
        first_name,
        last_name,
        position: role === 'admin' ? 'Administrator' : position,
        contact_number: phone,
      });
    }

    res.status(201).json({ success: true, message: "Staff account created.", user_id });
  } catch (err) {
    console.error("createStaff error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/admin/staff/:user_id/deactivate */
const deactivateStaff = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?", [user_id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === 'admin' && user.user_id === req.user.user_id) {
      return res.status(403).json({ success: false, message: "You cannot deactivate your own account." });
    }

    await pool.query(
      "UPDATE users SET is_active = 0 WHERE user_id = ?", [user_id]
    );

    res.json({ success: true, message: "Staff account deactivated." });
  } catch (err) {
    console.error("deactivateStaff error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/admin/specializations */
const getSpecializations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT specialization_id, specialization_name FROM specializations ORDER BY specialization_name ASC"
    );
    res.json({ success: true, specializations: rows });
  } catch (err) {
    console.error("getSpecializations error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getOverview, getStaff, createStaff, deactivateStaff, getSpecializations };
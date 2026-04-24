const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const Queue = require("../models/Queue");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Staff = require("../models/Staff");
const { normalizePhilippineMobilePhone } = require("../utils/phone");

/** GET /api/admin/overview — live stats for the admin dashboard */
const getOverview = async (req, res) => {
  try {
    const [[patientRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM queues WHERE DATE(created_at) = CURDATE()",
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
      SELECT u.user_id, u.email, u.phone, u.role, u.is_active,
             d.first_name, d.last_name,
             d.license_number, d.specialization_id
      FROM   users u
      JOIN   doctors d ON u.user_id = d.user_id
      WHERE  u.role = 'doctor'

      UNION ALL

      SELECT u.user_id, u.email, u.phone, u.role, u.is_active,
             s.first_name, s.last_name,
             NULL AS license_number, NULL AS specialization_id
      FROM   users u
      JOIN   staff s ON u.user_id = s.user_id
      WHERE  u.role IN ('staff', 'admin')

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
      license_number, position,
    } = req.body;
    const normalizedPhone = normalizePhilippineMobilePhone(phone);

    if (!username || !first_name || !last_name || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
      });
    }

    if (!['doctor', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Must be doctor, staff, or admin." });
    }

    if (role === 'doctor' && !license_number) {
      return res.status(400).json({ success: false, message: "License number is required for doctors." });
    }

    if (role === 'staff' && !position) {
      return res.status(400).json({ success: false, message: "Position is required for staff." });
    }

    // Check duplicates
    const [[existingPhone]] = await pool.query(
      "SELECT user_id FROM users WHERE phone = ?", [normalizedPhone]
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

    if (email) {
      const [[existingEmail]] = await pool.query(
        "SELECT user_id FROM users WHERE email = ?", [email]
      );
      if (existingEmail) {
        return res.status(409).json({ success: false, message: "Email address already in use." });
      }
    }

    // Use a transaction so user row is rolled back if profile insert fails
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const password_hash = await bcrypt.hash(password, 10);
      const [userResult] = await conn.query(
        `INSERT INTO users (username, email, phone, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
        [username, email || null, normalizedPhone, password_hash, role]
      );
      const user_id = userResult.insertId;

      if (role === 'doctor') {
        await conn.query(
          `INSERT INTO doctors (user_id, specialization_id, first_name, last_name, license_number, contact_number)
           VALUES (?, NULL, ?, ?, ?, ?)`,
          [user_id, first_name, last_name, license_number, normalizedPhone]
        );
      } else {
        await conn.query(
          `INSERT INTO staff (user_id, first_name, last_name, position, contact_number)
           VALUES (?, ?, ?, ?, ?)`,
          [user_id, first_name, last_name, role === 'admin' ? 'Administrator' : position, normalizedPhone]
        );
      }

      await conn.commit();
      res.status(201).json({ success: true, message: "Staff account created.", user_id });
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("createStaff error:", err);
    // Surface readable message for known MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: "A duplicate value was found. Check username, email, phone, or license number." });
    }
    if (err.code === 'ER_NO_DEFAULT_FOR_FIELD' || err.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ success: false, message: `Missing required field: ${err.sqlMessage}` });
    }
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ success: false, message: `Database schema error: ${err.sqlMessage}` });
    }
    res.status(500).json({ success: false, message: err.sqlMessage || "Server error." });
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

/** PATCH /api/admin/staff/:user_id/reactivate */
const reactivateStaff = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?", [user_id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await pool.query(
      "UPDATE users SET is_active = 1 WHERE user_id = ?", [user_id]
    );

    res.json({ success: true, message: "Staff account reactivated." });
  } catch (err) {
    console.error("reactivateStaff error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/admin/staff/:user_id */
const updateStaff = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { first_name, last_name, email, phone, license_number, position } = req.body;

    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?", [user_id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (email || phone) {
        let normalizedPhone = phone;
        if (phone) {
          normalizedPhone = normalizePhilippineMobilePhone(phone);
          if (!normalizedPhone) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ success: false, message: "Invalid Philippine mobile phone number." });
          }
        }
        const fields = [];
        const vals = [];
        if (email) { fields.push("email = ?"); vals.push(email); }
        if (phone) { fields.push("phone = ?"); vals.push(normalizedPhone); }
        vals.push(user_id);
        await conn.query(`UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`, vals);
      }

      if (user.role === 'doctor') {
        const docFields = [];
        const docVals = [];
        if (first_name) { docFields.push("first_name = ?"); docVals.push(first_name); }
        if (last_name) { docFields.push("last_name = ?"); docVals.push(last_name); }
        if (license_number) { docFields.push("license_number = ?"); docVals.push(license_number); }
        if (docFields.length) {
          docVals.push(user_id);
          await conn.query(`UPDATE doctors SET ${docFields.join(", ")} WHERE user_id = ?`, docVals);
        }
      } else {
        const staffFields = [];
        const staffVals = [];
        if (first_name) { staffFields.push("first_name = ?"); staffVals.push(first_name); }
        if (last_name) { staffFields.push("last_name = ?"); staffVals.push(last_name); }
        if (position && user.role !== 'admin') { staffFields.push("position = ?"); staffVals.push(position); }
        if (staffFields.length) {
          staffVals.push(user_id);
          await conn.query(`UPDATE staff SET ${staffFields.join(", ")} WHERE user_id = ?`, staffVals);
        }
      }

      await conn.commit();
      res.json({ success: true, message: "Staff account updated." });
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("updateStaff error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: "Email or phone already in use." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/admin/patients */
const getPatients = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.user_id, u.email, u.phone, u.is_active,
             p.patient_id, p.full_name, p.contact_number,
             p.barangay, p.city, p.gender, p.age
      FROM   users u
      JOIN   patients p ON u.user_id = p.user_id
      WHERE  u.role = 'patient'
      ORDER BY p.full_name ASC
    `);
    res.json({ success: true, patients: rows });
  } catch (err) {
    console.error("getPatients error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/admin/patients/:user_id/deactivate */
const deactivatePatient = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'patient'", [user_id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    await pool.query("UPDATE users SET is_active = 0 WHERE user_id = ?", [user_id]);
    res.json({ success: true, message: "Patient account deactivated." });
  } catch (err) {
    console.error("deactivatePatient error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/admin/patients/:user_id/reactivate */
const reactivatePatient = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'patient'", [user_id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    await pool.query("UPDATE users SET is_active = 1 WHERE user_id = ?", [user_id]);
    res.json({ success: true, message: "Patient account reactivated." });
  } catch (err) {
    console.error("reactivatePatient error:", err);
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

module.exports = {
  getOverview,
  getStaff, createStaff, deactivateStaff, reactivateStaff, updateStaff,
  getPatients, deactivatePatient, reactivatePatient,
  getSpecializations,
};

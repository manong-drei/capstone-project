const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const Queue = require("../models/Queue");
const User = require("../models/User");
const { normalizePhilippineMobilePhone } = require("../utils/phone");
const { normalizeSuffix, normalizeMiddleName } = require("../utils/name");
const { enqueuePassword, wakeWorker } = require('../services/smsNotifications');
const { parsePagination } = require("../utils/pagination");

/** GET /api/admin/overview — live stats for the admin dashboard */
const getOverview = async (req, res) => {
  try {
    const [[patientRow]] = await pool.query("SELECT COUNT(*) AS count FROM queues");
    const [[doctorRow]] = await pool.query("SELECT COUNT(*) AS count FROM doctors");

    const queueStats = await Queue.getTodayStats();
    const [[{ count: totalAppointments }]] = await pool.query("SELECT COUNT(*) AS count FROM appointments");
    const [[{ count: completedQueues }]] = await pool.query("SELECT COUNT(*) AS count FROM queues WHERE status = 'done'");
    const [dentalAgeGroups] = await pool.query(`
      SELECT CASE
        WHEN COALESCE(p.date_of_birth, q.walk_in_dob) IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 1 THEN '0–11 months'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 5 THEN '1–4 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 10 THEN '5–9 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 15 THEN '10–14 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 20 THEN '15–19 years'
        WHEN TIMESTAMPDIFF(YEAR, COALESCE(p.date_of_birth, q.walk_in_dob), q.created_at) < 60 THEN '20–59 years'
        ELSE '60+ years'
      END AS age_group, COUNT(*) AS count
      FROM queues q
      LEFT JOIN patients p ON p.patient_id = q.patient_id
      WHERE q.category = 'dental'
      GROUP BY age_group
    `);
    const [volumeDaily] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count
      FROM queues
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 MONTH)
      GROUP BY day
      ORDER BY day
    `);

    res.json({
      success: true,
      totalPatients: patientRow.count,
      totalDoctors: doctorRow.count,
      totalAppointments,
      completedQueues,
      dentalAgeGroups,
      volumeDaily,
      activeQueues: queueStats.activeQueues ?? 0,
      waiting: queueStats.waiting ?? 0,
      serving: queueStats.serving ?? 0,
      cancelled: queueStats.cancelled ?? 0,
      doneToday: queueStats.doneToday ?? 0,
      priorityServed: queueStats.priorityServed ?? 0,
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
             d.first_name, d.middle_name, d.last_name, d.suffix,
             d.license_number, d.specialization_id
      FROM   users u
      JOIN   doctors d ON u.user_id = d.user_id
      WHERE  u.role = 'doctor'

      UNION ALL

      SELECT u.user_id, u.email, u.phone, u.role, u.is_active,
             s.first_name, s.middle_name, s.last_name, s.suffix,
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
      first_name,
      middle_name,
      last_name,
      suffix,
      email,
      phone,
      password,
      role,
      license_number,
      specialization_id,
      position,
    } = req.body;
    const normalizedSuffix = normalizeSuffix(suffix);
    const normalizedMiddleName = normalizeMiddleName(middle_name);

    if (!first_name || !last_name || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

    // Normalize the phone number FIRST
    const normalizedPhone = normalizePhilippineMobilePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
      });
    }

    if (!["doctor", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be doctor, staff, or admin.",
      });
    }

    if (role === "doctor" && !license_number) {
      return res.status(400).json({
        success: false,
        message: "License number is required for doctors.",
      });
    }

    if (role === "staff" && !position) {
      return res
        .status(400)
        .json({ success: false, message: "Position is required for staff." });
    }

    // Check duplicates using the NORMALIZED phone
    const [[existingPhone]] = await pool.query(
      "SELECT user_id FROM users WHERE phone = ?",
      [normalizedPhone],
    );
    if (existingPhone) {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already in use." });
    }

    if (email) {
      const [[existingEmail]] = await pool.query(
        "SELECT user_id FROM users WHERE email = ?",
        [email],
      );
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "Email address already in use." });
      }
    }

    // Use a transaction so user row is rolled back if profile insert fails
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const password_hash = await bcrypt.hash(password, 10);
      const [userResult] = await conn.query(
        `INSERT INTO users (email, phone, password_hash, role, must_change_password)
         VALUES (?, ?, ?, ?, 0)`,
        [email || null, normalizedPhone, password_hash, role],
      );
      const user_id = userResult.insertId;

      if (role === "doctor") {
        await conn.query(
          `INSERT INTO doctors (user_id, specialization_id, first_name, middle_name, last_name, suffix, license_number, contact_number)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
          [user_id, first_name, normalizedMiddleName, last_name, normalizedSuffix, license_number, normalizedPhone],
        );
      } else {
        await conn.query(
          `INSERT INTO staff (user_id, first_name, middle_name, last_name, suffix, position, contact_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            first_name,
            normalizedMiddleName,
            last_name,
            normalizedSuffix,
            role === "admin" ? "Administrator" : position,
            normalizedPhone,
          ],
        );
      }

      await conn.commit();
      res
        .status(201)
        .json({ success: true, message: "Staff account created.", user_id });
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("createStaff error:", err);
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "A duplicate value was found. Check phone, email, or license number.",
      });
    }
    if (
      err.code === "ER_NO_DEFAULT_FOR_FIELD" ||
      err.code === "ER_BAD_NULL_ERROR"
    ) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${err.sqlMessage}`,
      });
    }
    if (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        success: false,
        message: `Database schema error: ${err.sqlMessage}`,
      });
    }
    res
      .status(500)
      .json({ success: false, message: err.sqlMessage || "Server error." });
  }
};

/** PATCH /api/admin/staff/:user_id/deactivate */
const deactivateStaff = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?",
      [user_id],
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.role === "admin" && user.user_id === req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    await pool.query("UPDATE users SET is_active = 0 WHERE user_id = ?", [
      user_id,
    ]);

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
      "SELECT user_id, role FROM users WHERE user_id = ?",
      [user_id],
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    await pool.query("UPDATE users SET is_active = 1 WHERE user_id = ?", [
      user_id,
    ]);

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
    const { first_name, middle_name, last_name, suffix, email, phone, license_number, position } =
      req.body;
    const normalizedSuffix = normalizeSuffix(suffix);
    const normalizedMiddleName = normalizeMiddleName(middle_name);
    const normalizedPhone = phone ? normalizePhilippineMobilePhone(phone) : null;
    if (phone && !normalizedPhone) {
      return res.status(400).json({ success: false, message: "Invalid Philippine mobile phone number." });
    }

    const [[user]] = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = ?",
      [user_id],
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (email || phone) {
        const fields = [];
        const vals = [];
        if (email) {
          fields.push("email = ?");
          vals.push(email);
        }
        if (phone) {
          fields.push("phone = ?");
          vals.push(normalizedPhone);
        }
        vals.push(user_id);
        await conn.query(
          `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
          vals,
        );
      }

      if (user.role === "doctor") {
        const docFields = [];
        const docVals = [];
        if (first_name) {
          docFields.push("first_name = ?");
          docVals.push(first_name);
        }
        if (last_name) {
          docFields.push("last_name = ?");
          docVals.push(last_name);
        }
        if (suffix !== undefined) {
          docFields.push("suffix = ?");
          docVals.push(normalizedSuffix);
        }
        if (middle_name !== undefined) {
          docFields.push("middle_name = ?");
          docVals.push(normalizedMiddleName);
        }
        if (license_number) {
          docFields.push("license_number = ?");
          docVals.push(license_number);
        }
        if (phone) {
          docFields.push("contact_number = ?");
          docVals.push(normalizedPhone);
        }
        if (docFields.length) {
          docVals.push(user_id);
          await conn.query(
            `UPDATE doctors SET ${docFields.join(", ")} WHERE user_id = ?`,
            docVals,
          );
        }
      } else {
        const staffFields = [];
        const staffVals = [];
        if (first_name) {
          staffFields.push("first_name = ?");
          staffVals.push(first_name);
        }
        if (last_name) {
          staffFields.push("last_name = ?");
          staffVals.push(last_name);
        }
        if (suffix !== undefined) {
          staffFields.push("suffix = ?");
          staffVals.push(normalizedSuffix);
        }
        if (middle_name !== undefined) {
          staffFields.push("middle_name = ?");
          staffVals.push(normalizedMiddleName);
        }
        if (phone) {
          staffFields.push("contact_number = ?");
          staffVals.push(normalizedPhone);
        }
        if (position && user.role !== "admin") {
          staffFields.push("position = ?");
          staffVals.push(position);
        }
        if (staffFields.length) {
          staffVals.push(user_id);
          await conn.query(
            `UPDATE staff SET ${staffFields.join(", ")} WHERE user_id = ?`,
            staffVals,
          );
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
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Email or phone already in use." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/admin/patients */
const getPatients = async (req, res) => {
  try {
    const { page: requestedPage, limit } = parsePagination(req.query);
    const search = req.query?.search ?? "";
    const includeInactive = req.query?.includeInactive ?? "false";
    if (typeof search !== "string" || search.length > 150 || !["true", "false"].includes(includeInactive)) {
      return res.status(400).json({ success: false, message: "Invalid patient search or account status filter." });
    }
    let where = "u.role = 'patient'";
    const values = [];
    if (includeInactive !== "true") where += " AND u.is_active = 1";
    if (search.trim()) {
      const pattern = `%${search.trim().replace(/[!%_]/g, "!$&")}%`;
      where += ` AND (
        CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')) LIKE ? ESCAPE '!'
        OR CONCAT_WS(' ', p.last_name, p.first_name, CONCAT(LEFT(NULLIF(TRIM(p.middle_name), ''), 1), '.'), p.suffix) LIKE ? ESCAPE '!'
        OR COALESCE(NULLIF(p.contact_number, ''), u.phone, '') LIKE ? ESCAPE '!'
        OR p.barangay LIKE ? ESCAPE '!'
      )`;
      values.push(pattern, pattern, pattern, pattern);
    }
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) AS total FROM users u
      JOIN patients p ON u.user_id = p.user_id WHERE ${where}
    `, values);
    const totalPages = Math.max(1, Math.ceil(Number(total) / limit));
    const page = Math.min(requestedPage, totalPages);
    const [rows] = await pool.query(`
      SELECT u.user_id, u.phone, u.is_active, u.must_change_password,
       (SELECT j.id FROM sms_jobs j WHERE j.user_id = u.user_id AND j.purpose = 'temporary_password' ORDER BY j.id DESC LIMIT 1) AS sms_job_id,
       (SELECT j.state FROM sms_jobs j WHERE j.user_id = u.user_id AND j.purpose = 'temporary_password' ORDER BY j.id DESC LIMIT 1) AS sms_state,
       (SELECT j.provider_status FROM sms_jobs j WHERE j.user_id = u.user_id AND j.purpose = 'temporary_password' ORDER BY j.id DESC LIMIT 1) AS sms_provider_status,
       p.patient_id, p.first_name, p.middle_name, p.last_name, p.suffix,
       CONCAT_WS(' ', p.first_name, NULLIF(TRIM(p.middle_name), ''), p.last_name, NULLIF(TRIM(p.suffix), '')) AS full_name, p.contact_number,
       p.barangay
      FROM   users u
      JOIN   patients p ON u.user_id = p.user_id
      WHERE ${where}
      ORDER BY p.first_name ASC, p.last_name ASC, p.patient_id ASC
      LIMIT ? OFFSET ?
    `, [...values, limit, (page - 1) * limit]);
    res.json({ success: true, patients: rows, pagination: { page, limit, total: Number(total), totalPages } });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    console.error("getPatients error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/admin/patients — admin-mediated patient account creation */
const createPatient = async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      suffix,
      phone,
      address,
      date_of_birth,
      gender,
      priority_category,
    } = req.body;
    const normalizedSuffix = normalizeSuffix(suffix);
    const normalizedMiddleName = normalizeMiddleName(middle_name);

    if (
      !first_name ||
      !last_name ||
      !phone ||
      !address ||
      !date_of_birth ||
      !gender
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

    if (
      priority_category !== undefined &&
      priority_category !== null &&
      priority_category !== "" &&
      !["senior", "pwd", "pregnant"].includes(priority_category)
    ) {
      return res.status(400).json({
        success: false,
        message: "priority_category must be senior, pwd, or pregnant.",
      });
    }

    const normalizedPhone = normalizePhilippineMobilePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
      });
    }

    if (!date_of_birth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required.",
      });
    }

    if (!["Male", "Female"].includes(gender)) {
      return res
        .status(400)
        .json({ success: false, message: "Gender must be Male or Female." });
    }

    const [[existingPhone]] = await pool.query(
      "SELECT user_id FROM users WHERE phone = ?",
      [normalizedPhone],
    );
    if (existingPhone) {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already in use." });
    }

    const tempPassword = User.generateTempPassword();

    const normalizedPriorityCategory = priority_category || null;
    const priorityExpiresAt =
      normalizedPriorityCategory === "pregnant"
        ? new Date(Date.now() + 280 * 24 * 60 * 60 * 1000)
        : null;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const salt_password_hash = await bcrypt.hash(tempPassword, 10);
      const [userResult] = await conn.query(
        `INSERT INTO users (phone, password_hash, role, must_change_password)
         VALUES (?, ?, 'patient', 1)`,
        [normalizedPhone, salt_password_hash],
      );
      const user_id = userResult.insertId;

      const [patientResult] = await conn.query(
        `INSERT INTO patients
           (user_id, first_name, middle_name, last_name, suffix, date_of_birth, gender, contact_number, barangay, city,
            priority_category, priority_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          first_name,
          normalizedMiddleName,
          last_name,
          normalizedSuffix,
          date_of_birth,
          gender,
          normalizedPhone,
          address,
          "Bago City",
          normalizedPriorityCategory,
          priorityExpiresAt,
        ],
      );

      const sms_job_id = await enqueuePassword(conn, user_id, patientResult.insertId, normalizedPhone, tempPassword);
      await conn.commit();
      wakeWorker();

      res.status(201).json({
        success: true,
        message: "Patient account created.",
        user_id,
        patient_id: patientResult.insertId,
        phone: normalizedPhone,
        sms_job_id,
        sms_status: 'queued',
      });
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Patient account creation failed internally.");
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already in use." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/admin/patients/:user_id/deactivate */
const deactivatePatient = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [[user]] = await pool.query(
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'patient'",
      [user_id],
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    await pool.query("UPDATE users SET is_active = 0 WHERE user_id = ?", [
      user_id,
    ]);
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
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'patient'",
      [user_id],
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    await pool.query("UPDATE users SET is_active = 1 WHERE user_id = ?", [
      user_id,
    ]);
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
      "SELECT specialization_id, specialization_name FROM specializations ORDER BY specialization_name ASC",
    );
    res.json({ success: true, specializations: rows });
  } catch (err) {
    console.error("getSpecializations error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getOverview,
  getStaff,
  createStaff,
  deactivateStaff,
  reactivateStaff,
  updateStaff,
  getPatients,
  createPatient,
  deactivatePatient,
  reactivatePatient,
  getSpecializations,
};

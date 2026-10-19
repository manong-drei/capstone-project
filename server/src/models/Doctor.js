/**
 * Doctor.js – Model for the `doctors` table (Table 4)
 * JOINs with specializations for full profile queries.
 */

const pool = require('../config/db');
const { normalizeSuffix, normalizeMiddleName } = require('../utils/name');

const Doctor = {

  findAll: async () => {
    const [rows] = await pool.query(`
      SELECT d.*, s.specialization_name,
        COALESCE(dds.is_available, 1) AS is_available
      FROM   doctors d
      LEFT   JOIN specializations s ON d.specialization_id = s.specialization_id
      LEFT   JOIN daily_doctor_settings dds
               ON dds.doctor_id = d.doctor_id AND dds.date = CURDATE()
      ORDER  BY d.last_name ASC
    `);
    return rows;
  },

  findById: async (doctor_id) => {
    const [rows] = await pool.query(`
      SELECT d.*, s.specialization_name
      FROM   doctors d
      LEFT   JOIN specializations s ON d.specialization_id = s.specialization_id
      WHERE  d.doctor_id = ?
    `, [doctor_id]);
    return rows[0] || null;
  },

  findAdminProfile: async (doctor_id) => {
    const [rows] = await pool.query(`
      SELECT d.doctor_id, d.first_name, d.middle_name, d.last_name, d.suffix, d.license_number,
        COALESCE(NULLIF(d.contact_number, ''), u.phone) AS contact_number,
        s.specialization_name, u.created_at AS date_added,
        COALESCE(dds.is_available, 1) AS is_available
      FROM doctors d
      LEFT JOIN users u ON u.user_id = d.user_id
      LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
      LEFT JOIN daily_doctor_settings dds
        ON dds.doctor_id = d.doctor_id AND dds.date = CURDATE()
      WHERE d.doctor_id = ?
    `, [doctor_id]);
    return rows[0] || null;
  },

  findAvailabilityRecords: async (doctor_id) => {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, is_available,
        appointment_limit, walk_in_limit
      FROM daily_doctor_settings
      WHERE doctor_id = ?
      ORDER BY date DESC
    `, [doctor_id]);
    return rows;
  },

  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      'SELECT * FROM doctors WHERE user_id = ?',
      [user_id]
    );
    return rows[0] || null;
  },

  create: async ({ user_id, specialization_id, first_name, middle_name, last_name, suffix, license_number, contact_number }) => {
    const [result] = await pool.query(
      `INSERT INTO doctors (user_id, specialization_id, first_name, middle_name, last_name, suffix, license_number, contact_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, specialization_id || null, first_name, normalizeMiddleName(middle_name), last_name, normalizeSuffix(suffix), license_number, contact_number || null]
    );
    return result.insertId;
  }
};

module.exports = Doctor;

/**
 * Doctor.js – Model for the `doctors` table (Table 4)
 * JOINs with specializations for full profile queries.
 */

const pool = require('../config/db');

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

  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      'SELECT * FROM doctors WHERE user_id = ?',
      [user_id]
    );
    return rows[0] || null;
  },

  create: async ({ user_id, specialization_id, first_name, last_name, license_number, contact_number }) => {
    const [result] = await pool.query(
      `INSERT INTO doctors (user_id, specialization_id, first_name, last_name, license_number, contact_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, specialization_id || null, first_name, last_name, license_number, contact_number || null]
    );
    return result.insertId;
  }
};

module.exports = Doctor;

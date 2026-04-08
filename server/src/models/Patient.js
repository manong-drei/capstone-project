/**
 * Patient.js – Model for the `patients` table (Table 2)
 */

const pool = require('../config/db');

const Patient = {

  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      'SELECT * FROM patients WHERE user_id = ?',
      [user_id]
    );
    return rows[0] || null;
  },

  findById: async (patient_id) => {
    const [rows] = await pool.query(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const {
      user_id, first_name, last_name, middle_name,
      date_of_birth, gender, contact_number,
      barangay, city, philhealth_id,
      emergency_contact, emg_contact_no
    } = data;

    const [result] = await pool.query(
      `INSERT INTO patients
         (user_id, first_name, last_name, middle_name,
          date_of_birth, gender, contact_number,
          barangay, city, philhealth_id,
          emergency_contact, emg_contact_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, first_name, last_name, middle_name || null,
        date_of_birth, gender, contact_number || null,
        barangay, city || 'Bago City', philhealth_id || null,
        emergency_contact || null, emg_contact_no || null
      ]
    );
    return result.insertId;
  },

  findByBarangay: async (barangay) => {
    const [rows] = await pool.query(
      'SELECT * FROM patients WHERE barangay = ? ORDER BY last_name ASC',
      [barangay]
    );
    return rows;
  }
};

module.exports = Patient;

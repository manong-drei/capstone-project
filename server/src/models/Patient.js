const pool = require("../config/db");

const Patient = {
  findByUserId: async (user_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  findById: async (patient_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE patient_id = ?",
      [patient_id],
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const {
      user_id,
      fullName,
      address,
      phone,
      age,
      gender,
      city,
      philhealth_id,
      emergency_contact,
      emg_contact_no,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO patients
         (user_id, full_name, age, gender, contact_number,
          barangay, city, philhealth_id,
          emergency_contact, emg_contact_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        fullName,
        age,
        gender,
        phone || null,
        address,
        city || "Bago City",
        philhealth_id || null,
        emergency_contact || null,
        emg_contact_no || null,
      ],
    );
    return result.insertId;
  },

  // Update patient profile by user_id — only allows known columns
  updateByUserId: async (user_id, data) => {
    const allowed = [
      "full_name",
      "age",
      "gender",
      "contact_number",
      "barangay",
      "city",
      "philhealth_id",
      "emergency_contact",
      "emg_contact_no",
    ];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (!fields.length) return null;

    const values = fields.map((f) => data[f]);
    values.push(user_id);

    await pool.query(
      `UPDATE patients SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE user_id = ?`,
      values,
    );
    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  findByBarangay: async (barangay) => {
    const [rows] = await pool.query(
      "SELECT * FROM patients WHERE barangay = ? ORDER BY full_name ASC",
      [barangay],
    );
    return rows;
  },
};

module.exports = Patient;

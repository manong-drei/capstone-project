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
      `SELECT p.*, COALESCE(p.contact_number, u.phone) AS contact_number
       FROM patients p LEFT JOIN users u ON p.user_id = u.user_id WHERE p.patient_id = ?`,
      [patient_id],
    );
    return rows[0] || null;
  },

  search: async ({ name, date_of_birth, phone }, connection = pool) => {
    const filters = [];
    const values = [];
    if (phone) { filters.push("COALESCE(p.contact_number, u.phone) = ?"); values.push(phone); }
    if (name) { filters.push("CONCAT(p.first_name, ' ', p.last_name) LIKE ?"); values.push(`%${name}%`); }
    if (name && date_of_birth) {
      filters.push("LOWER(CONCAT(p.first_name, ' ', p.last_name)) = LOWER(?) AND p.date_of_birth = ?");
      values.push(name, date_of_birth);
    }
    if (date_of_birth) { filters.push("p.date_of_birth = ?"); values.push(date_of_birth); }
    if (!filters.length) return [];
    const [rows] = await connection.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.gender,
              COALESCE(p.contact_number, u.phone) AS contact_number, p.barangay, p.city, p.user_id
       FROM patients p LEFT JOIN users u ON p.user_id = u.user_id
       WHERE p.archived_into_patient_id IS NULL AND (${filters.join(" OR ")})
       ORDER BY (COALESCE(p.contact_number, u.phone) = ?) DESC,
                (LOWER(CONCAT(p.first_name, ' ', p.last_name)) = LOWER(?) AND p.date_of_birth = ?) DESC,
                p.last_name, p.first_name LIMIT 20`,
      [...values, phone || "", name || "", date_of_birth || "1000-01-01"],
    );
    return rows;
  },

  createWalkIn: async ({ first_name, last_name, date_of_birth, gender, contact_number, barangay }, connection) => {
    const [result] = await connection.query(
      `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, contact_number, barangay, city)
       VALUES (NULL, ?, ?, ?, ?, ?, ?, 'Bago City')`,
      [first_name, last_name, date_of_birth, gender, contact_number, barangay],
    );
    return result.insertId;
  },

  audit: async (patient_id, actor_user_id, action, details = null, connection = pool) => {
    await connection.query(
      "INSERT INTO patient_audit (patient_id, actor_user_id, action, details) VALUES (?, ?, ?, ?)",
      [patient_id, actor_user_id || null, action, details && JSON.stringify(details)],
    );
  },

  create: async (data) => {
    const {
      user_id,
      first_name,
      last_name,
      address,
      phone,
      date_of_birth,
      gender,
      city,
      philhealth_id,
      emergency_contact,
      emg_contact_no,
      priority_category,
      priority_expires_at,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO patients
         (user_id, first_name, last_name, date_of_birth, gender, contact_number,
          barangay, city, philhealth_id,
          emergency_contact, emg_contact_no, priority_category, priority_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone || null,
        address,
        city || "Bago City",
        philhealth_id || null,
        emergency_contact || null,
        emg_contact_no || null,
        priority_category || null,
        priority_expires_at || null,
      ],
    );
    return result.insertId;
  },

  // Update patient profile by user_id — only allows known columns
  updateByUserId: async (user_id, data) => {
    const allowed = [
      "first_name",
      "last_name",
      "date_of_birth",
      "gender",
      "contact_number",
      "barangay",
      "city",
      "philhealth_id",
      "emergency_contact",
      "emg_contact_no",
      "priority_category",
      "priority_expires_at",
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
      "SELECT * FROM patients WHERE barangay = ? ORDER BY first_name ASC, last_name ASC",
      [barangay],
    );
    return rows;
  },
};

module.exports = Patient;

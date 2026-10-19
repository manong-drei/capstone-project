const pool = require('../config/db');
const { normalizeSuffix, normalizeMiddleName } = require('../utils/name');

const Staff = {
  create: async ({ user_id, first_name, middle_name, last_name, suffix, position, contact_number }) => {
    const [result] = await pool.query(
      `INSERT INTO staff (user_id, first_name, middle_name, last_name, suffix, position, contact_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, normalizeMiddleName(middle_name), last_name, normalizeSuffix(suffix), position, contact_number || null]
    );
    return result.insertId;
  },
};

module.exports = Staff;

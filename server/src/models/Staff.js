const pool = require('../config/db');

const Staff = {
  create: async ({ user_id, first_name, last_name, position, contact_number }) => {
    const [result] = await pool.query(
      `INSERT INTO staff (user_id, first_name, last_name, position, contact_number)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, position, contact_number || null]
    );
    return result.insertId;
  },
};

module.exports = Staff;
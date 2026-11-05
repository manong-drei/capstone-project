const pool = require('../config/db');
const { normalizeSuffix, normalizeMiddleName } = require('../utils/name');
const { normalizeProfileChanges } = require('../utils/profile');

const Staff = {
  create: async ({ user_id, first_name, middle_name, last_name, suffix, position, contact_number }, connection = pool) => {
    const [result] = await connection.query(
      `INSERT INTO staff (user_id, first_name, middle_name, last_name, suffix, position, contact_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, normalizeMiddleName(middle_name), last_name, normalizeSuffix(suffix), position, contact_number || null]
    );
    return result.insertId;
  },

  ensureAdminProfile: async (user_id, changes, connection) => {
    // Lock the account so concurrent saves cannot create duplicate staff profiles.
    const [[user]] = await connection.query(
      `SELECT u.phone, s.staff_id FROM users u LEFT JOIN staff s ON s.user_id = u.user_id
       WHERE u.user_id = ? AND u.role = 'admin' FOR UPDATE`, [user_id],
    );
    if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
    if (user.staff_id) return;
    const names = normalizeProfileChanges({ first_name: changes.first_name, last_name: changes.last_name });
    await Staff.create({
      user_id, ...names, middle_name: changes.middle_name, suffix: changes.suffix,
      position: 'Administrator', contact_number: changes.contact_number ?? user.phone,
    }, connection);
  },
};

module.exports = Staff;

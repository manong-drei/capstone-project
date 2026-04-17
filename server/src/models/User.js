/**
 * User.js – Model for the `users` table (Table 1)
 */

const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  findByPhone: async (phone) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE phone = ? AND is_active = 1",
      [phone],
    );
    return rows[0] || null;
  },

  findByUsername: async (username) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username],
    );
    return rows[0] || null;
  },

  findById: async (user_id) => {
    const [rows] = await pool.query(
      "SELECT user_id, phone, role, is_active, created_at FROM users WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  create: async ({ username, phone, password, role }) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const [result] = await pool.query(
      "INSERT INTO users (username, phone, password_hash, role) VALUES (?, ?, ?, ?)",
      [username, phone, password_hash, role],
    );
    return result.insertId;
  },

  verifyPassword: async (plainText, hash) => {
    return bcrypt.compare(plainText, hash);
  },
};

module.exports = User;

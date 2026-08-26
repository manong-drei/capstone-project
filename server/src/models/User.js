/**
 * User.js – Model for the `users` table (Table 1)
 */

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = {
  findByPhone: async (phone) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE phone = ? AND is_active = 1",
      [phone],
    );
    return rows[0] || null;
  },

  //findByUsername is not Used Anymore
  /*
  findByUsername: async (username) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username],
    );
    return rows[0] || null;
  },
*/
  findById: async (user_id) => {
    const [rows] = await pool.query(
      "SELECT user_id, phone, role, is_active, created_at FROM users WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  findByIdWithHash: async (user_id) => {
    const [rows] = await pool.query(
      "SELECT user_id, phone, role, is_active, password_hash FROM users WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  create: async ({ phone, password, role }) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const [result] = await pool.query(
      "INSERT INTO users (phone, password_hash, role, must_change_password) VALUES (?, ?, ?, 0)",
      [phone, password_hash, role],
    );
    return result.insertId;
  },

  generateTempPassword: () => {
    // 6-char uppercase + digits, excluding 0/O and 1/I for clarity
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pw = "";
    for (let i = 0; i < 6; i++) {
      pw += chars[crypto.randomInt(0, chars.length)];
    }
    return pw;
  },

  updatePassword: async (user_id, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await pool.query(
      "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE user_id = ?",
      [password_hash, user_id],
    );
  },

  verifyPassword: async (plainText, hash) => {
    return bcrypt.compare(plainText, hash);
  },
};

module.exports = User;

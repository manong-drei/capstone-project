/**
 * User.js – Model for the `users` table (Table 1)
 */

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sessionResponse } = require("../utils/authSession");

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
      "SELECT user_id, phone, role, is_active, created_at, must_change_password, credential_version FROM users WHERE user_id = ?",
      [user_id],
    );
    return rows[0] || null;
  },

  findByIdWithHash: async (user_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE user_id = ?",
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
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  },

  updatePassword: async (user_id, newPassword, version) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    const [result] = await pool.query(
      `UPDATE users SET password_hash = ?, must_change_password = 0,
       temp_password_expires_at = NULL, temp_password_used_at = NULL,
       credential_version = credential_version + 1, login_failures = 0, login_locked_until = NULL
       WHERE user_id = ? AND credential_version = ? AND is_active = 1`,
      [password_hash, user_id, version],
    );
    return result.affectedRows === 1;
  },

  authenticate: async (phone, password) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[user]] = await conn.query("SELECT *, NOW() AS db_now FROM users WHERE phone = ? AND is_active = 1 FOR UPDATE", [phone]);
      if (!user || (user.login_locked_until && user.login_locked_until > user.db_now)) {
        await conn.rollback(); return null;
      }
      if (user.must_change_password && (!user.temp_password_expires_at || user.temp_password_expires_at <= user.db_now || user.temp_password_used_at)) {
        await conn.rollback(); return null;
      }
      if (!await User.verifyPassword(password, user.password_hash)) {
        // Six digits need a persistent per-account limit in addition to the IP limiter.
        await conn.query(`UPDATE users SET login_failures = IF(login_locked_until IS NOT NULL AND login_locked_until <= NOW(), 1, login_failures + 1),
          login_locked_until = IF(login_failures >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NULL) WHERE user_id = ?`, [user.user_id]);
        await conn.commit(); return null;
      }
      // A signing failure must not consume the patient's temporary password.
      const session = sessionResponse(user);
      await conn.query(`UPDATE users SET login_failures = 0, login_locked_until = NULL,
        temp_password_used_at = IF(must_change_password = 1, NOW(), temp_password_used_at) WHERE user_id = ?`, [user.user_id]);
      await conn.commit();
      return session;
    } catch (err) { await conn.rollback(); throw err; }
    finally { conn.release(); }
  },

  verifyPassword: async (plainText, hash) => {
    return bcrypt.compare(plainText, hash);
  },
};

module.exports = User;

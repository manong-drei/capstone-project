const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { normalizePhilippineMobilePhone } = require("../utils/phone");
const { enqueuePassword, wakeWorker } = require("../services/smsNotifications");

async function getSettings(req, res) {
  try {
    const [[settings]] = await pool.query(
      "SELECT threshold, updated_at FROM sms_settings WHERE id = 1",
    );
    res.json({ success: true, data: settings });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Unable to load SMS settings." });
  }
}
async function updateSettings(req, res) {
  const { threshold } = req.body;
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Threshold must be an integer from 1 to 100.",
      });
  }
  try {
    await pool.query(
      "UPDATE sms_settings SET threshold = ?, updated_by = ?, updated_at = NOW() WHERE id = 1",
      [threshold, req.user.user_id],
    );
    wakeWorker();
    res.json({ success: true, data: { threshold } });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Unable to save SMS settings." });
  }
}
async function listJobs(req, res) {
  try {
    const [rows] =
      await pool.query(`SELECT id, purpose, user_id, queue_id, state, provider_status, last_error,
      CONCAT('*******', RIGHT(recipient, 4)) AS masked_recipient, created_at FROM sms_jobs ORDER BY id DESC LIMIT 100`);
    res.json({ success: true, jobs: rows });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Unable to load SMS history." });
  }
}
async function replacePassword(req, res) {
  const userId = Number(req.params.user_id);
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    req.body.identity_confirmed !== true
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Confirm the patient's identity before issuing a replacement.",
      });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [[user]] = await conn.query(
      "SELECT * FROM users WHERE user_id = ? AND role = 'patient' FOR UPDATE",
      [userId],
    );
    if (!user || !user.is_active || !user.must_change_password) {
      await conn.rollback();
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Only active patient accounts awaiting activation can receive a replacement.",
        });
    }
    const [[patient]] = await conn.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId],
    );
    const phone = normalizePhilippineMobilePhone(user.phone);
    if (!patient || !phone) {
      await conn.rollback();
      return res
        .status(409)
        .json({
          success: false,
          message: "Patient account has no valid registered mobile number.",
        });
    }
    const password = User.generateTempPassword();
    const version = user.credential_version + 1;
    await conn.query(
      `UPDATE users SET password_hash = ?, credential_version = ?, temp_password_expires_at = NULL,
      temp_password_used_at = NULL, login_failures = 0, login_locked_until = NULL WHERE user_id = ?`,
      [await bcrypt.hash(password, 10), version, userId],
    );
    await conn.query(
      `UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = 'credential_replaced'
      WHERE user_id = ? AND purpose = 'temporary_password' AND state IN ('queued','submitting')`,
      [userId],
    );
    const jobId = await enqueuePassword(
      conn,
      userId,
      patient.patient_id,
      phone,
      password,
      version,
    );
    await conn.query(
      "INSERT INTO sms_password_audit (user_id, actor_user_id, credential_version) VALUES (?, ?, ?)",
      [userId, req.user.user_id, version],
    );
    await conn.commit();
    wakeWorker();
    res
      .status(201)
      .json({
        success: true,
        message:
          "Replacement password SMS queued. The old credential is invalid.",
        sms_job_id: jobId,
        sms_status: "queued",
      });
  } catch {
    if (conn) await conn.rollback();
    res
      .status(500)
      .json({
        success: false,
        message: "Unable to issue replacement password.",
      });
  } finally {
    conn?.release();
  }
}
module.exports = { getSettings, updateSettings, listJobs, replacePassword };

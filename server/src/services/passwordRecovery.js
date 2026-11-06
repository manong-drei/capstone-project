const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const audit = require('./auditLog');
const sms = require('../utils/sms');
const { normalizePhilippineMobilePhone } = require('../utils/phone');

const generateOtp = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');
// A keyed hash keeps the four-digit code resistant to offline guessing from a database copy.
const otpHash = (id, code) => crypto.createHmac('sha256', process.env.SMS_ENCRYPTION_KEY).update(`${id}:${code}`).digest('hex');
const tokenHash = token => crypto.createHash('sha256').update(token).digest('hex');
const matches = (left, right) => typeof left === 'string' && /^[a-f\d]{64}$/.test(left)
  && crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
const error = (status, message, retryAfter) => ({ status, message, retryAfter });
const invalidCode = () => error(400, 'Invalid or expired code. Request a new code if needed.');

async function patient(connection, userId, patientId) {
  const [[row]] = await connection.query(`SELECT patient_id,
    CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name, NULLIF(suffix, '')) AS patient_name
    FROM patients WHERE user_id = ? AND archived_into_patient_id IS NULL${patientId ? ' AND patient_id = ?' : ''} LIMIT 1`,
  patientId ? [userId, patientId] : [userId]);
  return row;
}

async function record(connection, req, recovery, action, outcome = 'success', reason) {
  const person = await patient(connection, recovery.user_id, recovery.patient_id);
  const actor = action === 'completed'
    ? { user_id: recovery.user_id, name: person?.patient_name || `Patient #${recovery.patient_id}`, role: 'patient' } : undefined;
  await audit.write({ ip: req?.ip, auditActor: actor }, {
    action: `password.recovery_${action}`, target_type: 'user', target_id: recovery.user_id, outcome, force: true,
    details: { method: 'sms', patient_id: recovery.patient_id, patient_name: person?.patient_name,
      phone: recovery.phone, recovery_id: recovery.id, recovery_status: recovery.status, recovery_reason: reason },
  }, connection);
}

async function finish(connection, req, recovery, status, reason) {
  await connection.query(`UPDATE password_recoveries SET status = ?, otp_hash = NULL, reset_token_hash = NULL WHERE id = ?`, [status, recovery.id]);
  recovery.status = status;
  await connection.query(`UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = 'recovery_closed'
    WHERE recovery_id = ? AND state IN ('queued','submitting')`, [recovery.id]);
  if (status === 'completed' || status === 'failed') {
    await record(connection, req, recovery, status, status === 'completed' ? 'success' : 'failed', reason);
  }
}

async function load(connection, id) {
  const [[target]] = await connection.query('SELECT user_id FROM password_recoveries WHERE id = ?', [id]);
  if (!target) return {};
  // All request, verification and reset paths lock the account before its recovery rows.
  const [[user]] = await connection.query('SELECT *, NOW(3) AS db_now FROM users WHERE user_id = ? FOR UPDATE', [target.user_id]);
  const [[recovery]] = await connection.query('SELECT * FROM password_recoveries WHERE id = ? FOR UPDATE', [id]);
  return { user, recovery };
}

async function available(connection, req, recovery, user) {
  if (!recovery || !['pending', 'verified'].includes(recovery.status)) return false;
  if (!user || !user.is_active || user.role !== 'patient' || user.phone !== recovery.phone || user.credential_version !== recovery.credential_version
    || !await patient(connection, recovery.user_id, recovery.patient_id)) {
    await finish(connection, req, recovery, 'cancelled');
    return false;
  }
  const deadline = recovery.status === 'verified' ? recovery.reset_expires_at : recovery.expires_at;
  if (!deadline || deadline <= user.db_now) {
    await finish(connection, req, recovery, 'expired');
    return false;
  }
  const [[job]] = await connection.query('SELECT state, provider_status FROM sms_jobs WHERE recovery_id = ? LIMIT 1', [recovery.id]);
  if (recovery.status === 'pending' && (job?.state === 'failed' || ['failed', 'refunded'].includes(job?.provider_status))) {
    await finish(connection, req, recovery, 'failed', 'delivery_failed');
    return false;
  }
  return true;
}

async function request(req) {
  const phone = typeof req.body?.phone === 'string' && normalizePhilippineMobilePhone(req.body.phone);
  if (!phone) return error(400, 'invalid phone number');
  if (process.env.SMS_ENABLED !== 'true') return error(503, 'SMS recovery is unavailable. Please visit clinic reception for help.');
  sms.validateConfig();
  return audit.transaction(async connection => {
    const [[user]] = await connection.query("SELECT *, NOW(3) AS db_now FROM users WHERE phone = ? AND role = 'patient' AND is_active = 1 FOR UPDATE", [phone]);
    const person = user && await patient(connection, user.user_id);
    if (!person) return error(400, 'invalid phone number');
    const [[limits]] = await connection.query(`SELECT COUNT(*) AS total, MAX(created_at) AS last_sent FROM password_recoveries
      WHERE phone = ? AND created_at > DATE_SUB(NOW(3), INTERVAL 15 MINUTE)`, [phone]);
    const wait = limits.last_sent ? Math.ceil((limits.last_sent.getTime() + 60000 - user.db_now.getTime()) / 1000) : 0;
    if (wait > 0) return error(429, `Please wait ${wait} seconds before requesting another code.`, wait);
    if (Number(limits.total) >= 3) return error(429, 'Too many recovery requests. Please try again in 15 minutes.', 900);
    const [previous] = await connection.query("SELECT * FROM password_recoveries WHERE user_id = ? AND status IN ('pending','verified') FOR UPDATE", [user.user_id]);
    for (const recovery of previous) {
      if (await available(connection, req, recovery, user)) await finish(connection, req, recovery, 'cancelled');
    }
    const id = crypto.randomUUID();
    const code = generateOtp();
    await connection.query(`INSERT INTO password_recoveries
      (id, user_id, patient_id, phone, credential_version, otp_hash, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL 5 MINUTE))`,
    [id, user.user_id, person.patient_id, phone, user.credential_version, otpHash(id, code)]);
    const message = `E-KALUSUGAN: Your password recovery code is ${code}. Valid for 5 minutes. Never share this code. If you did not request it, ignore this message.`;
    await connection.query(`INSERT INTO sms_jobs (purpose, user_id, patient_id, recovery_id, credential_version, recipient, deduplication_key, payload)
      VALUES ('password_recovery', ?, ?, ?, ?, ?, ?, ?)`,
    [user.user_id, person.patient_id, id, user.credential_version, phone, `recovery:${id}`, sms.encryptPayload(message)]);
    return { recovery_id: id, expires_in: 300, resend_after: 60 };
  });
}

async function verify(req) {
  const { recovery_id: id, otp } = req.body || {};
  if (!validId(id) || typeof otp !== 'string' || !/^\d{4}$/.test(otp)) return invalidCode();
  return audit.transaction(async connection => {
    const { user, recovery } = await load(connection, id);
    if (!await available(connection, req, recovery, user) || recovery.status !== 'pending') return invalidCode();
    if (!matches(recovery.otp_hash, otpHash(id, otp))) {
      const attempts = recovery.attempts + 1;
      await connection.query('UPDATE password_recoveries SET attempts = ? WHERE id = ?', [attempts, id]);
      if (attempts >= 3) {
        await finish(connection, req, recovery, 'failed', 'attempts_exhausted');
        return error(400, 'Three incorrect attempts. Request a new code.');
      }
      await record(connection, req, recovery, 'failed', 'failed', 'incorrect_code');
      return error(400, `Incorrect code. ${3 - attempts} attempt${attempts === 1 ? 's' : ''} remaining.`);
    }
    const token = crypto.randomBytes(32).toString('hex');
    await connection.query(`UPDATE password_recoveries SET status = 'verified', otp_hash = NULL,
      reset_token_hash = ?, reset_expires_at = DATE_ADD(NOW(3), INTERVAL 5 MINUTE) WHERE id = ?`, [tokenHash(token), id]);
    return { reset_token: token, expires_in: 300 };
  });
}

async function reset(req) {
  const { recovery_id: id, reset_token: token, newPassword } = req.body || {};
  if (!validId(id) || typeof token !== 'string' || !/^[a-f\d]{64}$/.test(token)) return error(400, 'Recovery session expired. Please request a new code.');
  if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72 || !/[0-9]/.test(newPassword)) {
    return error(400, 'Password must contain at least 8 characters and a number, and fit within 72 UTF-8 bytes.');
  }
  return audit.transaction(async connection => {
    const { user, recovery } = await load(connection, id);
    if (!await available(connection, req, recovery, user) || recovery.status !== 'verified' || !matches(recovery.reset_token_hash, tokenHash(token))) {
      return error(400, 'Recovery session expired. Please request a new code.');
    }
    if (await bcrypt.compare(newPassword, user.password_hash)) return error(400, 'Choose a different password.');
    await connection.query(`UPDATE users SET password_hash = ?, must_change_password = 0,
      temp_password_expires_at = NULL, temp_password_used_at = NULL, credential_version = credential_version + 1,
      login_failures = 0, login_locked_until = NULL WHERE user_id = ?`, [await bcrypt.hash(newPassword, 10), user.user_id]);
    await connection.query(`UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = 'credential_replaced'
      WHERE user_id = ? AND purpose IN ('temporary_password','password_recovery') AND state IN ('queued','submitting')`, [user.user_id]);
    await finish(connection, req, recovery, 'completed');
    const [others] = await connection.query("SELECT * FROM password_recoveries WHERE user_id = ? AND id <> ? AND status IN ('pending','verified') FOR UPDATE", [user.user_id, id]);
    for (const other of others) await finish(connection, req, other, 'cancelled');
    return { message: 'Password changed successfully. Please log in with your new password.' };
  });
}

const validId = id => typeof id === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/.test(id);

async function reconcile() {
  const [rows] = await pool.query(`SELECT r.id FROM password_recoveries r LEFT JOIN users u ON u.user_id = r.user_id
    WHERE r.status IN ('pending','verified') AND (
      (r.status = 'pending' AND r.expires_at <= NOW(3)) OR (r.status = 'verified' AND r.reset_expires_at <= NOW(3))
      OR u.user_id IS NULL OR u.is_active = 0 OR u.role <> 'patient' OR u.phone <> r.phone OR u.credential_version <> r.credential_version
      OR NOT EXISTS (SELECT 1 FROM patients p WHERE p.patient_id = r.patient_id AND p.user_id = r.user_id AND p.archived_into_patient_id IS NULL)
      OR (r.status = 'pending' AND EXISTS (SELECT 1 FROM sms_jobs j WHERE j.recovery_id = r.id AND (j.state = 'failed' OR j.provider_status IN ('failed','refunded')))))
    ORDER BY r.created_at LIMIT 50`);
  for (const row of rows) await audit.transaction(async connection => {
    const { user, recovery } = await load(connection, row.id);
    await available(connection, undefined, recovery, user);
  });
}

module.exports = { request, verify, reset, reconcile, generateOtp, otpHash };

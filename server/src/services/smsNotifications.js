const pool = require('../config/db');
const Queue = require('../models/Queue');
const { alertState } = require('../utils/queueOrder');
const { normalizePhilippineMobilePhone } = require('../utils/phone');
const sms = require('../utils/sms');

async function enqueuePassword(connection, userId, patientId, phone, password, version = 1) {
  const message = `E-KALUSUGAN: Your temporary password is ${password}. Valid for 72 hours and one login. Change it after login. Do not share or reply.`;
  const [result] = await connection.query(`INSERT INTO sms_jobs
    (purpose, user_id, patient_id, credential_version, recipient, deduplication_key, payload)
    VALUES ('temporary_password', ?, ?, ?, ?, ?, ?)`,
  [userId, patientId, version, phone, `password:${userId}:${version}`, sms.encryptPayload(message)]);
  return result.insertId;
}

async function queueRecipient(connection, queue) {
  const [[patient]] = await connection.query(`SELECT p.user_id, p.contact_number, p.archived_into_patient_id,
    u.phone, u.is_active FROM patients p LEFT JOIN users u ON u.user_id = p.user_id WHERE p.patient_id = ? FOR UPDATE`, [queue.patient_id]);
  if (!patient || patient.archived_into_patient_id || (patient.user_id && !patient.is_active)) return null;
  if (!queue.is_walk_in) return normalizePhilippineMobilePhone(patient.phone);
  const contact = normalizePhilippineMobilePhone(queue.walk_in_contact);
  return contact && contact === normalizePhilippineMobilePhone(patient.contact_number) ? contact : null;
}

async function reconcileCategory(category) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await Queue.lockCategory(category, conn);
    const [[settings]] = await conn.query('SELECT threshold FROM sms_settings WHERE id = 1 FOR UPDATE');
    const waiting = await Queue.projectWaiting(category, conn);
    for (const [index, queue] of waiting.entries()) {
      const position = index + 1;
      if (!queue.sms_alert_state) {
        queue.sms_alert_state = alertState(position, settings.threshold);
        await conn.query(`UPDATE queues SET sms_alert_state = ?, sms_initial_position = ?, sms_initial_threshold = ? WHERE id = ?`,
          [queue.sms_alert_state, position, settings.threshold, queue.id]);
      }
      if (queue.sms_alert_state !== 'armed' || position > settings.threshold) continue;
      const recipient = await queueRecipient(conn, queue);
      if (!recipient) continue;
      const message = queueMessage(queue, position);
      await conn.query(`INSERT INTO sms_jobs (purpose, patient_id, queue_id, recipient, deduplication_key, payload)
        VALUES ('queue_alert', ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id`,
      [queue.patient_id, queue.id, recipient, `queue:${queue.id}`, sms.encryptPayload(message)]);
      await conn.query("UPDATE queues SET sms_alert_state = 'enqueued' WHERE id = ?", [queue.id]);
    }
    await conn.commit();
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}

function queueMessage(queue, position) {
  return `E-KALUSUGAN: ${queue.queue_number} is among the next ${position} patient${position === 1 ? '' : 's'} to be called. Please return to the waiting area. Order may change. Do not reply.`;
}

function failureDisposition(error, attempts) {
  return {
    state: error.unknown ? 'unknown' : error.retryable && attempts < 3 ? 'queued' : 'failed',
    delayMs: Math.max(error.retryAfter || 0, attempts === 1 ? 5000 : 30000),
    code: /^[a-z_\d]+$/.test(error.code || '') ? error.code.slice(0, 80) : 'sms_processing_failed',
  };
}

async function submitOne(conn) {
  // Commit the claim before contacting Semaphore: a crash must never return it to the send queue.
  await conn.beginTransaction();
  const [[job]] = await conn.query(`SELECT * FROM sms_jobs WHERE state = 'queued' AND next_attempt_at <= NOW()
    ORDER BY id LIMIT 1 FOR UPDATE`);
  if (!job) { await conn.commit(); return; }
  await conn.query("UPDATE sms_jobs SET state = 'submitting', attempts = attempts + 1, updated_at = NOW() WHERE id = ?", [job.id]);
  await conn.commit();
  job.attempts++;

  await conn.beginTransaction();
  try {
    let message;
    if (job.purpose === 'temporary_password') {
      const [[user]] = await conn.query('SELECT *, NOW() AS db_now FROM users WHERE user_id = ? FOR UPDATE', [job.user_id]);
      const valid = user && user.is_active && user.must_change_password && !user.temp_password_used_at &&
        user.credential_version === job.credential_version && normalizePhilippineMobilePhone(user.phone) === job.recipient &&
        (!user.temp_password_expires_at || user.temp_password_expires_at > user.db_now);
      if (!valid) { await cancelJob(conn, job.id); await conn.commit(); return; }
      await conn.query(`UPDATE users SET temp_password_expires_at = COALESCE(temp_password_expires_at, DATE_ADD(NOW(), INTERVAL 72 HOUR)) WHERE user_id = ?`, [job.user_id]);
      message = sms.decryptPayload(job.payload);
    } else {
      let [[queue]] = await conn.query('SELECT * FROM queues WHERE id = ?', [job.queue_id]);
      if (!queue || queue.patient_id !== job.patient_id) { await cancelJob(conn, job.id); await conn.commit(); return; }
      await Queue.lockCategory(queue.category, conn);
      [[queue]] = await conn.query('SELECT * FROM queues WHERE id = ? FOR UPDATE', [job.queue_id]);
      if (!queue || queue.patient_id !== job.patient_id) { await cancelJob(conn, job.id); await conn.commit(); return; }
      const waiting = await Queue.projectWaiting(queue.category, conn);
      const position = waiting.findIndex(q => q.id === job.queue_id) + 1;
      const [[settings]] = await conn.query('SELECT threshold FROM sms_settings WHERE id = 1 FOR UPDATE');
      if (!position || position > settings.threshold || queue.sms_alert_state !== 'enqueued' ||
          await queueRecipient(conn, queue) !== job.recipient) {
        await cancelJob(conn, job.id); await conn.commit(); return;
      }
      message = queueMessage(queue, position);
    }
    // Release database locks before the network request; clinic actions must not wait for SMS delivery.
    await conn.commit();
    const result = await sms.sendSMS(job.recipient, message);
    await conn.query(`UPDATE sms_jobs SET state = IF(state = 'submitting', 'submitted', state), payload = NULL, provider_message_id = ?,
      provider_status = ?, last_error = IF(state = 'cancelled', last_error, NULL), next_attempt_at = DATE_ADD(NOW(), INTERVAL 30 SECOND) WHERE id = ?`,
    [result.message_id, result.status, job.id]);
    await conn.query('UPDATE sms_settings SET next_submission_at = ? WHERE id = 1', [new Date(Date.now() + Math.max(5000, result.pauseMs))]);
    await conn.commit();
    console.info(`SMS job ${job.id}: submitted (${result.status}).`);
  } catch (error) {
    const failure = failureDisposition(error, job.attempts);
    await conn.query(`UPDATE sms_jobs SET state = ?, payload = IF(? = 'queued', payload, NULL),
      last_error = ?, next_attempt_at = ? WHERE id = ? AND state = 'submitting'`,
    [failure.state, failure.state, failure.code, new Date(Date.now() + failure.delayMs), job.id]);
    if (error.retryAfter) await conn.query('UPDATE sms_settings SET next_submission_at = ? WHERE id = 1', [new Date(Date.now() + error.retryAfter)]);
    await conn.commit();
    console.warn(`SMS job ${job.id}: ${failure.state} (${failure.code}).`);
  }
}
async function cancelJob(conn, id) {
  await conn.query("UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = 'no_longer_eligible' WHERE id = ?", [id]);
}

async function pollOne(conn) {
  const [[job]] = await conn.query(`SELECT * FROM sms_jobs WHERE state = 'submitted'
    AND provider_status IN ('queued','pending') AND next_attempt_at <= NOW() ORDER BY next_attempt_at, id LIMIT 1`);
  if (!job) return;
  try {
    const result = await sms.getSMSStatus(job.provider_message_id, job.recipient);
    await conn.query(`UPDATE sms_jobs SET provider_status = ?, last_error = NULL, next_attempt_at = DATE_ADD(NOW(), INTERVAL 60 SECOND) WHERE id = ?`, [result.status, job.id]);
    await conn.query('UPDATE sms_settings SET next_poll_at = ? WHERE id = 1', [new Date(Date.now() + Math.max(5000, result.pauseMs))]);
  } catch (error) {
    const code = failureDisposition(error, 3).code;
    await conn.query('UPDATE sms_jobs SET last_error = ?, next_attempt_at = ? WHERE id = ?', [code, new Date(Date.now() + Math.max(60000, error.retryAfter || 0)), job.id]);
    await conn.query('UPDATE sms_settings SET next_poll_at = ? WHERE id = 1', [new Date(Date.now() + Math.max(5000, error.retryAfter || 0))]);
  }
}

let running = false;
let timer;
async function tick() {
  if (running) return;
  running = true;
  let conn;
  let locked = false;
  try {
    conn = await pool.getConnection();
    const [[lock]] = await conn.query("SELECT GET_LOCK('sms_notifications_worker', 0) AS acquired");
    locked = lock.acquired === 1;
    if (!locked) return;
    await conn.query(`UPDATE sms_jobs SET state = 'unknown', payload = NULL, last_error = 'worker_interrupted'
      WHERE state = 'submitting' AND updated_at < DATE_SUB(NOW(), INTERVAL 60 SECOND)`);
    await reconcileCategory('dental');
    await reconcileCategory('general');
    const [[settings]] = await conn.query('SELECT *, NOW() AS db_now FROM sms_settings WHERE id = 1');
    if (!settings.next_submission_at || settings.next_submission_at <= settings.db_now) {
      await conn.query('UPDATE sms_settings SET next_submission_at = DATE_ADD(NOW(), INTERVAL 5 SECOND) WHERE id = 1');
      await submitOne(conn);
    }
    if (!settings.next_poll_at || settings.next_poll_at <= settings.db_now) {
      await conn.query('UPDATE sms_settings SET next_poll_at = DATE_ADD(NOW(), INTERVAL 5 SECOND) WHERE id = 1');
      await pollOne(conn);
    }
  } catch {
    if (conn) await conn.rollback().catch(() => {});
    console.error('SMS worker failed internally; no message content logged.');
  } finally {
    if (locked) await conn.query("SELECT RELEASE_LOCK('sms_notifications_worker')").catch(() => {});
    conn?.release();
    running = false;
  }
}
async function startWorker() {
  if (process.env.SMS_ENABLED !== 'true' || timer) return;
  sms.validateConfig();
  await pool.query('SELECT threshold FROM sms_settings WHERE id = 1');
  timer = setInterval(tick, 5000);
  timer.unref();
  void tick();
}
function wakeWorker() { if (timer) setImmediate(tick); }
module.exports = { enqueuePassword, startWorker, wakeWorker, reconcileCategory, queueRecipient, queueMessage, failureDisposition, tick, submitOne, pollOne };

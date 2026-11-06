const pool = require('../config/db');
const { isIP } = require('node:net');

const ACTIONS = Object.freeze([
  'account.created', 'account.deactivated', 'account.reactivated',
  'password.issued', 'password.replaced', 'password.recovery_completed', 'password.recovery_failed',
  'patient.merged', 'patient.duplicate_override', 'sms.threshold_changed', 'auth.login', 'access.denied',
]);
const OUTCOMES = ['success', 'failed', 'denied'];
const REASONS = new Set([
  'Access denied', 'Request rejected', 'Invalid credentials or unavailable account',
]);
const DEACTIVATION_REASONS = new Set([
  'Account holder requested deactivation',
  'Duplicate account',
  'Account no longer needed',
  'Suspected unauthorized access',
  'Policy violation',
  'Other administrative reason',
]);
const clean = (value, length) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, length) : null;
const id = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const maskPhone = value => typeof value === 'string' && /\d{4}$/.test(value)
  ? `*******${value.slice(-4)}` : null;

// Only these structured values can enter the unified audit log. Never log request/response bodies.
function safeDetails(input = {}) {
  const result = {};
  for (const key of ['patient_id', 'source_patient_id', 'target_patient_id']) {
    if (id(input[key])) result[key] = id(input[key]);
  }
  if (Array.isArray(input.possible_patient_ids)) result.possible_patient_ids = input.possible_patient_ids.map(id).filter(Boolean).slice(0, 20);
  if (input.duplicate_override === true) result.duplicate_override = true;
  if (['patient', 'doctor', 'staff', 'admin'].includes(input.assigned_role)) result.assigned_role = input.assigned_role;
  if (['sms', 'in_person'].includes(input.method)) result.method = input.method;
  if (Number.isInteger(input.http_status) && input.http_status >= 400 && input.http_status <= 599) result.http_status = input.http_status;
  if (maskPhone(input.phone)) result.phone = maskPhone(input.phone);
  if (typeof input.recovery_id === 'string' && /^[a-f\d-]{36}$/.test(input.recovery_id)) {
    result.recovery_id = input.recovery_id;
    if (clean(input.patient_name, 200)) result.patient_name = clean(input.patient_name, 200);
    if (['pending', 'completed', 'failed'].includes(input.recovery_status)) result.recovery_status = input.recovery_status;
    if (['incorrect_code', 'attempts_exhausted', 'delivery_failed'].includes(input.recovery_reason)) result.recovery_reason = input.recovery_reason;
  }
  const safeChange = (key, value) => {
    if (key === 'is_active') return [0, 1, false, true].includes(value) ? Number(value) : null;
    if (key === 'threshold') return Number.isInteger(value) && value >= 1 && value <= 100 ? value : null;
    return undefined;
  };
  if (input.changes && typeof input.changes === 'object') {
    result.changes = {};
    for (const [key, change] of Object.entries(input.changes)) {
      if (!change || typeof change !== 'object') continue;
      const from = safeChange(key, change.from);
      const to = safeChange(key, change.to);
      if (from !== undefined && to !== undefined) result.changes[key] = { from, to };
    }
  }
  return result;
}

async function write(req, event, connection = pool) {
  const actor = req?.auditActor;
  if (actor?.role !== 'admin' && !event.force) return;
  if (!ACTIONS.includes(event.action) || !OUTCOMES.includes(event.outcome || 'success')) throw new Error('Invalid audit event.');
  const ip = req?.ip || req?.socket?.remoteAddress;
  const allowedReason = REASONS.has(event.reason) ||
    (event.action === 'account.deactivated' && DEACTIVATION_REASONS.has(event.reason));
  await connection.query(
    `INSERT INTO audit_logs (actor_user_id, actor_name, actor_role, is_development,
      action, target_type, target_id, outcome, reason, ip_address, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))`,
    [id(actor?.user_id), clean(actor?.name, 200) || (actor ? `User #${id(actor.user_id) || '?'}` : 'Unauthenticated visitor'),
      ['admin', 'staff', 'doctor', 'patient'].includes(actor?.role) ? actor.role : null,
      actor?.development ? 1 : 0, event.action, clean(event.target_type, 32) || 'system', id(event.target_id),
      event.outcome || 'success', allowedReason ? event.reason : event.reason ? 'Reason recorded in source record' : null, isIP(ip || '') ? ip : null,
      JSON.stringify(safeDetails(event.details))],
  );
}

async function bestEffort(req, event, connection = pool) {
  try { await write(req, event, connection); }
  catch { console.error('Audit recording failed.'); }
}

async function setActor(req, user, development = false) {
  req.auditActor = { user_id: user.user_id ?? user.id, role: user.role, development };
  if (development) {
    req.auditActor.name = `Development ${user.role}`;
    return;
  }
  req.auditActor.name = user.audit_name || null;
}

async function transaction(change) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await change(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

module.exports = { ACTIONS, OUTCOMES, DEACTIVATION_REASONS, safeDetails, write, bestEffort, setActor, transaction };

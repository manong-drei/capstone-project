const pool = require('../config/db');
const { parsePagination } = require('../utils/pagination');
const { ACTIONS, OUTCOMES } = require('../services/auditLog');

const fullName = alias => `NULLIF(TRIM(CONCAT_WS(' ', ${alias}.first_name,
  NULLIF(TRIM(${alias}.middle_name), ''), ${alias}.last_name,
  NULLIF(TRIM(${alias}.suffix), ''))), '')`;

function filters(query) {
  const { page, limit } = parsePagination(query, 20);
  const conditions = [];
  const values = [];
  const invalid = () => { throw Object.assign(new Error('Invalid audit log filters.'), { status: 400 }); };
  for (const name of ['dateFrom', 'dateTo', 'actor', 'action', 'outcome']) {
    if (query[name] !== undefined && (typeof query[name] !== 'string' || query[name].length > 200)) invalid();
  }
  for (const name of ['dateFrom', 'dateTo']) {
    const day = query[name];
    if (!day) continue;
    const date = new Date(`${day}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day || day < '1000-01-01' || day > '9999-12-30') invalid();
    // UTC storage; Philippine calendar days start at 16:00 UTC on the previous day.
    const start = new Date(`${day}T00:00:00+08:00`);
    if (name === 'dateTo') start.setUTCDate(start.getUTCDate() + 1);
    conditions.push(`created_at ${name === 'dateFrom' ? '>=' : '<'} ?`);
    values.push(start.toISOString().slice(0, 23).replace('T', ' '));
  }
  if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) invalid();
  if (query.actor?.trim()) {
    conditions.push("(actor_name LIKE ? ESCAPE '!' OR CAST(actor_user_id AS CHAR) = ?)");
    values.push(`%${query.actor.trim().replace(/[!%_]/g, '!$&')}%`, query.actor.trim());
  }
  for (const [name, allowed] of [['action', ACTIONS], ['outcome', OUTCOMES]]) {
    if (!query[name]) continue;
    if (!allowed.includes(query[name])) invalid();
    conditions.push(`${name} = ?`); values.push(query[name]);
  }
  if (!query.action) {
    conditions.push('action IN (?)');
    values.push(ACTIONS);
  }
  return { page, limit, where: `WHERE ${conditions.join(' AND ')}`, values };
}

async function getAuditLogs(req, res) {
  res.set('Cache-Control', 'no-store');
  try {
    const { page: requestedPage, limit, where, values } = filters(req.query || {});
    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, values);
    const total = Number(count.total);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const [events] = await pool.query(`
      SELECT entry.*,
        COALESCE(
          (SELECT ${fullName('p')} FROM patients p
           WHERE (entry.target_type = 'patient' AND p.patient_id = entry.target_id)
              OR (u.role = 'patient' AND p.user_id = u.user_id)
           ORDER BY p.patient_id LIMIT 1),
          (SELECT ${fullName('d')} FROM doctors d
           WHERE (entry.target_type = 'doctor' AND d.doctor_id = entry.target_id)
              OR (u.role = 'doctor' AND d.user_id = u.user_id)
           ORDER BY d.doctor_id LIMIT 1),
          (SELECT ${fullName('s')} FROM staff s
           WHERE u.role IN ('staff', 'admin') AND s.user_id = u.user_id
           ORDER BY s.staff_id LIMIT 1)
        ) AS target_name,
        CASE entry.target_type WHEN 'patient' THEN 'patient' WHEN 'doctor' THEN 'doctor'
          ELSE u.role END AS target_role
      FROM (
        SELECT id, actor_user_id, actor_name, actor_role, is_development,
          action, target_type, target_id, outcome, reason, ip_address, details,
          CONCAT(DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.'), LPAD(MICROSECOND(created_at) DIV 1000, 3, '0'), 'Z') AS created_at
        FROM audit_logs ${where} ORDER BY audit_logs.created_at DESC, id DESC LIMIT ? OFFSET ?
      ) entry
      LEFT JOIN users u ON entry.target_type = 'user' AND u.user_id = entry.target_id
      ORDER BY entry.created_at DESC, entry.id DESC`, [...values, limit, (page - 1) * limit]);
    res.json({ success: true, events, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('Audit history lookup failed.');
    res.status(500).json({ success: false, message: 'Unable to load audit logs. Please try again.' });
  }
}

module.exports = { getAuditLogs, filters };

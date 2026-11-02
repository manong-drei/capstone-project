const audit = require('../services/auditLog');

// This middleware is mounted at /api before authentication; only auditActor is trusted.
const routes = [
  ['POST', /^\/admin\/staff$/, 'account.created', 'user'],
  ['PUT', /^\/admin\/staff\/([^/]+)$/, 'account.updated', 'user'],
  ['PATCH', /^\/admin\/(?:staff|patients)\/([^/]+)\/deactivate$/, 'account.deactivated', 'user'],
  ['PATCH', /^\/admin\/(?:staff|patients)\/([^/]+)\/reactivate$/, 'account.reactivated', 'user'],
  ['POST', /^\/admin\/patients$/, 'account.created', 'user'],
  ['POST', /^\/admin\/patients\/([^/]+)\/temporary-password$/, 'password.replaced', 'user'],
  ['PUT', /^\/admin\/sms-settings$/, 'sms.threshold_changed', 'sms_settings'],
  ['PATCH', /^\/auth\/change-password$/, 'password.changed', 'user'],
  ['POST', /^\/patients\/([^/]+)\/account-recovery$/, 'account.recovered', 'patient'],
  ['POST', /^\/patients\/([^/]+)\/merge$/, 'patient.merged', 'patient'],
  ['POST', /^\/queue\/walkin$/, 'queue.registered', 'queue'],
  ['PATCH', /^\/queue\/([^/]+)\/status$/, 'queue.status_changed', 'queue'],
  ['PATCH', /^\/appointments\/([^/]+)\/status$/, 'appointment.status_changed', 'appointment'],
  ['GET', /^\/appointments$/, 'patient.history_viewed', 'patient_history'],
  ['GET', /^\/patients\/([^/]+)$/, 'patient.viewed', 'patient'],
  ['GET', /^\/doctor\/([^/]+)\/records$/, 'doctor.viewed', 'doctor'],
];

module.exports = (req, res, next) => {
  const path = req.path.replace(/\/$/, '');
  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(path));
  res.once('finish', () => {
    if (res.statusCode < 400) return;
    const restricted = /^\/admin(?:\/|$)/.test(path)
      || (req.method === 'GET' && /^\/doctor\/[^/]+\/records$/.test(path));
    const denied = [401, 403].includes(res.statusCode);
    if (req.auditActor?.role !== 'admin' && !(restricted && denied)) return;
    if (!route && !denied) return;
    const target = route?.[1].exec(path)?.[1];
    void audit.bestEffort(req, {
      action: denied ? 'access.denied' : route[2], target_type: route?.[3] || 'admin', target_id: target,
      outcome: denied ? 'denied' : 'failed', force: restricted && denied,
      reason: denied ? 'Access denied' : 'Request rejected', details: { http_status: res.statusCode },
    });
  });
  next();
};

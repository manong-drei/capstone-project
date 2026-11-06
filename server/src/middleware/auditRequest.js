const audit = require('../services/auditLog');

// A null action keeps target information for access denials only.
const routes = [
  ['POST', /^\/admin\/staff$/, 'account.created', 'user'],
  ['PUT', /^\/admin\/staff\/([^/]+)$/, null, 'user'],
  ['PATCH', /^\/admin\/(?:staff|patients)\/([^/]+)\/deactivate$/, 'account.deactivated', 'user'],
  ['PATCH', /^\/admin\/(?:staff|patients)\/([^/]+)\/reactivate$/, 'account.reactivated', 'user'],
  ['POST', /^\/admin\/patients$/, 'account.created', 'user'],
  ['POST', /^\/admin\/patients\/([^/]+)\/temporary-password$/, 'password.replaced', 'user'],
  ['PUT', /^\/admin\/sms-settings$/, 'sms.threshold_changed', 'sms_settings'],
  ['PATCH', /^\/auth\/change-password$/, null, 'user'],
  ['POST', /^\/patients\/([^/]+)\/account-recovery$/, 'password.issued', 'patient'],
  ['POST', /^\/patients\/([^/]+)\/merge$/, 'patient.merged', 'patient'],
  ['POST', /^\/queue\/walkin$/, null, 'queue'],
  ['PATCH', /^\/queue\/([^/]+)\/status$/, null, 'queue'],
  ['PATCH', /^\/appointments\/([^/]+)\/status$/, null, 'appointment'],
  ['GET', /^\/appointments$/, null, 'patient_history'],
  ['GET', /^\/patients\/([^/]+)$/, null, 'patient'],
  ['GET', /^\/doctor\/([^/]+)\/records$/, null, 'doctor'],
];

// This middleware is mounted at /api before authentication; only auditActor is trusted.
module.exports = (req, res, next) => {
  const path = req.path.replace(/\/$/, '');
  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(path));
  res.once('finish', () => {
    if (res.statusCode < 400) return;
    const restricted = /^\/admin(?:\/|$)/.test(path)
      || (req.method === 'GET' && /^\/doctor\/[^/]+\/records$/.test(path));
    const denied = [401, 403].includes(res.statusCode);
    if (req.auditActor?.role !== 'admin' && !(restricted && denied)) return;
    if (!denied && !route?.[2]) return;
    const target = route?.[1].exec(path)?.[1];
    void audit.bestEffort(req, {
      action: denied ? 'access.denied' : route[2], target_type: route?.[3] || 'admin', target_id: target,
      outcome: denied ? 'denied' : 'failed', force: restricted && denied,
      reason: denied ? 'Access denied' : 'Request rejected', details: { http_status: res.statusCode },
    });
  });
  next();
};

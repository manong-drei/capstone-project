const recovery = require('../services/passwordRecovery');
const notifications = require('../services/smsNotifications');

const handle = action => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await recovery[action](req);
    if (result.retryAfter) res.set('Retry-After', String(result.retryAfter));
    if (result.status) return res.status(result.status).json({ success: false, message: result.message });
    if (action === 'request') notifications.wakeWorker();
    res.json({ success: true, ...result });
  } catch {
    console.error('Password recovery failed internally; no credentials logged.');
    res.status(503).json({ success: false, message: 'Account recovery is unavailable. Please try again or visit clinic reception.' });
  }
};

module.exports = { request: handle('request'), verify: handle('verify'), reset: handle('reset') };

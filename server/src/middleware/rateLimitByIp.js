const { isIP } = require('node:net');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

module.exports = function rateLimitByIp(options) {
  if (!process.env.RAILWAY_DEPLOYMENT_ID) return rateLimit(options);

  return rateLimit({
    ...options,
    keyGenerator(req) {
      // Railway's public edge replaces this header. Keep private callers within the trusted environment.
      const edgeIp = req.get('X-Real-IP');
      return ipKeyGenerator(isIP(edgeIp) ? edgeIp : req.ip);
    },
  });
};

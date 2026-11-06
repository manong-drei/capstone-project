const assert = require('node:assert/strict');
const test = require('node:test');
const rateLimitByIp = require('../src/middleware/rateLimitByIp');

test('Railway proxy headers use separate IP limits and group IPv6 clients by subnet', async t => {
  const loggedError = t.mock.method(console, 'error', () => {});
  const previous = process.env.RAILWAY_DEPLOYMENT_ID;
  process.env.RAILWAY_DEPLOYMENT_ID = 'test';
  let limiter;
  try {
    limiter = rateLimitByIp({
      limit: 1,
      legacyHeaders: false,
      handler: (_req, res, _next, options) => { res.statusCode = options.statusCode; },
    });
  } finally {
    if (previous === undefined) delete process.env.RAILWAY_DEPLOYMENT_ID;
    else process.env.RAILWAY_DEPLOYMENT_ID = previous;
  }

  async function request(edgeIp) {
    const headers = {
      'x-real-ip': edgeIp,
      'x-forwarded-for': '192.0.2.1',
      forwarded: 'for=192.0.2.80',
    };
    const req = { ip: '127.0.0.1', get: name => headers[name.toLowerCase()] };
    const res = { statusCode: 200 };
    await limiter(req, res, error => assert.ifError(error));
    return { key: req.rateLimit.key, status: res.statusCode };
  }

  assert.deepEqual(await request('203.0.113.1'), { key: '203.0.113.1', status: 200 });
  assert.deepEqual(await request('203.0.113.1'), { key: '203.0.113.1', status: 429 });
  assert.deepEqual(await request('203.0.113.2'), { key: '203.0.113.2', status: 200 });
  assert.deepEqual(await request('203.0.113.1, 203.0.113.2'), { key: '127.0.0.1', status: 200 });
  assert.deepEqual(await request(), { key: '127.0.0.1', status: 429 });
  const ipv6 = await request('2001:db8:abcd:12::1');
  assert.equal(ipv6.status, 200);
  assert.deepEqual(await request('2001:db8:abcd:34::2'), { key: ipv6.key, status: 429 });
  assert.equal(loggedError.mock.callCount(), 0);
});

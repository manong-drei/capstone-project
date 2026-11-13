const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../src/routes/adminRoutes');
const authenticate = require('../src/middleware/authenticate');
const { getPatients, createPatient } = require('../src/controllers/adminController');

test('staff can list and create patient accounts, while management remains admin-only', () => {
  for (const layer of router.stack.filter(layer => layer.route)) {
    const { route } = layer;
    const handlers = route.stack.map(item => item.handle);
    assert.equal(handlers[0], authenticate);
    const shared = route.path === '/patients';
    if (shared) assert.equal(handlers.at(-1), route.methods.get ? getPatients : createPatient);
    for (const role of ['staff', 'admin', 'patient', 'doctor']) {
      let allowed = false;
      const res = { status(code) { this.code = code; return this; }, json() {} };
      handlers[1]({ user: { role } }, res, () => { allowed = true; });
      assert.equal(allowed, role === 'admin' || (shared && role === 'staff'), `${role}: ${Object.keys(route.methods)} ${route.path}`);
      if (!allowed) assert.equal(res.code, 403);
    }
  }
});

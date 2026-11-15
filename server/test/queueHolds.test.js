const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const User = require('../src/models/User');
const router = require('../src/routes/queueRoutes');
const migrate = require('../src/config/migrateQueueHolds');

test('hold migration is idempotent and preserves existing ticket data', async t => {
  const columns = [{ Field: 'queue_number', Type: 'varchar(20)' }];
  const indexes = [];
  const writes = [];
  t.mock.method(pool, 'end', async () => {});
  t.mock.method(console, 'log', () => {});
  t.mock.method(pool, 'query', async sql => {
    if (sql.startsWith('SHOW COLUMNS')) return [columns];
    if (sql.startsWith('SHOW INDEX')) return [indexes];
    writes.push(sql);
    if (sql.includes('ADD COLUMN')) columns.push({ Field: sql.match(/ADD COLUMN (\w+)/)[1] });
    if (sql.includes('ADD INDEX')) indexes.push({ Key_name: 'queues_hold_expiry' });
    return [{}];
  });
  await migrate();
  await migrate();
  assert.equal(writes.filter(sql => sql.includes('ADD COLUMN')).length, 4);
  assert.equal(writes.filter(sql => sql.includes('ADD INDEX')).length, 1);
  assert.ok(writes.filter(sql => sql.includes('MODIFY COLUMN status')).every(sql => sql.includes("'held', 'expired'")));
  assert.ok(writes.every(sql => sql.startsWith('ALTER TABLE queues')));
});

test('hold endpoints are staff-only and validate IDs, missing tickets, invalid transitions, and elapsed holds', async t => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'hold-route-test-secret';
  t.after(() => { if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; });
  let role = 'staff';
  let result = { id: 1, status: 'held' };
  let failure;
  let writes = 0;
  t.mock.method(User, 'findById', async () => ({ user_id: 4, role, is_active: 1, credential_version: 1, must_change_password: 0 }));
  for (const method of ['hold', 'reactivate', 'holdRemaining']) t.mock.method(Queue, method, async () => {
    writes++;
    if (failure) throw Object.assign(new Error('Invalid transition.'), { status: 409 });
    return result;
  });
  const dispatch = async (path, id = '1') => {
    const route = router.stack.find(layer => layer.route?.path === path).route;
    const req = { headers: { authorization: `Bearer ${jwt.sign({ user_id: 4, role, credential_version: 1, purpose: 'session' }, process.env.JWT_SECRET)}` }, params: { id }, body: {} };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  };
  for (role of ['patient', 'doctor', 'admin']) {
    for (const path of ['/hold-remaining', '/:id/hold', '/:id/reactivate']) assert.equal((await dispatch(path)).statusCode, 403);
  }
  assert.equal(writes, 0);
  role = 'staff';
  for (const path of ['/hold-remaining', '/:id/hold', '/:id/reactivate']) assert.equal((await dispatch(path)).statusCode, 200);
  assert.equal((await dispatch('/:id/hold', 'bad')).statusCode, 400);
  result = null;
  assert.equal((await dispatch('/:id/reactivate')).statusCode, 404);
  failure = true;
  assert.equal((await dispatch('/:id/reactivate')).statusCode, 409);
  failure = false;
  result = { expired: true, held: true };
  const expired = await dispatch('/:id/reactivate');
  assert.equal(expired.statusCode, 409);
  assert.match(expired.body.message, /24-hour hold has expired/);
});

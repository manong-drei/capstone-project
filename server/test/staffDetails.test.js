const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');
const audit = require('../src/services/auditLog');
const admin = require('../src/controllers/adminController');
const migrate = require('../src/config/migrateStaffDetails');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } });
test.after(() => pool.end());

test('staff details migration preserves existing columns and is safe to rerun', async () => {
  const columns = { staff: ['gender'], doctors: [] };
  const changes = [];
  const connection = { async query(sql) {
    const table = sql.split(' ')[sql.startsWith('SHOW') ? 3 : 2];
    if (sql.startsWith('SHOW')) return [columns[table].map(Field => ({ Field }))];
    changes.push(sql);
    columns[table].push(sql.split(' ')[5]);
    return [{}];
  } };
  await migrate(connection);
  await migrate(connection);
  assert.equal(changes.length, 3);
  assert.ok(changes.every(sql => sql.includes('NULL DEFAULT NULL')));
});

test('staff and doctor accounts save outside-city addresses, clear fields, and preserve omitted details', async t => {
  let role = 'staff';
  const writes = [];
  const conn = { async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql, values) { writes.push({ sql, values }); return [{ insertId: 7 }]; } };
  t.mock.method(pool, 'getConnection', async () => conn);
  t.mock.method(pool, 'query', async sql => sql.includes('SELECT user_id, role') ? [[{ user_id: 7, role }]] : [[]]);
  t.mock.method(bcrypt, 'hash', async () => 'test-hash');
  t.mock.method(audit, 'write', async () => {});
  t.mock.method(console, 'error', () => {});
  for (role of ['staff', 'doctor']) {
    writes.length = 0;
    const body = { first_name: 'Ana', last_name: 'Santos', phone: '09123456789', password: 'test-password',
      role, position: 'Clerk', license_number: 'TEST-123', gender: 'Female', address: '  Bacolod City, Negros Occidental  ' };
    let res = response();
    await admin.createStaff({ body }, res);
    assert.equal(res.statusCode, 201);
    const insert = writes.find(write => write.sql.includes(`INSERT INTO ${role === 'doctor' ? 'doctors' : 'staff'}`));
    assert.deepEqual(insert.values.slice(-2), ['Female', 'Bacolod City, Negros Occidental']);
    for (const [details, expected] of [[{ gender: 'Other', address: 'Iloilo City' }, ['Other', 'Iloilo City']], [{ gender: '', address: '' }, [null, null]]]) {
      writes.length = 0;
      res = response();
      await admin.updateStaff({ params: { user_id: 7 }, body: details }, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(writes[0].values, [...expected, 7]);
    }
    writes.length = 0;
    res = response();
    await admin.updateStaff({ params: { user_id: 7 }, body: { first_name: 'Ana' } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(writes.every(write => !/gender|address/.test(write.sql)));
    for (const invalid of [{ gender: 'invalid' }, { gender: {} }, { address: {} }, { address: 'x'.repeat(256) }]) {
      for (const handler of [admin.createStaff, admin.updateStaff]) {
        writes.length = 0;
        res = response();
        await handler({ params: { user_id: 7 }, body: { ...body, ...invalid } }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(writes.length, 0);
      }
    }
  }
});

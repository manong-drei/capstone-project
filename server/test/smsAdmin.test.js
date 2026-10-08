const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const User = require('../src/models/User');
const sms = require('../src/utils/sms');
const { createPatient } = require('../src/controllers/adminController');
const { replacePassword } = require('../src/controllers/smsController');
const adminRouter = require('../src/routes/adminRoutes');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('patient creation commits the encrypted SMS with the account and exposes only job status', async () => {
  const saved = { getConnection: pool.getConnection, query: pool.query, generate: User.generateTempPassword, key: process.env.SMS_ENCRYPTION_KEY };
  process.env.SMS_ENCRYPTION_KEY = 'ef'.repeat(32);
  const statements = [];
  const conn = {
    async beginTransaction() {}, async rollback() {}, release() {},
    async commit() { statements.push({ sql: 'COMMIT' }); },
    async query(sql, values) {
      statements.push({ sql, values });
      return [{ insertId: sql.includes('INSERT INTO users') ? 7 : sql.includes('INSERT INTO patients') ? 42 : 99 }];
    },
  };
  pool.getConnection = async () => conn;
  pool.query = async () => [[]];
  User.generateTempPassword = () => '012345';
  try {
    const res = response();
    await createPatient({ body: { first_name: 'Ana', last_name: 'Santos', phone: '09123456789', address: 'Poblacion', date_of_birth: '1990-01-01', gender: 'Female' } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.sms_status, 'queued');
    assert.equal(res.body.temp_password, undefined);
    assert.ok(!JSON.stringify(res.body).includes('012345'));
    const jobIndex = statements.findIndex(row => row.sql.includes('INSERT INTO sms_jobs'));
    assert.ok(jobIndex < statements.findIndex(row => row.sql === 'COMMIT'));
    const payload = statements[jobIndex].values.at(-1);
    assert.ok(!payload.includes('012345'));
    assert.match(sms.decryptPayload(payload), /012345/);
    assert.equal(statements[jobIndex].values[3], '09123456789');
  } finally {
    pool.getConnection = saved.getConnection; pool.query = saved.query; User.generateTempPassword = saved.generate;
    if (saved.key === undefined) delete process.env.SMS_ENCRYPTION_KEY; else process.env.SMS_ENCRYPTION_KEY = saved.key;
  }
});

test('replacement requires identity confirmation and pending activation, invalidates old credentials, and audits issuance', async () => {
  const saved = { getConnection: pool.getConnection, generate: User.generateTempPassword, key: process.env.SMS_ENCRYPTION_KEY };
  process.env.SMS_ENCRYPTION_KEY = 'ef'.repeat(32);
  User.generateTempPassword = () => '654321';
  const statements = [];
  let user = { user_id: 7, phone: '09123456789', is_active: 1, must_change_password: 1, credential_version: 1 };
  pool.getConnection = async () => ({
    async beginTransaction() {}, async commit() { statements.push({ sql: 'COMMIT' }); }, async rollback() {}, release() {},
    async query(sql, values) {
      statements.push({ sql, values });
      if (sql.includes('SELECT * FROM users')) return [[user]];
      if (sql.includes('SELECT patient_id')) return [[{ patient_id: 42 }]];
      return [{ insertId: 99 }];
    },
  });
  const req = identity_confirmed => ({ params: { user_id: '7' }, body: { identity_confirmed, phone: '09987654321' }, user: { user_id: 4 } });
  try {
    let res = response(); await replacePassword(req(false), res); assert.equal(res.statusCode, 400); assert.equal(statements.length, 0);
    res = response(); await replacePassword(req(true), res); assert.equal(res.statusCode, 201);
    assert.ok(!JSON.stringify(res.body).includes('654321'));
    assert.ok(statements.some(row => row.sql.includes('UPDATE users SET password_hash') && row.values[1] === 2));
    assert.ok(statements.some(row => row.sql.includes("state = 'cancelled', payload = NULL")));
    const job = statements.find(row => row.sql.includes('INSERT INTO sms_jobs'));
    assert.equal(job.values[3], user.phone); assert.equal(job.values[4], 'password:7:2');
    assert.ok(statements.some(row => row.sql.includes('INSERT INTO sms_password_audit') && row.values.join(',') === '7,4,2'));
    user = { ...user, must_change_password: 0 };
    res = response(); await replacePassword(req(true), res); assert.equal(res.statusCode, 409);
    user = { ...user, must_change_password: 1, is_active: 0 };
    res = response(); await replacePassword(req(true), res); assert.equal(res.statusCode, 409);
  } finally {
    pool.getConnection = saved.getConnection; User.generateTempPassword = saved.generate;
    if (saved.key === undefined) delete process.env.SMS_ENCRYPTION_KEY; else process.env.SMS_ENCRYPTION_KEY = saved.key;
  }
});

test('actual admin route middleware denies patients and enforces threshold validation', async () => {
  const saved = { find: User.findById, query: pool.query, secret: process.env.JWT_SECRET };
  process.env.JWT_SECRET = 'test-only-secret';
  const writes = [];
  let role = 'patient';
  User.findById = async () => ({ user_id: 4, role, is_active: 1, credential_version: 1, must_change_password: 0 });
  pool.query = async (sql, values) => { if (values) writes.push(values); return [[{ threshold: 5 }]]; };
  const dispatch = async (path, method, body = {}) => {
    const route = adminRouter.stack.find(layer => layer.route?.path === path && layer.route.methods[method.toLowerCase()]).route;
    const token = jwt.sign({ user_id: 4, role: 'admin', credential_version: 1, purpose: 'session' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, path, method, body };
    const res = response();
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  };
  try {
    for (const [path, method] of [['/sms-settings', 'GET'], ['/sms-settings', 'PUT'], ['/sms-jobs', 'GET'], ['/patients/:user_id/temporary-password', 'POST']]) {
      assert.equal((await dispatch(path, method)).statusCode, 403);
    }
    assert.equal(writes.length, 0);
    role = 'admin';
    assert.equal((await dispatch('/sms-settings', 'GET')).body.data.threshold, 5);
    for (const threshold of [0, 101, 1.5, '5', null]) assert.equal((await dispatch('/sms-settings', 'PUT', { threshold })).statusCode, 400);
    assert.equal((await dispatch('/sms-settings', 'PUT', { threshold: 7 })).statusCode, 200);
    assert.deepEqual(writes, [[7, 4]]);
  } finally {
    User.findById = saved.find; pool.query = saved.query;
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
  }
});

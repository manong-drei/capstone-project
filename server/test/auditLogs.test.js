const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const audit = require('../src/services/auditLog');
const { filters, getAuditLogs } = require('../src/controllers/auditLogController');
const auditRequest = require('../src/middleware/auditRequest');
const authenticate = require('../src/middleware/authenticate');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Queue = require('../src/models/Queue');
const Appointment = require('../src/models/Appointment');
const admin = require('../src/controllers/adminController');
const sms = require('../src/controllers/smsController');
const auth = require('../src/controllers/authController');
const router = require('../src/routes/adminRoutes');
const { migrate } = require('../src/config/migrateAuditLogs');

test.after(() => pool.end());
const response = () => ({ statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = () => ({ auditActor: { user_id: 4, name: 'Test Admin', role: 'admin' }, user: { user_id: 4, role: 'admin' }, ip: '127.0.0.1', body: {}, params: {} });

test('migration preserves the original audit table and safely resumes without importing its contents', async () => {
  const calls = [];
  let columns = ['log_id', 'user_id', 'action', 'table_name', 'record_id', 'details', 'created_at'];
  const db = { async query(sql) {
    calls.push(sql);
    if (sql.includes('information_schema.columns')) return [columns.map(name => ({ name }))];
    if (sql.includes('information_schema.tables')) return [[{ count: 0 }]];
    if (sql.startsWith('RENAME')) columns = [];
    if (sql.startsWith('CREATE')) columns = ['id', 'actor_user_id', 'actor_name', 'actor_role', 'is_development', 'action', 'target_type', 'target_id', 'outcome', 'reason', 'ip_address', 'details', 'created_at'];
    return [{}];
  } };
  await migrate(db); await migrate(db);
  assert.equal(calls.filter(sql => sql.startsWith('RENAME')).length, 1);
  assert.ok(calls.includes('RENAME TABLE audit_logs TO audit_logs_legacy'));
  assert.ok(!calls.some(sql => /DROP|DELETE|INSERT/i.test(sql)));
  await assert.rejects(migrate({ async query() { return [[{ name: 'unexpected_schema' }]]; } }));
});

test('migration refuses to overwrite an existing legacy archive', async () => {
  const calls = [];
  await assert.rejects(migrate({ async query(sql) {
    calls.push(sql);
    return sql.includes('information_schema.columns')
      ? [['log_id', 'user_id', 'action', 'table_name', 'record_id', 'details', 'created_at'].map(name => ({ name }))]
      : [[{ count: 1 }]];
  } }), /refusing to overwrite/);
  assert.equal(calls.length, 2);
});

test('audit details allowlist excludes secrets, clinical data, and identity answers while masking phones', async t => {
  let values;
  const req = request();
  await audit.write(req, { action: 'account.updated', target_type: 'user', target_id: 9,
    reason: 'Private medical information', details: {
      password: 'secret', password_hash: 'hash', token: 'token', notes: 'private', verification: { phone: true },
      phone: '09123456789', assigned_role: 'admin',
      changed_fields: ['first_name', 'phone', 'password', 'diagnosis'],
      changes: { first_name: { from: 'Private Name', to: 'Other Name' }, phone: { from: '09123456780', to: '09123456789' },
        status: { from: 'waiting', to: 'cancelled' }, password: { from: 'secret', to: 'secret' } },
    } }, { async query(sql, args) { assert.match(sql, /UTC_TIMESTAMP\(3\)/); values = args; } });
  assert.equal(values[0], 4);
  assert.equal(values[8], 'Reason recorded in source record');
  const details = JSON.parse(values[10]);
  assert.equal(details.phone, '*******6789');
  assert.deepEqual(details.changed_fields, ['first_name', 'phone']);
  assert.deepEqual(details.changes.status, { from: 'waiting', to: 'cancelled' });
  assert.deepEqual(details.changes.phone, { from: '*******6780', to: '*******6789' });
  assert.doesNotMatch(JSON.stringify(values), /secret|hash|token|Private Name|Private medical|09123456789|verification|diagnosis/);
  t.mock.method(pool, 'query', async () => { throw new Error('Should not write'); });
  await audit.write({ user: { role: 'admin' }, body: { auditActor: req.auditActor } }, { action: 'account.created' });
});

test('Philippine date ranges are inclusive across UTC midnight; all filters and paging are validated', () => {
  const result = filters({ dateFrom: '2026-10-29', dateTo: '2026-10-29', actor: "Admin_%!' OR 1=1", action: 'auth.login', outcome: 'failed', page: '2' });
  assert.deepEqual(result.values.slice(0, 2), ['2026-10-28 16:00:00.000', '2026-10-29 16:00:00.000']);
  assert.equal(result.values[2], "%Admin!_!%!!' OR 1=1%");
  assert.ok(!result.where.includes('OR 1=1'));
  for (const query of [
    { dateFrom: '2026-02-30' }, { dateTo: 'bad' }, { dateFrom: '2026-10-30', dateTo: '2026-10-29' },
    { actor: ['4'] }, { actor: 'a'.repeat(201) }, { action: 'unknown' }, { outcome: 'unknown' },
    { page: '0' }, { limit: '101' }, { dateFrom: '2026-01-01T00:00:00Z' },
  ]) assert.throws(() => filters(query), { status: 400 });
});

test('audit listing has deterministic ordering, pagination, UTC serialization and generic failures', async t => {
  const calls = [];
  const queryMock = t.mock.method(pool, 'query', async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes('COUNT(*)') ? [[{ total: 21 }]] : [[{ id: 7, created_at: '2026-10-28T16:30:00.000Z' }]];
  });
  const res = response();
  await getAuditLogs({ query: { page: '2', limit: '20' } }, res);
  assert.deepEqual(res.body.pagination, { page: 2, limit: 20, total: 21, totalPages: 2 });
  assert.deepEqual(calls[1].values, [20, 20]);
  assert.match(calls[1].sql, /ORDER BY created_at DESC, id DESC LIMIT \? OFFSET \?/);
  assert.match(calls[1].sql, /AS created_at/);
  t.mock.method(console, 'error', () => {});
  queryMock.mock.mockImplementation(async () => { throw new Error('secret connection string'); });
  const failed = response(); await getAuditLogs({ query: {} }, failed);
  assert.equal(failed.statusCode, 500); assert.doesNotMatch(JSON.stringify(failed.body), /secret/);
});

test('audit endpoint is read-only and only a current verified admin can access it', async t => {
  const route = router.stack.find(layer => layer.route?.path === '/audit-logs').route;
  assert.deepEqual(Object.keys(route.methods), ['get']);
  t.mock.method(User, 'findById', async () => ({ user_id: 4, role: 'patient', is_active: 1, credential_version: 1 }));
  process.env.JWT_SECRET = 'audit-test-only';
  t.after(() => { delete process.env.JWT_SECRET; });
  const req = { headers: { authorization: `Bearer ${jwt.sign({ user_id: 4, role: 'admin', purpose: 'session', credential_version: 1 }, process.env.JWT_SECRET)}` }, path: '/audit-logs', method: 'GET' };
  const res = response();
  for (const layer of route.stack) {
    let next = false;
    await layer.handle(req, res, () => { next = true; });
    if (!next) break;
  }
  assert.equal(res.statusCode, 403);
  assert.equal(req.auditActor.role, 'patient');
  let passed = false;
  await authenticate({ headers: {} }, response(), () => { passed = true; });
  assert.equal(passed, false);
});

test('account status changes commit accurate before/after values and roll back on audit failure', async t => {
  for (const fails of [false, true]) {
    const calls = [];
    const conn = {
      async beginTransaction() { calls.push('begin'); }, async commit() { calls.push('commit'); },
      async rollback() { calls.push('rollback'); }, release() { calls.push('release'); },
      async query(sql, values) {
        if (sql.startsWith('SELECT')) return [[{ user_id: 9, role: 'patient', is_active: 1 }]];
        if (sql.includes('INSERT INTO audit_logs')) {
          assert.deepEqual(JSON.parse(values[10]).changes.is_active, { from: 1, to: 0 });
          calls.push('audit'); if (fails) throw new Error('audit unavailable');
        } else calls.push('update');
        return [{}];
      },
    };
    const connectionMock = t.mock.method(pool, 'getConnection', async () => conn);
    const errorMock = t.mock.method(console, 'error', () => {});
    const req = request(); req.params.user_id = '9'; const res = response();
    await admin.deactivatePatient(req, res);
    assert.equal(res.statusCode, fails ? 500 : 200);
    assert.deepEqual(calls, ['begin', 'update', 'audit', fails ? 'rollback' : 'commit', 'release']);
    connectionMock.mock.restore(); errorMock.mock.restore();
  }
});

test('SMS threshold changes record the locked previous value and rollback on audit failure', async t => {
  const calls = [];
  const conn = { async beginTransaction() {}, async commit() { calls.push('commit'); }, async rollback() { calls.push('rollback'); }, release() {},
    async query(sql, values) {
      if (sql.startsWith('SELECT')) { assert.match(sql, /FOR UPDATE/); return [[{ threshold: 5 }]]; }
      if (sql.includes('INSERT INTO audit_logs')) { assert.deepEqual(JSON.parse(values[10]).changes.threshold, { from: 5, to: 7 }); throw Error('fail'); }
      calls.push('update'); return [{}];
    } };
  t.mock.method(pool, 'getConnection', async () => conn);
  const req = request(); req.body.threshold = 7; const res = response();
  await sms.updateSettings(req, res);
  assert.equal(res.statusCode, 500); assert.deepEqual(calls, ['update', 'rollback']);
});

test('patient hooks produce one merge event, distinct duplicate override, and exclude verification details', async t => {
  const events = [];
  const conn = { async query(sql, values) { if (sql.includes('INSERT INTO audit_logs')) events.push({ action: values[4], details: JSON.parse(values[10]) }); return [{}]; } };
  const req = request();
  await Patient.audit(1, 4, 'merged_into', { target_patient_id: 2 }, conn, req);
  await Patient.audit(2, 4, 'merged_from', { source_patient_id: 1 }, conn, req);
  await Patient.audit(1, 4, 'account_recovery', { user_id: 8, verification: { date_of_birth: true }, temp_password: 'secret' }, conn, req);
  await Patient.audit(3, 4, 'create', { duplicate_override: true, possible_patient_ids: [1] }, conn, req);
  assert.deepEqual(events.map(event => event.action), ['patient.merged', 'account.recovered', 'patient.created', 'patient.duplicate_override']);
  assert.doesNotMatch(JSON.stringify(events), /verification|date_of_birth|secret/);
  t.mock.method(pool, 'query', async () => { throw Error('audit unavailable'); });
  t.mock.method(console, 'error', () => {});
  await Patient.audit(1, 4, 'view', null, pool, req);
});

test('queue changes and related appointments share the same audit transaction and previous statuses', async t => {
  const statements = [];
  const conn = { async query(sql, values) {
    statements.push({ sql, values });
    if (sql.startsWith('SELECT appointment_id')) return [[{ appointment_id: 8, status: 'confirmed' }]];
    return [[]];
  } };
  t.mock.method(Queue, '_withTicket', async (id, change) => change({ id, status: 'waiting', patient_id: 5, is_walk_in: 0, created_at: new Date() }, conn));
  t.mock.method(Queue, '_fetchById', async () => ({ id: 7, status: 'cancelled' }));
  await Queue.updateStatus(7, 'cancelled', 'Wait time too long', { auditRequest: request() });
  const entry = statements.find(row => row.sql.includes('INSERT INTO audit_logs'));
  assert.deepEqual(JSON.parse(entry.values[10]).changes.status, { from: 'waiting', to: 'cancelled' });
  assert.deepEqual(JSON.parse(entry.values[10]).appointments, [{ appointment_id: 8, from: 'confirmed', to: 'cancelled' }]);
  assert.ok(statements.find(row => row.sql.startsWith('UPDATE appointments')));
  assert.equal(entry.values[8], 'Wait time too long');
});

test('appointment and admin password changes roll back when auditing fails', async t => {
  let rollbacks = 0; let commits = 0;
  t.mock.method(pool, 'getConnection', async () => ({
    async beginTransaction() {}, async commit() { commits++; }, async rollback() { rollbacks++; }, release() {},
    async query(sql) {
      if (sql.startsWith('SELECT')) return [[{ status: 'pending' }]];
      if (sql.includes('INSERT INTO audit_logs')) throw Error('audit unavailable');
      return [{ affectedRows: 1 }];
    },
  }));
  await assert.rejects(Appointment.updateStatus(1, 'cancelled', request()));
  await assert.rejects(User.updatePassword(4, 'ValidPassword1', 1, request()));
  assert.equal(rollbacks, 2); assert.equal(commits, 0);
});

test('failed admin sign-in identifies the target without claiming an authenticated actor; success is best effort', async t => {
  const events = [];
  const authMock = t.mock.method(User, 'authenticate', async () => null);
  const queryMock = t.mock.method(pool, 'query', async (sql, values) => {
    if (sql.includes('INSERT INTO audit_logs')) { events.push(values); return [{}]; }
    return [[{ user_id: 9, role: 'admin', name: 'Admin' }]];
  });
  const req = { body: { phone: '09123456789', password: 'secret' }, ip: '127.0.0.1' };
  const res = response(); await auth.login(req, res);
  assert.equal(res.statusCode, 401); assert.equal(events[0][0], null); assert.equal(events[0][6], 9);
  assert.equal(events[0][7], 'failed'); assert.doesNotMatch(JSON.stringify(events), /secret|09123456789/);
  authMock.mock.mockImplementation(async () => ({ user: { user_id: 9, role: 'admin' }, token: 'private' }));
  queryMock.mock.mockImplementation(async () => { throw Error('unavailable'); }); t.mock.method(console, 'error', () => {});
  const success = response(); await auth.login(req, success); assert.equal(success.statusCode, 200);
});

test('rejected/denied requests use trusted actors, include a safe outcome, and do not audit successful requests twice', async t => {
  const events = [];
  t.mock.method(audit, 'bestEffort', async (req, event) => { events.push(event); });
  const finish = async (req, code) => {
    const res = new EventEmitter(); res.statusCode = code;
    auditRequest(req, res, () => {}); res.emit('finish'); await new Promise(resolve => setImmediate(resolve));
  };
  await finish({ path: '/admin/staff', method: 'POST', user: { role: 'admin' } }, 401);
  await finish({ ...request(), path: '/queue/7/status', method: 'PATCH' }, 409);
  await finish({ auditActor: { user_id: 9, role: 'patient' }, path: '/doctor/7/records', method: 'GET' }, 403);
  await finish({ ...request(), path: '/admin/staff', method: 'POST' }, 201);
  assert.equal(events.length, 3); assert.equal(events[0].outcome, 'denied'); assert.equal(events[0].force, true);
  assert.equal(events[1].action, 'queue.status_changed'); assert.equal(events[1].outcome, 'failed');
  assert.equal(events[2].force, true); assert.equal(events[2].target_type, 'doctor');
});

test('development identities are explicit and cannot be mistaken for named production admins', async t => {
  const req = {};
  await audit.setActor(req, { id: 4, role: 'admin' }, true);
  const values = [];
  await audit.write(req, { action: 'doctor.viewed', target_type: 'doctor', target_id: 7 }, { async query(sql, args) { values.push(args); } });
  assert.equal(values[0][3], 1); assert.equal(values[0][1], 'Development admin');
});

test('account creation, staff edits and replacement passwords audit on the mutation connection', async t => {
  const entries = [];
  let committed = false;
  const conn = {
    async beginTransaction() { committed = false; }, async commit() { committed = true; }, async rollback() {}, release() {},
    async query(sql, values) {
      if (sql.includes('INSERT INTO audit_logs')) { assert.equal(committed, false); entries.push({ action: values[4], details: JSON.parse(values[10]) }); }
      if (sql.startsWith('SELECT u.phone')) return [[{ phone: '09123456780', first_name: 'Before', email: 'old@example.com' }]];
      if (sql.includes('SELECT * FROM users')) return [[{ user_id: 9, is_active: 1, must_change_password: 1, phone: '09123456789', credential_version: 1 }]];
      if (sql.includes('SELECT patient_id FROM patients')) return [[{ patient_id: 42 }]];
      return [{ insertId: sql.includes('INSERT INTO users') ? 9 : sql.includes('INSERT INTO patients') ? 42 : 1 }];
    },
  };
  t.mock.method(pool, 'getConnection', async () => conn);
  t.mock.method(pool, 'query', async sql => sql.startsWith('SELECT user_id, role') ? [[{ user_id: 9, role: 'staff' }]] : [[]]);
  const req = request(); req.body = { first_name: 'Private', last_name: 'Patient', phone: '09123456789', password: 'PrivatePassword1', role: 'admin' };
  let res = response(); await admin.createStaff(req, res); assert.equal(res.statusCode, 201);
  assert.equal(entries[0].action, 'account.created'); assert.equal(entries[0].details.assigned_role, 'admin');
  req.params.user_id = '9'; req.body = { first_name: 'PrivateName', phone: '09123456789' };
  res = response(); await admin.updateStaff(req, res); assert.equal(res.statusCode, 200);
  assert.deepEqual(entries[1].details.changed_fields, ['first_name', 'phone']);
  const key = process.env.SMS_ENCRYPTION_KEY; process.env.SMS_ENCRYPTION_KEY = 'ab'.repeat(32);
  t.after(() => { if (key === undefined) delete process.env.SMS_ENCRYPTION_KEY; else process.env.SMS_ENCRYPTION_KEY = key; });
  req.body = { first_name: 'Private', last_name: 'Patient', phone: '09123456789', address: 'Poblacion', date_of_birth: '1990-01-01', gender: 'Female' };
  res = response(); await admin.createPatient(req, res); assert.equal(res.statusCode, 201);
  req.body = { identity_confirmed: true };
  res = response(); await sms.replacePassword(req, res); assert.equal(res.statusCode, 201);
  assert.deepEqual(entries.map(row => row.action), ['account.created', 'account.updated', 'account.created', 'password.issued', 'password.replaced']);
  assert.doesNotMatch(JSON.stringify(entries), /PrivateName|PrivatePassword|1990-01-01|Poblacion|09123456789/);
});

test('MySQL audit schema supports rollback, filters and Philippine midnight using isolated temporary tables', { skip: process.env.AUDIT_DB_TESTS !== 'true' }, async () => {
  const connection = await pool.getConnection();
  const saved = { query: pool.query, getConnection: pool.getConnection };
  try {
    await connection.query('CREATE TEMPORARY TABLE audit_fixture LIKE audit_logs');
    await connection.query('CREATE TEMPORARY TABLE audit_logs LIKE audit_fixture');
    await connection.query('DROP TEMPORARY TABLE audit_fixture');
    await connection.query('CREATE TEMPORARY TABLE users (user_id INT PRIMARY KEY, role VARCHAR(20), is_active BOOLEAN) ENGINE=InnoDB');
    await connection.query("INSERT INTO users VALUES (9, 'patient', 1)");
    const databaseErrors = [];
    pool.getConnection = async () => ({
      async query(...args) { try { return await connection.query(...args); } catch (error) { databaseErrors.push(error.code); throw error; } }, beginTransaction: connection.beginTransaction.bind(connection),
      commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {},
    });
    pool.query = connection.query.bind(connection);
    const req = request(); req.params.user_id = '9';
    const res = response(); await admin.deactivatePatient(req, res); assert.equal(res.statusCode, 200, databaseErrors.join(', '));
    const [[entry]] = await connection.query('SELECT * FROM audit_logs');
    assert.deepEqual(JSON.parse(entry.details).changes.is_active, { from: 1, to: 0 });
    await connection.query("UPDATE audit_logs SET created_at = '2026-10-28 16:00:00.000'");
    await connection.query("INSERT INTO audit_logs (actor_name, action, target_type, outcome, details, created_at) VALUES ('Visitor', 'access.denied', 'admin', 'denied', '{}', '2026-10-29 15:59:59.999'), ('Visitor', 'access.denied', 'admin', 'denied', '{}', '2026-10-29 16:00:00.000')");
    const logs = response(); await getAuditLogs({ query: { dateFrom: '2026-10-29', dateTo: '2026-10-29' } }, logs);
    assert.equal(logs.statusCode, 200); assert.equal(logs.body.pagination.total, 2);
    assert.equal(logs.body.events[1].created_at, '2026-10-28T16:00:00.000Z');
    // Reject a new success audit at the database layer, then verify the account update rolled back too.
    await connection.query('ALTER TABLE audit_logs ADD CONSTRAINT audit_reject_success CHECK (target_id IS NULL OR target_id = 9)');
    await connection.query("INSERT INTO users VALUES (10, 'patient', 1)");
    req.params.user_id = '10'; const rejected = response(); await admin.deactivatePatient(req, rejected);
    assert.equal(rejected.statusCode, 500);
    const [[user]] = await connection.query('SELECT is_active FROM users WHERE user_id = 10'); assert.equal(user.is_active, 1);
    const [[count]] = await connection.query('SELECT COUNT(*) AS total FROM audit_logs'); assert.equal(count.total, 3);
  } finally {
    pool.query = saved.query; pool.getConnection = saved.getConnection;
    await connection.query('DROP TEMPORARY TABLE IF EXISTS audit_logs, users');
    connection.release();
  }
});

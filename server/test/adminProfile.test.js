const assert = require('node:assert/strict');
const test = require('node:test');
const pool = require('../src/config/db');
const Staff = require('../src/models/Staff');
const auth = require('../src/controllers/authController');
const admin = require('../src/controllers/adminController');

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
test.after(() => pool.end());

test('missing admin profiles require real names and preserve the account contact number', async () => {
  const writes = [];
  let user = { phone: '09123456789', staff_id: null };
  const connection = {
    async query(sql, values) {
      if (sql.startsWith('SELECT')) {
        assert.match(sql, /u\.role = 'admin' FOR UPDATE/);
        assert.deepEqual(values, [7]);
        return [[user].filter(Boolean)];
      }
      writes.push({ sql, values });
      return [{ insertId: 21 }];
    },
  };
  for (const changes of [{ first_name: 'Ana' }, { first_name: ' ', last_name: 'Reyes' }]) {
    await assert.rejects(Staff.ensureAdminProfile(7, changes, connection), { status: 400 });
  }
  assert.equal(writes.length, 0);
  await Staff.ensureAdminProfile(7, { first_name: ' Ana ', last_name: ' Reyes ', middle_name: ' Cruz ', suffix: ' Jr. ' }, connection);
  assert.match(writes[0].sql, /^INSERT INTO staff/);
  assert.deepEqual(writes[0].values, [7, 'Ana', 'Cruz', 'Reyes', 'Jr.', 'Administrator', '09123456789']);
  user.staff_id = 21;
  await Staff.ensureAdminProfile(7, { middle_name: null }, connection);
  assert.equal(writes.length, 1, 'Existing profiles must not be recreated or require resending names');
  user = null;
  await assert.rejects(Staff.ensureAdminProfile(7, { first_name: 'Ana', last_name: 'Reyes' }, connection), { status: 404 });
});

test('local admin seed creates the account and named profile together, rolling back a failed profile insert', {
  skip: !require('node:fs').existsSync(require('node:path').join(__dirname, '../src/seedAdmin.js')),
}, async t => {
  const seed = require('../src/seedAdmin');
  const mysql = require('mysql2/promise');
  t.mock.method(require('bcryptjs'), 'hash', async () => 'test-hash');
  t.mock.method(console, 'log', () => {});
  const events = [];
  let failProfile = false;
  const connection = {
    async beginTransaction() { events.push('begin'); },
    async commit() { events.push('commit'); },
    async rollback() { events.push('rollback'); },
    async end() { events.push('end'); },
    async execute(sql) {
      assert.doesNotMatch(sql, /username/);
      events.push('user');
      return [{ insertId: 7 }];
    },
    async query(sql, values) {
      assert.match(sql, /^INSERT INTO staff/);
      assert.deepEqual(values.slice(0, 6), [7, 'Ana', null, 'Reyes', null, 'Administrator']);
      events.push('profile');
      if (failProfile) throw new Error('Profile insert failed');
      return [{ insertId: 21 }];
    },
  };
  const connect = t.mock.method(mysql, 'createConnection', async () => connection);
  await assert.rejects(seed(), { status: 400 });
  assert.equal(connect.mock.callCount(), 0);
  await seed(' Ana ', ' Reyes ');
  assert.deepEqual(events, ['begin', 'user', 'profile', 'commit', 'end']);
  events.length = 0;
  failProfile = true;
  await assert.rejects(seed('Ana', 'Reyes'), /Profile insert failed/);
  assert.deepEqual(events, ['begin', 'user', 'profile', 'rollback', 'end']);
});

test('MySQL repairs legacy admins through self-service and account management without changing existing profiles', { skip: process.env.ADMIN_PROFILE_DB_TESTS !== 'true' }, async t => {
  const connection = await pool.getConnection();
  const tables = ['users', 'staff', 'audit_logs'];
  try {
    // Temporary copies isolate every write, including audit entries, from application data.
    for (const table of tables) {
      await connection.query(`CREATE TEMPORARY TABLE admin_profile_fixture LIKE ${table}`);
      await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE admin_profile_fixture`);
      await connection.query('DROP TEMPORARY TABLE admin_profile_fixture');
    }
    t.mock.method(pool, 'query', connection.query.bind(connection));
    t.mock.method(pool, 'getConnection', async () => ({
      query: connection.query.bind(connection),
      beginTransaction: connection.beginTransaction.bind(connection),
      commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {},
    }));
    const ids = [4000000001, 4000000002];
    for (const user_id of ids) {
      await connection.query("INSERT INTO users (user_id, phone, password_hash, role) VALUES (?, ?, 'test-hash', 'admin')", [user_id, user_id === ids[0] ? '09123456789' : '09123456780']);
    }
    const request = { user: { user_id: ids[0], role: 'admin' }, auditActor: { user_id: ids[0], role: 'admin' } };
    let res = response();
    await admin.getStaff(request, res);
    assert.deepEqual(res.body.staff.map(row => row.user_id).sort(), ids, 'Admins without staff rows must remain visible');

    res = response();
    await auth.getProfile(request, res);
    assert.equal(res.body.data.display_name, 'Administrator');
    assert.equal(res.body.data.first_name, null);
    res = response();
    await auth.updateProfile({ ...request, body: { first_name: 'Ana' } }, res);
    assert.equal(res.statusCode, 400, 'Do not fabricate a missing last name');

    for (const [index, handler] of [auth.updateProfile, admin.updateStaff].entries()) {
      const req = { ...request, user: { user_id: ids[index], role: 'admin' }, params: { user_id: String(ids[index]) }, body: { first_name: 'Ana', last_name: 'Reyes' } };
      res = response();
      await handler(req, res);
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      const [[profile]] = await connection.query('SELECT * FROM staff WHERE user_id = ?', [ids[index]]);
      assert.equal(profile.first_name, 'Ana');
      assert.equal(profile.last_name, 'Reyes');
      assert.equal(profile.position, 'Administrator');
      assert.equal(profile.contact_number, index ? '09123456780' : '09123456789');
      res = response();
      await auth.updateProfile({ ...req, body: { middle_name: 'Cruz' } }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.display_name, 'Ana Cruz Reyes');
    }
    const [[{ profiles }]] = await connection.query('SELECT COUNT(*) AS profiles FROM staff');
    assert.equal(profiles, 2);
    const [[{ events }]] = await connection.query("SELECT COUNT(*) AS events FROM audit_logs WHERE action = 'account.updated'");
    assert.equal(events, 0);

    const [[{ id }]] = await connection.query('SELECT MAX(id) AS id FROM audit_logs');
    // A failed profile update must also roll back creating a missing profile.
    const query = connection.query.bind(connection);
    t.mock.method(pool, 'getConnection', async () => ({
      async query(sql, values) { if (sql.startsWith('UPDATE staff SET')) throw new Error('Profile update unavailable'); return query(sql, values); },
      beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection),
      rollback: connection.rollback.bind(connection), release() {},
    }));
    t.mock.method(console, 'error', () => {});
    res = response();
    await auth.updateProfile({ ...request, body: { first_name: 'Changed' } }, res);
    assert.equal(res.statusCode, 500);
    const [[unchanged]] = await connection.query('SELECT first_name FROM staff WHERE user_id = ?', [ids[0]]);
    assert.equal(unchanged.first_name, 'Ana');
    const [[last]] = await connection.query('SELECT MAX(id) AS id FROM audit_logs');
    assert.equal(last.id, id);

    await connection.query("INSERT INTO users (user_id, phone, password_hash, role) VALUES (4000000003, '09123456781', 'test-hash', 'admin')");
    res = response();
    await auth.updateProfile({ ...request, user: { user_id: 4000000003, role: 'admin' }, body: { first_name: 'Ana', last_name: 'Reyes' } }, res);
    assert.equal(res.statusCode, 500);
    const [[{ count }]] = await connection.query('SELECT COUNT(*) AS count FROM staff WHERE user_id = 4000000003');
    assert.equal(count, 0, 'Update failure must also roll back creation of the missing profile');
  } finally {
    t.mock.restoreAll();
    for (const table of [...tables].reverse()) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    await connection.query('DROP TEMPORARY TABLE IF EXISTS admin_profile_fixture');
    connection.release();
  }
});

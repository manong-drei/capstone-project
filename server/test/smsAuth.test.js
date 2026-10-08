const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const pool = require('../src/config/db');
const authenticate = require('../src/middleware/authenticate');
const { sessionResponse } = require('../src/utils/authSession');
const { login, changePassword } = require('../src/controllers/authController');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('temporary password is exactly six digits including leading zeros', () => {
  for (let i = 0; i < 100; i++) assert.match(User.generateTempPassword(), /^\d{6}$/);
});

test('temporary login atomically redeems once, rejects expiry at 72h, and enforces account lockout', async () => {
  const saved = pool.getConnection;
  const savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-secret';
  const now = new Date('2026-10-08T00:00:00Z');
  const user = { user_id: 1, phone: '09123456789', is_active: 1, must_change_password: 1,
    password_hash: await bcrypt.hash('012345', 4), temp_password_expires_at: new Date(now.getTime() + 72 * 3600000),
    temp_password_used_at: null, login_failures: 0, login_locked_until: null, db_now: now };
  let releaseLock;
  let held = Promise.resolve();
  pool.getConnection = async () => {
    let release;
    return {
      async beginTransaction() {},
      async query(sql) {
        if (sql.includes('SELECT *')) {
          assert.match(sql, /FOR UPDATE/);
          const previous = held;
          held = new Promise(resolve => { releaseLock = resolve; });
          release = releaseLock;
          await previous;
          return [[{ ...user }]];
        }
        if (sql.includes('temp_password_used_at = IF')) user.temp_password_used_at = now;
        return [{ affectedRows: 1 }];
      },
      async commit() { release?.(); }, async rollback() { release?.(); }, release() {},
    };
  };
  try {
    const result = await Promise.all([User.authenticate(user.phone, '012345'), User.authenticate(user.phone, '012345')]);
    assert.equal(result.filter(Boolean).length, 1);
    assert.equal(await User.authenticate(user.phone, '012345'), null);
    user.temp_password_used_at = null;
    user.temp_password_expires_at = now;
    assert.equal(await User.authenticate(user.phone, '012345'), null);
    user.temp_password_expires_at = null;
    assert.equal(await User.authenticate(user.phone, '012345'), null);
    user.temp_password_expires_at = new Date(now.getTime() + 1);
    user.login_locked_until = new Date(now.getTime() + 15 * 60000);
    assert.equal(await User.authenticate(user.phone, '012345'), null);
  } finally {
    pool.getConnection = saved;
    if (savedSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = savedSecret;
  }
});

test('failed session signing leaves temporary login redeemable; successful login returns its setup session', async () => {
  const saved = { connection: pool.getConnection, secret: process.env.JWT_SECRET };
  const user = { user_id: 1, phone: '09123456789', role: 'patient', is_active: 1, credential_version: 1,
    must_change_password: 1, password_hash: await bcrypt.hash('012345', 4),
    db_now: new Date('2026-10-08T00:00:00Z'), temp_password_expires_at: new Date('2026-10-11T00:00:00Z'), temp_password_used_at: null };
  let commits = 0, rollbacks = 0;
  pool.getConnection = async () => ({
    async beginTransaction() {},
    async query(sql) {
      if (sql.includes('SELECT *')) return [[{ ...user }]];
      if (sql.includes('temp_password_used_at = IF')) user.temp_password_used_at = user.db_now;
      return [{ affectedRows: 1 }];
    },
    async commit() { commits++; }, async rollback() { rollbacks++; }, release() {},
  });
  try {
    delete process.env.JWT_SECRET;
    await assert.rejects(User.authenticate(user.phone, '012345'), /secretOrPrivateKey/);
    assert.equal(user.temp_password_used_at, null);
    assert.equal(commits, 0); assert.equal(rollbacks, 1);
    process.env.JWT_SECRET = 'test-only-secret';
    const res = response();
    await login({ body: { phone: user.phone, password: '012345' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.must_change_password, true);
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).purpose, 'password_setup');
    assert.equal(commits, 1);
    assert.equal(await User.authenticate(user.phone, '012345'), null);
  } finally {
    pool.getConnection = saved.connection;
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
  }
});

test('backend limits setup JWT to password setup and me; rejects inactive, replaced, and legacy sessions', async () => {
  const saved = { find: User.findById, secret: process.env.JWT_SECRET };
  process.env.JWT_SECRET = 'test-only-secret';
  let user = { user_id: 1, phone: '09123456789', role: 'patient', is_active: 1, credential_version: 1, must_change_password: 1 };
  User.findById = async () => user;
  try {
    const session = sessionResponse(user);
    const claims = jwt.verify(session.token, process.env.JWT_SECRET);
    assert.equal(claims.exp - claims.iat, 15 * 60);
    const check = async (path, method, token = session.token) => {
      const res = response(); let passed = false;
      await authenticate({ headers: { authorization: `Bearer ${token}` }, path, method }, res, () => { passed = true; });
      return { passed, status: res.statusCode };
    };
    assert.equal((await check('/change-password', 'PATCH')).passed, true);
    assert.equal((await check('/me', 'GET')).passed, true);
    assert.equal((await check('/profile', 'GET')).status, 403);
    assert.equal((await check('/', 'POST')).status, 403);
    user = { ...user, credential_version: 2 };
    assert.equal((await check('/change-password', 'PATCH')).status, 401);
    user = { ...user, credential_version: 1, is_active: 0 };
    assert.equal((await check('/me', 'GET')).status, 401);
    user = { ...user, is_active: 1, must_change_password: 0 };
    const legacy = jwt.sign({ user_id: 1, role: 'patient' }, process.env.JWT_SECRET);
    assert.equal((await check('/me', 'GET', legacy)).status, 401);
    assert.equal((await check('/profile', 'GET', sessionResponse(user).token)).passed, true);
    const expired = jwt.sign({ user_id: 1, credential_version: 1, purpose: 'password_setup' }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await check('/change-password', 'PATCH', expired)).status, 401);
  } finally {
    User.findById = saved.find;
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
  }
});

test('password setup needs no old password, rotates the session, and concurrent change loses safely', async () => {
  const saved = { find: User.findByIdWithHash, update: User.updatePassword, secret: process.env.JWT_SECRET };
  process.env.JWT_SECRET = 'test-only-secret';
  const user = { user_id: 1, phone: '09123456789', role: 'patient', is_active: 1, must_change_password: 1,
    credential_version: 1, password_hash: await bcrypt.hash('012345', 4) };
  let version = 1;
  User.findByIdWithHash = async () => ({ ...user });
  User.updatePassword = async (id, password, expected) => { if (version !== expected) return false; version++; return true; };
  const req = (newPassword, purpose = 'password_setup') => ({ user: { user_id: 1, credential_version: 1, purpose }, body: { newPassword } });
  try {
    let res = response(); await changePassword(req('short1'), res); assert.equal(res.statusCode, 400);
    res = response(); await changePassword(req('longpassword'), res); assert.equal(res.statusCode, 400);
    res = response(); await changePassword(req('a'.repeat(72) + '1'), res); assert.equal(res.statusCode, 400);
    res = response(); await changePassword(req('é'.repeat(36) + '1'), res); assert.equal(res.statusCode, 400);
    res = response(); await changePassword(req('Password123', 'session'), res); assert.equal(res.statusCode, 400);
    delete process.env.JWT_SECRET;
    res = response(); await changePassword(req('Password123'), res); assert.equal(res.statusCode, 500);
    assert.equal(version, 1);
    process.env.JWT_SECRET = 'test-only-secret';
    const a = response(), b = response();
    await Promise.all([changePassword(req('a'.repeat(71) + '1'), a), changePassword(req('Different456'), b)]);
    assert.deepEqual([a.statusCode, b.statusCode].sort(), [200, 401]);
    const success = a.statusCode === 200 ? a : b;
    assert.equal(success.body.user.must_change_password, false);
    const claims = jwt.verify(success.body.token, process.env.JWT_SECRET);
    assert.equal(claims.purpose, 'session'); assert.equal(claims.credential_version, 2);
  } finally {
    User.findByIdWithHash = saved.find; User.updatePassword = saved.update;
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
  }
});

test('development tokens preserve mock login only in development and cannot bypass production authentication', async () => {
  const saved = { find: User.findById, secret: process.env.JWT_SECRET, environment: process.env.NODE_ENV };
  process.env.JWT_SECRET = 'test-only-secret';
  User.findById = async () => null;
  const token = jwt.sign({ user_id: 4, role: 'admin', purpose: 'development' }, process.env.JWT_SECRET);
  const req = () => ({ headers: { authorization: `Bearer ${token}` }, path: '/sms-settings', method: 'GET' });
  try {
    process.env.NODE_ENV = 'development'; let passed = false;
    await authenticate(req(), response(), () => { passed = true; }); assert.equal(passed, true);
    process.env.NODE_ENV = 'production'; const res = response(); passed = false;
    await authenticate(req(), res, () => { passed = true; }); assert.equal(passed, false); assert.equal(res.statusCode, 401);
  } finally {
    User.findById = saved.find;
    for (const [name, value] of [['JWT_SECRET', saved.secret], ['NODE_ENV', saved.environment]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

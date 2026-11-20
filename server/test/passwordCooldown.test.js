const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const pool = require('../src/config/db');
const { changePassword } = require('../src/controllers/authController');
const ensurePasswordCooldown = require('../src/config/ensurePasswordCooldown');

test('password changes wait five minutes, but temporary password setup can proceed', async t => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-secret';
  t.after(() => { if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; });
  const user = { user_id: 1, role: 'patient', is_active: 1, credential_version: 1, password_hash: 'old-hash', password_retry_seconds: 300 };
  t.mock.method(User, 'findByIdWithHash', async () => user);
  t.mock.method(User, 'verifyPassword', async password => password === 'OldPassword1');
  const update = t.mock.method(User, 'updatePassword', async () => true);
  const request = { user: { user_id: 1, credential_version: 1 }, body: { oldPassword: 'OldPassword1', newPassword: 'NewPassword2' } };
  const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  for (const seconds of [300, 1]) {
    user.password_retry_seconds = seconds;
    const res = response();
    await changePassword(request, res);
    assert.equal(res.code, 429);
    assert.match(res.body.message, new RegExp(`wait ${seconds} seconds`));
  }
  assert.equal(update.mock.callCount(), 0);
  for (const seconds of [0, null]) {
    user.password_retry_seconds = seconds;
    const res = response();
    await changePassword(request, res);
    assert.equal(res.code, 200);
  }
  user.password_retry_seconds = 300;
  const setup = response();
  await changePassword({ user: { ...request.user, purpose: 'password_setup' }, body: { newPassword: 'NewPassword2' } }, setup);
  assert.equal(setup.code, 200);
});

test('cooldown migration is safe to rerun and to run during concurrent starts', async () => {
  let installed = false;
  let alters = 0;
  const database = { async query(sql) {
    if (sql.startsWith('SHOW')) return [installed ? [{}] : []];
    assert.match(sql, /ADD COLUMN password_changed_at DATETIME NULL/);
    if (installed) throw Object.assign(new Error('Duplicate column'), { code: 'ER_DUP_FIELDNAME' });
    installed = true;
    alters++;
    return [{}];
  } };
  await Promise.all([ensurePasswordCooldown(database), ensurePasswordCooldown(database)]);
  await ensurePasswordCooldown(database);
  assert.equal(alters, 1);
});

test('MySQL upgrades the users table and preserves cooldown for regular changes', { skip: process.env.RECOVERY_DB_TESTS !== 'true' }, async t => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TEMPORARY TABLE users (
      user_id INT PRIMARY KEY, is_active BOOLEAN, credential_version INT, password_hash VARCHAR(100),
      must_change_password BOOLEAN, temp_password_expires_at DATETIME NULL, temp_password_used_at DATETIME NULL,
      login_failures INT DEFAULT 0, login_locked_until DATETIME NULL)`);
    t.mock.method(pool, 'query', (sql, values) => connection.query(sql, values));
    await assert.rejects(User.findByIdWithHash(1), { code: 'ER_BAD_FIELD_ERROR' });
    await ensurePasswordCooldown(connection);
    await connection.query('INSERT INTO users (user_id, is_active, credential_version, must_change_password) VALUES (1, 1, 1, 0)');
    assert.equal(await User.updatePassword(1, 'Password1', 1), true);
    await ensurePasswordCooldown(connection);
    assert.ok((await User.findByIdWithHash(1)).password_retry_seconds > 0);
    assert.equal(await User.updatePassword(1, 'Password2', 2), false);
    await connection.query('UPDATE users SET password_changed_at = DATE_SUB(NOW(), INTERVAL 5 MINUTE)');
    assert.equal((await User.findByIdWithHash(1)).password_retry_seconds, 0);
    assert.equal(await User.updatePassword(1, 'Password2', 2), true);
    await connection.query('UPDATE users SET must_change_password = 1');
    assert.equal(await User.updatePassword(1, 'Password3', 3), true);
  } finally {
    connection.destroy();
  }
});

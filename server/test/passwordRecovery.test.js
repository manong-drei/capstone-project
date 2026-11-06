const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/db');
const sms = require('../src/utils/sms');
const recovery = require('../src/services/passwordRecovery');
const notifications = require('../src/services/smsNotifications');
const authenticate = require('../src/middleware/authenticate');
const User = require('../src/models/User');
const router = require('../src/routes/authRoutes');
const { migrate } = require('../src/config/migratePasswordRecovery');

test.after(() => pool.end());
const req = body => ({ body, ip: '127.0.0.1' });
const verify = (id, otp = '0007') => recovery.verify(req({ recovery_id: id, otp }));
const reset = (id, token, newPassword = 'NewPassword2') => recovery.reset(req({ recovery_id: id, reset_token: token, newPassword }));

async function fixture(t) {
  const env = { ...process.env };
  Object.assign(process.env, { SMS_ENABLED: 'true', SMS_ENCRYPTION_KEY: 'ab'.repeat(32), SMS_API_KEY: 'test-key', SMS_SENDER_NAME: 'Clinic', JWT_SECRET: 'recovery-test-secret' });
  t.after(() => { for (const key of ['SMS_ENABLED', 'SMS_ENCRYPTION_KEY', 'SMS_API_KEY', 'SMS_SENDER_NAME', 'JWT_SECRET']) {
    if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key];
  } });
  const state = {
    now: new Date('2026-11-02T02:00:00Z'), rows: [], jobs: [], audits: [],
    user: { user_id: 7, phone: '09123456789', role: 'patient', is_active: 1, credential_version: 2, password_hash: await bcrypt.hash('OldPassword1', 4) },
    person: { patient_id: 42, patient_name: 'Ana Test' }, failAudit: false,
  };
  let held = Promise.resolve();
  t.mock.method(crypto, 'randomInt', () => 7);
  t.mock.method(pool, 'getConnection', async () => {
    let working, unlock;
    return {
      async beginTransaction() {
        const previous = held;
        held = new Promise(resolve => { unlock = resolve; });
        await previous;
        working = structuredClone(state);
      },
      async commit() { Object.assign(state, working); unlock(); },
      async rollback() { unlock(); }, release() {},
      async query(sql, values = []) {
        if (sql.includes('FROM users')) {
          const valid = sql.includes('phone = ?') ? values[0] === working.user.phone && working.user.role === 'patient' && working.user.is_active : values[0] === working.user.user_id;
          return [[valid && { ...working.user, db_now: working.now }].filter(Boolean)];
        }
        if (sql.includes('FROM patients')) return [[working.person].filter(Boolean)];
        if (sql.includes('COUNT(*)')) {
          const rows = working.rows.filter(row => row.phone === values[0] && row.created_at > new Date(working.now.getTime() - 900000));
          return [[{ total: rows.length, last_sent: rows.at(-1)?.created_at || null }]];
        }
        if (sql.startsWith('SELECT user_id FROM password_recoveries')) return [working.rows.filter(row => row.id === values[0]).map(row => ({ user_id: row.user_id }))];
        if (sql.startsWith('SELECT * FROM password_recoveries')) return [working.rows.filter(row => sql.includes('WHERE id = ?') ? row.id === values[0]
          : row.user_id === values[0] && ['pending', 'verified'].includes(row.status) && (!sql.includes('id <> ?') || row.id !== values[1]))];
        if (sql.startsWith('SELECT state')) return [working.jobs.filter(job => job.recovery_id === values[0])];
        if (sql.includes('INSERT INTO password_recoveries')) {
          const [id, user_id, patient_id, phone, credential_version, otp_hash] = values;
          working.rows.push({ id, user_id, patient_id, phone, credential_version, otp_hash, attempts: 0, status: 'pending', created_at: working.now, expires_at: new Date(working.now.getTime() + 300000) });
        } else if (sql.includes('INSERT INTO sms_jobs')) working.jobs.push({ id: working.jobs.length + 1, user_id: values[0], patient_id: values[1], recovery_id: values[2], credential_version: values[3], recipient: values[4], payload: values[6], purpose: 'password_recovery', state: 'queued' });
        else if (sql.includes('INSERT INTO audit_logs')) {
          if (working.failAudit) throw new Error('Synthetic audit failure');
          working.audits.push(values);
        } else if (sql.startsWith('UPDATE password_recoveries')) {
          const row = working.rows.find(row => row.id === values.at(-1));
          if (sql.includes('SET attempts')) row.attempts = values[0];
          else if (sql.includes("status = 'verified'")) Object.assign(row, { status: 'verified', otp_hash: null, reset_token_hash: values[0], reset_expires_at: new Date(working.now.getTime() + 300000) });
          else Object.assign(row, { status: values[0], otp_hash: null, reset_token_hash: null });
        } else if (sql.startsWith('UPDATE users')) Object.assign(working.user, { password_hash: values[0], credential_version: working.user.credential_version + 1, must_change_password: 0 });
        else if (sql.startsWith('UPDATE sms_jobs')) working.jobs.filter(job => ['queued', 'submitting'].includes(job.state)
          && (sql.includes('recovery_id = ?') ? job.recovery_id === values[0] : job.user_id === values[0])).forEach(job => Object.assign(job, { state: 'cancelled', payload: null }));
        else throw new Error(`Unexpected SQL: ${sql}`);
        return [{ affectedRows: 1 }];
      },
    };
  });
  t.mock.method(pool, 'query', async () => [state.rows.filter(row => ['pending', 'verified'].includes(row.status)).map(row => ({ id: row.id }))]);
  return state;
}

test('four-digit recovery preserves leading zeros, encrypts SMS and never exposes secrets in audits or responses', async t => {
  const state = await fixture(t);
  assert.equal(recovery.generateOtp(), '0007');
  const result = await recovery.request(req({ phone: '+639123456789' }));
  assert.match(result.recovery_id, /^[a-f\d-]{36}$/);
  assert.equal(result.resend_after, 60); assert.equal(result.expires_in, 300);
  assert.match(sms.decryptPayload(state.jobs[0].payload), /code is 0007/);
  assert.doesNotMatch(JSON.stringify(result), /0007|hash|password/);
  assert.deepEqual(state.audits, []);
  assert.equal((await verify(result.recovery_id, '8888')).status, 400);
  assert.doesNotMatch(JSON.stringify(state.audits), /0007|OldPassword|09123456789|otp_hash/);
  assert.equal(state.audits[0][4], 'password.recovery_failed');
  assert.equal(state.audits[0][0], null);
  assert.equal(JSON.parse(state.audits[0][10]).patient_name, 'Ana Test');
  assert.equal(JSON.parse(state.audits[0][10]).phone, '*******6789');
  assert.ok(await bcrypt.compare('OldPassword1', state.user.password_hash));
  const response = { set() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  t.mock.method(User, 'findById', async () => state.user);
  await authenticate({ headers: { authorization: `Bearer ${jwt.sign({ user_id: 7, credential_version: 2, purpose: 'password_recovery' }, process.env.JWT_SECRET)}` } }, response, () => assert.fail('recovery credentials must not access the dashboard'));
  assert.equal(response.code, 401);
});

test('unknown and ineligible numbers get the same public response without SMS', async t => {
  const state = await fixture(t);
  for (const phone of [null, [], {}, '123']) assert.equal((await recovery.request(req({ phone }))).message, 'invalid phone number');
  const valid = await recovery.request(req({ phone: state.user.phone }));
  const unknown = await recovery.request(req({ phone: '09999999999' }));
  const assertPublicResponse = response => {
    assert.match(response.recovery_id, /^[a-f\d-]{36}$/);
    assert.deepEqual({ ...response, recovery_id: valid.recovery_id }, valid);
  };
  assertPublicResponse(unknown);
  state.user.role = 'admin'; assertPublicResponse(await recovery.request(req({ phone: state.user.phone })));
  state.user.role = 'patient'; state.user.is_active = 0; assertPublicResponse(await recovery.request(req({ phone: state.user.phone })));
  state.user.is_active = 1; state.person = null; assertPublicResponse(await recovery.request(req({ phone: state.user.phone })));
  assert.equal(state.jobs.length, 1);
  process.env.SMS_ENABLED = 'false'; assert.equal((await recovery.request(req({ phone: state.user.phone }))).status, 503);
});

test('60-second cooldown, durable three-send limit and simultaneous requests allow only one new code', async t => {
  const state = await fixture(t);
  const requests = await Promise.all([1, 2].map(() => recovery.request(req({ phone: state.user.phone }))));
  assert.equal(requests.filter(row => row.recovery_id).length, 2);
  assert.equal(state.rows.length, 1);
  const decoy = requests.find(row => row.recovery_id !== state.rows[0].id);
  assert.deepEqual(await verify(decoy.recovery_id, '8888'), await verify(state.rows[0].id, '8888'));
  for (let i = 0; i < 2; i++) {
    state.now = new Date(state.now.getTime() + 60000);
    assert.ok((await recovery.request(req({ phone: state.user.phone }))).recovery_id);
  }
  assert.deepEqual(state.rows.map(row => row.status), ['cancelled', 'cancelled', 'pending']);
  assert.deepEqual(state.jobs.map(row => row.state), ['cancelled', 'cancelled', 'queued']);
  state.now = new Date(state.now.getTime() + 60000);
  const limited = await recovery.request(req({ phone: state.user.phone }));
  assert.ok(limited.recovery_id);
  assert.equal(state.rows.length, 3);
  state.now = new Date(state.now.getTime() + 900000);
  assert.ok((await recovery.request(req({ phone: state.user.phone }))).recovery_id);
});

test('three wrong codes permanently close the challenge, including racing guesses and correct-code replay', async t => {
  const state = await fixture(t);
  const { recovery_id: id } = await recovery.request(req({ phone: state.user.phone }));
  const results = await Promise.all([1, 2, 3].map(() => verify(id, '8888')));
  assert.ok(results.every(result => result.status === 400 && result.message === 'Invalid or expired code. Request a new code if needed.'));
  assert.equal(state.rows[0].status, 'failed'); assert.equal(state.rows[0].otp_hash, null);
  assert.deepEqual(state.audits.map(values => values[4]), Array(3).fill('password.recovery_failed'));
  assert.equal((await verify(id)).status, 400);
  assert.ok(await bcrypt.compare('OldPassword1', state.user.password_hash));
});

test('successful verification is single use; only its short-lived reset token changes the password and signs out older sessions', async t => {
  const state = await fixture(t);
  const { recovery_id: id } = await recovery.request(req({ phone: state.user.phone }));
  const results = await Promise.all([verify(id), verify(id)]);
  assert.equal(results.filter(row => row.reset_token).length, 1);
  const token = results.find(row => row.reset_token).reset_token;
  assert.ok(await bcrypt.compare('OldPassword1', state.user.password_hash));
  assert.equal(state.user.credential_version, 2);
  assert.equal((await reset(id, 'ab'.repeat(32))).status, 400);
  assert.equal((await reset(id, token, 'short')).status, 400);
  assert.equal((await reset(id, token, 'x'.repeat(73) + '1')).status, 400);
  assert.equal((await reset(id, token, 'OldPassword1')).status, 400);
  assert.equal((await reset(id, token)).message, 'Password changed successfully. Please log in with your new password.');
  assert.ok(await bcrypt.compare('NewPassword2', state.user.password_hash));
  assert.equal(state.user.credential_version, 3);
  assert.equal(state.rows[0].reset_token_hash, null);
  assert.equal((await reset(id, token)).status, 400);
  const actions = state.audits.map(values => values[4]);
  assert.deepEqual(actions, ['password.recovery_completed']);
  assert.doesNotMatch(JSON.stringify(state.audits), new RegExp(`${token}|NewPassword2`));
  t.mock.method(User, 'findById', async () => state.user);
  const res = { status(code) { this.code = code; return this; }, json() {} };
  await authenticate({ headers: { authorization: `Bearer ${jwt.sign({ user_id: 7, credential_version: 2, purpose: 'session' }, process.env.JWT_SECRET)}` } }, res, () => assert.fail('old session accepted'));
  assert.equal(res.code, 401);
});

test('OTP and reset grants expire exactly at five minutes; resend cancels an already verified reset grant', async t => {
  const state = await fixture(t);
  let { recovery_id: id } = await recovery.request(req({ phone: state.user.phone }));
  state.now = new Date(state.now.getTime() + 300000);
  assert.equal((await verify(id)).status, 400); assert.equal(state.rows[0].status, 'expired');
  ({ recovery_id: id } = await recovery.request(req({ phone: state.user.phone })));
  const { reset_token: token } = await verify(id);
  state.now = new Date(state.now.getTime() + 60000);
  await recovery.request(req({ phone: state.user.phone }));
  assert.equal((await reset(id, token)).status, 400);
  const newest = state.rows.at(-1).id;
  const { reset_token: fresh } = await verify(newest);
  state.now = new Date(state.now.getTime() + 300000);
  assert.equal((await reset(newest, fresh)).status, 400); assert.equal(state.rows.at(-1).status, 'expired');
});

test('credential changes and expiry still close recoveries while only delivery failures are audited', async t => {
  const state = await fixture(t);
  const { recovery_id: id } = await recovery.request(req({ phone: state.user.phone }));
  state.user.credential_version++;
  assert.equal((await verify(id)).status, 400); assert.equal(state.rows[0].status, 'cancelled');
  state.now = new Date(state.now.getTime() + 60000);
  await recovery.request(req({ phone: state.user.phone }));
  state.jobs.at(-1).state = 'failed';
  await recovery.reconcile(); assert.equal(state.rows.at(-1).status, 'failed');
  state.now = new Date(state.now.getTime() + 60000);
  await recovery.request(req({ phone: state.user.phone }));
  state.now = new Date(state.now.getTime() + 300000);
  await recovery.reconcile(); assert.equal(state.rows.at(-1).status, 'expired');
  assert.deepEqual(state.audits.map(values => values[4]), ['password.recovery_failed']);
  assert.equal(JSON.parse(state.audits[0][10]).recovery_reason, 'delivery_failed');
});

test('code issuance and verification do not need an audit write, but failed and completed recovery do', async t => {
  const state = await fixture(t);
  state.failAudit = true;
  const { recovery_id: id } = await recovery.request(req({ phone: state.user.phone }));
  assert.equal(state.jobs.length, 1);
  await assert.rejects(verify(id, '8888'));
  assert.equal(state.rows[0].attempts, 0);
  const { reset_token: token } = await verify(id);
  await assert.rejects(reset(id, token));
  assert.ok(await bcrypt.compare('OldPassword1', state.user.password_hash));
  assert.equal(state.rows[0].status, 'verified');
  for (const suffix of ['request', 'verify', 'reset']) {
    const route = router.stack.find(layer => layer.route?.path === `/password-recovery/${suffix}`);
    assert.equal(route.route.stack.length, 2);
    assert.equal(typeof route.route.stack[0].handle.resetKey, 'function');
  }
});

test('recovery SMS worker cancels superseded, expired, inactive and changed accounts before submission', async t => {
  const state = await fixture(t);
  await recovery.request(req({ phone: state.user.phone }));
  let sends = 0;
  t.mock.method(sms, 'sendSMS', async () => { sends++; return { message_id: '42', status: 'queued', pauseMs: 0 }; });
  const conn = { async beginTransaction() {}, async commit() {}, async query(sql) {
    if (sql.includes('SELECT * FROM sms_jobs')) return [[{ ...state.jobs[0], attempts: 0 }]];
    if (sql.includes('FROM users')) return [[{ ...state.user, db_now: state.now }]];
    if (sql.includes('FROM password_recoveries')) return [[state.rows[0]]];
    if (sql.includes('FROM patients')) return [[state.person]];
    return [{ affectedRows: 1 }];
  } };
  await notifications.submitOne(conn); assert.equal(sends, 1);
  state.rows[0].status = 'cancelled'; await notifications.submitOne(conn); assert.equal(sends, 1);
  state.rows[0].status = 'pending'; state.user.is_active = 0; await notifications.submitOne(conn); assert.equal(sends, 1);
  state.user.is_active = 1; state.user.credential_version++; await notifications.submitOne(conn); assert.equal(sends, 1);
  state.user.credential_version--; state.now = state.rows[0].expires_at; await notifications.submitOne(conn); assert.equal(sends, 1);
});

test('migration safely resumes without deleting existing recovery or SMS history', async () => {
  const statements = [];
  let exists = 0;
  const database = { async query(sql) {
    statements.push(sql);
    if (sql.includes('information_schema.columns')) return [[{ count: exists }]];
    if (sql.includes('ADD COLUMN')) exists = 1;
    return [{}];
  } };
  await migrate(database); await migrate(database);
  assert.equal(statements.filter(sql => sql.includes('ADD COLUMN')).length, 1);
  assert.ok(!statements.some(sql => /DROP|DELETE|TRUNCATE/.test(sql)));
});

test('public recovery endpoints enforce independent IP limits and never return cached credentials', async t => {
  for (const action of ['request', 'verify', 'reset']) t.mock.method(recovery, action, async () => ({ message: 'ok' }));
  const app = express();
  app.use(express.json()); app.use('/auth', router);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    for (const [action, limit] of [['request', 10], ['verify', 20], ['reset', 10]]) {
      for (let i = 0; i <= limit; i++) {
        const result = await fetch(`http://127.0.0.1:${server.address().port}/auth/password-recovery/${action}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        });
        assert.equal(result.status, i === limit ? 429 : 200);
        if (i < limit) assert.equal(result.headers.get('cache-control'), 'no-store');
        else assert.ok(Number(result.headers.get('retry-after')) > 0);
        await result.text();
      }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('MySQL recovery flow uses isolated temporary tables for real SQL, expiry and audit rollback', { skip: process.env.RECOVERY_DB_TESTS !== 'true' }, async t => {
  const connection = await pool.getConnection();
  const env = { ...process.env };
  try {
    Object.assign(process.env, { SMS_ENABLED: 'true', SMS_ENCRYPTION_KEY: 'ab'.repeat(32), SMS_API_KEY: 'test-key', SMS_SENDER_NAME: 'Clinic' });
    await connection.query('CREATE TEMPORARY TABLE users (user_id INT PRIMARY KEY, phone VARCHAR(11), role VARCHAR(20), is_active BOOLEAN, credential_version INT, password_hash VARCHAR(100), must_change_password BOOLEAN DEFAULT 0, temp_password_expires_at DATETIME NULL, temp_password_used_at DATETIME NULL, login_failures INT DEFAULT 0, login_locked_until DATETIME NULL) ENGINE=InnoDB');
    await connection.query('CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, user_id INT, first_name VARCHAR(100), middle_name VARCHAR(100), last_name VARCHAR(100), suffix VARCHAR(20), archived_into_patient_id INT NULL) ENGINE=InnoDB');
    await connection.query("CREATE TEMPORARY TABLE sms_jobs (id INT AUTO_INCREMENT PRIMARY KEY, purpose VARCHAR(40), user_id INT, patient_id INT, recovery_id CHAR(36), credential_version INT, recipient VARCHAR(11), deduplication_key VARCHAR(100), payload TEXT, state VARCHAR(20) DEFAULT 'queued', provider_status VARCHAR(20), last_error VARCHAR(80)) ENGINE=InnoDB");
    for (const [file, name] of [['008_password_recovery.sql', 'password_recoveries'], ['006_admin_audit_logs.sql', 'audit_logs']]) {
      await connection.query(fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8').replace(`CREATE TABLE IF NOT EXISTS ${name}`, `CREATE TEMPORARY TABLE ${name}`));
    }
    await connection.query("INSERT INTO users (user_id, phone, role, is_active, credential_version, password_hash) VALUES (7, '09123456789', 'patient', 1, 2, ?)", [await bcrypt.hash('OldPassword1', 4)]);
    await connection.query("INSERT INTO patients (patient_id, user_id, first_name, last_name) VALUES (42, 7, 'Ana', 'Test')");
    const proxy = { query: connection.query.bind(connection), beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {} };
    t.mock.method(pool, 'getConnection', async () => proxy);
    t.mock.method(pool, 'query', proxy.query);
    t.mock.method(crypto, 'randomInt', () => 7);
    const { recovery_id: id } = await recovery.request(req({ phone: '09123456789' }));
    const limited = await recovery.request(req({ phone: '09123456789' }));
    assert.ok(limited.recovery_id);
    const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM password_recoveries');
    assert.equal(Number(total), 1);
    const { reset_token: token } = await verify(id);
    assert.ok(token);
    assert.equal((await reset(id, token)).message, 'Password changed successfully. Please log in with your new password.');
    const [[user]] = await connection.query('SELECT * FROM users WHERE user_id = 7');
    assert.equal(user.credential_version, 3); assert.ok(await bcrypt.compare('NewPassword2', user.password_hash));
    const [events] = await connection.query('SELECT action, details FROM audit_logs ORDER BY id');
    assert.deepEqual(events.map(row => row.action), ['password.recovery_completed']);
    await connection.query('UPDATE password_recoveries SET created_at = DATE_SUB(NOW(3), INTERVAL 16 MINUTE)');
    const pending = await recovery.request(req({ phone: '09123456789' }));
    await connection.query('UPDATE password_recoveries SET expires_at = NOW(3) WHERE id = ?', [pending.recovery_id]);
    await recovery.reconcile();
    const [[expired]] = await connection.query('SELECT status FROM password_recoveries WHERE id = ?', [pending.recovery_id]);
    assert.equal(expired.status, 'expired');
    await connection.query('UPDATE password_recoveries SET created_at = DATE_SUB(NOW(3), INTERVAL 16 MINUTE)');
    await connection.query("ALTER TABLE audit_logs ADD CONSTRAINT reject_new_events CHECK (ip_address <> '127.0.0.2')");
    const retry = await recovery.request({ body: { phone: '09123456789' }, ip: '127.0.0.2' });
    const { reset_token: retryToken } = await verify(retry.recovery_id);
    await assert.rejects(recovery.reset({ body: { recovery_id: retry.recovery_id, reset_token: retryToken, newPassword: 'AnotherPassword3' }, ip: '127.0.0.2' }));
    const [[unchanged]] = await connection.query('SELECT credential_version FROM users WHERE user_id = 7');
    assert.equal(unchanged.credential_version, 3);
  } finally {
    for (const name of ['SMS_ENABLED', 'SMS_ENCRYPTION_KEY', 'SMS_API_KEY', 'SMS_SENDER_NAME']) {
      if (env[name] === undefined) delete process.env[name]; else process.env[name] = env[name];
    }
    // Closing the dedicated connection removes only its temporary fixture tables.
    connection.destroy();
  }
});

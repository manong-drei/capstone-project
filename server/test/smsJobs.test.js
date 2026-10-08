const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const sms = require('../src/utils/sms');
const notifications = require('../src/services/smsNotifications');

test('rollout suppresses first five; crossings, threshold jumps and restart create one job per eligible ticket', async () => {
  const saved = { getConnection: pool.getConnection, project: Queue.projectWaiting, lock: Queue.lockCategory, key: process.env.SMS_ENCRYPTION_KEY };
  process.env.SMS_ENCRYPTION_KEY = 'cd'.repeat(32);
  let threshold = 5;
  let rows = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, patient_id: i + 1, is_walk_in: 0, queue_number: `Q-00${i + 1}`, category: 'dental' }));
  const jobs = new Map();
  let held = Promise.resolve();
  Queue.lockCategory = async (category, conn) => {
    const previous = held;
    held = new Promise(resolve => { conn.unlock = resolve; });
    await previous;
  };
  Queue.projectWaiting = async () => rows.map(q => ({ ...q }));
  pool.getConnection = async () => ({
    async beginTransaction() {}, async commit() { this.unlock?.(); }, async rollback() { this.unlock?.(); }, release() {},
    async query(sql, values) {
      if (sql.includes('SELECT threshold')) return [[{ threshold }]];
      if (sql.includes('FROM patients p')) return [[{ user_id: values[0], phone: '09123456789', is_active: 1 }]];
      if (sql.includes('sms_initial_position =')) {
        const row = rows.find(q => q.id === values[3]);
        row.sms_alert_state = values[0]; row.sms_initial_position = values[1];
      }
      if (sql.includes('INSERT INTO sms_jobs')) {
        assert.equal(values[2], '09123456789');
        assert.match(sms.decryptPayload(values[4]), /Order may change/);
        if (!jobs.has(values[3])) jobs.set(values[3], values);
      }
      if (sql.includes("sms_alert_state = 'enqueued'")) rows.find(q => q.id === values[0]).sms_alert_state = 'enqueued';
      return [{ affectedRows: 1 }];
    },
  });
  try {
    await notifications.reconcileCategory('dental');
    assert.equal(jobs.size, 0);
    assert.ok(rows.slice(0, 5).every(q => q.sms_alert_state === 'suppressed'));
    assert.equal(rows[5].sms_alert_state, 'armed');
    rows = rows.slice(1);
    await Promise.all([notifications.reconcileCategory('dental'), notifications.reconcileCategory('dental')]);
    assert.deepEqual([...jobs.keys()], ['queue:6']);
    // A threshold increase catches the next armed ticket; suppressed tickets stay suppressed.
    threshold = 10;
    await notifications.reconcileCategory('dental');
    await notifications.reconcileCategory('dental');
    assert.deepEqual([...jobs.keys()], ['queue:6', 'queue:7']);
    assert.ok(rows.slice(0, 4).every(q => q.sms_alert_state === 'suppressed'));
  } finally {
    pool.getConnection = saved.getConnection; Queue.projectWaiting = saved.project; Queue.lockCategory = saved.lock;
    if (saved.key === undefined) delete process.env.SMS_ENCRYPTION_KEY; else process.env.SMS_ENCRYPTION_KEY = saved.key;
  }
});

test('recipient resolution uses only the associated account or confirmed walk-in; inactive and changed phones are skipped', async () => {
  let patient = { user_id: 7, phone: '09123456789', contact_number: '09987654321', is_active: 1 };
  const conn = { async query(sql, values) { assert.deepEqual(values, [42]); return [[patient]]; } };
  const ticket = { patient_id: 42, is_walk_in: 0, walk_in_contact: '09987654321' };
  assert.equal(await notifications.queueRecipient(conn, ticket), '09123456789');
  assert.equal(await notifications.queueRecipient(conn, { ...ticket, is_walk_in: 1 }), '09987654321');
  patient.contact_number = '09123456789';
  assert.equal(await notifications.queueRecipient(conn, { ...ticket, is_walk_in: 1 }), null);
  patient.is_active = 0;
  assert.equal(await notifications.queueRecipient(conn, ticket), null);
  patient = { user_id: null, contact_number: '09987654321' };
  assert.equal(await notifications.queueRecipient(conn, { ...ticket, is_walk_in: 1 }), '09987654321');
  patient.archived_into_patient_id = 1;
  assert.equal(await notifications.queueRecipient(conn, { ...ticket, is_walk_in: 1 }), null);
});

test('job claim precedes sending, password TTL is preserved, and uncertainty purges the body without resending', async () => {
  const saved = { send: sms.sendSMS, decrypt: sms.decryptPayload };
  const statements = [];
  const job = { id: 1, purpose: 'temporary_password', user_id: 7, credential_version: 1, recipient: '09123456789', attempts: 0, payload: 'encrypted' };
  let user = { is_active: 1, must_change_password: 1, credential_version: 1, phone: job.recipient, db_now: new Date(0), temp_password_expires_at: null };
  let sends = 0;
  let commits = 0;
  const conn = {
    async beginTransaction() {}, async commit() { commits++; },
    async query(sql, values) {
      statements.push({ sql, values });
      if (sql.includes('SELECT * FROM sms_jobs')) return [[{ ...job }]];
      if (sql.includes('FROM users')) return [[user]];
      return [{ affectedRows: 1 }];
    },
  };
  sms.decryptPayload = () => 'E-KALUSUGAN: Password 012345';
  sms.sendSMS = async (phone) => {
    sends++; assert.equal(phone, job.recipient); assert.ok(commits >= 1);
    return { message_id: '42', status: 'queued', pauseMs: 0 };
  };
  try {
    await notifications.submitOne(conn);
    assert.equal(sends, 1);
    assert.ok(statements.some(row => row.sql.includes('COALESCE(temp_password_expires_at, DATE_ADD(NOW(), INTERVAL 72 HOUR))')));
    assert.ok(statements.some(row => row.sql.includes("'submitted', state), payload = NULL")));
    user = { ...user, credential_version: 2 };
    await notifications.submitOne(conn);
    assert.equal(sends, 1);
    assert.ok(statements.some(row => row.sql.includes("state = 'cancelled', payload = NULL")));
    user = { ...user, credential_version: 1 };
    sms.sendSMS = async () => { throw { code: 'submission_uncertain', unknown: true }; };
    await notifications.submitOne(conn);
    assert.ok(statements.some(row => row.values?.[0] === 'unknown' && row.sql.includes("IF(? = 'queued', payload, NULL)")));
  } finally { sms.sendSMS = saved.send; sms.decryptPayload = saved.decrypt; }
});

test('stale queue jobs never submit; fresh jobs use the current position instead of an old encrypted message', async () => {
  const saved = { send: sms.sendSMS, project: Queue.projectWaiting, lock: Queue.lockCategory };
  const ticket = { id: 6, patient_id: 42, category: 'dental', is_walk_in: 0, queue_number: 'Q-010', sms_alert_state: 'enqueued' };
  const job = { id: 10, purpose: 'queue_alert', queue_id: 6, patient_id: 42, recipient: '09123456789', attempts: 0 };
  let waiting = [{ ...ticket }];
  let contact = job.recipient;
  const delivered = [];
  const conn = {
    async beginTransaction() {}, async commit() {},
    async query(sql) {
      if (sql.includes('SELECT * FROM sms_jobs')) return [[{ ...job }]];
      if (sql.includes('SELECT * FROM queues')) return [[{ ...ticket }]];
      if (sql.includes('SELECT threshold')) return [[{ threshold: 5 }]];
      if (sql.includes('FROM patients p')) return [[{ user_id: 7, phone: contact, is_active: 1 }]];
      return [{ affectedRows: 1 }];
    },
  };
  Queue.lockCategory = async () => {};
  Queue.projectWaiting = async () => waiting;
  sms.sendSMS = async (phone, message) => { delivered.push({ phone, message }); return { message_id: '42', status: 'queued', pauseMs: 0 }; };
  try {
    await notifications.submitOne(conn);
    assert.match(delivered[0].message, /next 1 patient to be called/);
    assert.equal(delivered[0].phone, contact);
    waiting = []; await notifications.submitOne(conn); assert.equal(delivered.length, 1);
    waiting = [{ ...ticket }]; contact = '09987654321';
    await notifications.submitOne(conn); assert.equal(delivered.length, 1);
    contact = job.recipient; waiting = Array.from({ length: 5 }, (_, i) => ({ id: 100 + i })).concat(ticket);
    await notifications.submitOne(conn); assert.equal(delivered.length, 1);
  } finally { sms.sendSMS = saved.send; Queue.projectWaiting = saved.project; Queue.lockCategory = saved.lock; }
});

test('status polling updates delivery status and never resubmits after a polling failure', async () => {
  const saved = { status: sms.getSMSStatus, send: sms.sendSMS };
  const statements = [];
  const conn = { async query(sql, values) {
    statements.push({ sql, values });
    if (sql.includes('SELECT * FROM sms_jobs')) return [[{ id: 1, provider_message_id: '42', recipient: '09123456789' }]];
    return [{ affectedRows: 1 }];
  } };
  let sends = 0;
  sms.sendSMS = async () => { sends++; };
  sms.getSMSStatus = async (id, phone) => {
    assert.equal(id, '42'); assert.equal(phone, '09123456789'); return { status: 'sent', pauseMs: 0 };
  };
  try {
    await notifications.pollOne(conn);
    assert.ok(statements.some(row => row.sql.includes('provider_status = ?') && row.values[0] === 'sent'));
    sms.getSMSStatus = async () => { throw { code: 'rate_limited', retryAfter: 90000 }; };
    await notifications.pollOne(conn);
    assert.ok(statements.some(row => row.sql.includes('last_error = ?') && row.values[0] === 'rate_limited'));
    assert.equal(sends, 0);
  } finally { sms.getSMSStatus = saved.status; sms.sendSMS = saved.send; }
});

test('worker excludes another instance and converts interrupted claims to unknown without sending again', async () => {
  const saved = { getConnection: pool.getConnection, project: Queue.projectWaiting, lock: Queue.lockCategory };
  let acquired = 0;
  let recovered = false;
  let released = false;
  const conn = {
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() { released = true; },
    async query(sql) {
      if (sql.includes('GET_LOCK')) return [[{ acquired }]];
      if (sql.includes("state = 'unknown', payload = NULL")) { recovered = true; return [{}]; }
      if (sql.includes('SELECT threshold')) return [[{ threshold: 5 }]];
      if (sql.includes('SELECT *, NOW()')) return [[{ db_now: new Date(0), next_submission_at: new Date(1000), next_poll_at: new Date(1000) }]];
      assert.ok(!sql.includes('SELECT * FROM sms_jobs'), 'No resubmission should be selected during cooldown');
      return [{}];
    },
  };
  pool.getConnection = async () => conn;
  Queue.lockCategory = async () => {};
  Queue.projectWaiting = async () => [];
  try {
    await notifications.tick(); assert.equal(recovered, false); assert.equal(released, true);
    acquired = 1; await notifications.tick(); assert.equal(recovered, true);
  } finally { pool.getConnection = saved.getConnection; Queue.projectWaiting = saved.project; Queue.lockCategory = saved.lock; }
});

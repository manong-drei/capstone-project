const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const reset = require('../reset-test-data');

test.after(() => pool.end());

function fixture(t, { empty = false, fail = false } = {}) {
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push('begin'); },
    async commit() { calls.push('commit'); },
    async rollback() { calls.push('rollback'); },
    release() { calls.push('release'); },
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('AS today')) return [[{ today: '2026-10-10' }]];
      if (sql.startsWith('SELECT id FROM queues')) return [empty ? [] : [{ id: 11 }, { id: 12 }]];
      if (sql.startsWith('SELECT consultation_id')) return [[{ consultation_id: 21 }]];
      if (fail && sql.startsWith('DELETE FROM consultations')) throw new Error('delete failed');
      return [{ affectedRows: 1 }];
    },
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  return calls;
}

test('reset locks both categories and deletes only captured queue records in dependency order', async t => {
  const calls = fixture(t);
  const result = await reset();
  assert.equal(result.today, '2026-10-10');
  assert.equal(result.deleted.queues, 1);
  assert.equal(result.sequencesReset, 1);
  const queries = calls.filter(call => call.sql);
  assert.deepEqual(queries.filter(call => call.sql.startsWith('INSERT INTO queue_sequences')).map(call => call.values), [['dental'], ['general']]);
  assert.deepEqual(queries.filter(call => call.sql.startsWith('DELETE FROM')).map(call => call.sql.split(' ')[2]),
    ['prescriptions', 'vital_signs', 'medical_records', 'consultations', 'sms_jobs', 'queues', 'appointments']);
  assert.deepEqual(queries.find(call => call.sql.startsWith('DELETE FROM queues')).values, [[11, 12]]);
  assert.deepEqual(queries.find(call => call.sql.startsWith('DELETE FROM prescriptions')).values, [[21]]);
  const appointments = queries.find(call => call.sql.startsWith('DELETE FROM appointments'));
  assert.match(appointments.sql, /reason = 'Same-day queue registration'/);
  assert.deepEqual(appointments.values, ['2026-10-10']);
  assert.match(queries.find(call => call.sql.startsWith('UPDATE queue_sequences')).sql, /sequence_type <> 'serving'/);
  assert.deepEqual(calls.slice(-2), ['commit', 'release']);
});

test('reset cleans orphan auto-appointments and counters even when there are no queues', async t => {
  const calls = fixture(t, { empty: true });
  const result = await reset();
  assert.equal(result.deleted.queues, 0);
  assert.equal(result.deleted.prescriptions, 0);
  assert.equal(result.deleted.appointments, 1);
  assert.equal(result.sequencesReset, 1);
  assert.ok(!calls.some(call => call.sql?.includes('IN (?)')));
  assert.deepEqual(calls.slice(-2), ['commit', 'release']);
});

test('a failed reset rolls back earlier deletes and releases its connection', async t => {
  const calls = fixture(t, { fail: true });
  await assert.rejects(reset(), /delete failed/);
  assert.ok(!calls.includes('commit'));
  assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
});

test('MySQL reset preserves other days and manual records, rolls back failure, and restarts numbers',
  { skip: process.env.QUEUE_DB_TESTS !== 'true' }, async t => {
    const connection = await pool.getConnection();
    const tables = ['queues', 'consultations', 'prescriptions', 'vital_signs', 'medical_records', 'sms_jobs', 'appointments', 'queue_sequences'];
    try {
      // Temporary copies shadow real tables only on this connection.
      for (const table of tables) {
        await connection.query(`CREATE TEMPORARY TABLE reset_fixture LIKE ${table}`);
        await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE reset_fixture`);
        await connection.query('DROP TEMPORARY TABLE reset_fixture');
      }
      await connection.query(`INSERT INTO queues (id, patient_id, queue_number, status, created_at) VALUES
        (1, 4294967290, 'TEST1', 'called', NOW()),
        (2, 4294967290, 'TEST2', 'missed', NOW()),
        (3, 4294967290, 'OLD', 'done', DATE_SUB(NOW(), INTERVAL 1 DAY))`);
      await connection.query(`INSERT INTO consultations (consultation_id, queue_id, doctor_id, patient_id) VALUES
        (1, 1, 4294967290, 4294967290), (2, 3, 4294967290, 4294967290)`);
      await connection.query("INSERT INTO prescriptions (consultation_id, medication_name) VALUES (1, 'Test'), (2, 'Old')");
      await connection.query('INSERT INTO vital_signs (consultation_id) VALUES (1), (2)');
      await connection.query(`INSERT INTO medical_records (patient_id, consultation_id, record_type) VALUES
        (4294967290, 1, 'Test'), (4294967290, 2, 'Old'), (4294967290, NULL, 'Unlinked')`);
      await connection.query(`INSERT INTO sms_jobs (purpose, queue_id, recipient, deduplication_key) VALUES
        ('queue_alert', 1, '09123456789', 'test:1'),
        ('queue_alert', 3, '09123456789', 'test:3'),
        ('temporary_password', NULL, '09123456789', 'test:password')`);
      await connection.query(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES
        (4294967290, 4294967290, CURDATE(), '08:00:00', 'Same-day queue registration'),
        (4294967290, 4294967290, CURDATE(), '09:00:00', 'Manual booking'),
        (4294967290, 4294967290, CURDATE() - INTERVAL 1 DAY, '08:00:00', 'Same-day queue registration')`);
      await connection.query(`INSERT INTO queue_sequences (queue_date, category, sequence_type, last_number) VALUES
        (CURDATE(), 'dental', 'regular', 8), (CURDATE(), 'dental', 'priority', 4),
        (CURDATE(), 'general', 'general', 5), (CURDATE() - INTERVAL 1 DAY, 'dental', 'regular', 9)`);

      let fail = true;
      const transaction = {
        async query(sql, values) {
          if (fail && sql.startsWith('UPDATE queue_sequences')) throw new Error('test rollback');
          return connection.query(sql, values);
        },
        beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection),
        rollback: connection.rollback.bind(connection), release() {},
      };
      t.mock.method(pool, 'getConnection', async () => transaction);
      await assert.rejects(reset(), /test rollback/);
      for (const [table, expected] of [['queues', 3], ['consultations', 2], ['prescriptions', 2], ['vital_signs', 2], ['medical_records', 3], ['sms_jobs', 3], ['appointments', 3]]) {
        const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
        assert.equal(count, expected, `${table} restored after rollback`);
      }

      fail = false;
      const result = await reset();
      assert.deepEqual(result.deleted, { prescriptions: 1, vital_signs: 1, medical_records: 1, consultations: 1, sms_jobs: 1, queues: 2, appointments: 1 });
      const [queues] = await connection.query('SELECT id FROM queues');
      assert.deepEqual(queues.map(queue => queue.id), [3]);
      for (const [table, expected] of [['consultations', 1], ['prescriptions', 1], ['vital_signs', 1], ['medical_records', 2], ['sms_jobs', 2], ['appointments', 2]]) {
        const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
        assert.equal(count, expected, `${table} outside reset scope preserved`);
      }
      const [[old]] = await connection.query('SELECT last_number FROM queue_sequences WHERE queue_date = CURDATE() - INTERVAL 1 DAY');
      assert.equal(old.last_number, 9);
      for (const [category, type, is_walk_in, expected] of [
        ['dental', 'regular', false, 'AQ01'], ['dental', 'priority', true, 'P01'], ['general', 'regular', true, 'G-001'],
      ]) {
        assert.equal(await Queue.nextQueueNumber({ category, type, is_walk_in }, connection), expected);
      }
      await connection.query("INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (4294967290, 4294967290, CURDATE(), '08:00:00', 'Same-day queue registration')");
      const empty = await reset();
      assert.equal(empty.deleted.queues, 0);
      assert.equal(empty.deleted.appointments, 1);
      assert.equal(await Queue.nextQueueNumber({ category: 'dental', type: 'regular', is_walk_in: true }, connection), 'Q01');
    } finally {
      for (const table of tables) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
      await connection.query('DROP TEMPORARY TABLE IF EXISTS reset_fixture');
      connection.release();
    }
  });

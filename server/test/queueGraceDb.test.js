const test = require('node:test');
const assert = require('node:assert/strict');
const Queue = require('../src/models/Queue');
const Doctor = require('../src/models/Doctor');
const pool = require('../src/config/db');

test.after(() => pool.end());

test('MySQL initializes every queue connection and uses the Manila date at midnight', { skip: process.env.QUEUE_DB_TESTS !== 'true' }, async () => {
  const sessions = await Promise.all([pool.query('SELECT @@session.time_zone AS zone'), pool.query('SELECT @@session.time_zone AS zone')]);
  for (const [[{ zone }]] of sessions) assert.equal(zone, '+08:00');

  const connection = await pool.getConnection();
  try {
    const midnight = Date.parse('2026-10-09T16:30:00Z');
    await connection.query('SET timestamp = ?', [midnight / 1000]);
    const [[{ day, issued, deadline }]] = await connection.query(`
      SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS day,
             NOW(3) AS issued, DATE_ADD(NOW(3), INTERVAL 10 MINUTE) AS deadline`);
    assert.equal(day, '2026-10-10');
    assert.equal(issued.getTime(), midnight);
    assert.equal(deadline.getTime(), midnight + 600_000);
  } finally {
    connection.destroy();
  }
});

test('MySQL grace lifecycle uses isolated temporary tables and preserves return order', { skip: process.env.QUEUE_DB_TESTS !== 'true' }, async () => {
  const connection = await pool.getConnection();
  const saved = { getConnection: pool.getConnection, query: pool.query };
  try {
    await connection.query('CREATE TEMPORARY TABLE queue_grace_fixture LIKE queues');
    await connection.query('CREATE TEMPORARY TABLE queues LIKE queue_grace_fixture');
    await connection.query('DROP TEMPORARY TABLE queue_grace_fixture');
    await connection.query('CREATE TEMPORARY TABLE queue_grace_fixture LIKE queue_sequences');
    await connection.query('CREATE TEMPORARY TABLE queue_sequences LIKE queue_grace_fixture');
    await connection.query('DROP TEMPORARY TABLE queue_grace_fixture');
    await connection.query('CREATE TEMPORARY TABLE consultations (consultation_id INT PRIMARY KEY, queue_id INT, doctor_id INT)');
    await connection.query('CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY, user_id INT)');
    await connection.query('CREATE TEMPORARY TABLE users (user_id INT PRIMARY KEY, role VARCHAR(20), is_active BOOLEAN)');
    await connection.query('CREATE TEMPORARY TABLE daily_doctor_settings (doctor_id INT, date DATE, is_available BOOLEAN)');
    await connection.query('CREATE TEMPORARY TABLE doctor_leaves (doctor_id INT, status VARCHAR(20), start_date DATE, end_date DATE)');
    await connection.query("INSERT INTO users VALUES (7, 'doctor', 1), (8, 'doctor', 1), (9, 'doctor', 1), (10, 'doctor', 0)");
    await connection.query('INSERT INTO doctors VALUES (7, 7), (8, 8), (9, 9), (10, 10)');
    await connection.query('INSERT INTO daily_doctor_settings VALUES (8, CURDATE(), 0)');
    await connection.query("INSERT INTO doctor_leaves VALUES (9, 'approved', CURDATE() - INTERVAL 1 DAY, CURDATE() + INTERVAL 1 DAY)");
    assert.equal((await Doctor.findSoleAvailable(connection)).doctor_id, 7);
    await connection.query('UPDATE daily_doctor_settings SET is_available = 1 WHERE doctor_id = 8');
    assert.equal(await Doctor.findSoleAvailable(connection), null);
    await connection.query('UPDATE daily_doctor_settings SET is_available = 0 WHERE doctor_id = 8');
    await connection.query(`INSERT INTO queues (id, patient_id, is_walk_in, queue_number, type, category, services, walk_in_name)
      VALUES (1, 4294967290, 0, 'TEST1', 'regular', 'dental', '[]', 'Grace Test'),
             (2, 4294967291, 1, 'TEST2', 'regular', 'dental', '[]', 'Grace Test'),
             (3, 4294967292, 0, 'TEST3', 'priority', 'dental', '[]', 'Grace Test')`);
    const transaction = {
      query: connection.query.bind(connection), beginTransaction: connection.beginTransaction.bind(connection),
      commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {},
    };
    pool.getConnection = async () => transaction;
    pool.query = connection.query.bind(connection);
    const wait = id => connection.query('UPDATE queues SET last_called_at = DATE_SUB(NOW(3), INTERVAL 31 SECOND) WHERE id = ?', [id]);
    const miss = async id => { await wait(id); await Queue.recall(id); await wait(id); return Queue.skip(id); };

    // Ordinary priority still wins before any patients have returned.
    assert.equal((await Queue.callNext()).id, 3);
    await assert.rejects(Queue.recall(3), { status: 409 });
    const skipped = await miss(3);
    assert.equal(skipped.queue.status, 'missed');
    assert.equal(skipped.next_queue.id, 2);
    assert.equal((await Queue.findByPatientId(4294967292)).status, 'missed');
    assert.equal((await Queue.returnPatient(3)).status, 'waiting');
    await connection.query('UPDATE queues SET grace_expires_at = DATE_SUB(NOW(3), INTERVAL 1 SECOND) WHERE id = 3');
    await Queue.expireMissed();
    assert.equal((await Queue._fetchById(3)).status, 'waiting');
    assert.equal((await Queue.findTodayActive())[1].id, 3);
    await Queue.updateStatus(2, 'serving');
    assert.equal((await Queue.updateStatus(2, 'done')).completed_by_doctor_id, 7);
    assert.equal((await Queue.callNext()).id, 3);
    assert.equal((await miss(3)).queue.status, 'no_show');
    assert.equal((await Queue.findLatestNoShow(4294967292)).status, 'no_show');
    const last = await miss(1);
    assert.equal(last.next_queue, null);
    await connection.query('UPDATE queues SET grace_expires_at = NOW(3) WHERE id = 1');
    assert.deepEqual(await Queue.returnPatient(1), { expired: true });
    assert.equal((await Queue._fetchById(1)).status, 'no_show');
    await assert.rejects(Queue.updateStatus(1, 'serving'), { status: 409 });
  } finally {
    pool.getConnection = saved.getConnection; pool.query = saved.query;
    await connection.query('DROP TEMPORARY TABLE IF EXISTS queue_sequences');
    await connection.query('DROP TEMPORARY TABLE IF EXISTS queues');
    await connection.query('DROP TEMPORARY TABLE IF EXISTS consultations, doctors, users, daily_doctor_settings, doctor_leaves');
    await connection.query('DROP TEMPORARY TABLE IF EXISTS queue_grace_fixture');
    connection.release();
  }
});

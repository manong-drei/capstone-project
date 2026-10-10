const test = require('node:test');
const assert = require('node:assert/strict');
const Queue = require('../src/models/Queue');
const pool = require('../src/config/db');

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
    await Queue.updateStatus(2, 'serving'); await Queue.updateStatus(2, 'done');
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
    await connection.query('DROP TEMPORARY TABLE IF EXISTS queue_grace_fixture');
    connection.release();
    await pool.end();
  }
});

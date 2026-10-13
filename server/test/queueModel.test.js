const assert = require("node:assert/strict");
const test = require("node:test");
const Queue = require("../src/models/Queue");
const pool = require("../src/config/db");

test.after(() => pool.end());

test("ticket prefixes use independent daily dental counters and one general counter", async () => {
  for (const [category, type, is_walk_in, prefix, sequenceType] of [
    ["dental", "regular", true, "Q", "walk_in_regular"],
    ["dental", "priority", true, "P", "walk_in_priority"],
    ["dental", "regular", false, "AQ", "appointment_regular"],
    ["dental", "priority", false, "AP", "appointment_priority"],
    ["general", "regular", true, "G-", "general"],
    ["general", "priority", true, "G-", "general"],
  ]) {
    for (const last_number of [1, 7, 99, 100, 1000]) {
      const calls = [];
      const connection = {
        async query(sql, values) {
          calls.push({ sql, values });
          return calls.length === 2 ? [[{ last_number }]] : [{}];
        },
      };
      assert.equal(
        await Queue.nextQueueNumber({ category, type, is_walk_in }, connection),
        `${prefix}${String(last_number).padStart(category === "general" ? 3 : 2, "0")}`,
      );
      for (const call of calls) {
        assert.match(call.sql, /CURDATE\(\)/);
      }
      assert.deepEqual(calls[0].values, [category, sequenceType, prefix.length + 1, category, `${prefix}%`]);
      assert.deepEqual(calls[1].values, [category, sequenceType]);
      assert.match(calls[0].sql, /MAX\(CAST\(SUBSTRING\(queue_number, \?\) AS UNSIGNED\)\)/);
      assert.match(calls[0].sql, /created_at >= CURDATE\(\) AND created_at < CURDATE\(\) \+ INTERVAL 1 DAY/);
      assert.doesNotMatch(calls[0].sql, /status\s*(?:IN|=)/);
      assert.match(calls[0].sql, /last_number = last_number \+ 1/);
      assert.match(calls[1].sql, /FOR UPDATE/);
    }
  }
});

test("MySQL counters separate sources, preserve issued numbers, and ignore earlier days", { skip: process.env.QUEUE_DB_TESTS !== 'true' }, async () => {
  const connection = await pool.getConnection();
  try {
    // Temporary copies shadow real tables only on this connection.
    for (const table of ['queues', 'queue_sequences']) {
      await connection.query(`CREATE TEMPORARY TABLE queue_number_fixture LIKE ${table}`);
      await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE queue_number_fixture`);
      await connection.query('DROP TEMPORARY TABLE queue_number_fixture');
    }
    await connection.query(`INSERT INTO queue_sequences (queue_date, category, sequence_type, last_number) VALUES
      (CURDATE(), 'dental', 'regular', 99), (CURDATE(), 'dental', 'priority', 99),
      (CURDATE() - INTERVAL 1 DAY, 'dental', 'appointment_regular', 90)`);
    for (const [prefix, type] of [['Q', 'regular'], ['P', 'priority']]) {
      for (let number = 1; number <= 4; number++) {
        await connection.query(`INSERT INTO queues (patient_id, is_walk_in, queue_number, type, category)
          VALUES (4294967290, 1, ?, ?, 'dental')`, [`${prefix}0${number}`, type]);
      }
    }
    await connection.query(`INSERT INTO queues (patient_id, is_walk_in, queue_number, type, category, created_at) VALUES
      (4294967290, 0, 'AQ90', 'regular', 'dental', DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (4294967290, 0, 'AP90', 'priority', 'dental', DATE_SUB(NOW(), INTERVAL 1 DAY))`);
    for (const [category, type, is_walk_in, expected] of [
      ['dental', 'regular', false, 'AQ01'], ['dental', 'priority', false, 'AP01'],
      ['dental', 'regular', true, 'Q05'], ['dental', 'priority', true, 'P05'],
      ['dental', 'regular', false, 'AQ02'], ['dental', 'priority', false, 'AP02'],
      ['general', 'regular', true, 'G-001'], ['general', 'priority', true, 'G-002'],
    ]) {
      assert.equal(await Queue.nextQueueNumber({ category, type, is_walk_in }, connection), expected);
    }

    await connection.query("DELETE FROM queue_sequences WHERE queue_date = CURDATE() AND category = 'dental'");
    await connection.query(`INSERT INTO queues (patient_id, is_walk_in, queue_number, type, category, status) VALUES
      (4294967290, 0, 'AQ05', 'regular', 'dental', 'done'),
      (4294967290, 0, 'AQ09', 'regular', 'dental', 'cancelled'),
      (4294967290, 0, 'AP07', 'priority', 'dental', 'done')`);
    assert.equal(await Queue.nextQueueNumber({ category: 'dental', type: 'regular' }, connection), 'AQ10');
    assert.equal(await Queue.nextQueueNumber({ category: 'dental', type: 'priority' }, connection), 'AP08');
    await connection.beginTransaction();
    assert.equal(await Queue.nextQueueNumber({ category: 'dental', type: 'regular' }, connection), 'AQ11');
    await connection.rollback();
    assert.equal(await Queue.nextQueueNumber({ category: 'dental', type: 'regular' }, connection), 'AQ11');
  } finally {
    await connection.rollback();
    for (const table of ['queues', 'queue_sequences', 'queue_number_fixture']) {
      await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    }
    connection.release();
  }
});

test("call-next alternates using is_walk_in after every queue has a patient ID", async () => {
  const originalConnection = pool.getConnection;
  const originalFetch = Queue._fetchById;
  let calledId;
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql) {
      if (sql.includes("SELECT id FROM queues") && sql.includes("status IN ('called', 'serving')")) return [[]];
      if (sql.includes("SELECT is_walk_in FROM queues")) return [[{ is_walk_in: 0 }]];
      if (sql.includes("status = 'waiting'")) return [[
        { id: 8, patient_id: 41, is_walk_in: 0, type: 'priority', created_at: new Date(0) },
        { id: 9, patient_id: 42, is_walk_in: 1, type: 'regular', created_at: new Date(1) },
      ]];
      if (sql.includes("UPDATE queues SET status = 'called'")) calledId = arguments[1][0];
      return [{}];
    },
  };
  pool.getConnection = async () => connection;
  Queue._fetchById = async () => ({ id: 9 });
  try {
    assert.deepEqual(await Queue.callNext({ category: "dental" }), { id: 9 });
    assert.equal(calledId, 9);
  } finally {
    pool.getConnection = originalConnection;
    Queue._fetchById = originalFetch;
  }
});

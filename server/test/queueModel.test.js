const assert = require("node:assert/strict");
const test = require("node:test");
const Queue = require("../src/models/Queue");
const pool = require("../src/config/db");

test("queue sequences use the category/type counter and preserve prefixes", async () => {
  const calls = [];
  const connection = {
    async query(sql, values) {
      calls.push({ sql, values });
      return calls.length === 2 ? [[{ last_number: 7 }]] : [{}];
    },
  };

  assert.equal(
    await Queue.nextQueueNumber({ category: "dental", type: "priority" }, connection),
    "P-007",
  );
  assert.deepEqual(calls[0].values, ["dental", "priority"]);
});

test("call-next alternates using is_walk_in after every queue has a patient ID", async () => {
  const originalConnection = pool.getConnection;
  const originalFetch = Queue._fetchById;
  let calledId;
  const connection = {
    async beginTransaction() {}, async commit() {}, release() {},
    async query(sql) {
      if (sql.includes("SELECT id FROM queues") && sql.includes("status = 'serving'")) return [[]];
      if (sql.includes("SELECT is_walk_in FROM queues")) return [[{ is_walk_in: 0 }]];
      if (sql.includes("status = 'waiting'")) return [[
        { id: 8, patient_id: 41, is_walk_in: 0, type: 'priority', created_at: new Date(0) },
        { id: 9, patient_id: 42, is_walk_in: 1, type: 'regular', created_at: new Date(1) },
      ]];
      if (sql.includes("UPDATE queues SET status = 'serving'")) calledId = arguments[1][0];
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

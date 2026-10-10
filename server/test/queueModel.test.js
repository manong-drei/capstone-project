const assert = require("node:assert/strict");
const test = require("node:test");
const Queue = require("../src/models/Queue");
const pool = require("../src/config/db");

test("ticket prefixes identify source and priority while keeping the category/type counters", async () => {
  for (const [category, type, is_walk_in, prefix] of [
    ["dental", "regular", true, "Q"],
    ["dental", "priority", true, "P"],
    ["dental", "regular", false, "AQ"],
    ["dental", "priority", false, "AP"],
    ["general", "regular", true, "G-"],
    ["general", "priority", true, "G-"],
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
        assert.deepEqual(call.values, [category, category === "general" ? "general" : type]);
        assert.match(call.sql, /CURDATE\(\)/);
      }
      assert.match(calls[0].sql, /last_number = last_number \+ 1/);
      assert.match(calls[1].sql, /FOR UPDATE/);
    }
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

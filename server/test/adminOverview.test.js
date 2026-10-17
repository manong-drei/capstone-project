const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const { getOverview } = require("../src/controllers/adminController");

test.after(() => pool.end());

test("overview exposes distinct daily waiting, serving and cancelled counts", async () => {
  const originalQuery = pool.query;
  let todayQuery;
  let stats = { activeQueues: 12, waiting: 7, serving: 3, cancelled: 2, doneToday: 9, priorityServed: 1 };
  pool.query = async (sql) => {
    if (sql.includes("AS activeQueues")) {
      todayQuery = sql;
      return [[stats]];
    }
    if (sql.includes("GROUP BY")) return [[]];
    return [[{ count: 10 }]];
  };
  const response = () => ({ json(body) { this.body = body; }, status() { throw new Error("Unexpected overview failure"); } });
  try {
    const res = response();
    await getOverview({}, res);
    for (const [key, value] of Object.entries(stats)) assert.equal(res.body[key], value);
    assert.match(todayQuery, /SUM\(status = 'waiting'\)\s+AS waiting/);
    assert.match(todayQuery, /SUM\(status IN \('called', 'serving'\)\)\s+AS serving/);
    assert.match(todayQuery, /SUM\(status = 'cancelled'\)\s+AS cancelled/);
    assert.match(todayQuery, /WHERE DATE\(created_at\) = CURDATE\(\)/);

    stats = { activeQueues: null, waiting: null, serving: null, cancelled: null, doneToday: null, priorityServed: null };
    const empty = response();
    await getOverview({}, empty);
    for (const key of Object.keys(stats)) assert.equal(empty.body[key], 0);
  } finally {
    pool.query = originalQuery;
  }
});

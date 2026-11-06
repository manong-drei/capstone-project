const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const { getOverview } = require("../src/controllers/adminController");
const { getAllDoctors } = require("../src/controllers/doctorController");

test.after(() => pool.end());

test("overview and doctor roster count only active doctor accounts", async t => {
  const active = [{ doctor_id: 4, is_available: 0 }];
  t.mock.method(pool, "query", async sql => {
    if (sql.includes("FROM doctors d")) {
      assert.match(sql, /JOIN users u ON u\.user_id = d\.user_id\s+AND u\.role = 'doctor' AND u\.is_active = 1/);
      return sql.includes("COUNT(*)") ? [[{ count: active.length }]] : [active];
    }
    return sql.includes("GROUP BY") ? [[]] : [[{ count: 4 }]];
  });
  const response = () => ({
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; },
  });
  for (const expected of [1, 2]) {
    const overview = response();
    const roster = response();
    await getOverview({}, overview);
    await getAllDoctors({}, roster);
    assert.equal(overview.body.totalDoctors, expected);
    assert.equal(roster.body.count, expected);
    assert.equal(roster.body.data[0].doctor_id, 4);
    active.push({ doctor_id: 3, is_available: 1 });
  }
});

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

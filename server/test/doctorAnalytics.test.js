const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/db");
const { getAnalytics } = require("../src/controllers/doctorController");

test("doctor analytics uses the selected calendar window and returns queue, appointment, and age totals", async () => {
  const originalQuery = pool.query;
  const queries = [];
  pool.query = async (sql) => {
    queries.push(sql);
    if (sql.includes("COUNT(DISTINCT patient_id)")) return [[{ patients: 3, waiting: 1, serving: 0, completed: 2, priority: 1, walk_ins: 2 }]];
    if (sql.includes("COUNT(*) AS appointments")) return [[{ appointments: 1 }]];
    return [[{ age_group: "20–59 years", count: 3 }]];
  };
  const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
  try {
    const week = response();
    await getAnalytics({ query: { period: "weekly" } }, week);
    assert.equal(week.data.walk_ins, 2);
    assert.equal(week.data.age_groups[0].count, 3);
    assert.ok(queries.every((sql) => sql.includes("WEEKDAY(CURDATE())")));

    queries.length = 0;
    const month = response();
    await getAnalytics({ query: { period: "monthly" } }, month);
    assert.equal(month.data.appointments, 1);
    assert.ok(queries.every((sql) => sql.includes("%Y-%m-01")));

    const bad = response();
    await getAnalytics({ query: { period: "annual" } }, bad);
    assert.equal(bad.statusCode, 400);
  } finally {
    pool.query = originalQuery;
  }
});

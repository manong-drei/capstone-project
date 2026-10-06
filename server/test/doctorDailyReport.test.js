const assert = require("node:assert/strict");
const test = require("node:test");
const Doctor = require("../src/models/Doctor");
const pool = require("../src/config/db");
const { getDailyReport, getMonthlyReport, saveDailyReport } = require("../src/controllers/doctorController");

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
});

test("daily barangay reports save by date, preserve older fields, and feed the monthly report", async () => {
  const originalFind = Doctor.findByUserId;
  const originalQuery = pool.query;
  const calls = [];
  const data = Array.from({ length: 24 }, () => Array(24).fill(null));
  data[0][0] = 0;
  data[1][8] = 3;
  data[2][23] = 4;
  const legacy = { categories: [[1, 2, 3]], pregnant: [1, 2, 3, 4] };
  Doctor.findByUserId = async (userId) => { assert.equal(userId, 4); return { doctor_id: 7 }; };
  pool.query = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes("DATE_ADD")) return [[{ data: JSON.stringify({ ...legacy, barangays: data }) }]];
    if (sql.startsWith("SELECT")) return [[{ data: JSON.stringify(legacy) }]];
    return [{}];
  };
  try {
    const invalid = response();
    await saveDailyReport({ user: { user_id: 4 }, body: { date: "2026-02-30", data } }, invalid);
    assert.equal(invalid.statusCode, 400);
    assert.equal(calls.length, 0);

    const saved = response();
    await saveDailyReport({ user: { user_id: 4 }, body: { date: "2026-10-06", data } }, saved);
    assert.equal(saved.statusCode, 200);
    assert.deepEqual(calls[1].params, [7, "2026-10-06", JSON.stringify({ ...legacy, barangays: data })]);

    const loaded = response();
    await getDailyReport({ user: { user_id: 4 }, query: { date: "2026-10-06" } }, loaded);
    assert.deepEqual(loaded.data.legacy, legacy);

    const monthly = response();
    await getMonthlyReport({ user: { user_id: 4 }, query: { month: "2026-10" } }, monthly);
    assert.deepEqual(monthly.data.reports, [data]);
    assert.deepEqual(calls[3].params, [7, "2026-10-01", "2026-10-01"]);
  } finally {
    Doctor.findByUserId = originalFind;
    pool.query = originalQuery;
  }
});

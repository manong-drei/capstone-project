const assert = require("node:assert/strict");
const test = require("node:test");
const Doctor = require("../src/models/Doctor");
const pool = require("../src/config/db");
const { getDailyReport, getMonthlyReport, getReport, saveDailyReport } = require("../src/controllers/doctorController");

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
});

test("selected daily, weekly, and monthly reports use doctor-owned calendar ranges and preserve older barangay rows", async (t) => {
  const originalFind = Doctor.findByUserId;
  const originalQuery = pool.query;
  const calls = [];
  const data = Array.from({ length: 24 }, () => Array(24).fill(null));
  data[0][0] = 2;
  const older = Array.from({ length: 24 }, () => Array(12).fill(null));
  older[1][11] = 4;
  Doctor.findByUserId = async (id) => { assert.equal(id, 4); return { doctor_id: 7 }; };
  pool.query = async (sql, params) => {
    calls.push({ sql, params });
    return [[{ data: JSON.stringify({ barangays: data }) }, { data: { barangays: older } }, { data: JSON.stringify({ categories: [[1]] }) }]];
  };
  t.after(() => { Doctor.findByUserId = originalFind; pool.query = originalQuery; });
  for (const [period, date, from, until] of [
    ["today", "2026-10-11", "2026-10-11", "2026-10-12"],
    ["weekly", "2026-10-11", "2026-10-05", "2026-10-12"],
    ["monthly", "2026-12-31", "2026-12-01", "2027-01-01"],
  ]) {
    const res = response();
    await getReport({ user: { user_id: 4 }, query: { period, date } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls.at(-1).params, [7, from, until]);
    assert.match(calls.at(-1).sql, /doctor_id = \? AND report_date >= \? AND report_date < \?/);
    assert.deepEqual(res.data, { period, from, until, reports: [data, older.map((row) => [...row, ...Array(12).fill(null)])] });
  }
  for (const query of [{ period: "annual" }, { date: "2026-02-30" }, { date: ["2026-10-11"] }]) {
    const res = response();
    await getReport({ user: { user_id: 4 }, query }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(calls.length, 3);
  Doctor.findByUserId = async () => null;
  const missing = response();
  await getReport({ user: { user_id: 4 }, query: { date: "2026-10-11" } }, missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(calls.length, 3);
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

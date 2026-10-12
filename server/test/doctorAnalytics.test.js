const assert = require("node:assert/strict");
const test = require("node:test");
const Doctor = require("../src/models/Doctor");
const pool = require("../src/config/db");
const { getAnalytics, getReport } = require("../src/controllers/doctorController");

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
const request = (query) => ({ user: { user_id: 4 }, query });
const fixture = (t) => {
  const original = { find: Doctor.findByUserId, query: pool.query, now: Date.now };
  const queries = [];
  Doctor.findByUserId = async (id) => { assert.equal(id, 4); return { doctor_id: 7 }; };
  Date.now = () => Date.parse("2026-10-11T17:00:00Z");
  pool.query = async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes("COUNT(DISTINCT q.patient_id)")) return [[{ patients: "3", waiting: "1", serving: "0", completed: "4", priority: "1", walk_ins: "2" }]];
    if (sql.includes("COUNT(*) AS appointments")) return [[{ appointments: "1" }]];
    return [[
      { barangay: "Poblacion", sex: "Female", age_group: "20–59 years", count: "2" },
      { barangay: "San Jose", sex: "Male", age_group: "20–59 years", count: "1" },
      { barangay: "Unknown", sex: "Unknown", age_group: "Unknown", count: "1" },
    ]];
  };
  t.after(() => { Doctor.findByUserId = original.find; pool.query = original.query; Date.now = original.now; });
  return queries;
};

test("doctor analytics scopes every count and groups only completed visits without requiring notes", async (t) => {
  const queries = fixture(t);
  const res = response();
  await getAnalytics(request({ period: "weekly", date: "2026-10-11" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.completed, 4);
  assert.equal(res.data.appointments, 1);
  assert.equal(res.data.walk_ins, 2);
  assert.equal(res.data.report_date, "2026-10-12");
  assert.deepEqual(res.data.age_groups, [{ age_group: "20–59 years", count: 3 }, { age_group: "Unknown", count: 1 }]);
  assert.equal(res.data.completed_demographics[0].count, 2);
  assert.equal(res.data.completed_demographics[2].barangay, "Unknown");
  assert.ok(queries.every(({ params }) => JSON.stringify(params) === JSON.stringify(["2026-10-05", "2026-10-12", 7])));
  const [queue, appointments, demographics] = queries.map(({ sql }) => sql);
  for (const sql of [queue, demographics]) {
    assert.match(sql, /c\.queue_id = q\.id ORDER BY c\.consultation_id ASC LIMIT 1/);
    assert.match(sql, /a\.patient_id = q\.patient_id AND a\.appointment_date = DATE\(q\.created_at\) AND a\.status != 'cancelled'/);
    assert.match(sql, /ORDER BY a\.appointment_id ASC LIMIT 1/);
    assert.match(sql, /SELECT d\.doctor_id FROM doctors d ORDER BY d\.doctor_id ASC LIMIT 1/);
    assert.match(sql, /COALESCE\([\s\S]*\) = \?/);
    assert.doesNotMatch(sql, /JOIN consultations|JOIN appointments/);
  }
  assert.match(appointments, /status != 'cancelled' AND doctor_id = \?/);
  assert.match(demographics, /q\.status = 'done'/);
  assert.match(demographics, /LEFT JOIN patients p/);
  assert.match(demographics, /TIMESTAMPDIFF\(YEAR, COALESCE\(p\.date_of_birth, q\.walk_in_dob\), q\.created_at\)/);
  assert.match(demographics, /WHEN 'male' THEN 'Male' WHEN 'female' THEN 'Female' WHEN 'other' THEN 'Other' ELSE 'Unknown'/);
});

test("calendar windows use Manila today, Monday weeks, leap days, and calendar months", async (t) => {
  fixture(t);
  const cases = [
    [{}, "2026-10-12", "2026-10-13"],
    [{ period: "today", date: "2024-02-29" }, "2024-02-29", "2024-03-01"],
    [{ period: "weekly", date: "2026-10-12" }, "2026-10-12", "2026-10-19"],
    [{ period: "weekly", date: "2027-01-01" }, "2026-12-28", "2027-01-04"],
    [{ period: "monthly", date: "2024-02-29" }, "2024-02-01", "2024-03-01"],
    [{ period: "monthly", date: "2026-12-31" }, "2026-12-01", "2027-01-01"],
  ];
  for (const [query, from, until] of cases) {
    const res = response();
    await getAnalytics(request(query), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.from, from);
    assert.equal(res.data.until, until);
  }
});

test("invalid periods and dates are rejected before database access", async (t) => {
  const queries = fixture(t);
  for (const query of [
    { period: "annual" }, { period: "" }, { period: ["today"] },
    { date: "2026-02-30" }, { date: "2026-02-29" }, { date: "2026-13-01" },
    { date: "2026-10-12 OR 1=1" }, { date: ["2026-10-12"] },
  ]) {
    const res = response();
    await getAnalytics(request(query), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(queries.length, 0);
});

test("analytics needs an authenticated dentist profile and returns empty demographics safely", async (t) => {
  const queries = fixture(t);
  Doctor.findByUserId = async () => null;
  const missing = response();
  await getAnalytics(request({}), missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(queries.length, 0);

  Doctor.findByUserId = async () => ({ doctor_id: 7 });
  pool.query = async (sql) => sql.includes("COUNT(DISTINCT") ? [[{ patients: 0, waiting: 0, serving: 0, completed: 0, priority: 0, walk_ins: 0 }]] :
    sql.includes("COUNT(*) AS appointments") ? [[{ appointments: 0 }]] : [[]];
  const empty = response();
  await getAnalytics(request({}), empty);
  assert.deepEqual(empty.data.age_groups, []);
  assert.deepEqual(empty.data.completed_demographics, []);
});

test("MySQL reports count each completed visit once and apply consultation, appointment, and default doctor ownership", { skip: process.env.DOCTOR_DB_TESTS !== "true" }, async () => {
  const connection = await pool.getConnection();
  const originalQuery = pool.query;
  const tables = ["queues", "appointments", "consultations", "doctors", "patients", "doctor_daily_reports"];
  try {
    await connection.query("CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY, user_id INT)");
    await connection.query("CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, date_of_birth DATE, gender VARCHAR(20), barangay VARCHAR(80))");
    await connection.query("CREATE TEMPORARY TABLE queues (id INT PRIMARY KEY, patient_id INT, created_at DATETIME, status VARCHAR(20), category VARCHAR(20), type VARCHAR(20), is_walk_in INT, walk_in_dob DATE, walk_in_gender VARCHAR(20))");
    await connection.query("CREATE TEMPORARY TABLE appointments (appointment_id INT PRIMARY KEY, patient_id INT, doctor_id INT, appointment_date DATE, status VARCHAR(20))");
    await connection.query("CREATE TEMPORARY TABLE consultations (consultation_id INT PRIMARY KEY, queue_id INT, doctor_id INT)");
    await connection.query("CREATE TEMPORARY TABLE doctor_daily_reports (doctor_id INT, report_date DATE, data JSON)");
    await connection.query("INSERT INTO doctors VALUES (7, 4), (9, 5)");
    await connection.query("INSERT INTO patients VALUES (1, '2015-10-11', ' Male ', ' Poblacion '), (3, '2000-01-01', 'female', ''), (4, '1966-10-12', ' Other ', ' San Jose ')");
    await connection.query(`INSERT INTO queues VALUES
      (1, 1, '2026-10-11 08:00:00', 'done', 'dental', 'regular', 0, NULL, NULL),
      (2, NULL, '2026-10-11 09:00:00', 'done', 'dental', 'regular', 1, '2025-10-12', 'female'),
      (3, 3, '2026-10-11 10:00:00', 'done', 'dental', 'priority', 0, NULL, NULL),
      (4, 4, '2026-10-11 11:00:00', 'done', 'dental', 'regular', 0, NULL, NULL),
      (5, NULL, '2026-10-11 12:00:00', 'cancelled', 'dental', 'regular', 1, NULL, NULL),
      (6, NULL, '2026-10-11 13:00:00', 'no_show', 'dental', 'regular', 1, NULL, NULL),
      (7, NULL, '2026-10-11 14:00:00', 'waiting', 'dental', 'regular', 1, NULL, NULL),
      (8, NULL, '2026-10-12 08:00:00', 'done', 'dental', 'regular', 1, NULL, NULL),
      (9, NULL, '2026-10-11 15:00:00', 'done', 'general', 'regular', 1, NULL, NULL),
      (10, NULL, '2026-10-11 16:00:00', 'done', 'dental', 'regular', 1, '2027-01-01', NULL)`);
    await connection.query("INSERT INTO appointments VALUES (1, 1, 7, '2026-10-11', 'cancelled'), (2, 1, 9, '2026-10-11', 'completed'), (3, 1, 7, '2026-10-11', 'confirmed'), (4, 3, 7, '2026-10-11', 'completed')");
    await connection.query("INSERT INTO consultations VALUES (1, 3, 9), (2, 4, 7), (3, 4, 9)");
    const ownReport = Array.from({ length: 24 }, () => Array(24).fill(null));
    ownReport[0][0] = 2;
    await connection.query("INSERT INTO doctor_daily_reports VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)", [
      7, "2026-10-11", JSON.stringify({ barangays: ownReport }),
      9, "2026-10-11", JSON.stringify({ barangays: [] }),
      7, "2026-10-12", JSON.stringify({ barangays: [] }),
    ]);
    pool.query = connection.query.bind(connection);
    const defaultDoctor = response();
    await getAnalytics(request({ date: "2026-10-11" }), defaultDoctor);
    assert.equal(defaultDoctor.statusCode, 200);
    assert.equal(defaultDoctor.data.completed, 3);
    assert.equal(defaultDoctor.data.waiting, 1);
    assert.equal(defaultDoctor.data.appointments, 2);
    assert.deepEqual(defaultDoctor.data.completed_demographics, [
      { barangay: "San Jose", sex: "Other", age_group: "20–59 years", count: 1 },
      { barangay: "Unknown", sex: "Female", age_group: "0–11 months", count: 1 },
      { barangay: "Unknown", sex: "Unknown", age_group: "Unknown", count: 1 },
    ]);
    const otherDoctor = response();
    await getAnalytics({ user: { user_id: 5 }, query: { date: "2026-10-11" } }, otherDoctor);
    assert.equal(otherDoctor.data.completed, 2);
    assert.deepEqual(otherDoctor.data.completed_demographics, [
      { barangay: "Poblacion", sex: "Male", age_group: "10–14 years", count: 1 },
      { barangay: "Unknown", sex: "Female", age_group: "20–59 years", count: 1 },
    ]);
    const manual = response();
    await getReport(request({ date: "2026-10-11" }), manual);
    assert.deepEqual(manual.data.reports, [ownReport]);
  } finally {
    pool.query = originalQuery;
    for (const table of tables) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
    await pool.end();
  }
});

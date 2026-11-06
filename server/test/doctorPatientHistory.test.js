const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const Doctor = require("../src/models/Doctor");
const DoctorHistory = require("../src/models/DoctorHistory");
const User = require("../src/models/User");
const { getPatientHistory, getConsultation } = require("../src/controllers/doctorController");
const router = require("../src/routes/doctorRoutes");

const response = () => ({
  statusCode: 200, headers: {},
  set(key, value) { this.headers[key] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
});

test("history and consultation reads require a doctor session and use its doctor profile", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "patient-history-test-only";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  let role = "doctor";
  t.mock.method(User, "findById", async () => ({ user_id: 4, role, is_active: 1, credential_version: 1 }));
  t.mock.method(Doctor, "findByUserId", async (id) => { assert.equal(id, 4); return { doctor_id: 7 }; });
  const history = t.mock.method(DoctorHistory, "findVisits", async (doctorId) => {
    assert.equal(doctorId, 7);
    return [{ visit_id: "queue-1", consultation_id: 11 }];
  });
  const notes = t.mock.method(DoctorHistory, "findConsultation", async (doctorId, id) => {
    assert.deepEqual([doctorId, id], [7, 11]);
    return { consultation_id: 11, notes: "Saved notes" };
  });
  async function dispatch(path, authenticated = true) {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods.get).route;
    const token = jwt.sign({ user_id: 4, role, credential_version: 1, purpose: "session" }, process.env.JWT_SECRET);
    const req = {
      headers: authenticated ? { authorization: `Bearer ${token}` } : {},
      path, method: "GET", params: { id: "11" }, query: { doctor_id: "99" },
    };
    const res = response();
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  }
  for (const path of ["/patient-history", "/consultations/:id"]) {
    assert.equal((await dispatch(path, false)).statusCode, 401);
    for (role of ["patient", "staff", "admin"]) assert.equal((await dispatch(path)).statusCode, 403);
    role = "doctor";
    const res = await dispatch(path);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
  assert.equal(history.mock.callCount(), 1);
  assert.equal(notes.mock.callCount(), 1);
});

test("history distinguishes missing profiles, unavailable notes and database errors", async (t) => {
  const profile = t.mock.method(Doctor, "findByUserId", async () => null);
  const history = t.mock.method(DoctorHistory, "findVisits", async () => []);
  t.mock.method(DoctorHistory, "findConsultation", async () => null);
  const req = { user: { user_id: 4 }, params: { id: "11" } };
  for (const handler of [getPatientHistory, getConsultation]) {
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, 404);
  }
  profile.mock.mockImplementation(async () => ({ doctor_id: 7 }));
  const empty = response();
  await getPatientHistory(req, empty);
  assert.deepEqual(empty.data, { success: true, visits: [] });
  const missing = response();
  await getConsultation(req, missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.data.message, "Consultation not found.");
  history.mock.mockImplementation(async () => { throw new Error("private database detail"); });
  t.mock.method(console, "error", () => {});
  const failure = response();
  await getPatientHistory(req, failure);
  assert.equal(failure.statusCode, 500);
  assert.equal(failure.data.message, "Unable to load patient history.");
});

test("invalid consultation IDs never reach the database", async (t) => {
  const profile = t.mock.method(Doctor, "findByUserId", async () => ({ doctor_id: 7 }));
  for (const id of ["0", "-1", "1.5", "1e2", "11 OR 1=1", "9007199254740992", "bad"]) {
    const res = response();
    await getConsultation({ params: { id } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(profile.mock.callCount(), 0);
});

test("consultation lookup scopes notes before reading prescriptions and retains existing saved fields", async (t) => {
  let exists = false;
  const queries = [];
  t.mock.method(pool, "query", async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes("FROM consultations c")) {
      assert.match(sql, /WHERE c\.consultation_id = \? AND c\.doctor_id = \?/);
      assert.deepEqual(params, [11, 7]);
      return [exists ? [{ consultation_id: 11, chief_complaint: "Original notes", notes: "Additional findings", diagnosis: "Assessment" }] : []];
    }
    assert.deepEqual(params, [11]);
    return [[{ medication_name: "Recommendation A" }, { medication_name: "Recommendation B" }]];
  });
  assert.equal(await DoctorHistory.findConsultation(7, 11), null);
  assert.equal(queries.length, 1);
  exists = true;
  const data = await DoctorHistory.findConsultation(7, 11);
  assert.equal(data.notes, "Original notes\n\nAdditional findings");
  assert.deepEqual(data.prescriptions, ["Recommendation A", "Recommendation B"]);
});

test("MySQL history combines visits once, preserves repeat visits, and isolates doctors' notes", { skip: process.env.DOCTOR_DB_TESTS !== "true" }, async (t) => {
  t.after(() => pool.end());
  const connection = await pool.getConnection();
  const tables = ["doctors", "patients", "queues", "appointments", "consultations", "prescriptions"];
  try {
    await connection.query("CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY)");
    await connection.query("CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, first_name VARCHAR(50), middle_name VARCHAR(50), last_name VARCHAR(50), suffix VARCHAR(10))");
    await connection.query("CREATE TEMPORARY TABLE queues (id INT PRIMARY KEY, patient_id INT, queue_number VARCHAR(20), created_at DATETIME, is_walk_in TINYINT, status VARCHAR(20), category VARCHAR(20), services TEXT, status_reason VARCHAR(255), walk_in_name VARCHAR(100), completed_by_doctor_id INT)");
    await connection.query("CREATE TEMPORARY TABLE appointments (appointment_id INT PRIMARY KEY, patient_id INT, doctor_id INT, appointment_date DATE, appointment_time TIME, reason VARCHAR(255), status VARCHAR(20))");
    await connection.query("CREATE TEMPORARY TABLE consultations (consultation_id INT PRIMARY KEY, queue_id INT, doctor_id INT, chief_complaint TEXT, notes TEXT, diagnosis TEXT)");
    await connection.query("CREATE TEMPORARY TABLE prescriptions (consultation_id INT, medication_name TEXT)");
    t.mock.method(pool, "query", (sql, params) => connection.query(sql, params));
    await connection.query("INSERT INTO doctors VALUES (7), (9)");
    await connection.query("INSERT INTO patients VALUES (1, 'Ana', 'M', 'Santos', NULL), (2, 'Walk', NULL, 'In', NULL), (4, 'Other', NULL, 'Doctor', NULL), (5, 'No', NULL, 'Notes', NULL)");
    await connection.query(`INSERT INTO queues (id, patient_id, queue_number, created_at, is_walk_in, status, category, services, walk_in_name) VALUES
      (1, 1, 'AQ01', '2026-10-25 09:00:00', 0, 'done', 'dental', '["CONSULTATION"]', NULL),
      (2, 1, 'WQ02', '2026-10-25 10:00:00', 1, 'done', 'dental', '[]', NULL),
      (3, NULL, 'WQ03', '2026-10-24 09:00:00', 1, 'done', 'dental', '[]', 'Legacy walk-in'),
      (4, 4, 'WQ04', '2026-10-24 10:00:00', 1, 'done', 'dental', '[]', NULL),
      (5, 5, 'AQ05', '2026-10-24 11:00:00', 0, 'done', 'dental', '[]', NULL),
      (6, 1, 'AQ06', '2026-10-25 11:00:00', 0, 'done', 'dental', '[]', NULL),
      (7, 2, 'AQ07', '2026-10-23 09:00:00', 0, 'cancelled', 'dental', '[]', NULL),
      (8, 4, 'WQ08', '2026-10-24 14:00:00', 1, 'done', 'dental', '[]', NULL),
      (9, NULL, 'WQ09', '2026-10-24 15:00:00', 1, 'done', 'general', '[]', 'Doctor-treated walk-in'),
      (10, NULL, 'WQ10', '2026-10-24 16:00:00', 1, 'done', 'general', '[]', 'Unassigned walk-in')`);
    await connection.query(`INSERT INTO queues (id, queue_number, created_at, is_walk_in, status, category, walk_in_name, completed_by_doctor_id)
      VALUES (11, 'WQ11', '2026-10-24 17:00:00', 1, 'done', 'dental', 'Dentist recorded without notes', 9)`);
    await connection.query(`INSERT INTO appointments VALUES
      (1, 1, 7, '2026-10-25', '09:00:00', 'Check-up', 'completed'),
      (2, 2, 7, '2026-10-26', '09:00:00', 'Scheduled', 'confirmed'),
      (3, 1, 7, '2026-10-25', '08:00:00', 'Cancelled booking', 'cancelled'),
      (4, 4, 9, '2026-10-24', '10:00:00', 'Other doctor', 'completed'),
      (5, 5, 9, '2026-10-24', '11:00:00', 'Other assignment', 'completed'),
      (6, 2, 7, '2026-10-23', '09:00:00', 'Cancelled visit', 'cancelled')`);
    await connection.query(`INSERT INTO consultations VALUES
      (11, 1, 7, 'First visit', NULL, 'First diagnosis'),
      (12, 2, 7, 'Return visit', 'Additional notes', 'Second diagnosis'),
      (13, 4, 9, 'Other doctor private notes', NULL, NULL),
      (14, 6, 7, 'Another visit', NULL, NULL),
      (15, 9, 7, 'General visit', NULL, NULL)`);
    await connection.query("INSERT INTO prescriptions VALUES (12, 'Follow-up instructions')");
    const visits = await DoctorHistory.findVisits(7);
    assert.deepEqual(new Set(visits.map((row) => row.visit_id)), new Set(["queue-1", "queue-2", "queue-3", "queue-6", "queue-7", "queue-8", "queue-9", "appointment-2", "appointment-3"]));
    const otherVisits = await DoctorHistory.findVisits(9);
    assert.ok(otherVisits.some((row) => row.visit_id === "queue-4"));
    assert.equal(otherVisits.find((row) => row.visit_id === "queue-11")?.consultation_id, null);
    assert.ok(otherVisits.every((row) => !["queue-8", "queue-9", "queue-10"].includes(row.visit_id)));
    assert.equal(visits[0].visit_id, "appointment-2");
    assert.equal(visits.filter((row) => row.patient_full_name === "Ana M Santos").length, 4);
    assert.equal(visits.find((row) => row.visit_id === "queue-2").visit_type, "walk_in");
    assert.equal(visits.find((row) => row.visit_id === "queue-3").patient_full_name, "Legacy walk-in");
    assert.equal(visits.find((row) => row.visit_id === "queue-1").consultation_id, 11);
    assert.equal(visits.find((row) => row.visit_id === "queue-2").consultation_id, 12);
    assert.ok(visits.every((row) => !Object.hasOwn(row, "notes")));
    assert.equal(await DoctorHistory.findConsultation(7, 13), null);
    const detail = await DoctorHistory.findConsultation(7, 12);
    assert.equal(detail.notes, "Return visit\n\nAdditional notes");
    assert.deepEqual(detail.prescriptions, ["Follow-up instructions"]);
  } finally {
    for (const table of tables.reverse()) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
  }
});

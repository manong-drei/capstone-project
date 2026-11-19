const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const Doctor = require("../src/models/Doctor");
const DoctorHistory = require("../src/models/DoctorHistory");
const Appointment = require("../src/models/Appointment");
const User = require("../src/models/User");
const { getPatientHistory, getConsultation, updateConsultation } = require("../src/controllers/doctorController");
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
  async function dispatch(path, authenticated = true, method = "get") {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route;
    const token = jwt.sign({ user_id: 4, role, credential_version: 1, purpose: "session" }, process.env.JWT_SECRET);
    const req = {
      headers: authenticated ? { authorization: `Bearer ${token}` } : {},
      path, method: method.toUpperCase(), params: { id: "11" }, query: { doctor_id: "99" },
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
  assert.equal((await dispatch("/consultations/:id", false, "patch")).statusCode, 401);
  for (role of ["patient", "staff", "admin"]) {
    assert.equal((await dispatch("/consultations/:id", true, "patch")).statusCode, 403);
  }
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

test("MySQL history isolates doctors and exposes only the current prescription after edits", { skip: process.env.DOCTOR_DB_TESTS !== "true" }, async (t) => {
  t.after(() => pool.end());
  const connection = await pool.getConnection();
  const tables = ["doctors", "patients", "queues", "appointments", "consultations", "prescriptions", "specializations"];
  try {
    await connection.query("CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY, first_name TEXT, last_name TEXT, middle_name TEXT, suffix TEXT, specialization_id INT)");
    await connection.query("CREATE TEMPORARY TABLE specializations (specialization_id INT PRIMARY KEY, specialization_name TEXT)");
    await connection.query("CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, first_name VARCHAR(50), middle_name VARCHAR(50), last_name VARCHAR(50), suffix VARCHAR(10))");
    await connection.query("CREATE TEMPORARY TABLE queues (id INT PRIMARY KEY, patient_id INT, queue_number VARCHAR(20), created_at DATETIME, is_walk_in TINYINT, status VARCHAR(20), category VARCHAR(20), services TEXT, status_reason VARCHAR(255), walk_in_name VARCHAR(100), completed_by_doctor_id INT, appointment_id INT, original_queue_number VARCHAR(20), updated_at DATETIME)");
    await connection.query("CREATE TEMPORARY TABLE appointments (appointment_id INT PRIMARY KEY, patient_id INT, doctor_id INT, appointment_date DATE, appointment_time TIME, reason VARCHAR(255), status VARCHAR(20), created_at DATETIME)");
    await connection.query("CREATE TEMPORARY TABLE consultations (consultation_id INT PRIMARY KEY, queue_id INT, doctor_id INT, chief_complaint TEXT, notes TEXT, diagnosis TEXT, patient_id INT)");
    await connection.query("CREATE TEMPORARY TABLE prescriptions (prescription_id INT AUTO_INCREMENT PRIMARY KEY, consultation_id INT, medication_name TEXT)");
    t.mock.method(pool, "query", (sql, params) => connection.query(sql, params));
    await connection.query("INSERT INTO doctors (doctor_id) VALUES (7), (9)");
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
    await connection.query(`INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES
      (1, 1, 7, '2026-10-25', '09:00:00', 'Check-up', 'completed'),
      (2, 2, 7, '2026-10-26', '09:00:00', 'Scheduled', 'confirmed'),
      (3, 1, 7, '2026-10-25', '08:00:00', 'Cancelled booking', 'cancelled'),
      (4, 4, 9, '2026-10-24', '10:00:00', 'Other doctor', 'completed'),
      (5, 5, 9, '2026-10-24', '11:00:00', 'Other assignment', 'completed'),
      (6, 2, 7, '2026-10-23', '09:00:00', 'Cancelled visit', 'cancelled')`);
    await connection.query(`INSERT INTO consultations (consultation_id, queue_id, doctor_id, chief_complaint, notes, diagnosis) VALUES
      (11, 1, 7, 'First visit', NULL, 'First diagnosis'),
      (12, 2, 7, 'Return visit', 'Additional notes', 'Second diagnosis'),
      (13, 4, 9, 'Other doctor private notes', NULL, NULL),
      (14, 6, 7, 'Another visit', NULL, NULL),
      (15, 9, 7, 'General visit', NULL, NULL)`);
    await connection.query("UPDATE queues SET appointment_id = 1 WHERE id = 1");
    await connection.query("UPDATE consultations SET patient_id = 1, notes = 'Legacy notes' WHERE consultation_id = 11");
    await connection.query("INSERT INTO prescriptions (consultation_id, medication_name) VALUES (12, 'Follow-up instructions'), (11, 'Old prescription')");
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

    let failPrescription = false;
    t.mock.method(pool, "getConnection", async () => ({
      query(sql, params) {
        if (failPrescription && sql.startsWith("INSERT INTO prescriptions")) throw new Error("Synthetic write failure");
        return connection.query(sql, params);
      },
      beginTransaction: connection.beginTransaction.bind(connection),
      rollback: connection.rollback.bind(connection),
      commit: connection.commit.bind(connection),
      release() {},
    }));
    t.mock.method(Doctor, "findByUserId", async (id) => ({ doctor_id: id }));
    const edit = async (doctorId, revision, changes) => {
      const res = response();
      await updateConsultation({ params: { id: "11" }, user: { user_id: doctorId, purpose: "session" },
        body: { revision, ...changes } }, res);
      return res;
    };
    const original = await DoctorHistory.findConsultation(7, 11);
    assert.equal((await edit(9, original.revision, { notes: "" })).statusCode, 404);
    const diagnosis = await edit(7, original.revision, { diagnosis: "Updated diagnosis" });
    assert.equal(diagnosis.statusCode, 200);
    assert.equal(diagnosis.data.data.notes, "First visit\n\nLegacy notes");
    assert.deepEqual(diagnosis.data.data.prescriptions, ["Old prescription"]);
    assert.equal((await edit(7, original.revision, { notes: "" })).statusCode, 409);
    failPrescription = true;
    t.mock.method(console, "error", () => {});
    assert.equal((await edit(7, diagnosis.data.data.revision, { notes: "Unsaved", prescription: "Unsaved" })).statusCode, 500);
    const afterFailure = await DoctorHistory.findConsultation(7, 11);
    assert.equal(afterFailure.revision, diagnosis.data.data.revision);
    failPrescription = false;
    const corrected = await edit(7, diagnosis.data.data.revision, { notes: "Corrected notes", prescription: "Updated prescription" });
    assert.equal(corrected.statusCode, 200);
    const cleared = await edit(7, corrected.data.data.revision, { notes: "" });
    assert.equal(cleared.statusCode, 200);
    assert.equal(cleared.data.data.notes, "");
    assert.equal(cleared.data.data.chief_complaint, null);
    const patientVisit = () => Appointment.findByPatientId(1).then(rows => rows.find(row => row.appointment_id === 1));
    const latest = await patientVisit();
    assert.equal(latest.status, "completed");
    assert.equal(latest.diagnosis, "Updated diagnosis");
    assert.deepEqual(latest.recommendations, ["Updated prescription"]);
    assert.equal((await edit(7, cleared.data.data.revision, { prescription: "" })).statusCode, 200);
    assert.equal((await patientVisit()).recommendations, null);
  } finally {
    for (const table of tables.reverse()) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
  }
});

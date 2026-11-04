const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const Patient = require("../src/models/Patient");
const Doctor = require("../src/models/Doctor");
const DoctorHistory = require("../src/models/DoctorHistory");
const User = require("../src/models/User");
const { getPatientById } = require("../src/controllers/patientController");
const router = require("../src/routes/patientRoutes");

const response = () => ({
  statusCode: 200, headers: {},
  set(key, value) { this.headers[key] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const patient = { patient_id: 42, user_id: 10, first_name: "Maria", last_name: "Santos" };
const request = (role = "doctor", id = "42") => ({ params: { id }, user: { user_id: 4, role } });

test("doctors can read their patient's demographics and own visits without account credentials", async (t) => {
  t.mock.method(Doctor, "findByUserId", async (id) => { assert.equal(id, 4); return { doctor_id: 7 }; });
  t.mock.method(DoctorHistory, "findVisits", async (...args) => {
    assert.deepEqual(args, [7, 42]);
    return [{ visit_id: "queue-1", patient_id: 42 }];
  });
  t.mock.method(Patient, "findById", async (id) => { assert.equal(id, 42); return patient; });
  const account = t.mock.method(User, "findById", async () => { throw new Error("Must not read account credentials"); });
  const audit = t.mock.method(Patient, "audit", async () => {});
  const res = response();
  await getPatientById(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.body.data.first_name, "Maria");
  assert.equal(res.body.data.visits.length, 1);
  assert.equal(res.body.data.account, null);
  assert.equal(account.mock.callCount(), 0);
  assert.equal(audit.mock.calls[0].arguments[2], "view");
});

test("doctors cannot look up unrelated patients or read demographics without a dentist profile", async (t) => {
  const doctor = t.mock.method(Doctor, "findByUserId", async () => null);
  const visits = t.mock.method(DoctorHistory, "findVisits", async () => []);
  const details = t.mock.method(Patient, "findById", async () => patient);
  const missingDoctor = response();
  await getPatientById(request(), missingDoctor);
  assert.equal(missingDoctor.statusCode, 404);
  assert.equal(visits.mock.callCount(), 0);
  doctor.mock.mockImplementation(async () => ({ doctor_id: 7 }));
  const unrelated = response();
  await getPatientById(request(), unrelated);
  assert.equal(unrelated.statusCode, 404);
  assert.equal(unrelated.body.message, "Patient not found.");
  assert.equal(details.mock.callCount(), 0);
});

test("staff and admin retain complete queue history and account-recovery information", async (t) => {
  t.mock.method(Patient, "findById", async () => patient);
  t.mock.method(Patient, "audit", async () => {});
  t.mock.method(User, "findById", async () => ({ role: "patient", phone: "09123456789", is_active: 1, credential_version: 3, password_hash: "private" }));
  t.mock.method(pool, "query", async () => [[{ id: 1 }, { id: 2 }]]);
  const history = t.mock.method(DoctorHistory, "findVisits", async () => []);
  for (const role of ["staff", "admin"]) {
    const res = response();
    await getPatientById(request(role), res);
    assert.equal(res.body.data.visits.length, 2);
    assert.deepEqual(res.body.data.account, { phone: "09123456789", is_active: 1, credential_version: 3 });
  }
  assert.equal(history.mock.callCount(), 0);
});

test("invalid patient IDs never reach a database lookup", async (t) => {
  const lookup = t.mock.method(Patient, "findById", async () => patient);
  const doctor = t.mock.method(Doctor, "findByUserId", async () => null);
  for (const id of ["0", "-1", "1.5", "bad", "42 OR 1=1", "9007199254740992"]) {
    const res = response();
    await getPatientById(request("doctor", id), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal(doctor.mock.callCount(), 0);
});

test("the profile route rejects patients and anonymous requests, and doctor access does not allow account mutations", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "patient-profile-test-only";
  t.after(() => { if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret; });
  let role = "patient";
  t.mock.method(User, "findById", async () => ({ user_id: 4, role, is_active: 1, credential_version: 1 }));
  async function dispatch(path, method, authenticated = true) {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route;
    const token = jwt.sign({ user_id: 4, role, purpose: "session", credential_version: 1 }, process.env.JWT_SECRET);
    const req = { headers: authenticated ? { authorization: `Bearer ${token}` } : {}, params: { id: "42" }, method: method.toUpperCase(), path };
    const res = response();
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  }
  assert.equal((await dispatch("/:id", "get", false)).statusCode, 401);
  assert.equal((await dispatch("/:id", "get")).statusCode, 403);
  role = "doctor";
  for (const path of ["/:id/merge", "/:id/account-recovery"]) {
    assert.equal((await dispatch(path, "post")).statusCode, 403);
  }
  t.mock.method(Doctor, "findByUserId", async () => ({ doctor_id: 7 }));
  t.mock.method(DoctorHistory, "findVisits", async () => [{ visit_id: "queue-1" }]);
  t.mock.method(Patient, "findById", async () => patient);
  t.mock.method(Patient, "audit", async () => {});
  assert.equal((await dispatch("/:id", "get")).statusCode, 200);
});

test("patient-filtered doctor history scopes both queues and appointments with bound parameters", async (t) => {
  const queries = [];
  t.mock.method(pool, "query", async (sql, params) => { queries.push({ sql, params }); return [[]]; });
  await DoctorHistory.findVisits(7, 42);
  assert.match(queries[0].sql, /AND q\.patient_id = \?/);
  assert.match(queries[0].sql, /AND a\.patient_id = \?/);
  assert.deepEqual(queries[0].params, [7, 42, 7, 42]);
  await DoctorHistory.findVisits(7);
  assert.deepEqual(queries[1].params, [7, 7]);
});

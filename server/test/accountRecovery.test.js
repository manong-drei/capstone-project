const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const Patient = require("../src/models/Patient");
const User = require("../src/models/User");
const { recoverAccount, getPatientById } = require("../src/controllers/patientController");
const { login, changePassword } = require("../src/controllers/authController");
const authenticate = require("../src/middleware/authenticate");
const patientRouter = require("../src/routes/patientRoutes");
const devBypass = require("../src/middleware/devBypass");
const { sessionResponse } = require("../src/utils/authSession");

test.after(() => pool.end());
const checks = ["patient_present", "first_name", "last_name", "phone", "address", "date_of_birth"];
const verification = Object.fromEntries(checks.map(key => [key, true]));
const request = (version = 2) => ({ params: { id: "42" }, body: { expected_credential_version: version, verification }, user: { user_id: 8 } });
const response = () => ({
  statusCode: 200, headers: {},
  status(code) { this.statusCode = code; return this; },
  set(key, value) { this.headers[key] = value; return this; },
  json(body) { this.body = body; return this; },
});

// Model row locks and transaction snapshots so racing requests and rollback are checked.
async function database(t) {
  const now = new Date("2026-10-13T02:00:00.000Z");
  const state = {
    patient: { patient_id: 42, user_id: 7, first_name: "Ana", last_name: "Test", date_of_birth: new Date("1990-01-01"), barangay: "Abuanan", city: "Bago City", archived_into_patient_id: null },
    user: { user_id: 7, role: "patient", phone: "09123456789", is_active: 1, credential_version: 2, must_change_password: 0, password_hash: await bcrypt.hash("OldPassword1", 4), temp_password_used_at: now, login_failures: 4, login_locked_until: now },
    jobs: [{ state: "queued" }, { state: "submitting" }, { state: "submitted" }],
    audits: [],
  };
  const events = [];
  let held = Promise.resolve();
  let failAudit = false;
  t.mock.method(User, "generateTempPassword", () => "012345");
  t.mock.method(pool, "getConnection", async () => {
    let working;
    let unlock;
    const lock = async () => {
      if (working) return;
      const previous = held;
      held = new Promise(resolve => { unlock = resolve; });
      await previous;
      working = structuredClone(state);
    };
    return {
      async beginTransaction() {},
      async query(sql, values) {
        events.push({ sql, values });
        if (sql.includes("FOR UPDATE")) await lock();
        if (sql.startsWith("SELECT patient_id")) return [[working.patient].filter(Boolean)];
        if (sql.startsWith("SELECT user_id") || sql.startsWith("SELECT *")) {
          if (sql.startsWith("SELECT *")) return [[working.user && { ...working.user, db_now: now }].filter(Boolean)];
          assert.match(sql, /DATE_ADD\(NOW\(\), INTERVAL 30 MINUTE\)/);
          return [[working.user && { ...working.user, recovery_expires_at: new Date(now.getTime() + 30 * 60000) }].filter(Boolean)];
        }
        if (sql.includes("UPDATE users SET password_hash")) Object.assign(working.user, {
          password_hash: values[0], credential_version: values[1], must_change_password: 1,
          temp_password_expires_at: values[2], temp_password_used_at: null, login_failures: 0, login_locked_until: null,
        });
        else if (sql.includes("UPDATE sms_jobs")) {
          assert.match(sql, /purpose = 'temporary_password'/);
          assert.match(sql, /state IN \('queued','submitting'\)/);
          working.jobs.filter(job => ["queued", "submitting"].includes(job.state)).forEach(job => Object.assign(job, { state: "cancelled", payload: null }));
        } else if (sql.includes("INSERT INTO patient_audit")) {
          if (failAudit) throw new Error("synthetic audit failure");
          working.audits.push({ patient_id: values[0], actor_user_id: values[1], action: values[2], details: JSON.parse(values[3]) });
        } else if (sql.includes("temp_password_used_at = IF")) working.user.temp_password_used_at = now;
        else if (sql.includes("login_failures = IF")) working.user.login_failures++;
        return [{ affectedRows: 1 }];
      },
      async commit() { Object.assign(state, working); events.push({ sql: "COMMIT" }); unlock?.(); },
      async rollback() { events.push({ sql: "ROLLBACK" }); unlock?.(); },
      release() {},
    };
  });
  t.mock.method(pool, "query", async (sql, values) => {
    if (sql.includes("FROM users")) return [[state.user && { ...state.user }].filter(Boolean)];
    if (sql.includes("UPDATE users SET password_hash")) {
      if (values[2] !== state.user.credential_version) return [{ affectedRows: 0 }];
      Object.assign(state.user, { password_hash: values[0], must_change_password: 0, credential_version: state.user.credential_version + 1, temp_password_expires_at: null, temp_password_used_at: null });
      return [{ affectedRows: 1 }];
    }
    return [[]];
  });
  return { state, events, now, failAudit: () => { failAudit = true; } };
}

test("profile exposes only safe account metadata and nullable unlinked accounts", async t => {
  t.mock.method(Patient, "findById", async () => ({ patient_id: 42, user_id: 7 }));
  t.mock.method(Patient, "audit", async () => {});
  t.mock.method(pool, "query", async () => [[]]);
  const find = t.mock.method(User, "findById", async () => ({ phone: "09123456789", role: "patient", is_active: 1, credential_version: 2, password_hash: "secret", temp_password: "secret" }));
  const req = { params: { id: "42" }, user: { user_id: 8 } };
  let res = response();
  await getPatientById(req, res);
  assert.deepEqual(res.body.data.account, { phone: "09123456789", is_active: 1, credential_version: 2 });
  for (const patient of [{ patient_id: 42, user_id: null }, { patient_id: 42, user_id: 7 }]) {
    t.mock.method(Patient, "findById", async () => patient);
    find.mock.mockImplementation(async () => ({ role: "doctor" }));
    res = response(); await getPatientById(req, res);
    assert.equal(res.body.data.account, null);
  }
});

test("requires every strict confirmation and a positive numeric version before accessing the database", async t => {
  const connection = t.mock.method(pool, "getConnection", async () => { throw new Error("must not query"); });
  const badBodies = [null, {}, { expected_credential_version: "2", verification }, { expected_credential_version: 0, verification }];
  for (const key of checks) {
    for (const value of [false, "true", 1, undefined]) badBodies.push({ expected_credential_version: 2, verification: { ...verification, [key]: value } });
  }
  for (const body of badBodies) {
    const res = response(); await recoverAccount({ ...request(), body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
  for (const id of ["0", "-1", "abc", "1.5", "9007199254740992"]) {
    const res = response(); await recoverAccount({ ...request(), params: { id } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(connection.mock.callCount(), 0);
});

test("issuance commits hash, expiry, credential rotation, SMS cancellation and sanitized audit before revealing the password", async t => {
  const { state, events, now } = await database(t);
  const res = response();
  res.json = function(body) {
    assert.equal(events.at(-1).sql, "COMMIT");
    this.body = body; return this;
  };
  await recoverAccount({ ...request(), body: { ...request().body, phone: "09999999999", newPassword: "ChosenPassword1", verification: { ...verification, unrelated: "do not audit" } } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.deepEqual(res.body.data, { temp_password: "012345", registered_phone: "09123456789", expires_at: new Date(now.getTime() + 30 * 60000).toISOString() });
  assert.ok(await bcrypt.compare("012345", state.user.password_hash));
  assert.equal(state.user.credential_version, 3);
  assert.equal(state.user.must_change_password, 1);
  assert.equal(state.user.temp_password_used_at, null);
  assert.equal(state.user.login_failures, 0);
  assert.equal(state.user.login_locked_until, null);
  assert.deepEqual(state.jobs.map(job => job.state), ["cancelled", "cancelled", "submitted"]);
  assert.deepEqual(state.audits, [{ patient_id: 42, actor_user_id: 8, action: "account_recovery", details: { user_id: 7, verification, credential_version: 3, expires_at: res.body.data.expires_at } }]);
  assert.ok(!JSON.stringify(state.audits).includes("012345"));
  assert.ok(!JSON.stringify(state.audits).includes("Ana"));
});

test("ineligible accounts and incomplete records roll back without replacing credentials", async t => {
  const { state, events } = await database(t);
  const original = structuredClone(state);
  const cases = [
    { patient: null, status: 404 },
    { patient: { ...original.patient, user_id: null } },
    { patient: { ...original.patient, archived_into_patient_id: 9 } },
    { user: null },
    { user: { ...original.user, role: "admin" } },
    { user: { ...original.user, is_active: 0 } },
    { user: { ...original.user, credential_version: 3 } },
    { user: { ...original.user, phone: "invalid" } },
    ...["first_name", "last_name", "date_of_birth", "barangay", "city"].map(key => ({ patient: { ...original.patient, [key]: null } })),
  ];
  for (const { status = 409, ...changes } of cases) {
    Object.assign(state, structuredClone(original), changes);
    const before = structuredClone(state);
    const res = response(); await recoverAccount(request(), res);
    assert.equal(res.statusCode, status);
    assert.deepEqual(state, before);
    assert.equal(res.body.data, undefined);
    assert.equal(events.at(-1).sql, "ROLLBACK");
  }
});

test("audit failure rolls back and simultaneous issuances with the same version have one winner", async t => {
  const db = await database(t);
  const before = structuredClone(db.state);
  const responses = [response(), response()];
  await Promise.all(responses.map(res => recoverAccount(request(), res)));
  assert.deepEqual(responses.map(res => res.statusCode).sort(), [201, 409]);
  assert.equal(db.state.audits.length, 1);
  Object.assign(db.state, before);
  db.failAudit();
  const res = response(); await recoverAccount(request(), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(db.state, before);
  assert.equal(res.body.data, undefined);
});

test("recovered credentials expire exactly at 30 minutes, redeem once, invalidate prior sessions and complete password setup", async t => {
  const { state, now } = await database(t);
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "account-recovery-test-only";
  t.after(() => { if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; });
  const oldSession = sessionResponse(state.user);
  await recoverAccount(request(), response());
  assert.equal(await User.authenticate(state.user.phone, "OldPassword1"), null);
  const expiry = state.user.temp_password_expires_at;
  state.user.temp_password_expires_at = now;
  assert.equal(await User.authenticate(state.user.phone, "012345"), null);
  state.user.temp_password_expires_at = expiry;
  const expiredSession = response();
  await authenticate({ headers: { authorization: `Bearer ${oldSession.token}` }, path: "/me", method: "GET" }, expiredSession, () => assert.fail("old session accepted"));
  assert.equal(expiredSession.statusCode, 401);
  const res = response(); await login({ body: { phone: state.user.phone, password: "012345" } }, res);
  assert.equal(res.statusCode, 200);
  const claims = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(claims.purpose, "password_setup");
  assert.equal(claims.exp - claims.iat, 15 * 60);
  assert.equal(await User.authenticate(state.user.phone, "012345"), null);
  const blocked = response();
  await authenticate({ headers: { authorization: `Bearer ${res.body.token}` }, path: "/profile", method: "GET" }, blocked, () => assert.fail("setup accessed profile"));
  assert.equal(blocked.statusCode, 403);
  const changed = response();
  await changePassword({ user: claims, body: { newPassword: "PatientPassword2" } }, changed);
  assert.equal(changed.statusCode, 200);
  assert.equal(changed.body.user.must_change_password, false);
  assert.equal(state.user.credential_version, 4);
  const next = await User.authenticate(state.user.phone, "PatientPassword2");
  assert.equal(jwt.verify(next.token, process.env.JWT_SECRET).purpose, "session");
});

test("real route enforces staff/admin permissions, rejects development identities and limits by authenticated account", async t => {
  const db = await database(t);
  const saved = { secret: process.env.JWT_SECRET, environment: process.env.NODE_ENV };
  process.env.JWT_SECRET = "route-recovery-test-only";
  process.env.NODE_ENV = "development";
  t.after(() => {
    for (const [key, value] of [["JWT_SECRET", saved.secret], ["NODE_ENV", saved.environment]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const actors = { 1001: "staff", 1002: "admin", 1003: "patient", 1004: "doctor", 1005: "staff", 1006: "staff" };
  t.mock.method(User, "findById", async id => ({ user_id: id, role: actors[id], is_active: 1, credential_version: 1, must_change_password: 0 }));
  const app = express();
  app.use(express.json());
  app.use(devBypass);
  app.use("/api/patients", patientRouter);
  const server = await new Promise(resolve => { const running = app.listen(0, "127.0.0.1", () => resolve(running)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}/api/patients/42/account-recovery`;
  const dispatch = async (id, body = request().body, purpose = "session", extraHeaders = {}) => {
    const token = id && jwt.sign({ user_id: id, role: "admin", credential_version: 1, purpose }, process.env.JWT_SECRET);
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders }, body: JSON.stringify(body) });
  };
  assert.equal((await dispatch(null)).status, 401);
  for (const id of [1003, 1004]) assert.equal((await dispatch(id)).status, 403);
  assert.equal((await dispatch(1001, {}, "development")).status, 403);
  assert.equal((await dispatch(null, {}, "session", { "x-dev-role": "staff" })).status, 403);
  for (const id of [1001, 1002]) {
    const res = await dispatch(id, request(db.state.user.credential_version).body);
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("cache-control"), "no-store");
  }
  for (let i = 0; i < 10; i++) assert.equal((await dispatch(1005, {})).status, 400);
  const limited = await dispatch(1005, {});
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("cache-control"), "no-store");
  assert.equal((await dispatch(1006, {})).status, 400);
});

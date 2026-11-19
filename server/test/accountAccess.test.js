const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const User = require("../src/models/User");
const authenticate = require("../src/middleware/authenticate");
const { deactivateStaff, reactivateStaff, deactivationImpact } = require("../src/controllers/adminController");
const { issueWorkforcePassword } = require("../src/services/accountAccess");

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  set() {},
  json(body) { this.body = body; return this; },
});

test("only a verified real administrator or the deployment operator can issue the intended workforce credential", async (t) => {
  const actor = { user_id: 8, role: "admin", is_active: 1, credential_version: 2 };
  const target = { user_id: 9, role: "doctor", is_active: 1, credential_version: 4,
    phone: "09123456789", recovery_expires_at: new Date("2026-11-19T02:30:00.000Z") };
  const events = [];
  t.mock.method(User, "findByIdWithHash", async () => actor);
  t.mock.method(User, "verifyPassword", async password => password === "SyntheticAdmin1");
  t.mock.method(User, "generateTempPassword", () => "102938");
  const connection = {
    async beginTransaction() {},
    async commit() { events.push("commit"); },
    async rollback() { events.push("rollback"); },
    release() {},
    async query(sql, values) {
      if (sql.startsWith("SELECT")) {
        assert.match(sql, /ORDER BY user_id FOR UPDATE/);
        return [[actor, target].filter(user => values[0].includes(user.user_id))];
      }
      if (sql.startsWith("UPDATE users")) {
        assert.match(sql, /must_change_password = 1/);
        assert.equal(values[2], target.recovery_expires_at);
        assert.equal(values[3], target.user_id);
        target.credential_version = values[1];
      } else if (sql.startsWith("INSERT INTO audit_logs")) {
        assert.equal(values[6], target.user_id);
        assert.equal(values[4], "password.issued");
        assert.ok(!values[10].includes("102938"));
        events.push(JSON.parse(values[10]).method);
      }
      return [{}];
    },
  };
  t.mock.method(pool, "getConnection", async () => connection);
  const req = { user: actor, auditActor: actor, body: { staff_password: "incorrect" } };
  await assert.rejects(issueWorkforcePassword(9, req, { expectedVersion: 4 }), { status: 403 });
  assert.equal(target.credential_version, 4);
  req.body.staff_password = "SyntheticAdmin1";
  await assert.rejects(issueWorkforcePassword(8, req, { expectedVersion: 2 }), { status: 403 });
  actor.role = "staff";
  await assert.rejects(issueWorkforcePassword(9, req, { expectedVersion: 4 }), { status: 403 });
  actor.role = "admin";
  assert.deepEqual(await issueWorkforcePassword(9, req, { expectedVersion: 4 }), {
    temp_password: "102938", expires_at: target.recovery_expires_at.toISOString(), registered_phone: target.phone,
  });
  assert.equal(target.credential_version, 5);
  await assert.rejects(issueWorkforcePassword(9, req, { expectedVersion: 4 }), { status: 409 });
  const operator = { auditActor: { name: "Deployment operator test" } };
  await assert.rejects(issueWorkforcePassword(9, operator, { operator: true, expectedVersion: 5 }), { status: 404 });
  target.role = "admin";
  await issueWorkforcePassword(9, operator, { operator: true, expectedVersion: 5 });
  assert.deepEqual(events.slice(-2), ["deployment_operator", "commit"]);
  assert.equal(target.credential_version, 6);
});

test("deactivation revokes existing sessions permanently and does not depend on its impact lookup", async t => {
  const user = { user_id: 9, role: "doctor", is_active: 1, credential_version: 4 };
  const writes = [];
  t.mock.method(User, "findById", async () => user);
  t.mock.method(pool, "query", async () => { throw new Error("Impact query unavailable"); });
  t.mock.method(pool, "getConnection", async () => ({
    async beginTransaction() {},
    async commit() {},
    release() {},
    async query(sql) {
      if (sql.startsWith("SELECT")) return [[user]];
      writes.push(sql);
      if (sql.startsWith("UPDATE users SET is_active = 0")) {
        user.is_active = 0;
        user.credential_version++;
      }
      if (sql.startsWith("UPDATE users SET is_active = 1")) user.is_active = 1;
      return [{}];
    },
  }));
  const req = { params: { user_id: "9" }, body: { reason: "Duplicate account" },
    user: { user_id: 8 }, auditActor: { user_id: 8, role: "admin" } };
  const preview = response();
  await deactivationImpact(req, preview);
  assert.equal(preview.statusCode, 503);
  const result = response();
  await deactivateStaff(req, result);
  assert.equal(result.statusCode, 200);
  await deactivateStaff(req, response());
  assert.equal(user.credential_version, 5);
  await reactivateStaff(req, response());
  assert.equal(user.is_active, 1);
  assert.equal(user.credential_version, 5);
  assert.ok(!writes.some(sql => /UPDATE (queues|appointments)/.test(sql)));

  const token = jwt.sign({ user_id: 9, role: "doctor", purpose: "session", credential_version: 4 }, process.env.JWT_SECRET);
  const rejected = response();
  await authenticate({ headers: { authorization: `Bearer ${token}` } }, rejected, () => assert.fail("Old session accepted"));
  assert.equal(rejected.body.code, "SESSION_REVOKED");
});

test("authentication distinguishes expiry from a temporarily unavailable account lookup", async t => {
  t.mock.method(User, "findById", async () => { throw new Error("Database unavailable"); });
  const claims = { user_id: 9, role: "doctor", purpose: "session", credential_version: 4 };
  for (const [seconds, status, code] of [[-1, 401, "SESSION_EXPIRED"], [60, 503, "AUTH_UNAVAILABLE"]]) {
    const token = jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: seconds });
    const res = response();
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail("Invalid session accepted"));
    assert.equal(res.statusCode, status);
    assert.equal(res.body.code, code);
  }
});

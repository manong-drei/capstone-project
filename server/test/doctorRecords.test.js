const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");
const User = require("../src/models/User");
const { getDoctorRecords } = require("../src/controllers/doctorController");
const router = require("../src/routes/doctorRoutes");

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
});

test("doctor records route restricts profile/history access to admins and scopes queries to the requested doctor", async (t) => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "doctor-records-test-only";
  t.after(() => {
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
  });
  let role = "admin";
  let queries = 0;
  const doctor = { doctor_id: 7, first_name: "Maria", last_name: "Santos", contact_number: "09123456780", date_added: "2026-01-14T16:30:00.000Z", is_available: 1 };
  const availability = [{ date: "2026-10-18", is_available: 1, appointment_limit: 10, walk_in_limit: 0 }, { date: "2026-10-17", is_available: 0, appointment_limit: 0, walk_in_limit: 5 }];
  t.mock.method(User, "findById", async () => ({ user_id: 8, role, is_active: 1, credential_version: 1, must_change_password: 0 }));
  t.mock.method(pool, "query", async (sql, params) => {
    queries++;
    assert.deepEqual(params, [7]);
    if (sql.includes("FROM doctors d")) {
      assert.match(sql, /u\.created_at AS date_added/);
      assert.match(sql, /COALESCE\(NULLIF\(d\.contact_number, ''\), u\.phone\)/);
      assert.match(sql, /dds\.date = CURDATE\(\)/);
      assert.match(sql, /WHERE d\.doctor_id = \?/);
      assert.doesNotMatch(sql, /SELECT \*|u\.\*|password|credential_version/);
      return [[doctor]];
    }
    assert.match(sql, /FROM daily_doctor_settings\s+WHERE doctor_id = \?\s+ORDER BY date DESC/);
    assert.match(sql, /DATE_FORMAT\(date, '%Y-%m-%d'\)/);
    return [availability];
  });
  const route = router.stack.find((layer) => layer.route?.path === "/:id/records" && layer.route.methods.get).route;
  const dispatch = async (authenticated = true) => {
    const token = jwt.sign({ user_id: 8, role, credential_version: 1, purpose: "session" }, process.env.JWT_SECRET);
    const req = { headers: authenticated ? { authorization: `Bearer ${token}` } : {}, path: "/7/records", method: "GET", params: { id: "7" } };
    const res = response();
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  };

  assert.equal((await dispatch(false)).statusCode, 401);
  for (role of ["patient", "staff", "doctor"]) assert.equal((await dispatch()).statusCode, 403);
  assert.equal(queries, 0);
  role = "admin";
  const res = await dispatch();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.data, { success: true, data: { doctor, availability } });
  assert.equal(queries, 2);
});

test("doctor records reject invalid IDs before querying and distinguish missing doctors from empty history", async (t) => {
  const queries = [];
  let exists = false;
  t.mock.method(pool, "query", async (sql, params) => {
    queries.push({ sql, params });
    return [sql.includes("FROM doctors d") && exists ? [{ doctor_id: 7 }] : []];
  });
  for (const id of ["bad", "0", "-7", "1.2", "1e2", "7 OR 1=1", "9007199254740992"]) {
    const res = response();
    await getDoctorRecords({ params: { id } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(queries.length, 0);
  const missing = response();
  await getDoctorRecords({ params: { id: "7" } }, missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(queries.length, 1);

  exists = true;
  const empty = response();
  await getDoctorRecords({ params: { id: "7" } }, empty);
  assert.equal(empty.statusCode, 200);
  assert.deepEqual(empty.data.data.availability, []);
  assert.equal(queries.length, 3);
});

test("doctor records report database failures without exposing internal errors", async (t) => {
  t.mock.method(pool, "query", async () => { throw new Error("private database detail"); });
  t.mock.method(console, "error", () => {});
  const res = response();
  await getDoctorRecords({ params: { id: "7" } }, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.data, { success: false, message: "Unable to load doctor records." });
});

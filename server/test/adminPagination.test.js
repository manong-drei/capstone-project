const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const { getPatients } = require("../src/controllers/adminController");
const { getAllAppointments } = require("../src/controllers/appointmentController");
const { parsePagination } = require("../src/utils/pagination");

test.after(() => pool.end());
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("patient list limits rows in SQL and counts matching active accounts separately", async (t) => {
  const calls = [];
  const patients = [{ patient_id: 11, first_name: "Ana" }];
  t.mock.method(pool, "query", async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes("COUNT(*) AS total") ? [[{ total: "24" }]] : [patients];
  });
  const res = response();
  await getPatients({ query: { page: "2", limit: "10" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.pagination, { page: 2, limit: 10, total: 24, totalPages: 3 });
  assert.deepEqual(res.body.patients, patients);
  assert.match(calls[0].sql, /u\.is_active = 1/);
  assert.doesNotMatch(calls[0].sql, /sms_jobs/);
  assert.match(calls[1].sql, /ORDER BY p\.first_name ASC, p\.last_name ASC, p\.patient_id ASC\s+LIMIT \? OFFSET \?/);
  assert.deepEqual(calls[1].values, [10, 10]);
  assert.doesNotMatch(calls[1].sql, /p\.date_of_birth|p\.gender|u\.email/);
});

test("patient search runs across all matching records with bound, literal search text", async (t) => {
  const calls = [];
  const search = "Ana_%!' OR 1=1";
  t.mock.method(pool, "query", async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes("COUNT(*) AS total") ? [[{ total: 1 }]] : [[{ patient_id: 77 }]];
  });
  const res = response();
  await getPatients({ query: { search, includeInactive: "true" } }, res);
  assert.equal(res.statusCode, 200);
  for (const call of calls) {
    assert.ok(!call.sql.includes(search));
    assert.doesNotMatch(call.sql, /u\.is_active = 1/);
    assert.match(call.sql, /p\.barangay LIKE \? ESCAPE '!'/);
    assert.ok(call.sql.includes("CONCAT(LEFT(NULLIF(TRIM(p.middle_name), ''), 1), '.')"));
    assert.match(call.sql, /COALESCE\(NULLIF\(p\.contact_number, ''\), u\.phone, ''\)/);
    assert.deepEqual(call.values.slice(0, 4), Array(4).fill("%Ana!_!%!!' OR 1=1%"));
  }
});

test("patient paging clamps to the last available page after account deactivation", async (t) => {
  let rowValues;
  t.mock.method(pool, "query", async (sql, values) => {
    if (sql.includes("COUNT(*) AS total")) return [[{ total: 10 }]];
    rowValues = values;
    return [[]];
  });
  const res = response();
  await getPatients({ query: { page: "2" } }, res);
  assert.deepEqual(res.body.pagination, { page: 1, limit: 10, total: 10, totalPages: 1 });
  assert.deepEqual(rowValues, [10, 0]);
});

test("appointment pages preserve global summary counts and deterministic ordering", async (t) => {
  const calls = [];
  t.mock.method(pool, "query", async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes("COUNT(*) AS total")
      ? [[{ total: "23", completed: "17", open: "5" }]]
      : [[{ appointment_id: 12 }]];
  });
  const res = response();
  await getAllAppointments({ query: { page: "2", limit: "5" } }, res);
  assert.deepEqual(res.body.pagination, { page: 2, limit: 5, total: 23, totalPages: 5 });
  assert.deepEqual(res.body.summary, { total: 23, completed: 17, open: 5 });
  assert.equal(res.body.count, 1);
  assert.deepEqual(calls[1].values, [5, 5]);
  assert.match(calls[1].sql, /a\.appointment_id DESC\s+LIMIT \? OFFSET \?/);
});

test("empty lists return a usable first page and zero summary counts", async (t) => {
  t.mock.method(pool, "query", async (sql) => sql.includes("COUNT(*) AS total")
    ? [[{ total: 0, completed: 0, open: 0 }]] : [[]]);
  for (const handler of [getPatients, getAllAppointments]) {
    const res = response();
    await handler({ query: { page: "999" } }, res);
    assert.deepEqual(res.body.pagination, { page: 1, limit: 10, total: 0, totalPages: 1 });
  }
});

test("invalid paging and patient filters are rejected before querying the database", async (t) => {
  let queries = 0;
  t.mock.method(pool, "query", async () => { queries++; throw new Error("Must not query"); });
  for (const query of [
    { page: "0" }, { page: "-1" }, { page: "1.5" }, { page: "1e2" },
    { page: ["1"] }, { page: "9007199254740992" }, { page: "9007199254740991", limit: "100" },
    { limit: "101" }, { limit: "0" }, { limit: "" }, { limit: ["10"] },
  ]) {
    for (const handler of [getPatients, getAllAppointments]) {
      const res = response();
      await handler({ query }, res);
      assert.equal(res.statusCode, 400, JSON.stringify(query));
    }
  }
  for (const query of [{ search: ["Ana"] }, { search: "x".repeat(151) }, { includeInactive: "yes" }]) {
    const res = response();
    await getPatients({ query }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(queries, 0);
  assert.deepEqual(parsePagination(), { page: 1, limit: 10 });
});

test("list failures return a generic error without exposing database details", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(pool, "query", async () => { throw new Error("private database details"); });
  for (const handler of [getPatients, getAllAppointments]) {
    const res = response();
    await handler({ query: {} }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { success: false, message: "Server error." });
  }
});

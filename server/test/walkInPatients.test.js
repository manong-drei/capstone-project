const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/db");
const Patient = require("../src/models/Patient");
const Queue = require("../src/models/Queue");
const { createWalkIn } = require("../src/controllers/queueController");
const { getPatientById, searchPatients, mergePatient } = require("../src/controllers/patientController");

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

const body = {
  full_name: "Ana Santos", date_of_birth: "1990-01-01", gender: "female",
  contact: "09123456789", address: "Barangay Poblacion, Bago City",
  category: "dental", services: ["CONSULTATION"], type: "regular",
};

test("new, returning, and duplicate walk-ins preserve names and assign senior priority by birthday", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-24T16:30:00Z") });
  const originals = { getConnection: pool.getConnection, createWalkIn: Patient.createWalkIn, audit: Patient.audit, create: Queue.create, next: Queue.nextQueueNumber };
  let duplicate = false;
  let created = 0;
  let queueInput;
  let patientInput;
  const patientUpdates = [];
  let savedPriority = [null, null];
  let pendingPriority;
  let hasActiveQueue = false;
  let committed = false;
  let rolledBack = false;
  let settings = { walk_in_limit: 5, is_available: 1 };
  let walkinToday = 0;
  const connection = {
    async query(sql, values) {
      if (sql.startsWith("UPDATE patients SET")) {
        patientUpdates.push({ sql, values });
        pendingPriority = values.slice(8, 10);
      }
      if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      if (sql.includes("RELEASE_LOCK")) return [[{ released: 1 }]];
      if (sql.includes("FROM doctors")) return [[{ doctor_id: 1 }]];
      if (sql.includes("FROM daily_doctor_settings")) return [settings ? [settings] : []];
      if (sql.includes("FROM doctor_leaves")) return [[]];
      if (sql.includes("walkinToday")) {
        assert.match(sql, /status != 'cancelled'/);
        return [[{ walkinToday }]];
      }
      if (sql.includes("FROM patients WHERE patient_id")) return [[{
        patient_id: 12, first_name: "Ana", last_name: "Santos", date_of_birth: new Date("1990-01-01T00:00:00+08:00"),
        gender: "Female", contact_number: "09123456789", barangay: "Poblacion",
        priority_category: savedPriority[0], priority_expires_at: savedPriority[1],
      }]];
      if (sql.includes("FROM patients p LEFT JOIN users")) return [duplicate ? [{ patient_id: 12 }] : []];
      if (sql.includes("FROM queues WHERE patient_id")) return [hasActiveQueue ? [{ id: 1 }] : []];
      return [{}];
    },
    async beginTransaction() {},
    async commit() {
      committed = true;
      if (pendingPriority) savedPriority = pendingPriority;
      pendingPriority = undefined;
    },
    async rollback() { rolledBack = true; pendingPriority = undefined; },
    release() {},
  };
  pool.getConnection = async () => connection;
  Patient.createWalkIn = async (input) => { patientInput = input; created++; return 42; };
  Patient.audit = async () => {};
  Queue.nextQueueNumber = async ({ is_walk_in }) => { assert.equal(is_walk_in, true); return "Q01"; };
  Queue.create = async (input) => { queueInput = input; return { id: 99, patient_id: input.patient_id, queue_number: "Q01" }; };
  try {
    let res = response();
    await createWalkIn({ body, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(queueInput.patient_id, 42);
    assert.equal(queueInput.is_walk_in, true);
    assert.equal(created, 1);
    assert.equal(committed, true);

    res = response();
    await createWalkIn({ body: { ...body, patient_id: 12 }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(queueInput.patient_id, 12);
    assert.equal(created, 1);
    assert.equal(patientUpdates.length, 0);

    duplicate = true;
    res = response();
    await createWalkIn({ body, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(created, 1);

    res = response();
    await createWalkIn({ body: { ...body, create_new_confirmed: true }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(created, 2);

    duplicate = false;
    for (const [date_of_birth, expectedType] of [["1966-10-26", "regular"], ["1966-10-25", "priority"], ["1966-10-24", "priority"]]) {
      patientUpdates.length = 0;
      res = response();
      await createWalkIn({ body: { ...body, full_name: undefined, first_name: " Juan  Pedro ", last_name: " Dela Cruz ", date_of_birth }, user: { user_id: 3 } }, res);
      assert.equal(res.statusCode, 201);
      assert.equal(patientInput.first_name, "Juan Pedro");
      assert.equal(patientInput.last_name, "Dela Cruz");
      assert.equal(queueInput.walk_in_name, "Juan Pedro Dela Cruz");
      assert.equal(queueInput.type, expectedType);
      assert.equal(patientInput.priority_category, expectedType === "priority" ? "senior" : null);
    }

    patientUpdates.length = 0;
    res = response();
    await createWalkIn({ body: { ...body, patient_id: 12, date_of_birth: "1966-10-25", type: "priority" }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(queueInput.type, "priority");
    assert.equal(patientUpdates.at(-1).values[8], "senior");

    for (const now of ["2028-02-28T04:00:00Z", "2028-02-29T04:00:00Z"]) {
      t.mock.timers.setTime(Date.parse(now));
      res = response();
      await createWalkIn({ body: { ...body, date_of_birth: "1968-02-29" }, user: { user_id: 3 } }, res);
      assert.equal(res.statusCode, 201);
      assert.equal(queueInput.type, now.startsWith("2028-02-29") ? "priority" : "regular");
    }

    for (const invalid of [{ first_name: "Ana", last_name: "" }, { first_name: "x".repeat(101), last_name: "Santos" }, { services: [] }, { clear_priority: "true" }, { clear_priority: true, priority_category: "pwd" }]) {
      res = response();
      await createWalkIn({ body: { ...body, ...invalid }, user: { user_id: 3 } }, res);
      assert.equal(res.statusCode, 400);
    }

    await t.test("priority is reused, expires in Manila, and changes only with a successful ticket", async () => {
      t.mock.timers.setTime(Date.parse("2026-05-30T16:00:00Z"));
      const issue = async (fields, expectedType, status = 201) => {
        const responseBody = response();
        await createWalkIn({ body: { ...body, ...fields }, user: { user_id: 3 } }, responseBody);
        assert.equal(responseBody.statusCode, status);
        if (expectedType) assert.equal(queueInput.type, expectedType);
      };
      await issue({ priority_category: "pwd" }, "priority");
      assert.equal(patientInput.priority_category, "pwd");
      assert.equal(patientInput.priority_expires_at, null);
      savedPriority = [patientInput.priority_category, patientInput.priority_expires_at];
      await issue({ patient_id: 12, priority_category: null }, "priority");
      assert.deepEqual(savedPriority, ["pwd", null]);

      await issue({ priority_category: "pregnant" }, "priority");
      const expiry = new Date("2027-02-27T16:00:00Z");
      assert.deepEqual([patientInput.priority_category, patientInput.priority_expires_at], ["pregnant", expiry]);
      savedPriority = ["pregnant", expiry];
      t.mock.timers.setTime(expiry.getTime() - 1);
      await issue({ patient_id: 12 }, "priority");
      assert.deepEqual(savedPriority, ["pregnant", expiry]);

      hasActiveQueue = true;
      await issue({ patient_id: 12, clear_priority: true }, null, 409);
      assert.deepEqual(savedPriority, ["pregnant", expiry]);
      hasActiveQueue = false;
      await issue({ patient_id: 12, clear_priority: true }, "regular");
      assert.deepEqual(savedPriority, [null, null]);

      savedPriority = ["pregnant", expiry];
      t.mock.timers.setTime(expiry.getTime());
      await issue({ patient_id: 12 }, "regular");
      assert.deepEqual(savedPriority, [null, null]);

      savedPriority = ["pregnant", null];
      await issue({ patient_id: 12 }, "regular");
      assert.deepEqual(savedPriority, [null, null]);
      savedPriority = ["pregnant", null];
      await issue({ patient_id: 12, priority_category: "pregnant" }, "priority");
      assert.deepEqual(savedPriority, ["pregnant", new Date("2027-11-27T16:00:00Z")]);
    });

    for (const [name, limit, count, expectedStatus] of [
      ["zero walk-in capacity blocks registration", 0, 0, 409],
      ["missing daily settings allows the 30th dental walk-in", null, 29, 201],
      ["missing daily settings blocks dental walk-ins after 30", null, 30, 409],
      ["the last available walk-in slot can be used", 5, 4, 201],
      ["full walk-in capacity blocks registration", 5, 5, 409],
    ]) {
      await t.test(name, async () => {
        settings = limit === null ? null : { walk_in_limit: limit, is_available: 1 };
        walkinToday = count;
        committed = false;
        rolledBack = false;
        queueInput = undefined;
        const createdBefore = created;
        const res = response();
        await createWalkIn({ body, user: { user_id: 3 } }, res);
        assert.equal(res.statusCode, expectedStatus);
        assert.equal(committed, expectedStatus === 201);
        assert.equal(rolledBack, expectedStatus === 409);
        assert.equal(created, createdBefore + (expectedStatus === 201 ? 1 : 0));
        if (expectedStatus === 409) {
          assert.equal(queueInput, undefined);
          assert.equal(res.body.message, "Walk-in slots are full for today.");
        } else {
          assert.equal(res.body.queue.queue_number, "Q01");
        }
      });
    }
  } finally {
    Object.assign(pool, { getConnection: originals.getConnection });
    Object.assign(Patient, { createWalkIn: originals.createWalkIn, audit: originals.audit });
    Object.assign(Queue, { create: originals.create, nextQueueNumber: originals.next });
  }
});

test("merge archives only a walk-in source and preserves its queue history on the target", async () => {
  const originalConnection = pool.getConnection;
  const originalAudit = Patient.audit;
  const statements = [];
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql) {
      statements.push(sql);
      if (sql.includes("SELECT patient_id, user_id")) return [[
        { patient_id: 12, user_id: null, archived_into_patient_id: null },
        { patient_id: 42, user_id: 7, archived_into_patient_id: null },
      ]];
      if (sql.includes("active_count")) return [[{ active_count: 0 }]];
      return [{}];
    },
  };
  pool.getConnection = async () => connection;
  Patient.audit = async () => {};
  try {
    const res = response();
    await mergePatient({ params: { id: "12" }, body: { target_patient_id: 42, confirm: true }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(statements.some((sql) => sql.includes("UPDATE queues SET patient_id = ?")));
    assert.ok(statements.some((sql) => sql.includes("UPDATE patients SET archived_into_patient_id = ?")));
  } finally {
    pool.getConnection = originalConnection;
    Patient.audit = originalAudit;
  }
});

test("staff profile and masked search agree on active priority", async (t) => {
  const expiry = Date.parse("2027-02-27T16:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now: expiry - 1 });
  const originals = { findById: Patient.findById, search: Patient.search, audit: Patient.audit, query: pool.query };
  const actions = [];
  const patient = { patient_id: 12, first_name: "Ana", last_name: "Santos", contact_number: "09123456789",
    priority_category: "pregnant", priority_expires_at: new Date(expiry) };
  Patient.findById = async () => patient;
  Patient.search = async () => [patient];
  Patient.audit = async (...args) => { actions.push(args[2]); };
  pool.query = async () => [[{ id: 1 }, { id: 2 }]];
  try {
    const user = { user_id: 3, role: "staff" };
    for (const [now, category] of [[expiry - 1, "pregnant"], [expiry, null]]) {
      t.mock.timers.setTime(now);
      const profile = response();
      await getPatientById({ params: { id: 12 }, user }, profile);
      assert.equal(profile.body.data.visits.length, 2);
      assert.equal(profile.body.data.effective_priority_category, category);
      const search = response();
      await searchPatients({ query: { name: "Ana" }, user }, search);
      assert.equal(search.body.data[0].masked_contact, "•••••••6789");
      assert.equal(search.body.data[0].contact_number, undefined);
      assert.equal(search.body.data[0].effective_priority_category, category);
      assert.equal(search.body.data[0].priority_expires_at, undefined);
    }
    assert.deepEqual(actions, ["view", "search", "view", "search"]);
  } finally {
    Object.assign(Patient, { findById: originals.findById, search: originals.search, audit: originals.audit });
    pool.query = originals.query;
  }
});

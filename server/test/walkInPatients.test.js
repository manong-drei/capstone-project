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

test("new, returning, and duplicate walk-ins use the correct patient record", async () => {
  const originals = { getConnection: pool.getConnection, createWalkIn: Patient.createWalkIn, audit: Patient.audit, create: Queue.create, next: Queue.nextQueueNumber };
  let duplicate = false;
  let created = 0;
  let queueInput;
  let committed = false;
  const connection = {
    async query(sql) {
      if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      if (sql.includes("RELEASE_LOCK")) return [[{ released: 1 }]];
      if (sql.includes("FROM doctors")) return [[{ doctor_id: 1 }]];
      if (sql.includes("FROM daily_doctor_settings")) return [[{ walk_in_limit: 5, is_available: 1 }]];
      if (sql.includes("walkinToday")) return [[{ walkinToday: 0 }]];
      if (sql.includes("FROM patients WHERE patient_id")) return [[{
        patient_id: 12, first_name: "Ana", last_name: "Santos", date_of_birth: "1990-01-01",
        gender: "Female", contact_number: "09123456789", barangay: body.address, priority_category: null,
      }]];
      if (sql.includes("FROM patients p LEFT JOIN users")) return [duplicate ? [{ patient_id: 12 }] : []];
      if (sql.includes("FROM queues WHERE patient_id")) return [[]];
      return [{}];
    },
    async beginTransaction() {}, async commit() { committed = true; }, async rollback() {}, release() {},
  };
  pool.getConnection = async () => connection;
  Patient.createWalkIn = async () => { created++; return 42; };
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

    duplicate = true;
    res = response();
    await createWalkIn({ body, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(created, 1);

    res = response();
    await createWalkIn({ body: { ...body, create_new_confirmed: true }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(created, 2);
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

test("staff profile returns all visits and search masks phone with an audit entry", async () => {
  const originals = { findById: Patient.findById, search: Patient.search, audit: Patient.audit, query: pool.query };
  const actions = [];
  Patient.findById = async () => ({ patient_id: 12, first_name: "Ana", last_name: "Santos" });
  Patient.search = async () => [{ patient_id: 12, first_name: "Ana", last_name: "Santos", contact_number: "09123456789" }];
  Patient.audit = async (...args) => { actions.push(args[2]); };
  pool.query = async () => [[{ id: 1 }, { id: 2 }]];
  try {
    const profile = response();
    await getPatientById({ params: { id: 12 }, user: { user_id: 3 } }, profile);
    assert.equal(profile.body.data.visits.length, 2);
    const search = response();
    await searchPatients({ query: { name: "Ana" }, user: { user_id: 3 } }, search);
    assert.equal(search.body.data[0].masked_contact, "•••••••6789");
    assert.equal(search.body.data[0].contact_number, undefined);
    assert.deepEqual(actions, ["view", "search"]);
  } finally {
    Object.assign(Patient, { findById: originals.findById, search: originals.search, audit: originals.audit });
    pool.query = originals.query;
  }
});

const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/db");
const Queue = require("../src/models/Queue");
const Patient = require("../src/models/Patient");
const { createQueue, createWalkIn } = require("../src/controllers/queueController");
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const router = require('../src/routes/queueRoutes');

test("registration assigns source from the endpoint and shares daily counters across prefixes", async () => {
  const saved = { connection: pool.getConnection, create: Queue.create, find: Queue.findByPatientId, audit: Patient.audit };
  const counters = { regular: 0, priority: 0 };
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql, values = []) {
      if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      if (sql.includes("SELECT * FROM patients")) return [[{ patient_id: 42, priority_category: "senior" }]];
      if (sql.includes("todayQueueCount")) return [[{ todayQueueCount: 0 }]];
      if (sql.includes("FROM doctors")) return [[{ doctor_id: 1 }]];
      if (sql.includes("FROM daily_doctor_settings")) return [[{ is_available: 1, appointment_limit: 10, walk_in_limit: 5 }]];
      if (sql.includes("SELECT appointment_id")) return [[{ appointment_id: 1 }]];
      if (sql.includes("walkinToday")) return [[{ walkinToday: 0 }]];
      if (sql.includes("FROM queues WHERE patient_id")) return [[]];
      if (sql.includes("INSERT INTO queue_sequences") && values.length === 2) counters[values[1]]++;
      if (sql.includes("SELECT last_number") && values.length === 2) return [[{ last_number: counters[values[1]] }]];
      return [{}];
    },
  };
  pool.getConnection = async () => connection;
  Queue.create = async (input) => ({ id: 1, ...input });
  Queue.findByPatientId = async () => null;
  Patient.audit = async () => {};
  try {
    for (const [handler, type, is_walk_in, ticket] of [
      [createQueue, "regular", false, "AQ01"],
      [createWalkIn, "regular", true, "Q02"],
      [createQueue, "priority", false, "AP01"],
      [createWalkIn, "priority", true, "P02"],
    ]) {
      const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
      await handler({ user: { user_id: 11 }, body: {
        patient_id: 42, full_name: "Ana Santos", date_of_birth: "1990-01-01", gender: "female",
        contact: "09123456789", address: "Poblacion", priority_category: "senior",
        category: "dental", services: ["CONSULTATION"], type, is_walk_in: !is_walk_in,
      } }, res);
      assert.equal(res.statusCode, 201);
      const queue = res.body.queue || res.body;
      assert.equal(queue.queue_number, ticket);
      assert.equal(Boolean(queue.is_walk_in), is_walk_in);
    }
    assert.deepEqual(counters, { regular: 2, priority: 2 });
  } finally {
    pool.getConnection = saved.connection;
    Queue.create = saved.create;
    Queue.findByPatientId = saved.find;
    Patient.audit = saved.audit;
  }
});

test('queue routes deny patient/admin recovery actions and reject direct lifecycle bypasses', async () => {
  const saved = { find: User.findById, recall: Queue.recall, update: Queue.updateStatus, secret: process.env.JWT_SECRET };
  process.env.JWT_SECRET = 'queue-route-test-secret';
  let role = 'patient';
  let writes = 0;
  User.findById = async () => ({ user_id: 4, role, is_active: 1, credential_version: 1, must_change_password: 0 });
  Queue.recall = async () => { writes++; return { id: 1, status: 'called', call_count: 2 }; };
  Queue.updateStatus = async () => { writes++; return { id: 1, status: 'serving' }; };
  const dispatch = async (path, method, body = {}, id = '1') => {
    const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method.toLowerCase()]).route;
    const token = jwt.sign({ user_id: 4, role, credential_version: 1, purpose: 'session' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, path, method, body, params: { id } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  };
  try {
    for (role of ['patient', 'admin']) {
      for (const action of ['recall', 'skip', 'return']) assert.equal((await dispatch(`/:id/${action}`, 'POST')).statusCode, 403);
    }
    role = 'staff';
    for (const status of ['waiting', 'called', 'missed', 'no_show']) assert.equal((await dispatch('/:id/status', 'PATCH', { status })).statusCode, 400);
    assert.equal(writes, 0);
    assert.equal((await dispatch('/:id/recall', 'POST', {}, 'bad')).statusCode, 400);
    assert.equal((await dispatch('/:id/recall', 'POST')).statusCode, 200);
    assert.equal((await dispatch('/:id/status', 'PATCH', { status: 'serving' })).statusCode, 200);
    role = 'admin';
    assert.equal((await dispatch('/:id/status', 'PATCH', { status: 'serving' })).statusCode, 403);
    assert.equal(writes, 2);
  } finally {
    User.findById = saved.find; Queue.recall = saved.recall; Queue.updateStatus = saved.update;
    if (saved.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.secret;
  }
});

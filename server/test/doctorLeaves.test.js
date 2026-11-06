const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const Doctor = require('../src/models/Doctor');
const DoctorLeave = require('../src/models/DoctorLeave');
const User = require('../src/models/User');
const Queue = require('../src/models/Queue');
const Patient = require('../src/models/Patient');
const audit = require('../src/services/auditLog');
const leaveController = require('../src/controllers/doctorLeaveController');
const { getDailySettings, upsertDailySettings } = require('../src/controllers/doctorController');
const { createAppointment } = require('../src/controllers/appointmentController');
const { createQueue, createWalkIn } = require('../src/controllers/queueController');
const { clinicToday } = require('../src/utils/clinicDate');

const now = Date.parse('2026-10-29T00:30:00+08:00');
const response = () => ({
  statusCode: 200, headers: {}, set(key, value) { this.headers[key] = value; return this; },
  status(value) { this.statusCode = value; return this; }, json(data) { this.data = data; return this; },
});

test('only doctors request their own leave and only admins can review, approve, reject or cancel approved leave', async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'doctor-leave-test-only';
  t.after(() => { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; });
  let role = 'doctor';
  t.mock.method(User, 'findById', async () => ({ user_id: 4, role, is_active: 1, credential_version: 1 }));
  t.mock.method(Doctor, 'findByUserId', async id => { assert.equal(id, 4); return { doctor_id: 7 }; });
  const list = t.mock.method(DoctorLeave, 'list', async () => []);
  const request = t.mock.method(DoctorLeave, 'request', async (...args) => {
    assert.deepEqual(args, [7, '2026-10-29', '2026-11-04', 'Private reason']); return 11;
  });
  const decide = t.mock.method(DoctorLeave, 'decide', async (id, status, note, req, options) => ({ id, status, options }));
  t.mock.method(DoctorLeave, 'reviewDetails', async () => ({ leave: { id: 11 }, impacts: { appointments: [], queues: [], version: 'test' } }));
  const doctorRouter = require('../src/routes/doctorRoutes');
  const adminRouter = require('../src/routes/adminRoutes');
  async function dispatch(router, routePath, method, authenticated = true, body = {}) {
    const route = router.stack.find(layer => layer.route?.path === routePath && layer.route.methods[method]).route;
    const token = jwt.sign({ user_id: 4, role, purpose: 'session', credential_version: 1 }, process.env.JWT_SECRET);
    const req = { headers: authenticated ? { authorization: `Bearer ${token}` } : {}, params: { id: '11' },
      body, query: { doctor_id: '99' }, method: method.toUpperCase(), path: routePath };
    const res = response();
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  }
  for (const [router, routePath, method, allowed] of [
    [doctorRouter, '/leave-requests', 'get', 'doctor'],
    [doctorRouter, '/leave-requests', 'post', 'doctor'],
    [doctorRouter, '/leave-requests/:id/withdraw', 'patch', 'doctor'],
    [adminRouter, '/doctor-leaves', 'get', 'admin'],
    [adminRouter, '/doctor-leaves/:id', 'get', 'admin'],
    [adminRouter, '/doctor-leaves/:id', 'patch', 'admin'],
  ]) {
    assert.equal((await dispatch(router, routePath, method, false)).statusCode, 401);
    for (role of ['patient', 'staff', 'doctor', 'admin']) {
      if (role !== allowed) assert.equal((await dispatch(router, routePath, method)).statusCode, 403);
    }
    role = allowed;
    const res = await dispatch(router, routePath, method, true, {
      start_date: '2026-10-29', end_date: '2026-11-04', reason: 'Private reason', doctor_id: 99, status: 'approved',
    });
    assert.ok([200, 201].includes(res.statusCode));
  }
  assert.equal(list.mock.calls[0].arguments[0], 7);
  assert.equal(request.mock.callCount(), 1);
  assert.equal(decide.mock.calls[0].arguments[1], 'cancelled');
  assert.equal(decide.mock.calls[0].arguments[4].doctorId, 7);
  assert.equal(decide.mock.calls[1].arguments[4].doctorId, undefined);
});

test('leave validation uses Philippine dates and rejects malformed ranges, notes and IDs before queries', async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  assert.equal(clinicToday(), '2026-10-29');
  const profile = t.mock.method(Doctor, 'findByUserId', async () => ({ doctor_id: 7 }));
  const base = { start_date: '2026-10-29', end_date: '2026-11-04' };
  for (const body of [
    {}, { ...base, start_date: '2026-10-28' }, { ...base, end_date: '2026-10-28' },
    { ...base, end_date: '2027-02-30' }, { ...base, start_date: ['2026-10-29'] },
    { ...base, reason: 'x'.repeat(501) }, { ...base, reason: {} },
  ]) {
    const res = response(); await leaveController.requestLeave({ body }, res); assert.equal(res.statusCode, 400);
  }
  for (const id of ['0', '-1', '1e2', '1 OR 1=1', '9007199254740992']) {
    for (const handler of [leaveController.withdraw, leaveController.reviewDetails]) {
      const res = response(); await handler({ params: { id } }, res); assert.equal(res.statusCode, 400);
    }
  }
  const invalidDecision = response();
  await leaveController.decide({ params: { id: '11' }, body: { status: 'approved', acknowledge_conflicts: 'true' } }, invalidDecision);
  assert.equal(invalidDecision.statusCode, 400);
  assert.equal(profile.mock.callCount(), 0);
});

test('approved leave rejects appointments, online tickets and walk-ins before registration writes', async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  let writes = 0; let rollbacks = 0;
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() { rollbacks++; }, release() {},
    async query(sql, values) {
      if (/^(INSERT|UPDATE)/.test(sql)) writes++;
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.includes('FROM patients')) return [[{ patient_id: 42 }]];
      if (sql.includes('todayQueueCount')) return [[{ todayQueueCount: 0 }]];
      if (sql.includes('FROM doctors')) return [[{ doctor_id: 7 }]];
      if (sql.includes('FROM doctor_leaves')) {
        assert.deepEqual(values, [7, '2026-10-29', '2026-10-29']);
        return [[{ id: 11, start_date: '2026-10-29', end_date: '2026-11-04' }]];
      }
      return [[]];
    },
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  t.mock.method(Queue, 'lockCategory', async () => {});
  t.mock.method(Queue, 'findByPatientId', async () => null);
  t.mock.method(Patient, 'findByUserId', async () => ({ patient_id: 42 }));
  t.mock.method(console, 'error', () => {});
  for (const [handler, body] of [
    [createAppointment, { doctor_id: 7, appointment_date: '2026-10-29', appointment_time: '09:00' }],
    [createQueue, { services: ['CONSULTATION'], type: 'regular' }],
    [createWalkIn, { first_name: 'Test', last_name: 'Patient', date_of_birth: '2000-01-01', gender: 'male', contact: '09123456789', address: 'Poblacion', services: ['CONSULTATION'], category: 'dental', type: 'regular' }],
  ]) {
    const res = response(); await handler({ user: { user_id: 4 }, body }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.data.message, /approved leave/);
  }
  assert.equal(writes, 0);
  assert.equal(rollbacks, 3);
});

test('MySQL leave approvals preserve daily settings, detect conflicts and expire by date without a reset job', { skip: process.env.DOCTOR_DB_TESTS !== 'true' }, async t => {
  t.mock.timers.enable({ apis: ['Date'], now });
  t.after(() => pool.end());
  const connection = await pool.getConnection();
  const tables = ['doctor_leaves', 'doctors', 'users', 'specializations', 'patients', 'appointments', 'queues', 'daily_doctor_settings', 'queue_sequences'];
  try {
    await connection.query("SET time_zone = '+08:00'");
    await connection.query('SET timestamp = ?', [Math.floor(now / 1000)]);
    await connection.query(fs.readFileSync(path.join(__dirname, '../migrations/007_doctor_leaves.sql'), 'utf8').replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMPORARY TABLE'));
    await connection.query('CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY, user_id INT, first_name VARCHAR(50), middle_name VARCHAR(50), last_name VARCHAR(50), suffix VARCHAR(20), specialization_id INT)');
    await connection.query('CREATE TEMPORARY TABLE users (user_id INT PRIMARY KEY, phone VARCHAR(20), created_at DATETIME, role VARCHAR(20), is_active TINYINT)');
    await connection.query('CREATE TEMPORARY TABLE specializations (specialization_id INT PRIMARY KEY, specialization_name VARCHAR(50))');
    await connection.query('CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, first_name VARCHAR(50), middle_name VARCHAR(50), last_name VARCHAR(50), suffix VARCHAR(20))');
    await connection.query('CREATE TEMPORARY TABLE appointments (appointment_id INT PRIMARY KEY, patient_id INT, doctor_id INT, appointment_date DATE, appointment_time TIME, status VARCHAR(20))');
    await connection.query('CREATE TEMPORARY TABLE queues (id INT PRIMARY KEY, patient_id INT, queue_number VARCHAR(20), category VARCHAR(20), status VARCHAR(20), created_at DATETIME, is_walk_in TINYINT, walk_in_name VARCHAR(100))');
    await connection.query('CREATE TEMPORARY TABLE daily_doctor_settings (doctor_id INT, date DATE, appointment_limit INT, walk_in_limit INT, is_available TINYINT, PRIMARY KEY(doctor_id, date))');
    await connection.query('CREATE TEMPORARY TABLE queue_sequences (queue_date DATE, category VARCHAR(20), sequence_type VARCHAR(30), last_number INT, PRIMARY KEY(queue_date, category, sequence_type))');
    t.mock.method(pool, 'query', (sql, params) => connection.query(sql, params));
    t.mock.method(pool, 'getConnection', async () => connection);
    const auditWrite = t.mock.method(audit, 'write', async () => {});
    await connection.query("INSERT INTO doctors VALUES (1, 4, 'Test', NULL, 'Doctor', NULL, NULL), (2, 5, 'Other', NULL, 'Doctor', NULL, NULL)");
    await connection.query("INSERT INTO users (user_id, role, is_active) VALUES (4, 'doctor', 1), (5, 'doctor', 1)");
    await connection.query("INSERT INTO patients VALUES (11, 'Test', NULL, 'Patient', NULL)");
    await connection.query("INSERT INTO appointments VALUES (5, 11, 1, '2026-10-29', '09:00', 'confirmed')");
    await connection.query("INSERT INTO queues VALUES (12, 11, 'WQ12', 'dental', 'waiting', '2026-10-29 00:15:00', 1, NULL)");
    await connection.query("INSERT INTO daily_doctor_settings VALUES (1, '2026-10-29', 10, 5, 1), (1, '2026-11-05', 8, 4, 0)");
    const id = await DoctorLeave.request(1, '2026-10-29', '2026-11-04', 'Private leave reason');
    assert.equal((await DoctorLeave.list(1))[0].status, 'pending');
    assert.equal(await DoctorLeave.findApproved(1, '2026-10-29'), null);
    assert.equal((await Doctor.findAll()).find(row => row.doctor_id === 1).is_available, 1);
    await assert.rejects(DoctorLeave.request(1, '2026-11-01', '2026-11-06', ''), { status: 409 });
    const other = await DoctorLeave.request(2, '2026-10-29', '2026-11-04', '');
    await assert.rejects(DoctorLeave.decide(id, 'cancelled', '', { user: { user_id: 5 } }, { doctorId: 2 }), { status: 404 });
    await DoctorLeave.decide(other, 'cancelled', '', { user: { user_id: 5 } }, { doctorId: 2 });
    const admin = { user: { user_id: 99 } };
    const { impacts } = await DoctorLeave.reviewDetails(id);
    assert.equal(impacts.appointments.length, 1);
    assert.equal(impacts.queues.length, 1);
    await assert.rejects(DoctorLeave.decide(id, 'approved', '', admin), { status: 409 });
    await assert.rejects(DoctorLeave.decide(id, 'approved', '', admin, { acknowledge: true, version: 'old' }), { status: 409 });
    await connection.query("INSERT INTO appointments VALUES (6, 11, 1, '2026-10-30', '09:00', 'confirmed')");
    await assert.rejects(DoctorLeave.decide(id, 'approved', '', admin, { acknowledge: true, version: impacts.version }), { status: 409 });
    const fresh = await DoctorLeave.reviewDetails(id);
    await DoctorLeave.decide(id, 'approved', 'Approved by admin', admin, { acknowledge: true, version: fresh.impacts.version });
    assert.equal(auditWrite.mock.callCount(), 0);
    assert.equal((await DoctorLeave.findApproved(1, '2026-10-29')).id, id);
    assert.equal((await DoctorLeave.findApproved(1, '2026-11-04')).id, id);
    assert.equal(await DoctorLeave.findApproved(1, '2026-11-05'), null);
    assert.equal(await DoctorLeave.findApproved(2, '2026-10-29'), null);
    const doctors = await Doctor.findAll();
    assert.equal(doctors.find(row => row.doctor_id === 1).is_available, 0);
    assert.equal(doctors.find(row => row.doctor_id === 1).leave_end, '2026-11-04');
    assert.ok(doctors.every(row => !Object.hasOwn(row, 'reason')));
    const req = { user: { user_id: 4 }, query: { date: '2026-10-29' } };
    const daily = response(); await getDailySettings(req, daily);
    assert.equal(daily.data.is_available, 0); assert.equal(daily.data.daily_is_available, 1);
    const capacity = response();
    await upsertDailySettings({ ...req, body: { date: '2026-10-29', appointment_limit: 8, walk_in_limit: 4 } }, capacity);
    assert.equal(capacity.statusCode, 200);
    const [[raw]] = await connection.query("SELECT * FROM daily_doctor_settings WHERE doctor_id = 1 AND date = '2026-10-29'");
    assert.equal(raw.is_available, 1); assert.equal(raw.appointment_limit, 8);
    t.mock.method(console, 'error', () => {});
    const bypass = response(); await upsertDailySettings({ ...req, body: { date: '2026-10-29', appointment_limit: 8, walk_in_limit: 4, is_available: 1 } }, bypass);
    assert.equal(bypass.statusCode, 409);
    await assert.rejects(DoctorLeave.decide(id, 'cancelled', '', req, { doctorId: 1 }), { status: 409 });
    await assert.rejects(DoctorLeave.decide(id, 'approved', '', admin), { status: 409 });
    const after = response(); await getDailySettings({ ...req, query: { date: '2026-11-05' } }, after);
    assert.equal(after.data.is_available, 0); assert.equal(after.data.approved_leave, null);
    await DoctorLeave.decide(id, 'cancelled', 'Returned early', admin);
    assert.equal((await Doctor.findAll()).find(row => row.doctor_id === 1).is_available, 1);
    assert.equal((await DoctorLeave.list(1))[0].review_note, 'Returned early');
    const [[appointment]] = await connection.query('SELECT status FROM appointments WHERE appointment_id = 5');
    const [[queue]] = await connection.query('SELECT status FROM queues WHERE id = 12');
    assert.equal(appointment.status, 'confirmed'); assert.equal(queue.status, 'waiting');
    const rejectedId = await DoctorLeave.request(1, '2026-11-01', '2026-11-07', '');
    await DoctorLeave.decide(rejectedId, 'rejected', 'Please choose other dates', admin);
    assert.equal(await DoctorLeave.findApproved(1, '2026-11-01'), null);
    const noConflicts = await DoctorLeave.request(2, '2026-11-10', '2026-11-16', '');
    await DoctorLeave.decide(noConflicts, 'approved', '', admin);
    assert.ok(await DoctorLeave.findApproved(2, '2026-11-10'));
  } finally {
    await connection.query('SET timestamp = DEFAULT');
    for (const table of tables) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
  }
});

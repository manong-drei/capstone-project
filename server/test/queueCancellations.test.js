const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const Patient = require('../src/models/Patient');
const User = require('../src/models/User');
const router = require('../src/routes/queueRoutes');
const migrate = require('../src/config/migrateQueueCancellations');

test.after(() => pool.end());

function fixture(t, { patient = { user_id: 11, phone: '09123456789', is_active: 1 }, fail = false, failAudit = false } = {}) {
  let state = { ticket: { id: 1, patient_id: 7, category: 'dental', queue_number: 'AQ11', status: 'waiting',
    services: '[]', is_today: 1, appointment_id: 5 }, jobs: [], audits: [], appointment: 'confirmed' };
  let tail = Promise.resolve();
  t.mock.method(Queue, 'lockCategory', async (category, connection) => connection.lock());
  t.mock.method(pool, 'getConnection', async () => {
    let working;
    let unlock;
    return {
      async beginTransaction() {}, release() {},
      async lock() {
        const previous = tail;
        tail = new Promise(resolve => { unlock = resolve; });
        await previous;
        working = structuredClone(state);
      },
      async commit() { state = working; unlock(); },
      async rollback() { unlock?.(); },
      async query(raw, values = []) {
        const sql = raw.replace(/\s+/g, ' ').trim();
        if (sql.startsWith('SELECT category')) return [[{ category: 'dental' }]];
        if (sql.startsWith('SELECT *,') || sql.startsWith('SELECT q.*')) return [[{ ...working.ticket }]];
        if (sql.startsWith('UPDATE queues SET status = ?')) Object.assign(working.ticket, { status: values[0], status_reason: values[1] });
        else if (sql.startsWith('UPDATE appointments')) working.appointment = values[0];
        else if (sql.startsWith('UPDATE queues SET cancelled_by_role')) Object.assign(working.ticket, { cancelled_by_role: values[0], cancellation_acknowledged_at: null });
        else if (sql.includes('FROM patients p')) return [[patient]];
        else if (sql.startsWith('INSERT INTO sms_jobs')) {
          if (fail) throw new Error('outbox unavailable');
          working.jobs.push(values);
        } else if (sql.startsWith('INSERT INTO audit_logs')) {
          if (failAudit) throw new Error('audit unavailable');
          working.audits.push(values);
        } else assert.fail(`Unexpected query: ${sql}`);
        return [{ affectedRows: 1 }];
      },
    };
  });
  return () => state;
}

const auditRequest = role => ({ auditActor: { user_id: 4, role, name: 'Clinic Operator' } });

test('each clinic role atomically cancels the linked booking and creates exactly one SMS job', async t => {
  for (const cancelledByRole of ['staff', 'doctor', 'admin']) await t.test(cancelledByRole, async t => {
    const state = fixture(t);
    const results = await Promise.allSettled([1, 2].map(() => Queue.updateStatus(1, 'cancelled', '  Wait time too long  ', {
      cancelledByRole, auditRequest: auditRequest(cancelledByRole),
    })));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results.find(result => result.status === 'rejected').reason.status, 409);
    assert.equal(state().ticket.cancelled_by_role, cancelledByRole);
    assert.equal(state().ticket.status_reason, 'Wait time too long');
    assert.equal(state().appointment, 'cancelled');
    assert.deepEqual(state().audits.map(row => row.slice(0, 9)), cancelledByRole === 'doctor'
      ? []
      : [[4, 'Clinic Operator', cancelledByRole, 0, 'queue.cancelled', 'queue', 1, 'success', null]]);
    assert.deepEqual(state().jobs, [[7, 1, '09123456789', 'queue-cancellation:1']]);
  });
});

test('an audit write failure rolls back the ticket, linked booking and SMS job', async t => {
  const state = fixture(t, { failAudit: true });
  await assert.rejects(Queue.updateStatus(1, 'cancelled', 'Leaving', {
    cancelledByRole: 'staff', auditRequest: auditRequest('staff'),
  }), /audit unavailable/);
  assert.equal(state().ticket.status, 'waiting');
  assert.equal(state().appointment, 'confirmed');
  assert.deepEqual(state().jobs, []);
  assert.deepEqual(state().audits, []);
});

test('an outbox write failure rolls back the cancellation, booking and notification', async t => {
  const state = fixture(t, { fail: true });
  await assert.rejects(Queue.updateStatus(1, 'cancelled', 'Leaving', { cancelledByRole: 'staff' }), /outbox unavailable/);
  assert.equal(state().ticket.status, 'waiting');
  assert.equal(state().ticket.cancelled_by_role, undefined);
  assert.equal(state().appointment, 'confirmed');
  assert.deepEqual(state().jobs, []);
  assert.deepEqual(state().audits, []);
});

test('invalid phones, inactive or archived associations still get an in-app notice without an SMS job', async t => {
  for (const patient of [null, { phone: 'invalid' }, { user_id: 11, phone: '09123456789', is_active: 0 },
    { phone: '09123456789', archived_into_patient_id: 8 }]) await t.test(JSON.stringify(patient), async t => {
    const state = fixture(t, { patient });
    await Queue.updateStatus(1, 'cancelled', 'Leaving', { cancelledByRole: 'staff' });
    assert.equal(state().ticket.cancelled_by_role, 'staff');
    assert.equal(state().ticket.status, 'cancelled');
    assert.deepEqual(state().jobs, []);
  });
});

test('patient self-cancellation creates neither a clinic notice nor an SMS job', async t => {
  const state = fixture(t);
  await Queue.updateStatus(1, 'cancelled', 'Leaving', { patientOnly: true });
  assert.equal(state().ticket.cancelled_by_role, undefined);
  assert.deepEqual(state().jobs, []);
  assert.deepEqual(state().audits, []);
});

test('pending query retains older notices, exposes only notice fields, and acknowledgment is scoped to its owner', async t => {
  const calls = [];
  t.mock.method(pool, 'query', async (sql, values) => {
    calls.push({ sql, values });
    return sql.startsWith('SELECT') ? [[]] : [{ affectedRows: 1 }];
  });
  assert.deepEqual(await Queue.findPendingCancellations(7), []);
  assert.match(calls[0].sql, /cancelled_by_role IS NOT NULL AND cancellation_acknowledged_at IS NULL/);
  assert.match(calls[0].sql, /ORDER BY updated_at, id/);
  assert.doesNotMatch(calls[0].sql, /CURDATE|SELECT \*/);
  assert.deepEqual(calls[0].values, [7]);
  assert.equal(await Queue.acknowledgeCancellation(1, 7), true);
  assert.equal(await Queue.acknowledgeCancellation(1, 7), true);
  assert.match(calls[1].sql, /COALESCE\(cancellation_acknowledged_at, NOW\(\)\)/);
  assert.match(calls[1].sql, /updated_at = updated_at WHERE id = \? AND patient_id = \?/);
  assert.deepEqual(calls[1].values, [1, 7]);
});

test('routes enforce roles, ownership and reason validation and use the authenticated cancelling role', async t => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'cancellation-route-test-secret';
  t.after(() => { if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; });
  let role = 'patient';
  t.mock.method(User, 'findById', async () => ({ user_id: 11, role, is_active: 1, credential_version: 1 }));
  const patient = t.mock.method(Patient, 'findByUserId', async () => ({ patient_id: 7 }));
  const pending = t.mock.method(Queue, 'findPendingCancellations', async id => { assert.equal(id, 7); return []; });
  t.mock.method(Queue, 'acknowledgeCancellation', async (id, patientId) => id === 1 && patientId === 7);
  const update = t.mock.method(Queue, 'updateStatus', async (id, status, reason, options) => {
    assert.equal(options.cancelledByRole, role);
    assert.equal(options.auditRequest.auditActor.role, role);
    assert.equal(options.auditRequest.auditActor.user_id, 11);
    assert.equal(reason, 'Leaving');
    return { id, status };
  });
  async function dispatch(path, method, { id = '1', body = {}, authenticated = true } = {}) {
    const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method.toLowerCase()]).route;
    const token = jwt.sign({ user_id: 11, role, credential_version: 1, purpose: 'session' }, process.env.JWT_SECRET);
    const req = { headers: authenticated ? { authorization: `Bearer ${token}` } : {}, path, method, body, params: { id } };
    const res = { statusCode: 200, set() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    for (const layer of route.stack) {
      let next = false;
      await layer.handle(req, res, () => { next = true; });
      if (!next) break;
    }
    return res;
  }
  assert.equal((await dispatch('/cancellations', 'GET', { authenticated: false })).statusCode, 401);
  assert.deepEqual((await dispatch('/cancellations', 'GET')).body.cancellations, []);
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH')).statusCode, 200);
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH')).statusCode, 200);
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH', { id: '99' })).statusCode, 404);
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH', { id: 'bad' })).statusCode, 400);
  patient.mock.mockImplementation(async () => ({ patient_id: 8 }));
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH')).statusCode, 404);
  patient.mock.mockImplementation(async () => ({ patient_id: 7 }));
  assert.equal((await dispatch('/:id/status', 'PATCH', { body: { status: 'cancelled', reason: 'Leaving' } })).statusCode, 403);
  for (role of ['staff', 'doctor', 'admin']) {
    assert.equal((await dispatch('/cancellations', 'GET')).statusCode, 403);
    assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH')).statusCode, 403);
    for (const reason of ['', ' ', null, 5, {}, ['Leaving'], 'x'.repeat(256)])
      assert.equal((await dispatch('/:id/status', 'PATCH', { body: { status: 'cancelled', reason } })).statusCode, 400);
    assert.equal((await dispatch('/:id/status', 'PATCH', { body: { status: 'cancelled', reason: ' Leaving ', cancelledByRole: 'patient' } })).statusCode, 200);
  }
  assert.equal(update.mock.callCount(), 3);
  role = 'patient';
  patient.mock.mockImplementation(async () => null);
  assert.equal((await dispatch('/cancellations', 'GET')).statusCode, 404);
  assert.equal((await dispatch('/:id/acknowledge-cancellation', 'PATCH')).statusCode, 404);
  patient.mock.mockImplementation(async () => ({ patient_id: 7 }));
  pending.mock.mockImplementation(async () => { throw new Error('database unavailable'); });
  assert.equal((await dispatch('/cancellations', 'GET')).statusCode, 500);
});

test('migration can run twice and preserves existing SMS purposes and historical queues', async () => {
  const columns = new Set();
  let purpose = "enum('temporary_password','queue_alert','password_recovery')";
  const changes = [];
  const database = { async query(sql, values) {
    if (sql.startsWith('SHOW COLUMNS FROM queues')) return [columns.has(values[0]) ? [{ Field: values[0] }] : []];
    if (sql.startsWith('SHOW COLUMNS FROM sms_jobs')) return [[{ Type: purpose }]];
    changes.push(sql);
    if (sql.includes('ADD COLUMN')) columns.add(sql.split('ADD COLUMN ')[1].split(' ')[0]);
    else purpose = sql.match(/ENUM\(.+\)/)[0];
    return [{}];
  } };
  await migrate(database);
  await migrate(database);
  assert.equal(changes.length, 3);
  assert.match(purpose, /'temporary_password','queue_alert','password_recovery','queue_cancellation'/);
  assert.ok(changes.every(sql => sql.startsWith('ALTER TABLE')));
});

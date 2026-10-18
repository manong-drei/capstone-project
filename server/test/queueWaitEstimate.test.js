const assert = require('node:assert/strict');
const test = require('node:test');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const Patient = require('../src/models/Patient');
const { getMyQueue } = require('../src/controllers/queueController');

const now = Date.parse('2026-10-18T10:00:00+08:00');
const minutesAgo = minutes => new Date(now - minutes * 60_000);
const row = (id, fields = {}) => ({
  id, category: 'dental', status: 'waiting', is_walk_in: 0, type: 'regular',
  services: '[]', created_at: minutesAgo(90), full_name: `Private patient ${id}`, ...fields,
});
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; },
});

test('wait estimates use the real projected dental order, completed visits, and remaining current-patient time', async t => {
  t.mock.method(Date, 'now', () => now);
  const rows = [
    row(1, { status: 'serving', last_called_at: minutesAgo(5) }),
    row(2),
    row(3, { is_walk_in: 1, type: 'priority' }),
    row(4, { type: 'priority' }),
    row(5, { is_walk_in: 1 }),
    row(6, { returned_at: minutesAgo(1) }),
    row(7, { status: 'missed' }),
    row(8, { status: 'no_show' }),
    row(9, { status: 'cancelled' }),
    row(10, { status: 'done', last_called_at: minutesAgo(60), updated_at: minutesAgo(50) }),
    row(11, { status: 'done', last_called_at: minutesAgo(45), updated_at: minutesAgo(15) }),
  ];
  t.mock.method(pool, 'query', async (sql, params) => {
    assert.deepEqual(params, ['dental']);
    assert.match(sql, /DATE\(q\.created_at\) = CURDATE\(\)/);
    assert.match(sql, /AND q\.category = \?/);
    return [rows.map(value => ({ ...value }))];
  });
  assert.deepEqual((await Queue.findTodayActive({ category: 'dental' })).map(value => value.id), [1, 6, 3, 4, 5, 2, 7, 8, 10, 11]);
  assert.deepEqual(await Queue.getWaitEstimate(row(6)), { minutes: 15, patients_ahead: 1, sample_count: 2 });
  assert.deepEqual(await Queue.getWaitEstimate(row(3)), { minutes: 35, patients_ahead: 2, sample_count: 2 });
  assert.deepEqual(await Queue.getWaitEstimate(row(4)), { minutes: 55, patients_ahead: 3, sample_count: 2 });
  assert.deepEqual(await Queue.getWaitEstimate(row(2)), { minutes: 95, patients_ahead: 5, sample_count: 2 });
});

test('the initial estimate handles missing/bad timing data, empty queues, overdue service, and changed ticket states', async t => {
  t.mock.method(Date, 'now', () => now);
  let rows = [row(1, { status: 'called', last_called_at: minutesAgo(5) }), row(2), row(3)];
  t.mock.method(Queue, 'findTodayActive', async ({ category }) => { assert.equal(category, 'dental'); return rows; });
  assert.deepEqual(await Queue.getWaitEstimate(row(3)), { minutes: 25, patients_ahead: 2, sample_count: 0 });

  rows.push(
    row(4, { status: 'done', last_called_at: null, updated_at: minutesAgo(1) }),
    row(5, { status: 'done', last_called_at: minutesAgo(1), updated_at: minutesAgo(1) }),
    row(6, { status: 'done', last_called_at: 'bad', updated_at: minutesAgo(1) }),
    row(7, { status: 'done', last_called_at: minutesAgo(1), updated_at: minutesAgo(2) }),
  );
  assert.equal((await Queue.getWaitEstimate(row(3))).minutes, 25);
  rows[0].last_called_at = minutesAgo(30);
  assert.deepEqual(await Queue.getWaitEstimate(row(2)), { minutes: 1, patients_ahead: 1, sample_count: 0 });
  rows[0].last_called_at = null;
  assert.equal((await Queue.getWaitEstimate(row(2))).minutes, 15);
  rows[0].last_called_at = minutesAgo(-5);
  assert.equal((await Queue.getWaitEstimate(row(2))).minutes, 15);

  rows = [row(2)];
  assert.deepEqual(await Queue.getWaitEstimate(row(2)), { minutes: 0, patients_ahead: 0, sample_count: 0 });
  assert.equal(await Queue.getWaitEstimate(row(99)), null);
  rows = [];
  assert.equal(await Queue.getWaitEstimate(row(2)), null);
  t.mock.method(Queue, 'findTodayActive', async () => { throw new Error('Non-waiting tickets must not query the queue'); });
  for (const status of ['called', 'serving', 'missed', 'done', 'cancelled', 'no_show']) {
    assert.equal(await Queue.getWaitEstimate(row(2, { status })), null);
  }
});

test('the patient endpoint returns only their ticket and aggregate estimate and keeps null/no-show behavior', async t => {
  const own = row(2, { full_name: 'Own patient', patient_id: 42 });
  let ticket = own;
  let noShow = null;
  t.mock.method(Patient, 'findByUserId', async id => { assert.equal(id, 11); return { patient_id: 42 }; });
  t.mock.method(Queue, 'findByPatientId', async id => { assert.equal(id, 42); return ticket; });
  t.mock.method(Queue, 'findLatestNoShow', async id => { assert.equal(id, 42); return noShow; });
  t.mock.method(Queue, 'findTodayActive', async () => [row(1), own]);
  const req = { user: { user_id: 11, role: 'patient' } };
  const res = response();
  await getMyQueue(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.data.wait_estimate, { minutes: 15, patients_ahead: 1, sample_count: 0 });
  assert.equal(res.data.patient_id, 42);
  assert.doesNotMatch(JSON.stringify(res.data), /Private patient 1/);

  ticket = null;
  const empty = response();
  await getMyQueue(req, empty);
  assert.equal(empty.data, null);
  noShow = row(2, { status: 'no_show' });
  const ended = response();
  await getMyQueue(req, ended);
  assert.equal(ended.data.status, 'no_show');
  assert.equal(ended.data.wait_estimate, null);

  ticket = own;
  t.mock.method(Queue, 'getWaitEstimate', async () => { throw new Error('Estimate lookup failed'); });
  t.mock.method(console, 'error', () => {});
  const failedEstimate = response();
  await getMyQueue(req, failedEstimate);
  assert.equal(failedEstimate.statusCode, 200);
  assert.equal(failedEstimate.data.patient_id, 42);
  assert.equal(failedEstimate.data.wait_estimate, null);
});

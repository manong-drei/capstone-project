const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const Appointment = require('../src/models/Appointment');
const Patient = require('../src/models/Patient');
const { createQueue, getQueueStatus } = require('../src/controllers/queueController');
const { createAppointment } = require('../src/controllers/appointmentController');

const date = offset => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const today = date(0);
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}) => ({ user: { user_id: 11, role: 'patient' }, query: {}, body: { services: ['CONSULTATION'], type: 'regular', ...body } });
const called = (status = 'called', category = 'dental', day = today) => ({ id: 1, status, category, day, last_called_at: new Date() });
const booked = (status = 'confirmed', day = today) => ({ appointment_id: 1, patient_id: 42, status, day });

async function fixture(run) {
  const saved = {
    connection: pool.getConnection, query: pool.query, create: Queue.create,
    find: Queue.findByPatientId, number: Queue.nextQueueNumber, status: Queue.getPublicStatus,
    patient: Patient.findByUserId, appointment: Appointment.create,
  };
  const state = { calls: [], appointments: [], tickets: [], writes: [], locks: 0, rolledBack: 0, onLock: null,
    bookedCount: 0, registrationCount: 0, activeQueue: null,
    activeDoctorIds: [1],
    patient: { patient_id: 42, priority_category: 'senior' },
    settings: { appointment_limit: 10, is_available: 1 } };
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() { state.rolledBack++; }, release() {},
    async query(sql, values = []) {
      if (sql.includes('INSERT INTO queue_sequences')) return [{}];
      if (sql.includes('SELECT last_number')) { state.locks++; state.onLock?.(); return [[{ last_number: 0 }]]; }
      if (sql.includes('SELECT appointment_id')) {
        assert.match(sql, /appointment_date = CURDATE\(\)/);
        assert.match(sql, /status IN \('pending', 'confirmed'\)/);
        assert.match(sql, /FOR UPDATE/);
        return [state.appointments.filter(row => row.patient_id === values[0] && row.day === today && ['pending', 'confirmed'].includes(row.status)).slice(0, 1)];
      }
      if (sql.includes('SELECT * FROM patients')) return [[state.patient]];
      if (sql.includes('todayQueueCount')) return [[{ todayQueueCount: state.registrationCount }]];
      if (sql.includes('FROM doctors')) {
        assert.match(sql, /JOIN users u[\s\S]*u\.is_active = 1[\s\S]*FOR UPDATE/);
        const doctorId = values[0] ?? state.activeDoctorIds[0];
        return [state.activeDoctorIds.includes(doctorId) ? [{ doctor_id: doctorId }] : []];
      }
      if (sql.includes('FROM daily_doctor_settings')) return [[state.settings]];
      if (sql.includes('FROM doctor_leaves')) return [[]];
      if (sql.includes('AS booked')) return [[{ booked: state.bookedCount }]];
      if (sql.includes('INSERT INTO appointments')) { state.writes.push('appointment'); return [{ insertId: 2 }]; }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  pool.getConnection = async () => connection;
  pool.query = connection.query;
  Queue.findByPatientId = async () => state.activeQueue;
  Queue.nextQueueNumber = async ({ type }) => type === 'priority' ? 'AP01' : 'AQ01';
  Queue.create = async input => { state.tickets.push(input); return { id: 2, ...input }; };
  Queue.getPublicStatus = async () => ({ now_serving: null, next_queuing: null });
  Patient.findByUserId = async () => ({ patient_id: 42 });
  Appointment.create = async input => { state.writes.push('appointment'); return { appointment_id: 2, ...input }; };
  try { await run(state); }
  finally {
    pool.getConnection = saved.connection; pool.query = saved.query;
    Queue.create = saved.create; Queue.findByPatientId = saved.find; Queue.nextQueueNumber = saved.number;
    Queue.getPublicStatus = saved.status; Patient.findByUserId = saved.patient; Appointment.create = saved.appointment;
  }
}

test('dental intake uses the remaining active doctor and rejects an inactive booking target', async () => {
  await fixture(async state => {
    state.activeDoctorIds = [4];
    const queue = response();
    await createQueue(request(), queue);
    assert.equal(queue.statusCode, 201);
    const booking = response();
    await createAppointment(request({ doctor_id: 1, appointment_date: date(1), appointment_time: '09:00:00' }), booking);
    assert.equal(booking.statusCode, 404);
    assert.deepEqual(state.writes, ['appointment']);
  });
});

test('new dashboard appointments remain available before the first dental call', async () => {
  await fixture(async state => {
    state.calls = [called('done', 'general'), called('done', 'dental', date(-1)), { ...called('waiting'), last_called_at: null }];
    for (const type of ['regular', 'priority']) {
      const res = response();
      await createQueue(request({ type }), res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.queue_number, type === 'priority' ? 'AP01' : 'AQ01');
    }
    assert.equal(state.writes.length, 2);
    assert.equal(state.tickets.length, 2);
  });
});

test('new regular and priority dashboard tickets remain available after dental service starts', async () => {
  await fixture(async state => {
    for (const status of ['called', 'serving', 'done', 'cancelled', 'missed', 'no_show', 'waiting']) {
      state.calls = [called(status)];
      for (const type of ['regular', 'priority']) {
        const res = response();
        await createQueue(request({ type }), res);
        assert.equal(res.statusCode, 201, `${status}, ${type}`);
        assert.equal(res.body.queue_number, type === 'priority' ? 'AP01' : 'AQ01');
      }
    }
    assert.equal(state.writes.length, 14);
    assert.equal(state.tickets.length, 14);
    assert.equal(state.rolledBack, 0);
  });
});

test('active bookings are reused; inactive or unrelated bookings require a new capacity-checked booking', async () => {
  await fixture(async state => {
    state.calls = [called('done')];
    for (const status of ['pending', 'confirmed']) {
      state.appointments = [booked(status)];
      for (const type of ['regular', 'priority']) {
        const res = response();
        await createQueue(request({ type }), res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.queue_number, type === 'priority' ? 'AP01' : 'AQ01');
      }
    }
    for (const appointment of [booked('cancelled'), booked('completed'), booked('confirmed', date(1)), { ...booked(), patient_id: 99 }]) {
      state.appointments = [appointment];
      const res = response();
      await createQueue(request(), res);
      assert.equal(res.statusCode, 201);
    }
    assert.equal(state.tickets.length, 8);
    assert.equal(state.writes.length, 4);
  });
});

test('the booking endpoint accepts today and future dates after the first call when capacity remains', async () => {
  await fixture(async state => {
    const submit = async appointment_date => {
      const res = response();
      await createAppointment(request({ doctor_id: 1, appointment_date, appointment_time: '09:00' }), res);
      return res;
    };
    assert.equal((await submit(today)).statusCode, 201);
    state.calls = [called('done')];
    state.appointments = [booked()];
    assert.equal((await submit(today)).statusCode, 201);
    assert.equal((await submit(date(1))).statusCode, 201);
    assert.equal(state.writes.length, 3);
    assert.equal(state.locks, 3);
  });
});

test('a concurrent first call does not close intake; registration retains the category lock', async () => {
  await fixture(async state => {
    state.onLock = () => { state.calls = [called()]; };
    const ticket = response();
    await createQueue(request(), ticket);
    assert.equal(ticket.statusCode, 201);
    state.calls = [];
    const booking = response();
    await createAppointment(request({ doctor_id: 1, appointment_date: today, appointment_time: '09:00' }), booking);
    assert.equal(booking.statusCode, 201);
    assert.equal(state.tickets.length, 1);
    assert.equal(state.writes.length, 2);
    assert.equal(state.locks, 2);
  });
});

test('patient status never advertises a first-call closure and preserves the response contract', async () => {
  await fixture(async state => {
    const before = response();
    await getQueueStatus(request(), before);
    assert.equal(before.body.registration_message, null);
    state.calls = [called('done')];
    const running = response();
    await getQueueStatus(request(), running);
    assert.equal(running.body.registration_message, null);
    state.appointments = [booked()];
    const existing = response();
    await getQueueStatus(request(), existing);
    assert.equal(existing.body.registration_message, null);
    const staff = response();
    await getQueueStatus({ ...request(), user: { role: 'staff' } }, staff);
    assert.deepEqual(staff.body, { now_serving: null, next_queuing: null });
  });
});

test('open intake still rejects unavailable dentists, full capacity, duplicates, daily limits and unverified priority', async () => {
  await fixture(async state => {
    state.calls = [called('serving')];
    for (const [setup, message, type = 'regular'] of [
      [() => { state.settings.is_available = 0; }, /unavailable/],
      [() => { state.settings.is_available = 1; state.bookedCount = 10; }, /No appointment slots/],
      [() => { state.bookedCount = 0; state.activeQueue = { id: 1 }; }, /already have an active queue/],
      [() => { state.activeQueue = null; state.registrationCount = 2; }, /daily queue limit/],
      [() => { state.registrationCount = 0; state.patient.priority_category = null; }, /not eligible/, 'priority'],
      [() => { state.patient.priority_category = 'pwd'; state.patient.priority_expires_at = new Date(0); }, /not eligible/, 'priority'],
    ]) {
      setup();
      const res = response();
      await createQueue(request({ type }), res);
      assert.equal(res.statusCode, type === 'priority' ? 403 : 409);
      assert.match(res.body.message, message);
    }
    assert.equal(state.tickets.length, 0);
    assert.equal(state.writes.length, 0);
  });
});

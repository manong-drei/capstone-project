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
  const state = { calls: [], appointments: [], tickets: [], writes: [], locks: 0, rolledBack: 0, onLock: null };
  const connection = {
    async beginTransaction() {}, async commit() {}, async rollback() { state.rolledBack++; }, release() {},
    async query(sql, values = []) {
      if (sql.includes('INSERT INTO queue_sequences')) return [{}];
      if (sql.includes('SELECT last_number')) { state.locks++; state.onLock?.(); return [[{ last_number: 0 }]]; }
      if (sql.includes('last_called_at IS NOT NULL LIMIT 1')) {
        assert.match(sql, /category = 'dental'/);
        assert.match(sql, /created_at >= COALESCE\(\?, CURDATE\(\)\)/);
        assert.match(sql, /created_at < COALESCE\(\?, CURDATE\(\)\) \+ INTERVAL 1 DAY/);
        assert.doesNotMatch(sql, /status\s*(?:IN|=)/);
        assert.equal(values[0], values[1]);
        return [state.calls.filter(row => row.category === 'dental' && row.day === (values[0] || today) && row.last_called_at).slice(0, 1)];
      }
      if (sql.includes('SELECT appointment_id')) {
        assert.match(sql, /appointment_date = CURDATE\(\)/);
        assert.match(sql, /status IN \('pending', 'confirmed'\)/);
        assert.match(sql, /FOR UPDATE/);
        return [state.appointments.filter(row => row.patient_id === values[0] && row.day === today && ['pending', 'confirmed'].includes(row.status)).slice(0, 1)];
      }
      if (sql.includes('SELECT * FROM patients')) return [[{ patient_id: 42, priority_category: 'senior' }]];
      if (sql.includes('todayQueueCount')) return [[{ todayQueueCount: 0 }]];
      if (sql.includes('FROM doctors')) return [[{ doctor_id: 1 }]];
      if (sql.includes('FROM daily_doctor_settings')) return [[{ appointment_limit: 20, is_available: 1 }]];
      if (sql.includes('AS booked')) return [[{ booked: 0 }]];
      if (sql.includes('INSERT INTO appointments')) { state.writes.push('appointment'); return [{ insertId: 2 }]; }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  pool.getConnection = async () => connection;
  pool.query = connection.query;
  Queue.findByPatientId = async () => null;
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

test('first call closes new dashboard appointments for the rest of the day, including priority patients', async () => {
  await fixture(async state => {
    for (const status of ['called', 'serving', 'done', 'cancelled', 'missed', 'no_show', 'waiting']) {
      state.calls = [called(status)];
      for (const type of ['regular', 'priority']) {
        const res = response();
        await createQueue(request({ type }), res);
        assert.equal(res.statusCode, 409, `${status}, ${type}`);
        assert.equal(res.body.message, Queue.REGISTRATION_CLOSED_MESSAGE);
      }
    }
    assert.equal(state.writes.length, 0);
    assert.equal(state.tickets.length, 0);
    assert.equal(state.rolledBack, 14);
  });
});

test('earlier active bookings retain AQ/AP access; cancelled, completed and unrelated bookings do not', async () => {
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
      assert.equal(res.statusCode, 409);
    }
    assert.equal(state.tickets.length, 4);
    assert.equal(state.writes.length, 0);
  });
});

test('separate booking endpoint closes today after the first call and still accepts future appointments', async () => {
  await fixture(async state => {
    const submit = async appointment_date => {
      const res = response();
      await createAppointment(request({ doctor_id: 1, appointment_date, appointment_time: '09:00' }), res);
      return res;
    };
    assert.equal((await submit(today)).statusCode, 201);
    state.calls = [called('done')];
    state.appointments = [booked()];
    const closed = await submit(today);
    assert.equal(closed.statusCode, 409);
    assert.equal(closed.body.message, Queue.REGISTRATION_CLOSED_MESSAGE);
    assert.equal((await submit(date(1))).statusCode, 201);
    assert.equal(state.writes.length, 2);
    assert.equal(state.locks, 3);
  });
});

test('registration checks run after acquiring the first-call lock', async () => {
  await fixture(async state => {
    state.onLock = () => { state.calls = [called()]; };
    const ticket = response();
    await createQueue(request(), ticket);
    assert.equal(ticket.statusCode, 409);
    state.calls = [];
    const booking = response();
    await createAppointment(request({ doctor_id: 1, appointment_date: today, appointment_time: '09:00' }), booking);
    assert.equal(booking.statusCode, 409);
    assert.equal(state.tickets.length, 0);
    assert.equal(state.writes.length, 0);
  });
});

test('patient status explains closure and permits existing bookings without changing other roles', async () => {
  await fixture(async state => {
    const before = response();
    await getQueueStatus(request(), before);
    assert.equal(before.body.registration_message, null);
    state.calls = [called('done')];
    const closed = response();
    await getQueueStatus(request(), closed);
    assert.equal(closed.body.registration_message, Queue.REGISTRATION_CLOSED_MESSAGE);
    state.appointments = [booked()];
    const existing = response();
    await getQueueStatus(request(), existing);
    assert.equal(existing.body.registration_message, null);
    const staff = response();
    await getQueueStatus({ ...request(), user: { role: 'staff' } }, staff);
    assert.deepEqual(staff.body, { now_serving: null, next_queuing: null });
  });
});

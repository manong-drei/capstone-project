const test = require('node:test');
const assert = require('node:assert/strict');
const Queue = require('../src/models/Queue');
const pool = require('../src/config/db');
const { projectQueue } = require('../src/utils/queueOrder');
const Doctor = require('../src/models/Doctor');
const { createConsultation } = require('../src/controllers/doctorController');

// A transactional fixture exercises the real model and serializes its category locks.
function fixture() {
  const original = pool.getConnection;
  let now = Date.parse('2026-10-10T09:00:00+08:00');
  let rows = [1, 2, 3].map(id => ({ id, category: 'dental', patient_id: id, queue_number: `Q${id}`,
    appointment_id: id === 1 ? 11 : null,
    status: 'waiting', call_count: 0, is_walk_in: id === 2 ? 1 : 0, type: 'regular',
    services: '[]', created_at: new Date(now - 1000), last_called_at: null, returned_at: null }));
  let tail = Promise.resolve();
  let failCall = false;
  let failAppointment = false;
  let appointments = [
    { appointment_id: 11, patient_id: 1, status: 'confirmed' },
    { appointment_id: 12, patient_id: 1, status: 'confirmed' },
  ];
  let failPrescription = false;
  let prescriptionWarning = null;
  let consultations = [];
  let availableDentists = [{ doctor_id: 7 }];
  let prescriptions = [];
  const statements = [];
  pool.getConnection = async () => {
    let working;
    let workingConsultations;
    let workingPrescriptions;
    let workingAppointments;
    let unlock;
    return {
      async beginTransaction() {},
      async commit() {
        if (working) {
          rows = working; consultations = workingConsultations; prescriptions = workingPrescriptions;
          appointments = workingAppointments;
        }
        unlock?.(); unlock = null;
      },
      async rollback() { working = null; unlock?.(); unlock = null; },
      release() {},
      async query(raw, values = []) {
        const sql = raw.replace(/\s+/g, ' ').trim();
        statements.push(sql);
        if (sql.startsWith('INSERT INTO queue_sequences')) return [{}];
        if (sql.startsWith('SELECT last_number')) {
          const previous = tail;
          tail = new Promise(resolve => { unlock = resolve; });
          await previous;
          working = structuredClone(rows);
          workingConsultations = structuredClone(consultations);
          workingPrescriptions = structuredClone(prescriptions);
          workingAppointments = structuredClone(appointments);
          return [[{ last_number: 0 }]];
        }
        const data = working || rows;
        const row = data.find(q => q.id === Number(values[0]));
        if (sql.startsWith('SELECT d.doctor_id FROM doctors')) {
          if (sql.includes('LIMIT 2')) return [availableDentists];
          return [values[0] === 7 ? [{ doctor_id: 7 }] : []];
        }
        if (sql.startsWith('SELECT doctor_id FROM consultations')) return [workingConsultations.filter(consultation => consultation.queue_id === Number(values[0]))];
        if (sql.startsWith('SELECT consultation_id')) return [workingConsultations.filter(consultation => consultation.queue_id === values[0])];
        if (sql.startsWith('INSERT INTO consultations')) {
          const id = workingConsultations.length + 1;
          workingConsultations.push({ consultation_id: id, queue_id: values[0], doctor_id: values[1], patient_id: values[2], notes: values[3], diagnosis: values[4] });
          return [{ insertId: id }];
        }
        if (sql.startsWith('INSERT INTO prescriptions')) {
          if (failPrescription) throw Object.assign(new Error('Prescription save failed.'), { status: 503 });
          const medication_name = prescriptionWarning === 'truncation' ? values[1].slice(0, 150) : values[1];
          const insertId = workingPrescriptions.push({ consultation_id: values[0], medication_name });
          return [{ insertId, warningStatus: Number(prescriptionWarning !== null) }];
        }
        if (sql.startsWith('SELECT medication_name')) return [[workingPrescriptions[values[0] - 1]]];
        if (sql.startsWith('UPDATE appointments')) {
          if (failAppointment) throw new Error('Simulated appointment update failure');
          const [status, appointmentId, patientId] = values;
          const appointment = workingAppointments.find(a => a.appointment_id === appointmentId && a.patient_id === patientId);
          if (['pending', 'confirmed'].includes(appointment?.status)) appointment.status = status;
          return [{ affectedRows: 1 }];
        }
        if (sql.startsWith('SELECT category')) return [[...row ? [{ category: row.category }] : []]];
        if (sql.startsWith('SELECT *, TIMESTAMPDIFF')) return [[{ ...row,
          call_ready: now - new Date(row.last_called_at) >= 15_000,
          expired: row.grace_expires_at && new Date(row.grace_expires_at).getTime() <= now,
          is_today: row.created_at.toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10),
        }]];
        if (sql.startsWith('SELECT id FROM queues')) return [[...data.filter(q => q.category === values[0] && ['called', 'serving'].includes(q.status)).slice(0, 1)]];
        if (sql.startsWith('SELECT is_walk_in')) return [[...data.filter(q => q.category === values[0] && q.last_called_at)
          .sort((a, b) => new Date(b.last_called_at) - new Date(a.last_called_at) || b.id - a.id).slice(0, 1)]];
        if (sql.startsWith('SELECT * FROM queues')) return [structuredClone(data.filter(q => q.category === values[0] && q.status === 'waiting'))];
        if (sql.startsWith('SELECT q.*')) return [row ? [structuredClone(row)] : []];
        if (sql.startsWith("UPDATE queues SET status = 'called'")) {
          if (failCall) throw new Error('Simulated call failure');
          Object.assign(row, { status: 'called', call_count: 1, last_called_at: new Date(now), status_reason: null });
        } else if (sql.startsWith('UPDATE queues SET call_count = 2')) {
          Object.assign(row, { call_count: 2, last_called_at: new Date(now) });
        } else if (sql.startsWith("UPDATE queues SET status = 'missed'")) {
          Object.assign(data.find(q => q.id === values[1]), { status: 'missed', missed_at: new Date(now), grace_expires_at: new Date(now + 600_000) });
        } else if (sql.startsWith("UPDATE queues SET status = 'waiting'")) {
          Object.assign(row, { status: 'waiting', returned_at: new Date(now) });
        } else if (sql.startsWith("UPDATE queues SET status = 'no_show'")) {
          const targets = sql.includes('WHERE category = ?')
            ? data.filter(q => q.category === values[1] && q.status === 'missed' && new Date(q.grace_expires_at).getTime() <= now)
            : data.filter(q => q.id === values[1]);
          targets.forEach(q => Object.assign(q, { status: 'no_show', status_reason: values[0] }));
        } else if (sql.includes('completed_by_doctor_id = ?')) {
          Object.assign(data.find(q => q.id === Number(values[3])), { status: values[0], status_reason: values[1], completed_by_doctor_id: values[2] });
        } else if (sql.startsWith('UPDATE queues SET status = ?')) {
          Object.assign(data.find(q => q.id === Number(values[2])), { status: values[0], status_reason: values[1] });
        } else throw new Error(`Unexpected SQL: ${sql}`);
        return [{ affectedRows: 1 }];
      },
    };
  };
  return {
    advance: ms => { now += ms; }, rows: () => rows, statements,
    consultations: () => consultations, prescriptions: () => prescriptions, appointments: () => appointments,
    availableDentists: ids => { availableDentists = ids.map(doctor_id => ({ doctor_id })); },
    failPrescription: () => { failPrescription = true; },
    warnPrescription: kind => { prescriptionWarning = kind; },
    failAppointment: () => { failAppointment = true; },
    failCall: () => { failCall = true; }, close: () => { pool.getConnection = original; },
  };
}

test('ticket cancellation changes only the linked booking and rolls back if its update fails', async () => {
  const cancelled = fixture();
  try {
    await Queue.updateStatus(1, 'cancelled', 'Patient requested cancellation', { patientOnly: true });
    assert.deepEqual(cancelled.appointments().map(appointment => appointment.status), ['cancelled', 'confirmed']);
  } finally { cancelled.close(); }

  const failed = fixture();
  try {
    failed.failAppointment();
    await assert.rejects(Queue.updateStatus(1, 'cancelled', 'Patient requested cancellation'), /appointment update failure/);
    assert.equal(failed.rows()[0].status, 'waiting');
    assert.deepEqual(failed.appointments().map(appointment => appointment.status), ['confirmed', 'confirmed']);
  } finally { failed.close(); }
});

test('two calls enforce both 15-second waits; skip starts one grace window and calls next', async () => {
  const f = fixture();
  try {
    assert.equal((await Queue.callNext()).status, 'called');
    await assert.rejects(Queue.recall(1), { status: 409 });
    await assert.rejects(Queue.skip(1), { status: 409 });
    assert.ok(f.statements.some(sql => sql.includes('>= 15000000 AS call_ready')));
    f.advance(14_999);
    await assert.rejects(Queue.recall(1), { status: 409 });
    f.advance(1);
    assert.equal((await Queue.recall(1)).call_count, 2);
    await assert.rejects(Queue.skip(1), { status: 409 });
    f.advance(14_999);
    await assert.rejects(Queue.skip(1), { status: 409 });
    f.advance(1);
    const result = await Queue.skip(1);
    assert.equal(result.queue.status, 'missed');
    assert.equal(result.queue.grace_expires_at - result.queue.missed_at, 600_000);
    assert.equal(result.next_queue.id, 2);
    assert.equal(result.next_queue.status, 'called');
    await assert.rejects(Queue.updateStatus(1, 'no_show'), { status: 409 });
    await assert.rejects(Queue.updateStatus(1, 'waiting'), { status: 409 });
    await assert.rejects(Queue.updateStatus(3, 'serving'), { status: 409 });
    await assert.rejects(Queue.updateStatus(2, 'done'), { status: 409 });
    assert.equal((await Queue.updateStatus(2, 'serving')).status, 'serving');
  } finally { f.close(); }
});

test('staff finishes and calls next while the dentist can still save the previous notes once', async () => {
  const f = fixture();
  const originalDoctor = Doctor.findByUserId;
  Doctor.findByUserId = async () => ({ doctor_id: 7 });
  const save = async () => {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await createConsultation({ user: { user_id: 4 }, body: { queue_id: 1, notes: 'Check-up complete', diagnosis: 'Healthy', prescription: ' Follow-up ' } }, res);
    return res;
  };
  try {
    await Queue.callNext();
    assert.equal((await save()).statusCode, 400);
    assert.equal(f.consultations().length, 0);
    await Queue.updateStatus(1, 'serving');
    await Queue.updateStatus(1, 'done');
    assert.equal((await Queue.callNext()).id, 2);
    assert.equal((await Queue.updateStatus(1, 'done')).status, 'done');
    const response = await save();
    assert.equal(response.statusCode, 201);
    assert.deepEqual(f.consultations(), [{ consultation_id: 1, queue_id: 1, doctor_id: 7, patient_id: 1, notes: 'Check-up complete', diagnosis: 'Healthy' }]);
    assert.deepEqual(f.prescriptions(), [{ consultation_id: 1, medication_name: 'Follow-up' }]);
    assert.equal(f.rows()[0].status, 'done');
    assert.equal(f.rows()[1].status, 'called');
    assert.equal((await save()).statusCode, 409);
    assert.equal(f.consultations().length, 1);
  } finally { Doctor.findByUserId = originalDoctor; f.close(); }
});

test('staff completion records the sole available dentist who can add notes later', async t => {
  const f = fixture();
  t.mock.method(Doctor, 'findByUserId', async userId => ({ doctor_id: userId === 4 ? 7 : 8 }));
  try {
    f.rows()[1].status = 'serving';
    const completed = await Queue.updateStatus(2, 'done');
    assert.equal(completed.completed_by_doctor_id, 7);
    f.availableDentists([8]);
    assert.equal((await Queue.updateStatus(2, 'done')).completed_by_doctor_id, 7);
    const save = async userId => {
      const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json() {} };
      await createConsultation({ user: { user_id: userId }, body: { queue_id: 2, notes: 'Dental notes' } }, res);
      return res.statusCode;
    };
    assert.equal(await save(5), 403);
    assert.equal(await save(4), 201);
    assert.equal(f.consultations()[0].doctor_id, 7);
    assert.ok(!f.statements.some(sql => sql.startsWith('UPDATE appointments')));
  } finally { f.close(); }
});

test('staff can finish a walk-in with an ambiguous roster and record the dentist later through notes', async t => {
  t.mock.method(Doctor, 'findByUserId', async () => ({ doctor_id: 8 }));
  for (const roster of [[], [7, 8]]) {
    const f = fixture();
    try {
      f.availableDentists(roster);
      f.rows()[1].status = 'serving';
      const completed = await Queue.updateStatus(2, 'done');
      assert.equal(completed.status, 'done');
      assert.equal(completed.completed_by_doctor_id, null);
      const res = { status(code) { this.statusCode = code; return this; }, json() {} };
      await createConsultation({ user: { user_id: 5 }, body: { queue_id: 2, notes: 'Dental notes' } }, res);
      assert.equal(res.statusCode, 201);
      assert.equal(f.consultations()[0].doctor_id, 8);
    } finally { f.close(); }
  }
});

test('a dentist completing a walk-in is identified by their session', async t => {
  const f = fixture();
  t.mock.method(Doctor, 'findByUserId', async id => {
    assert.equal(id, 4);
    return { doctor_id: 7 };
  });
  try {
    f.rows()[1].status = 'serving';
    f.availableDentists([8]);
    const completed = await Queue.updateStatus(2, 'done', null, { doctorUserId: 4 });
    assert.equal(completed.completed_by_doctor_id, 7);
  } finally { f.close(); }
});

test('simultaneous staff completion and dentist saving serialize without losing notes', async () => {
  const f = fixture();
  const originalDoctor = Doctor.findByUserId;
  Doctor.findByUserId = async () => ({ doctor_id: 7 });
  try {
    await Queue.callNext();
    await Queue.updateStatus(1, 'serving');
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await Promise.all([
      createConsultation({ user: { user_id: 4 }, body: { queue_id: 1, notes: 'Completed notes' } }, res),
      Queue.updateStatus(1, 'done'),
    ]);
    assert.equal(res.statusCode, 201);
    assert.equal(f.rows()[0].status, 'done');
    assert.equal(f.consultations().length, 1);
    assert.equal((await Queue.callNext()).id, 2);
  } finally { Doctor.findByUserId = originalDoctor; f.close(); }
});

test('a failed prescription rolls back the consultation and leaves the patient serving', async () => {
  const f = fixture();
  const originalDoctor = Doctor.findByUserId;
  Doctor.findByUserId = async () => ({ doctor_id: 7 });
  try {
    await Queue.callNext();
    await Queue.updateStatus(1, 'serving');
    f.failPrescription();
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await createConsultation({ user: { user_id: 4 }, body: { queue_id: 1, notes: 'Completed notes', prescription: 'Follow-up' } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(f.consultations().length, 0);
    assert.equal(f.prescriptions().length, 0);
    assert.equal(f.rows()[0].status, 'serving');
  } finally { Doctor.findByUserId = originalDoctor; f.close(); }
});

test('prescription directions survive in full or the consultation rolls back on a write warning', async t => {
  const f = fixture();
  t.mock.method(Doctor, 'findByUserId', async () => ({ doctor_id: 7 }));
  const logged = t.mock.method(console, 'error', () => {});
  const prescription = 'A'.repeat(180) + ' Final directions';
  const req = { user: { user_id: 4 }, body: { queue_id: 1, notes: 'Completed notes', prescription } };
  const res = { status(code) { this.statusCode = code; return this; }, json() {} };
  try {
    await Queue.callNext();
    await Queue.updateStatus(1, 'serving');
    await createConsultation({ ...req, body: { ...req.body, prescription: {} } }, res);
    assert.equal(res.statusCode, 400);
    f.warnPrescription('truncation');
    await createConsultation(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(f.prescriptions().length, 0);
    assert.equal(f.consultations().length, 0);
    assert.equal(f.rows()[0].status, 'serving');
    assert.deepEqual(logged.mock.calls[0].arguments, ['Consultation could not be saved.']);
    f.warnPrescription('unrelated');
    await createConsultation(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(f.prescriptions()[0].medication_name, prescription);
  } finally { f.close(); }
});

test('timely return keeps the original ticket beyond expiry and a second miss is final', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(15_000); await Queue.recall(1); f.advance(15_000); await Queue.skip(1);
    f.advance(599_999);
    const returned = await Queue.returnPatient(1);
    assert.equal(returned.id, 1);
    assert.equal(returned.status, 'waiting');
    f.advance(1);
    await Queue.expireMissed();
    assert.equal(f.rows()[0].status, 'waiting');
    await Queue.updateStatus(2, 'serving'); await Queue.updateStatus(2, 'done');
    assert.equal((await Queue.callNext()).id, 3);
    await Queue.updateStatus(3, 'serving'); await Queue.updateStatus(3, 'done');
    assert.equal((await Queue.callNext()).id, 1);
    f.advance(15_000); await Queue.recall(1); f.advance(15_000);
    const second = await Queue.skip(1);
    assert.equal(second.queue.status, 'no_show');
    assert.equal(second.queue.grace_expires_at.getTime(), returned.grace_expires_at.getTime());
    await assert.rejects(Queue.returnPatient(1), { status: 409 });
    assert.equal(f.rows().length, 3);
  } finally { f.close(); }
});

test('return at the deadline commits no-show; worker closes overdue tickets, including yesterday', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(15_000); await Queue.recall(1); f.advance(15_000); await Queue.skip(1);
    f.advance(600_000);
    assert.deepEqual(await Queue.returnPatient(1), { expired: true });
    assert.equal(f.rows()[0].status, 'no_show');
    const second = f.rows()[1];
    Object.assign(second, { status: 'missed', created_at: new Date('2026-10-09T01:00:00Z'), grace_expires_at: new Date(0) });
    await Queue.expireMissed();
    assert.equal(f.rows()[1].status, 'no_show');
  } finally { f.close(); }
});

test('simultaneous call and skip requests serialize; failure rolls back both skip and next', async () => {
  const f = fixture();
  try {
    const calls = await Promise.all([Queue.callNext(), Queue.callNext()]);
    assert.equal(calls.filter(q => q?.status === 'called').length, 1);
    assert.equal(calls.filter(q => q?.conflict).length, 1);
    f.advance(15_000); await Queue.recall(1); f.advance(15_000);
    f.failCall();
    await assert.rejects(Queue.skip(1), /Simulated call failure/);
    assert.equal(f.rows()[0].status, 'called');
    assert.equal(f.rows()[1].status, 'waiting');
  } finally { f.close(); }
  const second = fixture();
  try {
    await Queue.callNext(); second.advance(15_000); await Queue.recall(1); second.advance(15_000);
    const skips = await Promise.allSettled([Queue.skip(1), Queue.skip(1)]);
    assert.equal(skips.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(second.rows().filter(q => q.status === 'called').length, 1);
  } finally { second.close(); }
});

test('skipping the last waiting patient succeeds with no next ticket', async () => {
  const f = fixture();
  try {
    f.rows().splice(1);
    await Queue.callNext(); f.advance(15_000); await Queue.recall(1); f.advance(15_000);
    assert.equal((await Queue.skip(1)).next_queue, null);
  } finally { f.close(); }
});

test('cancellation cannot bypass expiry while waiting for the worker', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(15_000); await Queue.recall(1); f.advance(15_000); await Queue.skip(1);
    f.advance(600_000);
    assert.deepEqual(await Queue.updateStatus(1, 'cancelled', 'Leaving', { patientOnly: true }), { expired: true });
    assert.equal(f.rows()[0].status, 'no_show');
  } finally { f.close(); }
});

test('returns rejoin their group after existing entries without bypassing priority', () => {
  const row = (id, is_walk_in, returned_at, type = 'regular') => ({ id, is_walk_in, returned_at, type, created_at: new Date(0) });
  const waiting = [row(4, 0, new Date(2)), row(3, 1, new Date(1)), row(2, 1, null, 'priority'), row(1, 0, null, 'priority')];
  assert.deepEqual(projectQueue(waiting, { is_walk_in: 1 }).map(q => q.id), [1, 2, 3, 4]);
});

test('expiry startup sweep and five-second timer work with SMS disabled', async () => {
  const worker = require('../src/services/queueExpiry');
  const saved = { expire: Queue.expireMissed, interval: global.setInterval, sms: process.env.SMS_ENABLED };
  let calls = 0;
  Queue.expireMissed = async () => { calls++; };
  process.env.SMS_ENABLED = 'false';
  global.setInterval = (callback, delay) => { assert.equal(delay, 5000); return { unref() {} }; };
  try { await worker.startWorker(); assert.equal(calls, 1); await worker.tick(); assert.equal(calls, 2); }
  finally {
    Queue.expireMissed = saved.expire; global.setInterval = saved.interval;
    if (saved.sms === undefined) delete process.env.SMS_ENABLED; else process.env.SMS_ENABLED = saved.sms;
  }
});
